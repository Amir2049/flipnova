// GFEngine: Google Research Football's engine as a Godot object (one match at a time).
#pragma once
#include <godot_cpp/classes/ref_counted.hpp>
#include <godot_cpp/variant/dictionary.hpp>
#include <godot_cpp/variant/packed_float32_array.hpp>
#include <godot_cpp/variant/string.hpp>

#include "gf_api.h"

namespace godot {

class GFEngine : public RefCounted {
  GDCLASS(GFEngine, RefCounted)

 protected:
  static void _bind_methods();

 public:
  // data_dir: the unpacked engine data. options: human (0/1), difficulty_home, difficulty_away (0..1), seed,
  // match_seconds (real seconds for 90 minutes), offsides (bool).
  bool start(const String& data_dir, const Dictionary& options);
  // from now on a crash of the engine is written to this file (crash_guard.cpp)
  void set_crash_file(const String& path);
  // run n engine frames of 10 ms
  void frames(int n);
  // the human's stick in pitch axes (x along the pitch, y across it, length 0..1) and held buttons (GF_* bits)
  void set_input(float dx, float dy, int buttons);
  void substitute(int team, int player);
  // ball, score, mode, clock, owner, the human's player
  Dictionary state();
  // 22 players x STRIDE floats: pos x y z, yaw, root x y z, tired, has_ball, active, then 14 joints x (x y z w)
  PackedFloat32Array poses();
  int stride() const { return 10 + afc::J_COUNT * 4; }

 private:
  afc::GfState st_{};
  bool fresh_ = false;
  void refresh();
};

}  // namespace godot
