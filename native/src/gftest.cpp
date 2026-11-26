#include <string>
// AFC native check: plays a match with Google Research Football's engine, headless, and prints what happened.
//   gftest <gfootball data dir> [physics frames] [tizero.bin [left difficulty [temperature [obs dump file]]]]
// With tizero.bin the right team is played by TiZero against the engine's built-in AI on the left.
#include <chrono>
#include <cstdio>
#include <cstdlib>
#include <cmath>

#include "gf_api.h"
#include "crash_guard.h"
#include "tizero.h"

static void dump(FILE* f, const afc::TzObs& o, int frame) {
  auto arr = [&](const char* name, const float* v, int n, bool last = false) {
    fprintf(f, "\"%s\": [", name);
    for (int i = 0; i < n; i++) fprintf(f, "%s%.7g", i ? ", " : "", v[i]);
    fprintf(f, "]%s", last ? "" : ", ");
  };
  auto barr = [&](const char* name, const bool* v, int n) {
    fprintf(f, "\"%s\": [", name);
    for (int i = 0; i < n; i++) fprintf(f, "%s%s", i ? ", " : "", v[i] ? "true" : "false");
    fprintf(f, "], ");
  };
  fprintf(f, "{\"frame\": %d, ", frame);
  arr("ball", o.ball, 3);
  arr("ball_direction", o.ball_dir, 3);
  arr("ball_rotation", o.ball_rot, 3);
  arr("left_team", &o.left[0][0], 22);
  arr("left_team_direction", &o.left_dir[0][0], 22);
  arr("left_team_tired_factor", o.left_tired, 11);
  barr("left_team_yellow_card", o.left_yellow, 11);
  barr("left_team_active", o.left_active, 11);
  arr("right_team", &o.right[0][0], 22);
  arr("right_team_direction", &o.right_dir[0][0], 22);
  arr("right_team_tired_factor", o.right_tired, 11);
  barr("right_team_yellow_card", o.right_yellow, 11);
  barr("right_team_active", o.right_active, 11);
  fprintf(f, "\"ball_owned_team\": %d, \"ball_owned_player\": %d, \"game_mode\": %d, \"score\": [%d, %d], \"steps_left\": %d}\n",
          o.ball_owned_team, o.ball_owned_player, o.game_mode, o.score[0], o.score[1], o.steps_left);
}

// Shots, saves and what the keepers do, from the state alone (the same shot test as scripts/view/engine_stats.gd):
// a shot = the ball leaves its man at > 12 m/s toward the goal his side attacks, from within 36 m, arriving within
// 2.5 s inside 10 m of the goal's centre; a save = the defending keeper gets the ball while the shot is live; a dive =
// the defending keeper's body (the "player" joint, 0 standing) drops more than 0.45 m while it is live.
struct KeeperStats {
  int shots = 0, on_target = 0, saves = 0, goals = 0, dives = 0, dives_off = 0, kept_out = 0;
  int live_t = 0;
  double depth_sum = 0.0;
  int depth_n = 0;
  int live = -1;        // team of the live shot, -1 none
  bool live_on = false, dived = false;
  int last_man = -1;    // 0..21 who had the ball last
  int goals_seen[2] = {0, 0};
  float root_min = 9.f, root_max = -9.f;

  void feed(const afc::GfState& s) {
    const float GOAL_X = 54.4f;
    int ot = s.ball_owner_team;
    if (live >= 0 && ++live_t > 300) {   // 3 s and no goal: the shot was kept out (saved, blocked, wide)
      if (live_on) kept_out++;
      live = -1;
    }
    if (ot >= 0) {
      int man = ot * 11 + s.ball_owner_player;
      if (live >= 0 && ot != live && s.ball_owner_player == 0 && live_on) saves++;
      if (live >= 0 && live_on) kept_out++;
      live = -1;
      last_man = man;
    }
    if (ot < 0 && last_man >= 0 && live < 0 && s.game_mode == 0) {
      int team = last_man / 11;
      float gx = team == 0 ? GOAL_X : -GOAL_X;
      float vx = team == 0 ? s.ball_vel[0] : -s.ball_vel[0];
      float sp = std::sqrt(s.ball_vel[0] * s.ball_vel[0] + s.ball_vel[1] * s.ball_vel[1] + s.ball_vel[2] * s.ball_vel[2]);
      if (sp > 12.f && vx > 4.f && std::fabs(gx - s.ball[0]) < 36.f) {
        float t = std::fabs(gx - s.ball[0]) / std::fabs(s.ball_vel[0]);
        float y = s.ball[1] + s.ball_vel[1] * t;
        if (t < 2.5f && std::fabs(y) < 10.f) {
          float z = s.ball[2] + s.ball_vel[2] * t - 4.9f * t * t;
          shots++;
          live = team;
          live_on = std::fabs(y) < 3.66f && z < 2.44f + 0.4f;
          live_t = 0;
          if (live_on) on_target++;
          dived = false;
        }
      }
    }
    const afc::GfPlayer& k = s.players[live >= 0 ? (1 - live) * 11 : 0];
    if (live >= 0) {
      root_min = std::min(root_min, k.root[2]);
      root_max = std::max(root_max, k.root[2]);
      if (!dived && k.root[2] < -0.45f) {   // the "player" joint drops ~0.9 m in a dive, ~0 standing
        dived = true;
        dives++;
        if (!live_on) dives_off++;
      }
    }
    for (int t = 0; t < 2; t++) {
      if (s.goals[t] > goals_seen[t]) {
        goals_seen[t] = s.goals[t];
        goals++;
        const afc::GfPlayer& gk = s.players[(1 - t) * 11];
        float line = t == 0 ? GOAL_X : -GOAL_X;   // the conceding keeper's goal line
        depth_sum += std::fabs(line - gk.pos[0]);
        depth_n++;
        live = -1;
      }
    }
  }
};

