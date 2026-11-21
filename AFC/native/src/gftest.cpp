// AFC native check: plays a match with Google Research Football's engine, headless, and prints what happened.
//   gftest <gfootball data dir> [physics frames] [tizero.bin [left difficulty [temperature [obs dump file]]]]
// With tizero.bin the right team is played by TiZero against the engine's built-in AI on the left.
#include <chrono>
#include <cstdio>
#include <cstdlib>
#include <cmath>

#include "gf_api.h"
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

int main(int argc, char** argv) {
  if (argc < 2) {
    fprintf(stderr, "usage: gftest <data dir> [physics frames] [tizero.bin [left difficulty [temperature [dump]]]]\n");
    return 1;
  }
  int frames = argc > 2 ? atoi(argv[2]) : 30000;
  auto t0 = std::chrono::steady_clock::now();
  afc::GfSetup setup;
  setup.data_dir = argv[1];
  setup.human_players = 0;
  setup.match_frames = frames;
  if (getenv("GF_SEED")) setup.seed = (unsigned)atoi(getenv("GF_SEED"));
  if (argc > 3) {
    setup.right_brain = 1;
    setup.brain_path = argv[3];
    setup.left_difficulty = argc > 4 ? (float)atof(argv[4]) : 0.95f;
    setup.right_difficulty = setup.left_difficulty;
    setup.brain_temperature = argc > 5 ? (float)atof(argv[5]) : 0.f;
  }
  FILE* df = argc > 6 ? fopen(argv[6], "w") : nullptr;
  if (!afc::gf_start(setup)) {
    fprintf(stderr, "start failed\n");
    return 2;
  }
  printf("right team: %s\n", afc::gf_brain_on() ? "TiZero" : "built-in AI");
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
  for (int f = 0; f < stop; f++) {
    afc::gf_frame();
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
  // where the engine reports the right team vs where it draws them (positions must agree, turned 180 degrees)
  afc::gf_brain_obs(&o, false);
  printf("right player 5: drawn (%.2f %.2f), observed (%.3f %.3f) -> metres (%.2f %.2f)\n", st.players[16].pos[0],
         st.players[16].pos[1], o.right[5][0], o.right[5][1], o.right[5][0] * 54.4f, o.right[5][1] * -83.6f);
  if (df) fclose(df);
  return 0;
}
