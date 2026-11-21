// AFC bridge to Google Research Football's engine. See gf_api.h.
#include "gf_api.h"

#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <mutex>

#include "ai/ai_keyboard.hpp"
#include "game_env.hpp"
#include "gametask.hpp"
#include "main.hpp"
#include "onthepitch/match.hpp"
#include "onthepitch/player/player.hpp"
#include "onthepitch/team.hpp"
#include "onthepitch/teamAIcontroller.hpp"
#include "tizero.h"

#include <random>

using namespace blunted;

namespace afc {

static GameEnv* g_env = nullptr;
static int g_frame = 0;
static int g_human = 0;
static float g_dx = 0.f, g_dy = 0.f;
static unsigned g_buttons = 0;
static unsigned g_prev_buttons = 0;
static int g_last_goal_team = -1;
static int g_goals_seen[2] = {0, 0};
static int g_last_scorer = -1;
static int g_last_scorer_own = 0;
static TiZero g_tz;
static bool g_tz_on = false;
static float g_tz_temp = 0.f;
static int g_tz_every = 10;
static std::mt19937 g_tz_rng(1);
static int g_tz_last[11];
static int g_tz_wait = 0;              // frames TiZero's side has been standing over its own set piece
static int g_tz_side = 1;              // the team TiZero plays (1 right; 0 left is for tests: then nobody is human)
static bool g_tz_gk_builtin = false;   // its keeper: the engine's own (true) or TiZero's keeper rules

// gfootball's 11 v 11 line-up (scenarios/11_vs_11_stochastic.py); x in -1..1 (own goal at -1), y in -0.42..0.42.
struct Spot { float x, y; e_PlayerRole role; };
static const Spot kHome[11] = {
    {-1.000000f, 0.000000f, e_PlayerRole_GK}, {0.000000f, 0.020000f, e_PlayerRole_RM},
    {0.000000f, -0.020000f, e_PlayerRole_CF}, {-0.422000f, -0.19576f, e_PlayerRole_LB},
    {-0.500000f, -0.06356f, e_PlayerRole_CB}, {-0.500000f, 0.063559f, e_PlayerRole_CB},
    {-0.422000f, 0.195760f, e_PlayerRole_RB}, {-0.184212f, -0.10568f, e_PlayerRole_CM},
    {-0.267574f, 0.000000f, e_PlayerRole_CM}, {-0.184212f, 0.105680f, e_PlayerRole_CM},
    {-0.010000f, -0.21610f, e_PlayerRole_LM}};
static const Spot kAway[11] = {
    {-1.000000f, 0.000000f, e_PlayerRole_GK}, {-0.050000f, 0.000000f, e_PlayerRole_RM},
    {-0.010000f, 0.216102f, e_PlayerRole_CF}, {-0.422000f, -0.19576f, e_PlayerRole_LB},
    {-0.500000f, -0.06356f, e_PlayerRole_CB}, {-0.500000f, 0.063559f, e_PlayerRole_CB},
    {-0.422000f, 0.195760f, e_PlayerRole_RB}, {-0.184212f, -0.10568f, e_PlayerRole_CM},
    {-0.267574f, 0.000000f, e_PlayerRole_CM}, {-0.184212f, 0.105680f, e_PlayerRole_CM},
    {-0.010000f, -0.21610f, e_PlayerRole_LM}};

// AFC skeleton order -> engine body part
static const BodyPart kJointPart[J_COUNT] = {player,     body,         middle,     neck,       left_shoulder,
                                             left_elbow, right_shoulder, right_elbow, left_thigh, left_knee,
                                             left_ankle, right_thigh,  right_knee, right_ankle};

bool gf_start(const GfSetup& s) {
  // the engine keeps global state: it is started once, and every new match is a reset of it
  if (!g_env) {
    setenv("GFOOTBALL_DATA_DIR", s.data_dir.c_str(), 1);
    g_env = new GameEnv();
    g_env->game_config.render = false;
    g_env->game_config.physics_steps_per_frame = 1;
    g_env->start_game();
  }
  SetGame(g_env);
  auto cfg = ScenarioConfig::make();
  for (int i = 0; i < 11; i++) {
    for (int t = 0; t < 2; t++) {
      const std::vector<float>& f = s.formation[t];
      const Spot& d = (t == 0 ? kHome : kAway)[i];
      float x = d.x, y = d.y;
      e_PlayerRole role = d.role;
      if (f.size() >= 33) {
        x = f[i * 3];
        y = f[i * 3 + 1];
        role = (e_PlayerRole)(int)f[i * 3 + 2];
      }
      (t == 0 ? cfg->left_team : cfg->right_team).push_back(FormationEntry(x, y, role, false, true));
    }
  }
  g_tz_side = getenv("AFC_TZ_LEFT") ? 0 : 1;
  g_tz_gk_builtin = getenv("AFC_TZ_GK") != nullptr;
  cfg->left_agents = s.human_players > 0 ? 1 : 0;
  g_tz_on = false;
  if (s.right_brain == 1) {
    if (!g_tz.loaded() && !s.brain_path.empty()) g_tz.load(s.brain_path);
    g_tz_on = g_tz.loaded();
  }
  g_tz_temp = s.brain_temperature;
  g_tz_every = s.brain_every < 1 ? 1 : s.brain_every;
  cfg->right_agents = g_tz_on ? 11 : 0;
  if (g_tz_on && g_tz_side == 0) {
    cfg->left_agents = 11;
    cfg->right_agents = 0;
  }
  cfg->left_team_difficulty = s.left_difficulty;
  cfg->right_team_difficulty = s.right_difficulty;
  cfg->game_engine_random_seed = s.seed;
  cfg->offsides = s.offsides;
  cfg->deterministic = false;
  cfg->real_time = false;
  cfg->use_magnet = true;
  cfg->game_duration = 1000000000;
  cfg->second_half = 1500;  // 45 minutes of match time (1800 ms of match time per 100 ms step)
  // match clock speed: 90 minutes over match_frames frames of 10 ms
  float real_s = s.match_frames * 0.01f;
  float factor = (90.f * 60.f) / real_s;            // match seconds per real second
  float md = (1.f / factor - 0.05f) / 0.2f;         // engine: factor = 1 / (md * 0.2 + 0.05)
  GetContext().config->Set("match_duration", md);
  GetContext().config->Set("afc_dribble_lead", s.dribble_lead);
  g_env->reset(*cfg, true);
  g_human = (g_tz_on && g_tz_side == 0) ? 0 : s.human_players;
  if (g_human > 0) {
    auto c = GetControllers()[0];
    c->SetDisabled(false);
  }
  g_frame = 0;
  g_dx = g_dy = 0.f;
  g_buttons = g_prev_buttons = 0;
  g_last_goal_team = -1;
  g_goals_seen[0] = g_goals_seen[1] = 0;
  g_last_scorer = -1;
  g_last_scorer_own = 0;
  g_tz.reset();
  g_tz_rng.seed(s.seed);
  return true;
}

bool gf_brain_on() { return g_tz_on; }
int gf_brain_last(int i) { return i >= 0 && i < 11 ? g_tz_last[i] : -1; }

bool gf_running() { return g_env != nullptr; }

void gf_substitute(int team, int player) {
  if (!g_env || team < 0 || team > 1) return;
  SetGame(g_env);
  Match* m = GetGameTask()->GetMatch();
  if (!m) return;
  const std::vector<Player*>& ps = m->GetTeam(team)->GetAllPlayers();
  if (player >= 0 && player < (int)ps.size()) ps[player]->RelaxFatigue(1.0f);
}

void gf_stop() {
  // the engine keeps global singletons; one match at a time, restarted with reset()
}

static void apply_input() {
  if (g_human <= 0) return;
  AIControlledKeyboard* c = GetControllers()[0];
  c->SetDisabled(false);
  c->SetDirection(Vector3(g_dx, g_dy, 0));
  static const struct { unsigned bit; e_ButtonFunction fn; } map[] = {
      {GF_SHORT_PASS, e_ButtonFunction_ShortPass}, {GF_LONG_PASS, e_ButtonFunction_LongPass},
      {GF_HIGH_PASS, e_ButtonFunction_HighPass},   {GF_SHOT, e_ButtonFunction_Shot},
      {GF_SPRINT, e_ButtonFunction_Sprint},        {GF_DRIBBLE, e_ButtonFunction_Dribble},
      {GF_SLIDING, e_ButtonFunction_Sliding},      {GF_PRESSURE, e_ButtonFunction_Pressure},
      {GF_TEAM_PRESSURE, e_ButtonFunction_TeamPressure}, {GF_SWITCH, e_ButtonFunction_Switch},
      {GF_KEEPER_RUSH, e_ButtonFunction_KeeperRush}};
  for (auto& m : map) c->SetButton(m.fn, (g_buttons & m.bit) != 0);
}

void gf_input(float dx, float dy, unsigned buttons) {
  g_dx = dx;
  g_dy = dy;
  g_buttons = buttons;
}

// ---------------------------------------------------------------------------------------------------- TiZero

// Position::env_coord gives gfootball's observation scale (X_FIELD_SCALE / Y_FIELD_SCALE): x in -1..1, y in
// -0.42..0.42 (top < 0)

void gf_brain_obs(TzObs* o, bool right) {
  Match* m = GetGameTask()->GetMatch();
  if (!m || !o) return;
  SharedInfo info;
  m->GetState(&info);
  // gfootball reports directions per 100 ms step with 10 physics frames per step; here a step is one frame
  const float k = 0.1f;
  const float s = right ? -1.f : 1.f;  // the right team sees the pitch turned 180 degrees
  o->ball[0] = s * info.ball_position.env_coord(0);
  o->ball[1] = s * info.ball_position.env_coord(1);
  o->ball[2] = info.ball_position.env_coord(2);
  o->ball_dir[0] = s * info.ball_direction.env_coord(0) * k;
  o->ball_dir[1] = s * info.ball_direction.env_coord(1) * k;
  o->ball_dir[2] = info.ball_direction.env_coord(2) * k;
  o->ball_rot[0] = info.ball_rotation.env_coord(0) * k;
  o->ball_rot[1] = info.ball_rotation.env_coord(1) * k;
  o->ball_rot[2] = info.ball_rotation.env_coord(2) * k;
  const std::vector<PlayerInfo>& us = right ? info.right_team : info.left_team;
  const std::vector<PlayerInfo>& them = right ? info.left_team : info.right_team;
  for (int i = 0; i < 11; i++) {
    const PlayerInfo& a = us[i < (int)us.size() ? i : 0];
    const PlayerInfo& b = them[i < (int)them.size() ? i : 0];
    o->left[i][0] = s * a.player_position.env_coord(0);
    o->left[i][1] = s * a.player_position.env_coord(1);
    o->left_dir[i][0] = s * a.player_direction.env_coord(0) * k;
    o->left_dir[i][1] = s * a.player_direction.env_coord(1) * k;
    o->left_tired[i] = a.tired_factor;
    o->left_yellow[i] = a.has_card;
    o->left_active[i] = a.is_active;
    o->right[i][0] = s * b.player_position.env_coord(0);
    o->right[i][1] = s * b.player_position.env_coord(1);
    o->right_dir[i][0] = s * b.player_direction.env_coord(0) * k;
    o->right_dir[i][1] = s * b.player_direction.env_coord(1) * k;
    o->right_tired[i] = b.tired_factor;
    o->right_yellow[i] = b.has_card;
    o->right_active[i] = b.is_active;
  }
  int ot = info.ball_owned_team;
  o->ball_owned_team = ot < 0 ? -1 : (right ? 1 - ot : ot);
  o->ball_owned_player = ot < 0 ? -1 : info.ball_owned_player;
  o->game_mode = (int)info.game_mode;
  o->score[0] = right ? info.right_goals : info.left_goals;
  o->score[1] = right ? info.left_goals : info.right_goals;
  float minute = (float)(m->GetMatchTime_ms() / 60000.0);
  int left_steps = (int)((90.f - minute) / 90.f * 3000.f);
  o->steps_left = left_steps < 0 ? 0 : left_steps;
}

// engine direction of each TiZero direction action (GameEnv::action), in the team's own frame
static const int kTzDir[9][2] = {{0, 0}, {-1, 0}, {-1, 1}, {0, 1}, {1, 1}, {1, 0}, {1, -1}, {0, -1}, {-1, -1}};

static void tz_apply(AIControlledKeyboard* c, int a) {
  const int f = g_tz_side == 1 ? -1 : 1;
  c->SetDisabled(false);
  if (a >= TZ_LEFT && a <= TZ_BOTTOM_LEFT) {
    // the right team's actions are turned back 180 degrees (gfootball's flip_single_action)
    c->SetDirection(Vector3(f * kTzDir[a][0], f * kTzDir[a][1], 0));
    return;
  }
  switch (a) {
    case TZ_LONG_PASS: c->SetButton(e_ButtonFunction_LongPass, true); break;
    case TZ_HIGH_PASS: c->SetButton(e_ButtonFunction_HighPass, true); break;
    case TZ_SHORT_PASS: c->SetButton(e_ButtonFunction_ShortPass, true); break;
    case TZ_SHOT: c->SetButton(e_ButtonFunction_Shot, true); break;
    case TZ_SPRINT: c->SetButton(e_ButtonFunction_Sprint, true); break;
    case TZ_RELEASE_DIRECTION: c->SetDirection(Vector3(0, 0, 0)); break;
    case TZ_RELEASE_SPRINT: c->SetButton(e_ButtonFunction_Sprint, false); break;
    case TZ_SLIDING: c->SetButton(e_ButtonFunction_Sliding, true); break;
    case TZ_DRIBBLE: c->SetButton(e_ButtonFunction_Dribble, true); break;
    case TZ_RELEASE_DRIBBLE: c->SetButton(e_ButtonFunction_Dribble, false); break;
    default: break;
  }
}

// Each right-team player decides once per step (g_tz_every frames), staggered over the step's frames so the
// network runs for one or two players per frame rather than all eleven at once.
static void tz_frame() {
  int phase = g_frame % g_tz_every;
  bool any = false;
  for (int i = 0; i < 11; i++)
    if (i % g_tz_every == phase) any = true;
  if (!any) return;
  static TzObs o;
  gf_brain_obs(&o, g_tz_side == 1);
  const std::vector<AIControlledKeyboard*>& cs = GetControllers();
  // TiZero learned to waste time: with a lead it can stand over its own free kick for the rest of the match.
  // After 2.5 seconds its taker takes it (a pass; a cross from a corner; a shot from the spot).
  int taker = -1;
  Match* m = GetGameTask()->GetMatch();
  if (m && m->IsInSetPiece()) {
    Player* tk = m->GetTeam(g_tz_side)->GetController()->GetPieceTaker();
    const std::vector<Player*>& ps = m->GetTeam(g_tz_side)->GetAllPlayers();
    for (int i = 0; i < 11 && i < (int)ps.size(); i++)
      if (tk && ps[i] == tk) taker = i;
  }
  for (int i = 0; i < 11; i++) {
    if (i % g_tz_every != phase) continue;
    AIControlledKeyboard* c = cs[g_tz_side * 11 + i];
    if (i == 0 && g_tz_gk_builtin) {
      c->SetDisabled(true);  // the engine's own keeper (positioning, diving)
      continue;
    }
    // end of this player's previous step: one-shot buttons are let go (GameEnv::step -> ResetNotSticky)
    c->ResetNotSticky();
    int sticky[10];
    Vector3 d = c->GetOriginalDirection();
    const float f = g_tz_side == 1 ? -1.f : 1.f;
    float dx = f * (float)d.coords[0], dy = f * (float)d.coords[1];  // into the team's own frame
    for (int k = 0; k < 8; k++) sticky[k] = (dx == kTzDir[k + 1][0] && dy == kTzDir[k + 1][1]) ? 1 : 0;
    sticky[8] = c->GetButton(e_ButtonFunction_Sprint) ? 1 : 0;
    sticky[9] = c->GetButton(e_ButtonFunction_Dribble) ? 1 : 0;
    int a = i == 0 ? tizero_goalkeeper(o, sticky, g_tz_rng) : g_tz.act(o, i, sticky, g_tz_temp, g_tz_rng);
    if (i == taker && g_tz_wait > 250) {
      // press for one step, let go the next (the engine kicks when the button is released)
      static int press = 0;
      press = !press;
      a = o.game_mode == 4 ? TZ_HIGH_PASS : (o.game_mode == 6 ? TZ_SHOT : TZ_SHORT_PASS);
      if (!press) a = TZ_IDLE;
    }
    tz_apply(c, a);
    g_tz_last[i] = a;
  }
}

void gf_frame() {
  if (!g_env) return;
  SetGame(g_env);
  apply_input();
  if (g_tz_on) {
    Match* mm = GetGameTask()->GetMatch();
    g_tz_wait = (mm && mm->IsInSetPiece()) ? g_tz_wait + 1 : 0;
    tz_frame();
  }
  g_env->context->gameTask->ProcessPhase();
  g_frame++;
  Match* m = GetGameTask()->GetMatch();
  if (m && m->IsInPlay()) {
    // what env.step() does after its 10 frames: one-shot buttons are released
    if (g_frame % 10 == 0) g_env->context->step++;
  }
  g_prev_buttons = g_buttons;
}

static void put_quat(float* out, const Quaternion& q) {
  out[0] = (float)q.elements[0];
  out[1] = (float)q.elements[1];
  out[2] = (float)q.elements[2];
  out[3] = (float)q.elements[3];
}

void gf_state(GfState* out) {
  if (!g_env || !out) return;
  SetGame(g_env);
  Match* m = GetGameTask()->GetMatch();
  if (!m) return;
  SharedInfo info;
  m->GetState(&info);
  Ball* b = m->GetBall();
  Vector3 bp = b->Predict(0);
  Vector3 bv = b->GetMovement();
  Vector3 br = b->GetRotation();
  for (int k = 0; k < 3; k++) {
    out->ball[k] = (float)bp.coords[k];
    out->ball_vel[k] = (float)bv.coords[k];
    out->ball_spin[k] = (float)br.coords[k];
  }
  out->goals[0] = m->GetScore(0);
  out->goals[1] = m->GetScore(1);
  for (int t = 0; t < 2; t++) {
    if (out->goals[t] > g_goals_seen[t]) {
      g_last_goal_team = t;
      // the scorer, the way the engine names him: the scoring side's last toucher, else an own goal
      int lt = m->GetLastTouchTeamID();
      int team = (lt == 0 || lt == 1) ? lt : t;
      Player* sc = m->GetTeam(team)->GetLastTouchPlayer();
      g_last_scorer = -1;
      g_last_scorer_own = team != t ? 1 : 0;
      const std::vector<Player*>& ps = m->GetTeam(team)->GetAllPlayers();
      for (int i = 0; i < 11 && i < (int)ps.size(); i++)
        if (ps[i] == sc) g_last_scorer = team * 11 + i;
    }
    g_goals_seen[t] = out->goals[t];
  }
  out->last_goal_team = g_last_goal_team;
  out->last_scorer = g_last_scorer;
  out->last_scorer_own = g_last_scorer_own;
  out->game_mode = (int)info.game_mode;
  out->in_play = info.is_in_play ? 1 : 0;
  out->ball_owner_team = info.ball_owned_team;
  out->ball_owner_player = info.ball_owned_player;
  out->controlled = info.left_controllers.empty() ? -1 : info.left_controllers[0].controlled_player;
  out->frame = g_frame;
  out->minute = (float)(m->GetMatchTime_ms() / 60000.0);
  out->setpiece_taker = -1;
  if (m->IsInSetPiece()) {
    for (int t = 0; t < 2 && out->setpiece_taker < 0; t++) {
      Player* tk = m->GetTeam(t)->GetController()->GetPieceTaker();
      if (!tk) continue;
      const std::vector<Player*>& ps = m->GetTeam(t)->GetAllPlayers();
      for (int i = 0; i < 11 && i < (int)ps.size(); i++)
        if (ps[i] == tk) out->setpiece_taker = t * 11 + i;
    }
  }
  for (int t = 0; t < 2; t++) {
    const std::vector<Player*>& ps = m->GetTeam(t)->GetAllPlayers();
    for (int i = 0; i < 11 && i < (int)ps.size(); i++) {
      GfPlayer& gp = out->players[t * 11 + i];
      Player* p = ps[i];
      Humanoid* h = p->CastHumanoid();
      boost::intrusive_ptr<Node> hn0 = h->GetHumanoidNode();
      Vector3 pos = hn0->GetPosition();
      // Between frames the engine keeps the second team turned 180 degrees (it plays every team as if attacking
      // the same way; HumanoidBase::Mirror). Turn its players back onto the real pitch: x and y change sign.
      // Their skeleton is turned too: the root joint gets the same half turn about the vertical.
      const float mir = t == 1 ? -1.f : 1.f;
      gp.pos[0] = mir * (float)pos.coords[0];
      gp.pos[1] = mir * (float)pos.coords[1];
      gp.pos[2] = (float)pos.coords[2];
      boost::intrusive_ptr<Node> hn = h->GetHumanoidNode();
      Quaternion hr = hn->GetRotation();
      // facing from the rendered root rotation (it is what the joints hang off)
      Vector3 fwd = hr * Vector3(0, -1, 0);
      gp.yaw = (float)std::atan2(fwd.coords[1], fwd.coords[0]);
      const NodeMap& nm = h->GetNodeMap();
      Vector3 rp = nm[player]->GetPosition();
      gp.root[0] = (float)rp.coords[0];
      gp.root[1] = (float)rp.coords[1];
      gp.root[2] = (float)rp.coords[2];
      for (int j = 0; j < J_COUNT; j++) {
        put_quat(gp.joints[j], nm[kJointPart[j]]->GetRotation());
      }
      if (t == 1) {
        // (0, 0, 1, 0) * q: half a turn about z
        float* q = gp.joints[J_PLAYER];
        float x = q[0], y = q[1], z = q[2], w = q[3];
        q[0] = -y;
        q[1] = x;
        q[2] = w;
        q[3] = -z;
      }
      gp.tired = (t == 0 ? info.left_team[i].tired_factor : info.right_team[i].tired_factor);
      gp.role = (int)(t == 0 ? info.left_team[i].role : info.right_team[i].role);
      gp.active = (t == 0 ? info.left_team[i].is_active : info.right_team[i].is_active) ? 1 : 0;
      gp.has_ball = (info.ball_owned_team == t && info.ball_owned_player == i) ? 1 : 0;
      gp.card = (t == 0 ? info.left_team[i].has_card : info.right_team[i].has_card) ? 1 : 0;
    }
  }
}

}  // namespace afc
