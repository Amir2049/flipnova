// AFC bridge to Google Research Football's game engine (headless): start a match, run it frame by frame (10 ms of
// game time per frame, the engine's own physics rate), steer the human's player, and read everything the renderer
// needs - ball, players, the local rotation of every skeleton joint (the same 14 joints AFC's player model uses).
// Engine axes: x along the pitch (metres, goals at about +-55), y across it, z up.
#pragma once
#include <string>
#include <vector>

namespace afc {

enum GfButton : unsigned {
  GF_SHORT_PASS = 1u << 0,
  GF_LONG_PASS = 1u << 1,
  GF_HIGH_PASS = 1u << 2,
  GF_SHOT = 1u << 3,
  GF_SPRINT = 1u << 4,
  GF_DRIBBLE = 1u << 5,   // close control
  GF_SLIDING = 1u << 6,
  GF_PRESSURE = 1u << 7,
  GF_TEAM_PRESSURE = 1u << 8,
  GF_SWITCH = 1u << 9,
  GF_KEEPER_RUSH = 1u << 10,
  GF_CHIP = 1u << 11,      // with SHOT: a chip (scooped over the keeper)
  GF_FINESSE = 1u << 12,   // with SHOT: a placed, curled shot
  GF_LOW = 1u << 13,       // with SHOT: a low drive
  GF_POWER = 1u << 14,     // with SHOT: a power shot
};

// Skeleton joints, in the order of AFC's player model (tools/make_player_glb.py SKELETON).
enum GfJoint {
  J_PLAYER, J_BODY, J_MIDDLE, J_NECK, J_LEFT_SHOULDER, J_LEFT_ELBOW, J_RIGHT_SHOULDER, J_RIGHT_ELBOW,
  J_LEFT_THIGH, J_LEFT_KNEE, J_LEFT_ANKLE, J_RIGHT_THIGH, J_RIGHT_KNEE, J_RIGHT_ANKLE, J_COUNT
};

struct GfSetup {
  std::string data_dir;          // the engine's data folder (animations, databases)
  int human_players = 1;         // 1: the left team is played by a person (the engine switches his player), 0: CPU v CPU
  float left_difficulty = 0.6f;  // AI level 0..1 (the human team's teammates)
  float right_difficulty = 0.6f;
  unsigned seed = 42;
  int match_frames = 270000;     // whole match length in 10 ms frames (both halves)
  bool offsides = true;
  float dribble_lead = 1.0f;
  float wind_x = 0.0f, wind_y = 0.0f;   // wind on a ball in the air, m/s^2, engine axes
  float wetness = 0.0f;          // 0 dry .. 1 soaked: the ball skids on a wet pitch     // how far ahead running touches send the ball (engine default 1, lower = closer)
  int right_brain = 0;           // who plays the right team: 0 the engine's built-in AI, 1 TiZero (tizero.h)
  std::string brain_path;        // TiZero weights (assets/tizero.bin)
  float brain_temperature = 0.f; // 0: TiZero's best move every time; higher: more human, weaker
  int brain_every = 10;          // frames between a player's decisions (10 = TiZero's own 10 per second)
  // the line-ups: 11 x (x -1..1 with the own goal at -1, y -0.42..0.42, e_PlayerRole); empty = gfootball's 4-4-2
  std::vector<float> formation[2];
  // the players' ratings: 11 x 22 engine stats (PlayerStat order, 0..1) per side; empty = the engine's stock players
  std::vector<float> stats[2];
};

struct GfPlayer {
  float pos[3];               // on the ground
  float yaw;                  // facing, radians around z (0 = +x)
  float root[3];              // the "player" joint's offset (height of the body during the animation)
  float joints[J_COUNT][4];   // local rotation (x, y, z, w) of each joint, engine axes
  float tired;                // 0..1
  int role;                   // e_PlayerRole
  int active;                 // 0 after a red card
  int has_ball;
  int card;                   // 1: booked (yellow)
};

struct GfState {
  float ball[3];
  float ball_vel[3];
  float ball_spin[3];
  int goals[2];
  int game_mode;             // e_GameMode: 0 normal, 1 kick off, 2 goal kick, 3 free kick, 4 corner, 5 throw in, 6 penalty
  int in_play;
  int ball_owner_team;       // -1 none, 0 left, 1 right
  int ball_owner_player;
  int controlled;            // index (0..10) of the human's player on the left team, -1 none
  int frame;                 // frames since kick off
  float minute;              // match clock 0..90
  int last_goal_team;        // -1, 0, 1 (the most recent goal)
  int setpiece_taker;        // during a set piece: the player who takes it (0..21), else -1
  int last_scorer;           // who scored the most recent goal (0..21, the player who touched it last), -1 none
  int last_scorer_own;       // 1 when that goal was an own goal
  GfPlayer players[22];      // 0..10 left team, 11..21 right team
};

bool gf_start(const GfSetup& setup);
bool gf_brain_on();
int gf_brain_last(int player);                        // TiZero's latest action for a right-team player (tests)                                  // TiZero is playing the right team
struct TzObs;
void gf_brain_obs(TzObs* out, bool right_team);      // the raw gfootball observation of one side (tests)
void gf_frame();
void gf_state(GfState* out);
void gf_input(float dx, float dy, unsigned buttons);  // the human's stick (engine axes, length 0..1) and held buttons
void gf_stop();
void gf_substitute(int team, int player);
void gf_set_player_stats(int team, int player, const float* stats22);   // a substitute's ratings
void gf_pass_to(float x, float y, int kind);   // the next pass goes to this spot (engine metres); 1 ground, 2 lofted
void gf_set_tactics(int team, float mentality, float width, float pressing);  // team instructions, each -1..1 (0 = engine's own)           // a fresh player comes on: tiredness back to none
bool gf_running();

}  // namespace afc
