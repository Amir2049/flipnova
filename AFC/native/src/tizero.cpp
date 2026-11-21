// TiZero policy, features and goalkeeper rules in C++. See tizero.h.
#include "tizero.h"

#include <algorithm>
#include <cmath>
#include <cstdint>
#include <cstdio>
#include <cstring>

namespace afc {

namespace {

const int kHidden = 256;

float half_to_float(uint16_t h) {
  uint32_t s = (h & 0x8000u) << 16, e = (h >> 10) & 0x1f, m = h & 0x3ff, f;
  if (e == 0) {
    if (m == 0) {
      f = s;
    } else {  // subnormal
      int sh = 0;
      while (!(m & 0x400)) { m <<= 1; sh++; }
      m &= 0x3ff;
      f = s | ((uint32_t)(113 - sh) << 23) | (m << 13);
    }
  } else if (e == 31) {
    f = s | 0x7f800000u | (m << 13);
  } else {
    f = s | ((e + 112) << 23) | (m << 13);
  }
  float out;
  std::memcpy(&out, &f, 4);
  return out;
}

struct Reader {
  FILE* f = nullptr;
  bool ok = true;
  std::vector<float> next(size_t expect) {
    uint32_t n = 0;
    if (!f || fread(&n, 4, 1, f) != 1 || n != expect) { ok = false; return std::vector<float>(expect, 0.f); }
    std::vector<uint16_t> h(n);
    if (fread(h.data(), 2, n, f) != n) ok = false;
    std::vector<float> v(n);
    for (uint32_t i = 0; i < n; i++) v[i] = half_to_float(h[i]);
    return v;
  }
};

inline float sigmoid(float x) { return 1.f / (1.f + std::exp(-x)); }

void layer_norm(float* x, int n, const float* w, const float* b) {
  double mean = 0, var = 0;
  for (int i = 0; i < n; i++) mean += x[i];
  mean /= n;
  for (int i = 0; i < n; i++) var += (x[i] - mean) * (x[i] - mean);
  var /= n;
  float inv = (float)(1.0 / std::sqrt(var + 1e-5));
  for (int i = 0; i < n; i++) x[i] = (float)(x[i] - mean) * inv * w[i] + b[i];
}

void matvec(const float* w, const float* b, const float* x, int in, int out, float* y) {
  for (int o = 0; o < out; o++) {
    const float* row = w + (size_t)o * in;
    float s = b ? b[o] : 0.f;
    for (int i = 0; i < in; i++) s += row[i] * x[i];
    y[o] = s;
  }
}

}  // namespace

bool TiZero::load(const std::string& path) {
  ok_ = false;
  Reader r;
  r.f = fopen(path.c_str(), "rb");
  if (!r.f) return false;
  char magic[4];
  uint32_t count = 0;
  if (fread(magic, 1, 4, r.f) != 4 || std::memcmp(magic, "TZ01", 4) != 0 || fread(&count, 4, 1, r.f) != 1 ||
      count != 68) {
    fclose(r.f);
    return false;
  }
  auto lin = [&](Lin& l, int in, int out) {
    l.in = in;
    l.out = out;
    l.w = r.next((size_t)in * out);
    l.b = r.next(out);
  };
  auto norm = [&](Norm& n, int size) {
    n.w = r.next(size);
    n.b = r.next(size);
  };
  auto blk = [&](Block& b, int in, int out) {
    lin(b.lin, in, out);
    norm(b.norm, out);
  };
  const int ins[5] = {87, 57, 88, 88, 9};
  const int outs[5] = {64, 64, 64, 64, 9};
  for (int e = 0; e < 5; e++) {
    blk(enc_[e][0], ins[e], outs[e]);
    blk(enc_[e][1], outs[e], outs[e]);
  }
  blk(embed_, 265, kHidden);
  w_ih_ = r.next((size_t)4 * kHidden * kHidden);
  w_hh_ = r.next((size_t)4 * kHidden * kHidden);
  b_ih_ = r.next(4 * kHidden);
  b_hh_ = r.next(4 * kHidden);
  norm(rnn_norm_, kHidden);
  blk(after_rnn_, kHidden, kHidden);
  blk(id_emb_, 11, 11);
  blk(before_act_[0], kHidden + 11, kHidden);
  blk(before_act_[1], kHidden, kHidden);
  lin(act_, kHidden, 20);
  fclose(r.f);
  ok_ = r.ok;
  reset();
  return ok_;
}

void TiZero::reset() {
  for (auto& s : state_) s.assign(2 * kHidden, 0.f);
}

void TiZero::block(const Block& b, const float* x, float* y) const {
  matvec(b.lin.w.data(), b.lin.b.data(), x, b.lin.in, b.lin.out, y);
  for (int i = 0; i < b.lin.out; i++) y[i] = y[i] > 0.f ? y[i] : 0.f;
  layer_norm(y, b.lin.out, b.norm.w.data(), b.norm.b.data());
}

int TiZero::act(const TzObs& o, int active, const int sticky[10], float temperature, std::mt19937& rng) {
  if (!ok_ || active < 0 || active > 10) return TZ_IDLE;
  float obs[330], avail[19];
  features(o, active, sticky, obs, avail);
  // input encoders over the five parts of the observation
  float enc_out[265];
  const int ins[5] = {87, 57, 88, 88, 9};
  const int outs[5] = {64, 64, 64, 64, 9};
  int at = 1, put = 0;
  float tmp[kHidden];
  for (int e = 0; e < 5; e++) {
    block(enc_[e][0], obs + at, tmp);
    block(enc_[e][1], tmp, enc_out + put);
    at += ins[e];
    put += outs[e];
  }
  float x[kHidden];
  block(embed_, enc_out, x);
  // LSTM (gates i, f, g, o), then LayerNorm
  std::vector<float>& st = state_[active];
  float* h = st.data();
  float* c = st.data() + kHidden;
  float gates[4 * kHidden];
  matvec(w_ih_.data(), b_ih_.data(), x, kHidden, 4 * kHidden, gates);
  for (int g = 0; g < 4 * kHidden; g++) {
    const float* row = w_hh_.data() + (size_t)g * kHidden;
    float s = b_hh_[g];
    for (int i = 0; i < kHidden; i++) s += row[i] * h[i];
    gates[g] += s;
  }
  float hn[kHidden];
  for (int i = 0; i < kHidden; i++) {
    float ig = sigmoid(gates[i]), fg = sigmoid(gates[kHidden + i]);
    float gg = std::tanh(gates[2 * kHidden + i]), og = sigmoid(gates[3 * kHidden + i]);
    c[i] = fg * c[i] + ig * gg;
    hn[i] = og * std::tanh(c[i]);
  }
  std::memcpy(h, hn, sizeof(hn));
  layer_norm(hn, kHidden, rnn_norm_.w.data(), rnn_norm_.b.data());
  float obs_out[kHidden];
  block(after_rnn_, hn, obs_out);
  // player id embedding, joined with the observation features
  float onehot[11] = {0};
  onehot[active] = 1.f;
  float cat[kHidden + 11];
  block(id_emb_, onehot, cat);
  std::memcpy(cat + 11, obs_out, sizeof(obs_out));
  float y1[kHidden], y2[kHidden];
  block(before_act_[0], cat, y1);
  block(before_act_[1], y1, y2);
  float logits[20];
  matvec(act_.w.data(), act_.b.data(), y2, kHidden, 20, logits);
  bool any = false;
  for (int a = 0; a < 19; a++) {
    if (avail[a] == 0.f) logits[a] = -1e10f;
    else any = true;
  }
  logits[19] = -1e10f;
  if (!any) return TZ_IDLE;
  int best = 0;
  if (temperature <= 0.f) {
    for (int a = 1; a < 20; a++)
      if (logits[a] > logits[best]) best = a;
  } else {
    float mx = -1e30f;
    for (int a = 0; a < 19; a++) mx = std::max(mx, logits[a]);
    double p[19], sum = 0;
    for (int a = 0; a < 19; a++) {
      p[a] = avail[a] == 0.f ? 0.0 : std::exp((logits[a] - mx) / temperature);
      sum += p[a];
    }
    double u = std::uniform_real_distribution<double>(0.0, sum)(rng);
    best = 0;
    for (int a = 0; a < 19; a++) {
      if (p[a] <= 0) continue;
      best = a;
      u -= p[a];
      if (u <= 0) break;
    }
  }
  if (best == TZ_DRIBBLE && sticky[8] == 1) best = TZ_RELEASE_SPRINT;
  return best;
}

// ---------------------------------------------------------------------------------------------------- features

namespace {

const float kBoxX = 0.7f;
const int kDirActions[8] = {TZ_LEFT, TZ_TOP_LEFT, TZ_TOP, TZ_TOP_RIGHT, TZ_RIGHT, TZ_BOTTOM_RIGHT, TZ_BOTTOM,
                            TZ_BOTTOM_LEFT};
const float kDirVecs[8][2] = {{-1, 0}, {-1, -1}, {0, -1}, {1, -1}, {1, 0}, {1, 1}, {0, 1}, {-1, 1}};

void direction_action(float* a, const int sticky[10], const int* targets, int nt, bool need_sprint) {
  for (int i = 0; i < 19; i++) a[i] = 0.f;
  for (int i = 0; i < nt; i++) a[targets[i]] = 1.f;
  if (need_sprint) {
    a[TZ_RELEASE_SPRINT] = 0.f;
    if (sticky[8] == 0) {
      for (int i = 0; i < 19; i++) a[i] = 0.f;
      a[TZ_SPRINT] = 1.f;
    }
  } else {
    a[TZ_SPRINT] = 0.f;
    if (sticky[8] == 1) {
      for (int i = 0; i < 19; i++) a[i] = 0.f;
      a[TZ_RELEASE_SPRINT] = 1.f;
    }
  }
}

int best_direction(float dx, float dy) {
  int best = 0;
  float bd = -1e30f;
  for (int k = 0; k < 8; k++) {
    float n = std::sqrt(kDirVecs[k][0] * kDirVecs[k][0] + kDirVecs[k][1] * kDirVecs[k][1]);
    float d = dx * kDirVecs[k][0] / n + dy * kDirVecs[k][1] / n;
    if (d > bd) { bd = d; best = k; }
  }
  return best;
}

}  // namespace

void TiZero::features(const TzObs& o, int active, const int sticky[10], float* out, float* avail) {
  const float dxb = 0.03f, dyb = 0.02f;
  // offside flags
  float left_off[11] = {0}, right_off[11] = {0};
  if (o.ball_owned_team == 0) {
    float xs[11];
    for (int i = 0; i < 11; i++) xs[i] = o.right[i][0];
    std::sort(xs, xs + 11);
    float line = std::max(0.f, std::max(o.ball[0], xs[9]));
    for (int i = 0; i < 11; i++) left_off[i] = o.left[i][0] > line ? 1.f : 0.f;
    if (o.ball_owned_player >= 0 && o.ball_owned_player < 11) left_off[o.ball_owned_player] = 0.f;
  }
  if (o.ball_owned_team == 1) {
    float xs[11];
    for (int i = 0; i < 11; i++) xs[i] = o.left[i][0];
    std::sort(xs, xs + 11);
    float line = std::min(0.f, std::min(o.ball[0], xs[1]));
    for (int i = 0; i < 11; i++) right_off[i] = o.right[i][0] < line ? 1.f : 0.f;
    if (o.ball_owned_player >= 0 && o.ball_owned_player < 11) right_off[o.ball_owned_player] = 0.f;
  }
  auto team = [&](float* p, const float (*pos)[2], const float (*dir)[2], const float* tired, const bool* yellow,
                  const bool* act, const float* off) {
    for (int i = 0; i < 11; i++) { *p++ = pos[i][0]; *p++ = pos[i][1]; }
    for (int i = 0; i < 11; i++) { *p++ = dir[i][0] / dxb; *p++ = dir[i][1] / dyb; }
    for (int i = 0; i < 11; i++) *p++ = tired[i];
    for (int i = 0; i < 11; i++) *p++ = yellow[i] ? 1.f : 0.f;
    for (int i = 0; i < 11; i++) *p++ = act[i] ? 0.f : 1.f;
    for (int i = 0; i < 11; i++) *p++ = off[i];
  };
  float* p = out;
  *p++ = (float)active;
  const float ax = o.left[active][0], ay = o.left[active][1];
  const float adx = o.left_dir[active][0] / dxb, ady = o.left_dir[active][1] / dyb;
  const float a_tired = o.left_tired[active], a_yellow = o.left_yellow[active] ? 1.f : 0.f;
  const float a_red = o.left_active[active] ? 0.f : 1.f, a_off = left_off[active];
  // active player (18)
  for (int i = 0; i < 10; i++) *p++ = (float)sticky[i];
  *p++ = ax; *p++ = ay; *p++ = adx; *p++ = ady; *p++ = a_tired; *p++ = a_yellow; *p++ = a_red; *p++ = a_off;
  // relative (69)
  const float rbx = o.ball[0] - ax, rby = o.ball[1] - ay;
  const float d2ball = std::sqrt(rbx * rbx + rby * rby);
  *p++ = rbx; *p++ = rby; *p++ = d2ball;
  for (int i = 0; i < 11; i++) { *p++ = o.left[i][0] - ax; *p++ = o.left[i][1] - ay; }
  for (int i = 0; i < 11; i++) *p++ = std::hypot(o.left[i][0] - ax, o.left[i][1] - ay);
  for (int i = 0; i < 11; i++) { *p++ = o.right[i][0] - ax; *p++ = o.right[i][1] - ay; }
  for (int i = 0; i < 11; i++) *p++ = std::hypot(o.right[i][0] - ax, o.right[i][1] - ay);
  // ball (12)
  float* ball_info = p;
  *p++ = o.ball[0]; *p++ = o.ball[1]; *p++ = o.ball[2];
  *p++ = o.ball_dir[0] / 0.15f; *p++ = o.ball_dir[1] / 0.07f; *p++ = o.ball_dir[2] / 4.f;
  for (int i = 0; i < 3; i++) *p++ = (o.ball_owned_team + 1 == i) ? 1.f : 0.f;
  *p++ = o.ball_rot[0] / 0.0005f; *p++ = o.ball_rot[1] / 0.0004f; *p++ = o.ball_rot[2] / 0.015f;
  (void)ball_info;
  // ball owner (23)
  for (int i = 0; i < 23; i++) p[i] = 0.f;
  float opx = 0, opy = 0, odx = 0, ody = 0, o_tired = 0, o_yellow = 0, o_red = 0, o_off = 0;
  const int bo = o.ball_owned_player;
  if (o.ball_owned_team == 1 && bo >= 0) {
    p[11 + bo] = 1.f;
    opx = o.right[bo][0]; opy = o.right[bo][1]; odx = o.right_dir[bo][0]; ody = o.right_dir[bo][1];
    o_tired = o.right_tired[bo]; o_yellow = o.right_yellow[bo] ? 1.f : 0.f;
    o_red = o.right_active[bo] ? 0.f : 1.f; o_off = right_off[bo];
  } else if (o.ball_owned_team == 0 && bo >= 0) {
    p[bo] = 1.f;
    opx = o.left[bo][0]; opy = o.left[bo][1]; odx = o.left_dir[bo][0]; ody = o.left_dir[bo][1];
    o_tired = o.left_tired[bo]; o_yellow = o.left_yellow[bo] ? 1.f : 0.f;
    o_red = o.left_active[bo] ? 0.f : 1.f; o_off = left_off[bo];
  } else {
    p[22] = 1.f;
  }
  p += 23;
  *p++ = ax; *p++ = ay; *p++ = adx; *p++ = ady; *p++ = a_tired; *p++ = a_yellow; *p++ = a_red; *p++ = a_off;
  *p++ = rbx; *p++ = rby; *p++ = d2ball;
  *p++ = opx; *p++ = opy; *p++ = odx / dxb; *p++ = ody / dyb;
  if (o.ball_owned_team != -1) {
    float rx = opx - ax, ry = opy - ay;
    *p++ = rx; *p++ = ry; *p++ = std::sqrt(rx * rx + ry * ry);
    *p++ = o_tired; *p++ = o_yellow; *p++ = o_red; *p++ = o_off;
  } else {
    for (int i = 0; i < 7; i++) *p++ = 0.f;
  }
  // teams (88 + 88)
  team(p, o.left, o.left_dir, o.left_tired, o.left_yellow, o.left_active, left_off);
  p += 88;
  team(p, o.right, o.right_dir, o.right_tired, o.right_yellow, o.right_active, right_off);
  p += 88;
  // match state (9)
  for (int i = 0; i < 7; i++) *p++ = o.game_mode == i ? 1.f : 0.f;
  *p++ = (o.score[0] - o.score[1]) / 5.f;
  *p++ = o.steps_left / 3001.f;

  // ------------------------------------------------------------------------- available actions
  float* a = avail;
  for (int i = 0; i < 19; i++) a[i] = 1.f;
  a[TZ_IDLE] = 0.f;
  a[TZ_RELEASE_DIRECTION] = 0.f;
  bool should_left = false;
  if (o.game_mode == 0) {
    int left_mates = 0;
    for (int i = 1; i < 11; i++)
      if (ax > o.left[i][0]) left_mates++;
    if (ax > o.ball[0] + 0.05f && left_mates < 2 && o.ball_owned_team != 0) should_left = true;
  }
  if (should_left) {
    const int t[3] = {TZ_LEFT, TZ_BOTTOM_LEFT, TZ_TOP_LEFT};
    direction_action(a, sticky, t, 3, true);
  }
  if (std::fabs(rbx) > 0.75f || std::fabs(rby) > 0.5f) {
    const int t[1] = {kDirActions[best_direction(rbx, rby)]};
    direction_action(a, sticky, t, 1, true);
  }
  const bool hold = o.ball_owned_team == 0 && o.ball_owned_player == active;
  const float bpo = 0.05f, nbo = 0.03f;
  bool outside = false;
  int target = TZ_IDLE;
  if (ax <= -1 + nbo || (hold && ax <= -1 + bpo)) {
    outside = true; target = TZ_RIGHT;
  } else if (ax >= 1 - nbo || (hold && ax >= 1 - bpo)) {
    outside = true; target = TZ_LEFT;
  } else if (ay >= 0.42f - nbo || (hold && ay >= 0.42f - bpo)) {
    outside = true; target = TZ_TOP;
  } else if (ay <= -0.42f + nbo || (hold && ax <= -0.42f + bpo)) {   // (sic: x, as in TiZero)
    outside = true; target = TZ_BOTTOM;
  }
  float min_l = 1e9f, min_r = 1e9f;
  int arg_l = 0;
  for (int i = 0; i < 11; i++) {
    float dl = std::hypot(o.left[i][0] - o.ball[0], o.left[i][1] - o.ball[1]);
    float dr = std::hypot(o.right[i][0] - o.ball[0], o.right[i][1] - o.ball[1]);
    if (dl < min_l) { min_l = dl; arg_l = i; }
    if (dr < min_r) min_r = dr;
  }
  const bool we_take = min_l < min_r && active == arg_l;
  if (o.game_mode >= 1 && o.game_mode <= 5) {
    if (we_take) outside = false;
  } else if (o.game_mode == 6) {
    if (o.ball[0] > 0 && ax > kBoxX) outside = false;
  }
  if (outside) {
    const int t[1] = {target};
    direction_action(a, sticky, t, 1, false);
  }
  int dir_sum = 0;
  for (int i = 0; i < 8; i++) dir_sum += sticky[i];
  if (dir_sum == 0) a[TZ_RELEASE_DIRECTION] = 0.f;
  if (sticky[8] == 0) a[TZ_RELEASE_SPRINT] = 0.f;
  else a[TZ_SPRINT] = 0.f;
  if (sticky[9] == 0) a[TZ_RELEASE_DRIBBLE] = 0.f;
  else a[TZ_DRIBBLE] = 0.f;
  if (ax < 0.4f || std::fabs(ay) > 0.3f) a[TZ_SHOT] = 0.f;
  auto off = [&](std::initializer_list<int> l) { for (int k : l) a[k] = 0.f; };
  if (o.game_mode == 0) {
    if (o.ball_owned_team == -1) {
      a[TZ_DRIBBLE] = 0.f;
      if (d2ball >= 0.05f) off({TZ_SLIDING, TZ_LONG_PASS, TZ_HIGH_PASS, TZ_SHORT_PASS, TZ_SHOT});
    } else if (o.ball_owned_team == 0) {
      a[TZ_SLIDING] = 0.f;
      if (d2ball >= 0.05f) off({TZ_LONG_PASS, TZ_HIGH_PASS, TZ_SHORT_PASS, TZ_SHOT, TZ_DRIBBLE});
    } else if (o.ball_owned_team == 1) {
      a[TZ_DRIBBLE] = 0.f;
      if (d2ball >= 0.05f) off({TZ_LONG_PASS, TZ_HIGH_PASS, TZ_SHORT_PASS, TZ_SHOT, TZ_SLIDING});
    }
  } else if (o.game_mode >= 1 && o.game_mode <= 5) {
    if (we_take) {
      off({TZ_SPRINT, TZ_RELEASE_SPRINT, TZ_SLIDING, TZ_DRIBBLE, TZ_RELEASE_DRIBBLE});
    } else {
      off({TZ_LONG_PASS, TZ_HIGH_PASS, TZ_SHORT_PASS, TZ_SHOT, TZ_SLIDING, TZ_DRIBBLE, TZ_RELEASE_DRIBBLE});
    }
  } else if (o.game_mode == 6) {
    if (o.ball[0] > 0 && ax > kBoxX) {
      off({TZ_LONG_PASS, TZ_HIGH_PASS, TZ_SHORT_PASS, TZ_SPRINT, TZ_RELEASE_SPRINT, TZ_SLIDING, TZ_DRIBBLE,
           TZ_RELEASE_DRIBBLE});
    } else {
      off({TZ_LONG_PASS, TZ_HIGH_PASS, TZ_SHORT_PASS, TZ_SHOT, TZ_SLIDING, TZ_DRIBBLE, TZ_RELEASE_DRIBBLE});
    }
  }
}

// ---------------------------------------------------------------------------------------------------- goalkeeper

namespace {

// sticky index of each direction action (left, top_left, ... bottom_left = 0..7), sprint 8, dribble 9
int sticky_index(int action) {
  if (action >= TZ_LEFT && action <= TZ_BOTTOM_LEFT) return action - TZ_LEFT;
  if (action == TZ_SPRINT) return 8;
  if (action == TZ_DRIBBLE) return 9;
  return -1;
}

bool has(const int sticky[10], int action) {
  int i = sticky_index(action);
  return i >= 0 && sticky[i] != 0;
}

int release_all(const int sticky[10]) {
  if (sticky[8]) return TZ_RELEASE_SPRINT;
  if (sticky[9]) return TZ_RELEASE_DRIBBLE;
  for (int i = 0; i < 10; i++)
    if (sticky[i]) return TZ_RELEASE_DIRECTION;
  return TZ_IDLE;
}

int start_sprinting(const int sticky[10]) {  // only called when sprint is not on
  return sticky[9] ? TZ_RELEASE_DRIBBLE : TZ_SPRINT;
}

float dist_y(float x1, float y1, float x2, float y2) {  // goal_keeper.get_distance: y counts 2.38 times
  return std::sqrt((x1 - x2) * (x1 - x2) + (y1 * 2.38f - y2 * 2.38f) * (y1 * 2.38f - y2 * 2.38f));
}

int toward(const TzObs& o, float tx, float ty) {
  return kDirActions[best_direction(tx - o.left[0][0], ty - o.left[0][1])];
}

}  // namespace

int tizero_goalkeeper(const TzObs& o, const int sticky[10], std::mt19937& rng) {
  const float px = o.left[0][0], py = o.left[0][1];
  const float d2ball = std::hypot(o.ball[0] - px, o.ball[1] - py);
  // 1. far from the play (or a team-mate is nearer the ball): back to the middle of the goal
  bool far = d2ball > 0.5f || (o.ball_owned_team == 0 && o.ball_owned_player != 0);
  if (!far && (px > -0.7f || std::fabs(py) > 0.25f)) {
    for (int i = 1; i < 11; i++)
      if (std::hypot(o.ball[0] - o.left[i][0], o.ball[1] - o.left[i][1]) < d2ball) far = true;
  }
  if (far) {
    if (std::hypot(-1 + 0.01f - px, 0 - py) < 0.02f) return release_all(sticky);
    if (!sticky[8]) return start_sprinting(sticky);
    return toward(o, -1 + 0.01f, 0.f);
  }
  // 2. the keeper has the ball: clear it forward
  if (o.ball_owned_team == 0 && o.ball_owned_player == 0) {
    if (px < -0.4f) {
      float md = 1e9f;
      for (int i = 0; i < 11; i++) md = std::min(md, dist_y(px, py, o.right[i][0], o.right[i][1]));
      if (std::fabs(py) > 0.22f) return has(sticky, TZ_RIGHT) ? TZ_HIGH_PASS : TZ_RIGHT;
      if (md > 0.4f) return py > 0 ? TZ_BOTTOM : TZ_TOP;
      if (md < 0.4f && md > 0.2f) return py < 0 ? TZ_TOP_RIGHT : TZ_BOTTOM_RIGHT;
      if (md < 0.2f) return has(sticky, TZ_RIGHT) ? TZ_HIGH_PASS : TZ_RIGHT;
    }
    return TZ_IDLE;
  }
  // 3. set pieces
  if (o.game_mode != 0) {
    switch (o.game_mode) {
      case 4:  // corner
        if (py > 0) { if (!has(sticky, TZ_TOP_RIGHT)) return TZ_TOP_RIGHT; }
        else if (!has(sticky, TZ_BOTTOM_RIGHT)) return TZ_BOTTOM_RIGHT;
        return TZ_HIGH_PASS;
      case 3:  // free kick
        if (px > 0.5f) {
          if (py > 0) { if (!has(sticky, TZ_TOP_RIGHT)) return TZ_TOP_RIGHT; }
          else if (!has(sticky, TZ_BOTTOM_RIGHT)) return TZ_BOTTOM_RIGHT;
          return TZ_SHOT;
        }
        if (py > 0) { if (!has(sticky, TZ_BOTTOM_RIGHT)) return TZ_BOTTOM_RIGHT; }
        else if (!has(sticky, TZ_TOP_RIGHT)) return TZ_TOP_RIGHT;
        return TZ_SHORT_PASS;
      case 2:  // goal kick
        if (!has(sticky, TZ_BOTTOM_RIGHT)) return TZ_BOTTOM_RIGHT;
        return TZ_SHORT_PASS;
      case 1:  // kick off
        if (py > 0) { if (!has(sticky, TZ_TOP)) return TZ_TOP; }
        else if (!has(sticky, TZ_BOTTOM)) return TZ_BOTTOM;
        return TZ_SHORT_PASS;
      case 6:  // penalty
        if (std::uniform_real_distribution<float>(0.f, 1.f)(rng) < 0.5f && !has(sticky, TZ_TOP_RIGHT) &&
            !has(sticky, TZ_BOTTOM_RIGHT))
          return TZ_TOP_RIGHT;
        if (!has(sticky, TZ_BOTTOM_RIGHT)) return TZ_BOTTOM_RIGHT;
        return TZ_SHOT;
      case 5:  // throw in
        if (!has(sticky, TZ_RIGHT)) return TZ_RIGHT;
        return TZ_SHORT_PASS;
    }
    return TZ_IDLE;
  }
  // 4. 0.2 - 0.5 away and they have it (or nobody): stand on the line from the ball to the middle of the goal
  if (o.ball_owned_team != 0 && d2ball <= 0.5f && d2ball >= 0.2f) {
    float bx = o.ball[0], by = o.ball[1];
    float dg = std::sqrt((bx + 1) * (bx + 1) + by * by) + 1e-5f;
    float tx = 0.03f * (bx + 1) / dg - 1, ty = 0.03f * by / dg;
    if (std::hypot(tx - px, ty - py) < 0.02f) return release_all(sticky);
    if (!sticky[8]) return start_sprinting(sticky);
    return toward(o, tx, ty);
  }
  // 5. close: clear it
  if (o.ball_owned_team != 0 && d2ball < 0.25f) return TZ_SHOT;
  // 6. defending: run at where the ball is going
  if (o.ball_owned_team != 0) {
    float bx = o.ball[0] + o.ball_dir[0] * 7, by = o.ball[1] + o.ball_dir[1] * 3;
    if (std::fabs(by) > 0.07f && o.ball_owned_team == 1) {
      bx -= 0.01f;
      by += by > 0 ? -0.01f : 0.01f;
    }
    if (!sticky[8]) return start_sprinting(sticky);
    if (bx > px && std::fabs(by - py) < 0.01f) return TZ_RIGHT;
    if (bx < px && std::fabs(by - py) < 0.01f) return TZ_LEFT;
    if (by > py && std::fabs(bx - px) < 0.01f) return TZ_BOTTOM;
    if (by < py && std::fabs(bx - px) < 0.01f) return TZ_TOP;
    if (bx > px && by < py) return TZ_TOP_RIGHT;
    if (bx < px && by < py) return TZ_TOP_LEFT;
    if (bx > px && by > py) return TZ_BOTTOM_RIGHT;
    if (bx < px && by > py) return TZ_BOTTOM_LEFT;
    return TZ_IDLE;
  }
  return TZ_IDLE;
}

}  // namespace afc
