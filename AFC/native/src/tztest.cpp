// TiZero port check: reads observations (one per line, the TzObs fields flattened by tools/tizero/reference.py),
// prints the features (330), available actions (19) and the chosen action for players 1..10 and the keeper.
//   tztest tizero.bin obs.txt > out.txt
#include <cstdio>
#include <fstream>
#include <sstream>
#include <string>

#include "tizero.h"

int main(int argc, char** argv) {
  if (argc < 3) return 1;
  afc::TiZero tz;
  if (!tz.load(argv[1])) {
    fprintf(stderr, "cannot load %s\n", argv[1]);
    return 2;
  }
  std::ifstream in(argv[2]);
  std::string line;
  std::mt19937 rng(1);
  while (std::getline(in, line)) {
    std::istringstream s(line);
    afc::TzObs o;
    auto rd = [&](float* v, int n) { for (int i = 0; i < n; i++) s >> v[i]; };
    auto rb = [&](bool* v, int n) { for (int i = 0; i < n; i++) { int b; s >> b; v[i] = b != 0; } };
    rd(o.ball, 3); rd(o.ball_dir, 3); rd(o.ball_rot, 3);
    rd(&o.left[0][0], 22); rd(&o.left_dir[0][0], 22); rd(o.left_tired, 11); rb(o.left_yellow, 11); rb(o.left_active, 11);
    rd(&o.right[0][0], 22); rd(&o.right_dir[0][0], 22); rd(o.right_tired, 11); rb(o.right_yellow, 11); rb(o.right_active, 11);
    s >> o.ball_owned_team >> o.ball_owned_player >> o.game_mode >> o.score[0] >> o.score[1] >> o.steps_left;
    int sticky[11][10];
    for (int p = 0; p < 11; p++)
      for (int k = 0; k < 10; k++) s >> sticky[p][k];
    for (int p = 1; p < 11; p++) {
      float f[330], a[19];
      afc::TiZero::features(o, p, sticky[p], f, a);
      for (int i = 0; i < 330; i++) printf("%.6g ", f[i]);
      for (int i = 0; i < 19; i++) printf("%d ", (int)a[i]);
      printf("%d\n", tz.act(o, p, sticky[p], 0.f, rng));
    }
    printf("GK %d\n", afc::tizero_goalkeeper(o, sticky[0], rng));
  }
  return 0;
}
