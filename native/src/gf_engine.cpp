#include "gf_engine.h"
#include "crash_guard.h"

#include <godot_cpp/core/class_db.hpp>
#include <godot_cpp/variant/utility_functions.hpp>

namespace godot {

void GFEngine::_bind_methods() {
  ClassDB::bind_method(D_METHOD("start", "data_dir", "options"), &GFEngine::start);
  ClassDB::bind_method(D_METHOD("set_crash_file", "path"), &GFEngine::set_crash_file);
  ClassDB::bind_method(D_METHOD("frames", "n"), &GFEngine::frames);
  ClassDB::bind_method(D_METHOD("set_input", "dx", "dy", "buttons"), &GFEngine::set_input);
  ClassDB::bind_method(D_METHOD("state"), &GFEngine::state);
  ClassDB::bind_method(D_METHOD("poses"), &GFEngine::poses);
  ClassDB::bind_method(D_METHOD("stride"), &GFEngine::stride);
  ClassDB::bind_method(D_METHOD("substitute", "team", "player"), &GFEngine::substitute);
  ClassDB::bind_method(D_METHOD("set_tactics", "team", "mentality", "width", "pressing"), &GFEngine::set_tactics);
  ClassDB::bind_method(D_METHOD("set_player_stats", "team", "player", "stats"), &GFEngine::set_player_stats);
}

bool GFEngine::start(const String& data_dir, const Dictionary& o) {
  afc::GfSetup s;
  s.data_dir = data_dir.utf8().get_data();
  s.human_players = int(o.get("human", 1));
  s.left_difficulty = float(o.get("difficulty_home", 0.6));
  s.right_difficulty = float(o.get("difficulty_away", 0.6));
  s.seed = (unsigned)int64_t(o.get("seed", 42));
  s.match_frames = int(float(o.get("match_seconds", 480.0)) * 100.0f);
  s.offsides = bool(o.get("offsides", true));
  s.dribble_lead = float(o.get("dribble_lead", 1.0));
  s.wetness = float(o.get("wetness", 0.0));
  s.wind_x = float(o.get("wind_x", 0.0));
  s.wind_y = float(o.get("wind_y", 0.0));
  s.right_brain = int(o.get("brain", 0));
  s.brain_path = String(o.get("brain_path", "")).utf8().get_data();
  s.brain_temperature = float(o.get("brain_temperature", 0.0));
  s.brain_every = int(o.get("brain_every", 10));
  const char* keys[2] = {"home_formation", "away_formation"};
  for (int t = 0; t < 2; t++) {
    PackedFloat32Array f = o.get(keys[t], PackedFloat32Array());
    for (int i = 0; i < f.size(); i++) s.formation[t].push_back(f[i]);
  }
  const char* skeys[2] = {"home_stats", "away_stats"};
  for (int t = 0; t < 2; t++) {
    PackedFloat32Array f = o.get(skeys[t], PackedFloat32Array());
    for (int i = 0; i < f.size(); i++) s.stats[t].push_back(f[i]);
  }
  bool ok = afc::gf_start(s);
  fresh_ = false;
  return ok;
}

void GFEngine::set_crash_file(const String& path) { afc::crash_guard_install(path.utf8().get_data()); }

void GFEngine::frames(int n) {
  for (int i = 0; i < n; i++) afc::gf_frame();
  fresh_ = false;
}

void GFEngine::set_player_stats(int team, int player, const PackedFloat32Array& stats) {
  if (stats.size() >= 22) afc::gf_set_player_stats(team, player, stats.ptr());
}

void GFEngine::set_tactics(int team, float mentality, float width, float pressing) {
  afc::gf_set_tactics(team, mentality, width, pressing);
}

void GFEngine::substitute(int team, int player) {
  afc::gf_substitute(team, player);
  fresh_ = false;
}

void GFEngine::set_input(float dx, float dy, int buttons) { afc::gf_input(dx, dy, (unsigned)buttons); }

void GFEngine::refresh() {
  if (!fresh_) {
    afc::gf_state(&st_);
    fresh_ = true;
  }
}

Dictionary GFEngine::state() {
  refresh();
  Dictionary d;
  d["ball"] = Vector3(st_.ball[0], st_.ball[1], st_.ball[2]);
  d["ball_vel"] = Vector3(st_.ball_vel[0], st_.ball_vel[1], st_.ball_vel[2]);
  d["ball_spin"] = Vector3(st_.ball_spin[0], st_.ball_spin[1], st_.ball_spin[2]);
  d["goals"] = Vector2i(st_.goals[0], st_.goals[1]);
  d["mode"] = st_.game_mode;
  d["in_play"] = st_.in_play != 0;
  d["owner_team"] = st_.ball_owner_team;
  d["owner_player"] = st_.ball_owner_player;
  d["controlled"] = st_.controlled;
  d["frame"] = st_.frame;
  d["minute"] = st_.minute;
  d["last_goal_team"] = st_.last_goal_team;
  d["taker"] = st_.setpiece_taker;
  d["scorer"] = st_.last_scorer;
  d["own_goal"] = st_.last_scorer_own != 0;
  d["brain"] = afc::gf_brain_on();
  PackedInt32Array cards;
  cards.resize(22);
  for (int i = 0; i < 22; i++) cards.set(i, st_.players[i].active ? st_.players[i].card : 2);
  d["cards"] = cards;
  return d;
}

PackedFloat32Array GFEngine::poses() {
  refresh();
  PackedFloat32Array a;
  const int S = stride();
  a.resize(22 * S);
  float* w = a.ptrw();
  for (int i = 0; i < 22; i++) {
    const afc::GfPlayer& p = st_.players[i];
    float* o = w + i * S;
    o[0] = p.pos[0]; o[1] = p.pos[1]; o[2] = p.pos[2];
    o[3] = p.yaw;
    o[4] = p.root[0]; o[5] = p.root[1]; o[6] = p.root[2];
    o[7] = p.tired;
    o[8] = (float)p.has_ball;
    o[9] = (float)p.active;
    for (int j = 0; j < afc::J_COUNT; j++)
      for (int k = 0; k < 4; k++) o[10 + j * 4 + k] = p.joints[j][k];
  }
  return a;
}

}  // namespace godot
