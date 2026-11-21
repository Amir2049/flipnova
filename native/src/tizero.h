// TiZero (OpenRL-Lab/TiZero, Apache-2.0): the strongest open agent for Google Research Football - one shared policy
// network (MLP encoders + LSTM) that plays every outfield player, plus a rule-based goalkeeper. AFC runs its
// published weights on the device in plain C++ (no inference library), ten times per second of game time.
//
// Ported from submission/tizero/{openrl_policy.py, openrl_utils.py, goal_keeper.py}. Everything is in the raw
// gfootball observation convention: the team being played attacks +x, x in -1..1, y in -0.42..0.42 (top negative).
#pragma once
#include <random>
#include <string>
#include <vector>

namespace afc {

enum TzAction {
  TZ_IDLE, TZ_LEFT, TZ_TOP_LEFT, TZ_TOP, TZ_TOP_RIGHT, TZ_RIGHT, TZ_BOTTOM_RIGHT, TZ_BOTTOM, TZ_BOTTOM_LEFT,
  TZ_LONG_PASS, TZ_HIGH_PASS, TZ_SHORT_PASS, TZ_SHOT, TZ_SPRINT, TZ_RELEASE_DIRECTION, TZ_RELEASE_SPRINT,
  TZ_SLIDING, TZ_DRIBBLE, TZ_RELEASE_DRIBBLE, TZ_ACTIONS
};

// A raw observation from the point of view of the team being played ("left" = that team).
struct TzObs {
  float ball[3], ball_dir[3], ball_rot[3];
  float left[11][2], left_dir[11][2], left_tired[11];
  bool left_yellow[11], left_active[11];
  float right[11][2], right_dir[11][2], right_tired[11];
  bool right_yellow[11], right_active[11];
  int ball_owned_team = -1, ball_owned_player = -1;  // -1 none, 0 us, 1 them
  int game_mode = 0;
  int score[2] = {0, 0};                               // ours, theirs
  int steps_left = 3000;
};

class TiZero {
 public:
  bool load(const std::string& path);  // assets/tizero.bin (tools/tizero/convert.py)
  bool loaded() const { return ok_; }
  void reset();                         // new match: clear every player's memory
  // One decision for player `active` (1..10) with its sticky actions (left, top_left, top, top_right, right,
  // bottom_right, bottom, bottom_left, sprint, dribble). temperature 0 = the network's best action (as in
  // TiZero's submission); above 0, sample from the policy (a weaker, more human opponent).
  int act(const TzObs& o, int active, const int sticky[10], float temperature, std::mt19937& rng);
  // The observation vector (330) and available actions (19) TiZero's feature code makes - exposed for tests.
  static void features(const TzObs& o, int active, const int sticky[10], float* obs330, float* avail19);

 private:
  struct Lin { int in = 0, out = 0; std::vector<float> w, b; };
  struct Norm { std::vector<float> w, b; };
  struct Block { Lin lin; Norm norm; };     // Linear -> ReLU -> LayerNorm
  bool ok_ = false;
  Block enc_[5][2];                         // active, ball owner, left, right, match state (2 blocks each)
  Block embed_, after_rnn_, id_emb_, before_act_[2];
  std::vector<float> w_ih_, w_hh_, b_ih_, b_hh_;
  Norm rnn_norm_;
  Lin act_;
  std::vector<float> state_[11];            // per player: h (256) then c (256)
  void block(const Block& b, const float* x, float* y) const;
};

// TiZero's goalkeeper rules (goal_keeper.py) for the keeper (player 0).
int tizero_goalkeeper(const TzObs& o, const int sticky[10], std::mt19937& rng);

}  // namespace afc