int main(int argc, char** argv) {
  if (argc < 2) {
    fprintf(stderr, "usage: gftest <data dir> [physics frames] [tizero.bin [left difficulty [temperature [dump]]]]\n");
    return 1;
  }
  int frames = argc > 2 ? atoi(argv[2]) : 30000;
  auto t0 = std::chrono::steady_clock::now();
  afc::GfSetup setup;
  setup.data_dir = argv[1];
  // GF_PASS_TEST: the left team is "human": whenever its man has had the ball 0.4 s, a tap on SHORT PASS (held
  // GF_TAP frames, default 12 = 120 ms like a thumb); prints the mean time from the tap to the ball leaving his feet
  const bool pass_test = getenv("GF_PASS_TEST") != nullptr;
  const int tap_frames = getenv("GF_TAP") ? atoi(getenv("GF_TAP")) : 12;
  // GF_FEEL_TEST: a scripted human who defends like a person (stick at the man on the ball, PRESSURE held, SWITCH
  // when a team-mate is much nearer) and, on the ball, flips the stick back to time the turn. GF_FEEL_TEST=ai: the
  // same numbers with the left team all CPU (the reference for the defending).
  const char* feel_env = getenv("GF_FEEL_TEST");
  const bool feel_test = feel_env != nullptr;
  const bool feel_ai = feel_test && std::string(feel_env) == "ai";
  setup.human_players = (pass_test || (feel_test && !feel_ai)) ? 1 : 0;
  setup.match_frames = frames;
  if (getenv("GF_SEED")) setup.seed = (unsigned)atoi(getenv("GF_SEED"));
  if (argc > 3) {
    setup.right_brain = 1;
    setup.brain_path = argv[3];
    setup.left_difficulty = argc > 4 ? (float)atof(argv[4]) : 0.95f;
    setup.right_difficulty = setup.left_difficulty;
    setup.brain_temperature = argc > 5 ? (float)atof(argv[5]) : 0.f;
  }
  if (getenv("GF_RIGHT_DIFF")) {   // the CPU at a game level (Amateur 0.3, Pro 0.6, World Class 0.95), the human's side full
    setup.left_difficulty = 1.0f;
    setup.right_difficulty = (float)atof(getenv("GF_RIGHT_DIFF"));
  }
  FILE* df = argc > 6 ? fopen(argv[6], "w") : nullptr;
  if (getenv("GF_CRASH_FILE")) afc::crash_guard_install(getenv("GF_CRASH_FILE"));
  for (int t = 0; t < 2; t++) {
    const char* e = getenv(t == 0 ? "GF_STATS_L" : "GF_STATS_R");
    if (e) setup.stats[t].assign(11 * 22, (float)atof(e));
  }
  // GF_STATS_FILE: two lines of 242 numbers, the game's real squads (engine_match_view.gd team_stats)
  if (const char* sf = getenv("GF_STATS_FILE")) {
    if (FILE* fp = fopen(sf, "r")) {
      for (int t = 0; t < 2; t++) {
        setup.stats[t].clear();
        float v;
        for (int k = 0; k < 11 * 22 && fscanf(fp, "%f", &v) == 1; k++) setup.stats[t].push_back(v);
      }
      fclose(fp);
    }
  }
  if (getenv("GF_WIND")) { setup.wind_x = (float)atof(getenv("GF_WIND")); }
  if (!afc::gf_start(setup)) {
    fprintf(stderr, "start failed\n");
    return 2;
  }
  printf("right team: %s\n", afc::gf_brain_on() ? "TiZero" : "built-in AI");
  // GF_TAC_L / GF_TAC_R="mentality,width,pressing" (each -1..1): team instructions; TAC prints the left team's shape
  for (int t = 0; t < 2; t++) {
    const char* e = getenv(t == 0 ? "GF_TAC_L" : "GF_TAC_R");
    float m = 0.f, w = 0.f, pr = 0.f;
    if (e && sscanf(e, "%f,%f,%f", &m, &w, &pr) >= 1) afc::gf_set_tactics(t, m, w, pr);
    const char* st = getenv(t == 0 ? "GF_STYLE_L" : "GF_STYLE_R");
    if (st) afc::gf_set_style(t, atoi(st));
  }
  double tac_depth = 0.0, tac_width = 0.0;
  long tac_n = 0;
  int to_t = -1, to_owner = -1, to_def = -1, to_n = 0, to_won = 0, to_fail = 0;
  float to_att = 1.f;
  int regains_left = 0, quick_regains = 0, lost_at = -1;
  auto t1 = std::chrono::steady_clock::now();
  printf("started in %.0f ms\n", std::chrono::duration<double, std::milli>(t1 - t0).count());
  afc::GfState st;
  static afc::TzObs o;
  for (int k = 0; k < 400; k++) afc::gf_frame();
  afc::gf_state(&st);
  afc::gf_brain_obs(&o, false);
  for (int i = 0; i < 22; i += 3) {
    const float* ob = i < 11 ? o.left[i] : o.right[i - 11];
    printf("  player %2d drawn (%6.1f %6.1f)  obs -> metres (%6.1f %6.1f)\n", i, st.players[i].pos[0], st.players[i].pos[1],
           ob[0] * 54.4f, ob[1] * -83.6f);
  }
  printf("  ball (%.1f %.1f) owner %d/%d\n", st.ball[0], st.ball[1], st.ball_owner_team, st.ball_owner_player);
  printf("kick off, as the left team sees it: left GK drawn (%.1f %.1f) obs (%.3f %.3f); right GK drawn (%.1f %.1f) obs (%.3f %.3f)\n",
         st.players[0].pos[0], st.players[0].pos[1], o.left[0][0], o.left[0][1], st.players[11].pos[0], st.players[11].pos[1],
         o.right[0][0], o.right[0][1]);
  int stop = getenv("GF_STOP") ? atoi(getenv("GF_STOP")) : frames;
  // match numbers: possession changes, set pieces by kind, time in play
  int poss_changes = 0, last_owner = -1, prev_mode = 0, in_play = 0;
  KeeperStats ks;
  // feel test
  int spell_start = -1, spells = 0, switch_cd = 0;
  long spell_frames = 0;
  int turn_phase = 0, turn_t0 = 0, turns = 0, turn_face_n = 0, turn_vel_n = 0;
  long turn_face_ms = 0, turn_vel_ms = 0;
  float prevx = 0.f;
  int hold = 0, tap_left = 0, tap_at = -1, taps = 0, passes = 0;
  long pass_frames = 0;
  // GF_SHOT_STYLE=0/1/2: the tap is a SHOT (normal / chip / finesse) instead of a pass; prints the ball's launch
  const int shot_style = getenv("GF_SHOT_STYLE") ? atoi(getenv("GF_SHOT_STYLE")) : -1;
  double elev_sum = 0.0, speed_sum = 0.0;
  int launches = 0;
  float tap_tx = 0.f, tap_ty = 0.f, tap_best = 0.f, tap_sum = 0.f;
  int tap_watch = -1, tap_n = 0, tap_hit = 0;
  float gl_prev = 0.f;
  int aim_t = -1, aim_target = -1, aim_near = -1, aim_n = 0, aim_hit = 0, aim_nearest = 0, aim_lost = 0;
  bool aim_done = false;
  int aim_passer = -1;
  float aim_dx = 1.f, aim_dy = 0.f;
  int gl_in = 0, gl_over = 0, gl_wide = 0, gl_y_n = 0;
  float gl_y_sum = 0.f, gl_y_abs = 0.f;   // where shots cross the goal line (engine y; posts at +-3.66)
  int cross_t = -1, cross_n = 0, cross_shots = 0, cross_air = 0;
  bool cross_shoot = false, cross_done = false, cross_pressed = false;
  int cross_press = 0, cross_bi = -1;
  float cross_pv[3] = {0.f, 0.f, 0.f};
  float cross_closest = 1e9f, cross_z_at = 0.f;
  bool tap_air = false, tap_watch_air_done = false;
  int by_dist_n[4] = {0, 0, 0, 0}, by_dist_on[4] = {0, 0, 0, 0}, by_dist_goal[4] = {0, 0, 0, 0}, last_shot_bk = -1, last_shot_f = -1000, goals_seen = 0;   // shots from <20, 20-30, 30-45, 45+ m: on target
  int restarts[7] = {0, 0, 0, 0, 0, 0, 0};
  for (int f = 0; f < stop; f++) {
    if (feel_test) {
      afc::GfState ps;
      afc::gf_state(&ps);
      // the defending spells: from the right team winning the ball to the left team having it back
      if (ps.game_mode == 0 && ps.ball_owner_team == 1 && spell_start < 0) spell_start = f;
      if (spell_start >= 0 && (ps.ball_owner_team == 0 || ps.game_mode != 0)) {
        if (ps.ball_owner_team == 0) { spells++; spell_frames += f - spell_start; }
        spell_start = -1;
      }
      if (!feel_ai) {
        int c = ps.controlled;
        float dx = 0.f, dy = 0.f;
        unsigned b = 0;
        if (getenv("GF_PASSIVE_DEF") && ps.ball_owner_team == 1) {
          // a player who leaves the defending to his team-mates: the stick at rest, no buttons
        } else if (c >= 0 && ps.game_mode == 0 && ps.ball_owner_team == 1) {
          const afc::GfPlayer& me = ps.players[c];
          dx = ps.ball[0] - me.pos[0];
          dy = ps.ball[1] - me.pos[1];
          float d = std::sqrt(dx * dx + dy * dy);
          b = afc::GF_PRESSURE | (d > 6.f ? afc::GF_SPRINT : 0u) | (getenv("GF_TEAM_PRESS") ? afc::GF_TEAM_PRESSURE : 0u);
          float best = 1e9f;
          for (int i = 1; i < 11; i++) {
            float ex = ps.ball[0] - ps.players[i].pos[0], ey = ps.ball[1] - ps.players[i].pos[1];
            best = std::min(best, std::sqrt(ex * ex + ey * ey));
          }
          if (!getenv("GF_NO_SWITCH") && switch_cd <= 0 && d > 8.f && d > best * 1.6f) { b |= afc::GF_SWITCH; switch_cd = 60; }
          if (d > 0.01f) { dx /= d; dy /= d; }
          turn_phase = 0;
        } else if (c >= 0 && ps.game_mode == 0 && ps.ball_owner_team == 0 && ps.ball_owner_player == c) {
          // on the ball: run +x for 1 s, then flip the stick and time the turn
          const afc::GfPlayer& me = ps.players[c];
          if (turn_phase == 0) { turn_phase = 1; turn_t0 = f; }
          if (turn_phase == 1) {
            dx = 1.f;
            if (f - turn_t0 >= 100) { turn_phase = 2; turn_t0 = f; turns++; }
          }
          if (turn_phase == 2) {
            dx = -1.f;
            float qx = me.joints[afc::J_BODY][0], qy = me.joints[afc::J_BODY][1], qz = me.joints[afc::J_BODY][2], qw = me.joints[afc::J_BODY][3];
            // the body's forward in engine axes: Godot q = (x, z, -y, w) applied to (0, 0, 1), back to engine (x, -z)
            float gx = qx, gy = qz, gz = -qy;
            float fx = 2.f * (gx * gz + qw * gy), fz = 1.f - 2.f * (gx * gx + gy * gy);
            float ex = fx;   // engine x of the facing
            (void)fz;
            if (ex < 0.f && turn_face_n < turns) { turn_face_n++; turn_face_ms += 10 * (f - turn_t0); }
            float vx = me.pos[0] - prevx;
            if (vx < -0.005f && turn_vel_n < turns) { turn_vel_n++; turn_vel_ms += 10 * (f - turn_t0); }
            if (f - turn_t0 > 150) { turn_phase = 3; b = afc::GF_SHORT_PASS; }
          }
          prevx = me.pos[0];
        } else {
          turn_phase = 0;
          if (ps.game_mode != 0 && f % 120 == 0) b = afc::GF_SHORT_PASS;   // take set pieces
        }
        if (switch_cd > 0) switch_cd--;
        afc::gf_input(dx, dy, b);
      }
    }
    if (pass_test) {
      afc::GfState ps;
      afc::gf_state(&ps);
      bool mine = ps.game_mode == 0 && ps.ball_owner_team == 0 && ps.ball_owner_player == ps.controlled;
      if (tap_at >= 0) {
        float bs = std::sqrt(ps.ball_vel[0] * ps.ball_vel[0] + ps.ball_vel[1] * ps.ball_vel[1]);
        if (!mine || bs > 7.f) {
          passes++;
          pass_frames += f - tap_at;
          if (shot_style >= 0 && bs > 7.f) {
            float sp = std::sqrt(bs * bs + ps.ball_vel[2] * ps.ball_vel[2]);
            elev_sum += std::atan2(ps.ball_vel[2], bs) * 57.2958;
            {
              float gx = 54.4f, dxg = gx - ps.ball[0];
              float dist = std::sqrt(dxg * dxg + ps.ball[1] * ps.ball[1]);
              int bk = dist < 20.f ? 0 : dist < 30.f ? 1 : dist < 45.f ? 2 : 3;
              bool on = false;
              if (ps.ball_vel[0] > 1.f) {
                float t = dxg / ps.ball_vel[0];
                float y = ps.ball[1] + ps.ball_vel[1] * t, z = ps.ball[2] + ps.ball_vel[2] * t - 4.9f * t * t;
                on = std::fabs(y) < 3.66f && z < 2.44f && t < 4.f;
              }
              by_dist_n[bk]++;
              if (on) by_dist_on[bk]++;
              last_shot_bk = bk;
              last_shot_f = f;
            }
            speed_sum += sp;
            launches++;
          }
          tap_at = -1;
          hold = 0;
        } else if (f - tap_at > 150) {
          tap_at = -1;   // never went: not counted as a pass
          hold = 0;
        }
      }
      hold = mine ? hold + 1 : 0;
      // GF_SHOT_NEAR: dribble at the goal and only shoot inside ~20 m (the stick straight at goal: the aim is the engine's)
      static const float near_x = getenv("GF_SHOT_X") ? (float)atof(getenv("GF_SHOT_X")) : 34.f;
      if (getenv("GF_SHOT_NEAR") && mine && ps.ball[0] < near_x && hold >= 40) hold = 39;
      // GF_TAP_TEST=1/2/3: tap passing - 1 a ground ball to open grass 18 m ahead, 2 a lofted ball 32 m ahead and 8 m
      // wide, 3 to the nearest team-mate's feet; TAP prints how close the ball came to the spot
      // where shots really cross the goal line the human attacks (+x): in, over the bar, wide
      if (gl_prev < 52.5f && ps.ball[0] >= 52.5f && ps.ball_vel[0] > 8.f) {
        if (std::fabs(ps.ball[1]) < 3.66f) { if (ps.ball[2] < 2.44f) gl_in++; else gl_over++; } else gl_wide++;
        gl_y_sum += ps.ball[1]; gl_y_abs += std::fabs(ps.ball[1]); gl_y_n++;
      }
      gl_prev = ps.ball[0];
      // a goal of ours within 4 s of our last shot: that shot's distance band scored
      if (ps.goals[0] > goals_seen) {
        if (last_shot_bk >= 0 && f - last_shot_f < 240) by_dist_goal[last_shot_bk]++;
        last_shot_bk = -1;
      }
      goals_seen = ps.goals[0];
      // GF_AIM_TEST: the stick points at a team-mate who is NOT the nearest (15-35 m, any direction); a pass is
      // pressed; AIM prints how often the ball reached the man aimed at, and how often the nearest instead
      static const bool aim_test = getenv("GF_AIM_TEST") != nullptr;
      if (aim_test && hold == 40 && aim_t < 0 && ps.game_mode == 0 && ps.controlled >= 0) {
        const afc::GfPlayer& me = ps.players[ps.controlled];
        int near = -1; float nd = 1e9f;
        for (int i = 1; i < 11; i++) if (i != ps.controlled) {
          float d = std::hypot(ps.players[i].pos[0] - me.pos[0], ps.players[i].pos[1] - me.pos[1]);
          if (d < nd) { nd = d; near = i; }
        }
        int pick = -1; float pd = 0.f;
        for (int i = 1; i < 11; i++) if (i != ps.controlled && i != near) {
          float d = std::hypot(ps.players[i].pos[0] - me.pos[0], ps.players[i].pos[1] - me.pos[1]);
          if (d > 15.f && d < 35.f && d > pd) { pd = d; pick = i; }
        }
        if (pick >= 0) {
          aim_target = pick; aim_near = near; aim_t = 0; aim_n++; aim_passer = ps.controlled;
          aim_dx = (ps.players[pick].pos[0] - me.pos[0]) / pd; aim_dy = (ps.players[pick].pos[1] - me.pos[1]) / pd;
        }
      }
      if (aim_t >= 0) {
        aim_t++;
        if (getenv("GF_AIM_DEBUG") && (aim_t % 25 == 1)) printf("aim t%d target %d near %d ctl %d owner %d/%d\n", aim_t, aim_target, aim_near, ps.controlled, ps.ball_owner_team, ps.ball_owner_player);
        // the engine hands control to the man a pass is played to: that first switch is who it chose
        if (aim_t > 3 && !aim_done && ps.controlled >= 0 && ps.controlled != aim_passer && ps.ball_owner_team != 0) {
          if (ps.controlled == aim_target) aim_hit++;
          else if (ps.controlled == aim_near) aim_nearest++;
          aim_done = true;
        }
        if (aim_t > 3 && !aim_done && ps.ball_owner_team == 1) { aim_lost++; aim_done = true; }
        if (aim_t >= 250) { aim_t = -1; aim_done = false; }
      }
      static const int tap_test = getenv("GF_TAP_TEST") ? atoi(getenv("GF_TAP_TEST")) : 0;
      // GF_CROSS_TEST: a lofted ball to the most advanced team-mate, then SHOOT held while it is in the air; counts
      // the first-time finishes (the next touch is a shot) and how many were struck off the ground (volley / header)
      static const bool cross_test = getenv("GF_CROSS_TEST") != nullptr;
      if (cross_test && hold == 40 && cross_t < 0 && ps.game_mode == 0) {
        int bi = -1; float bx = -1e9f;
        for (int i = 1; i < 11; i++) if (i != ps.controlled && ps.players[i].pos[0] > bx) { bx = ps.players[i].pos[0]; bi = i; }
        if (bi >= 0) {
          static const float lead = getenv("GF_CROSS_LEAD") ? (float)atof(getenv("GF_CROSS_LEAD")) : 0.f;
          float dx = ps.players[bi].pos[0] - ps.players[ps.controlled].pos[0], dy = ps.players[bi].pos[1] - ps.players[ps.controlled].pos[1];
          float dl = std::max(0.1f, std::hypot(dx, dy));
          afc::gf_pass_to(ps.players[bi].pos[0] + dx / dl * lead, ps.players[bi].pos[1] + dy / dl * lead, 2);
          cross_t = 0; cross_n++; cross_bi = bi;
        }
      }
      if (cross_t >= 0) {
        cross_t++;
        // SHOOT tapped like a person: when the ball in the air is ~10 m from the man it is coming to
        if (cross_press > 0) { cross_shoot = true; cross_press--; } else cross_shoot = false;
        // GF_CROSS_EARLY: SHOOT pressed right after the cross (on the crosser), then pressed again for him as the
        // ball reaches the receiver - what engine_match_view.gd's remembered finish does
        if (getenv("GF_CROSS_EARLY") && cross_t == 10) cross_press = 6;
        if (!cross_pressed && cross_t > 6 && ps.ball[2] > 0.5f && ps.controlled >= 0) {
          const afc::GfPlayer& c = ps.players[ps.controlled];
          static const float press_r = getenv("GF_CROSS_EARLY") ? 7.f : 10.f;
          if (std::hypot(ps.ball[0] - c.pos[0], ps.ball[1] - c.pos[1]) < press_r && cross_t > 18) {
            cross_press = 8; cross_pressed = true;
            if (getenv("GF_CROSS_DEBUG")) printf("press: ctl %d target %d ball z %.1f t %d\n", ps.controlled, cross_bi, ps.ball[2], cross_t);
          }
        }
        float bs = std::sqrt(ps.ball_vel[0] * ps.ball_vel[0] + ps.ball_vel[1] * ps.ball_vel[1]);
        const float dvx = ps.ball_vel[0] - cross_pv[0], dvy = ps.ball_vel[1] - cross_pv[1], dvz = ps.ball_vel[2] - cross_pv[2];
        const bool kicked = std::sqrt(dvx * dvx + dvy * dvy + dvz * dvz) > 6.f;
        cross_pv[0] = ps.ball_vel[0]; cross_pv[1] = ps.ball_vel[1]; cross_pv[2] = ps.ball_vel[2];
        if (cross_pressed && kicked && !cross_done && cross_t > 8) {
          cross_done = true;   // the first touch after SHOOT: was it a shot (fast, goalwards), and off the ground?
          if (bs > 12.f && ps.ball_vel[0] > 5.f) { cross_shots++; if (ps.ball[2] > 0.45f) cross_air++; }
          if (getenv("GF_CROSS_DEBUG")) printf("touch: speed %.1f vx %.1f z %.2f t %d\n", bs, ps.ball_vel[0], ps.ball[2], cross_t);
        }
        if (false) {
          cross_shots++; if (ps.ball[2] > 0.45f) cross_air++; cross_done = true;
          if (getenv("GF_CROSS_DEBUG")) printf("shot: by team %d player %d (ctl %d) z %.2f t %d\n", ps.ball_owner_team, ps.ball_owner_player, ps.controlled, ps.ball[2], cross_t);
        }
        // the height the ball passes the receiver at (closest approach, while still in the air)
        if (cross_bi >= 0 && cross_t > 10) {
          const afc::GfPlayer& rcv = ps.players[cross_bi];
          const float d = std::hypot(ps.ball[0] - rcv.pos[0], ps.ball[1] - rcv.pos[1]);
          if (d < cross_closest) { cross_closest = d; cross_z_at = ps.ball[2]; }
        }
        if (cross_t == 219 && getenv("GF_CROSS_DEBUG")) printf("arrive: closest %.1f m at height %.2f\n", cross_closest, cross_z_at);
        if (cross_t >= 220) { cross_closest = 1e9f; cross_t = -1; cross_shoot = false; cross_done = false; cross_pressed = false; }
      }
      if (tap_test && hold == 40 && tap_at < 0 && ps.game_mode == 0) {
        const afc::GfPlayer& me = ps.players[ps.controlled];
        if (tap_test == 3) {
          int bi = -1; float bd = 1e9f;
          for (int i = 1; i < 11; i++) if (i != ps.controlled) {
            float d = std::hypot(ps.players[i].pos[0] - me.pos[0], ps.players[i].pos[1] - me.pos[1]);
            if (d < bd && d > 6.f) { bd = d; bi = i; }
          }
          if (bi >= 0) { tap_tx = ps.players[bi].pos[0]; tap_ty = ps.players[bi].pos[1]; }
        } else {
          tap_tx = std::min(me.pos[0] + (tap_test == 1 ? 18.f : 32.f), 48.f);
          tap_ty = std::max(-30.f, std::min(30.f, me.pos[1] + (tap_test == 1 ? 0.f : 8.f)));
        }
        afc::gf_pass_to(tap_tx, tap_ty, tap_test == 2 ? 2 : 1);
        tap_watch = 0; tap_best = 1e9f; tap_air = false; tap_watch_air_done = false;
      }
      if (tap_watch >= 0) {
        tap_watch++;
        float d = std::hypot(ps.ball[0] - tap_tx, ps.ball[1] - tap_ty);
        if (tap_watch > 20 && ps.ball[2] < 0.6f) tap_best = std::min(tap_best, d);
        if (ps.ball[2] > 1.5f) tap_air = true;
        if (tap_air && !tap_watch_air_done && ps.ball[2] < 0.4f) {   // first landing of a lofted ball: along (+ long) and across
          float sx = ps.ball[0] - tap_tx, sy = ps.ball[1] - tap_ty;
          printf("LAND %.1f %.1f\n", sx, sy);
          tap_air = false; tap_watch_air_done = true;
        }
        if (tap_watch == 300) { tap_n++; tap_sum += tap_best; if (tap_best < 3.f) tap_hit++; tap_watch = -1; }
      }
      if (hold == 40 && tap_at < 0) {
        tap_at = f;
        tap_left = tap_frames;
        taps++;
      }
      if (ps.game_mode != 0 && f % 120 == 0 && tap_left == 0) tap_left = tap_frames;   // take set pieces (not timed)
      unsigned tap_bits = afc::GF_SHORT_PASS;
      if (shot_style >= 0 && ps.game_mode == 0)
        tap_bits = afc::GF_SHOT | (shot_style == 1 ? afc::GF_CHIP : 0u) | (shot_style == 2 ? afc::GF_FINESSE : 0u) |
                   (shot_style == 3 ? afc::GF_LOW : 0u) | (shot_style == 4 ? afc::GF_POWER : 0u);
      if (getenv("GF_CROSS_TEST")) tap_bits = afc::GF_HIGH_PASS;
      const bool aiming = getenv("GF_AIM_TEST") && aim_t >= 0 && aim_t < 30;
      // GF_SHOT_AIM=deg: shots with the stick that many degrees off straight at goal (+ = the engine's +y side)
      static const float shot_aim = getenv("GF_SHOT_AIM") ? (float)atof(getenv("GF_SHOT_AIM")) * 0.0174533f : 0.f;
      const bool aim_shot = shot_style >= 0 && tap_left > 0 && shot_aim != 0.f;
      afc::gf_input(aiming ? aim_dx : aim_shot ? std::cos(shot_aim) : 1.f, aiming ? aim_dy : aim_shot ? std::sin(shot_aim) : 0.f,
                    (tap_left > 0 ? tap_bits : 0u) | (cross_shoot ? afc::GF_SHOT : 0u));
      if (tap_left > 0) tap_left--;
    }
    afc::gf_frame();
    if (getenv("GF_CRASH_TEST") && f == 50) *(volatile int*)nullptr = 1;   // proves the crash report works
    {
      afc::GfState ms;
      afc::gf_state(&ms);
      if (ms.ball_owner_team >= 0 && ms.ball_owner_team != last_owner) {
        if (last_owner >= 0) poss_changes++;
        if (last_owner >= 0 && ms.ball_owner_team == 0) {
          regains_left++;
          if (lost_at >= 0 && f - lost_at < 500) quick_regains++;   // won back within 5 s of losing it
        }
        if (last_owner == 0 && ms.ball_owner_team == 1) lost_at = f;
        last_owner = ms.ball_owner_team;
      }
      if (ms.game_mode != prev_mode && ms.game_mode > 0 && ms.game_mode < 7) restarts[ms.game_mode]++;
      prev_mode = ms.game_mode;
      if (ms.game_mode == 0) in_play++;
      // take-ons (both teams): the man on the ball with an opponent within 2 m in front of him (toward the goal he
      // attacks); 1.5 s later: still his and the defender behind him = beaten, the ball lost = failed
      if (ms.game_mode == 0 && to_t < 0 && ms.ball_owner_team >= 0 && ms.ball_owner_player >= 0) {
        const int oi = ms.ball_owner_team * 11 + ms.ball_owner_player;
        const float att = ms.ball_owner_team == 0 ? 1.f : -1.f;   // the left team attacks +x (gf_state frame)
        const afc::GfPlayer& me = ms.players[oi];
        for (int j = 0; j < 11; j++) {
          const int dj = (1 - ms.ball_owner_team) * 11 + j;
          const float dx = (ms.players[dj].pos[0] - me.pos[0]) * att, dy = ms.players[dj].pos[1] - me.pos[1];
          if (dx > 0.3f && dx < 2.0f && std::fabs(dy) < 1.2f) { to_t = 0; to_owner = oi; to_def = dj; to_att = att; to_n++; break; }
        }
      } else if (to_t >= 0) {
        to_t++;
        const int oi = ms.ball_owner_team >= 0 ? ms.ball_owner_team * 11 + ms.ball_owner_player : -1;
        if (oi >= 0 && oi / 11 != to_owner / 11) { to_fail++; to_t = -1; }
        else if (to_t >= 150) {
          if (oi == to_owner && (ms.players[to_def].pos[0] - ms.players[to_owner].pos[0]) * to_att < -0.5f) to_won++;
          to_t = -1;
        }
      }
      if (ms.game_mode == 0 && f % 10 == 0) {
        // the left team's shape: outfield distance up the pitch from its own keeper, and spread across it
        float cx = 0.f, cy = 0.f;
        for (int i = 1; i < 11; i++) { cx += ms.players[i].pos[0]; cy += ms.players[i].pos[1]; }
        cx /= 10.f; cy /= 10.f;
        float w = 0.f;
        for (int i = 1; i < 11; i++) w += std::fabs(ms.players[i].pos[1] - cy);
        tac_depth += std::fabs(cx - ms.players[0].pos[0]);
        tac_width += w / 10.f;
        tac_n++;
      }
      ks.feed(ms);
    }
    if (df && f % 50 == 0) {
      afc::gf_brain_obs(&o, true);
      dump(df, o, f);
    }
    static int stall = 0;
    afc::gf_state(&st);
    stall = (st.game_mode != 0) ? stall + 1 : 0;
    if (stall == 1500 || stall == 3000) {
      afc::gf_brain_obs(&o, true);
      printf("STALL f=%d mode %d taker %d ball (%.2f %.2f) | right-team view: ball (%.3f %.3f) owned %d/%d\n", f, st.game_mode,
             st.setpiece_taker, st.ball[0], st.ball[1], o.ball[0], o.ball[1], o.ball_owned_team, o.ball_owned_player);
      printf("   actions:");
      for (int i = 0; i < 11; i++) printf(" %d", afc::gf_brain_last(i));
      printf("\n");
      for (int i = 0; i < 11; i++)
        printf("   R%d at (%.3f %.3f) d=%.3f   L%d at (%.3f %.3f) d=%.3f\n", i, o.left[i][0], o.left[i][1],
               std::hypot(o.left[i][0] - o.ball[0], o.left[i][1] - o.ball[1]), i, o.right[i][0], o.right[i][1],
               std::hypot(o.right[i][0] - o.ball[0], o.right[i][1] - o.ball[1]));
    }
    if (f % 5000 == 0 || f == frames - 1) {
      afc::gf_state(&st);
      printf("frame %6d  min %5.1f  mode %d  score %d-%d  ball (%.1f %.1f %.1f)  owner team %d player %d\n", f, st.minute,
             st.game_mode, st.goals[0], st.goals[1], st.ball[0], st.ball[1], st.ball[2], st.ball_owner_team,
             st.ball_owner_player);
    }
  }
  auto t2 = std::chrono::steady_clock::now();
  double ms = std::chrono::duration<double, std::milli>(t2 - t1).count();
  printf("%d frames in %.0f ms (%.3f ms per frame, %.1fx real time)\n", frames, ms, ms / frames, frames * 10.0 / ms);
  afc::gf_state(&st);
  printf("FINAL %d-%d\n", st.goals[0], st.goals[1]);
  {
    afc::GfState fs;
    afc::gf_state(&fs);
    int reds = 0, yellows = 0;
    for (int i = 0; i < 22; i++) { reds += fs.players[i].active == 0; yellows += fs.players[i].card == 1; }
    printf("CARDS red %d yellow %d\n", reds, yellows);
  }
  if (aim_n) printf("AIM passes %d  reached the man aimed at %d  went to the nearest %d  lost %d\n", aim_n, aim_hit, aim_nearest, aim_lost);
  if (gl_in + gl_over + gl_wide) printf("GOALLINE in %d over %d wide %d  mean y %.2f  mean |y| %.2f\n", gl_in, gl_over, gl_wide, gl_y_sum / std::max(1, gl_y_n), gl_y_abs / std::max(1, gl_y_n));
  { extern int afc_header_count; if (cross_n) printf("HEADERS assisted %d\n", afc_header_count); }
  if (cross_n) printf("CROSS crosses %d  first-time shots %d  off the ground %d\n", cross_n, cross_shots, cross_air);
  if (tap_n) printf("TAP passes %d  within 3 m of the spot %d  mean closest %.1f m\n", tap_n, tap_hit, tap_sum / tap_n);
  if (tac_n) printf("TAC left depth %.2f m  width %.2f m  regains %d  within 5 s %d\n", tac_depth / tac_n, tac_width / tac_n, regains_left, quick_regains);
  printf("TAKEON faced %d  beaten %d  lost %d\n", to_n, to_won, to_fail);
  printf("STATS possession_changes %d  goal_kicks %d  free_kicks %d  corners %d  throw_ins %d  penalties %d  in_play %.0f%%\n",
         poss_changes, restarts[2], restarts[3], restarts[4], restarts[5], restarts[6], 100.0 * in_play / stop);
  if (feel_test)
    printf("FEEL %s defending: %d spells, ball back after %.0f ms | turns %d: facing past 90 deg after %.0f ms (%d), moving back after %.0f ms (%d)\n",
           feel_ai ? "cpu" : "human", spells, spells ? 10.0 * spell_frames / spells : 0.0, turns,
           turn_face_n ? (double)turn_face_ms / turn_face_n : 0.0, turn_face_n, turn_vel_n ? (double)turn_vel_ms / turn_vel_n : 0.0, turn_vel_n);
  if (pass_test)
    printf("PASS taps %d passes %d mean_tap_to_ball_ms %.0f\n", taps, passes, passes ? 10.0 * pass_frames / passes : 0.0);
  if (shot_style >= 0)
    printf("SHOTDIST on target: <20m %d/%d  20-30m %d/%d  30-45m %d/%d  45m+ %d/%d\n", by_dist_on[0], by_dist_n[0],
           by_dist_on[1], by_dist_n[1], by_dist_on[2], by_dist_n[2], by_dist_on[3], by_dist_n[3]);
    printf("SHOTGOALS goals per shot: <20m %d/%d  20-30m %d/%d  30-45m %d/%d  45m+ %d/%d\n", by_dist_goal[0], by_dist_n[0],
           by_dist_goal[1], by_dist_n[1], by_dist_goal[2], by_dist_n[2], by_dist_goal[3], by_dist_n[3]);
  if (shot_style >= 0)
    printf("SHOT style %d launches %d mean_elevation_deg %.1f mean_speed %.1f m/s\n", shot_style, launches,
           launches ? elev_sum / launches : 0.0, launches ? speed_sum / launches : 0.0);
  printf("KEEPER shots %d on_target %d kept_out %d caught %d goals %d dives %d dives_off_target %d depth_at_goal %.2f\n",
         ks.shots, ks.on_target, ks.kept_out, ks.saves, ks.goals, ks.dives, ks.dives_off, ks.depth_n ? ks.depth_sum / ks.depth_n : 0.0);
  // where the engine reports the right team vs where it draws them (positions must agree, turned 180 degrees)
  afc::gf_brain_obs(&o, false);
  printf("right player 5: drawn (%.2f %.2f), observed (%.3f %.3f) -> metres (%.2f %.2f)\n", st.players[16].pos[0],
         st.players[16].pos[1], o.right[5][0], o.right[5][1], o.right[5][0] * 54.4f, o.right[5][1] * -83.6f);
  if (df) fclose(df);
  return 0;
}
