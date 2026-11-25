// The native engine writes its own crash report (see crash_guard.cpp).
#pragma once

namespace afc {
// Catch fatal signals and uncaught exceptions from now on, writing reports to `path` (appended).
void crash_guard_install(const char* path);
// What the engine is doing now (a static string), and the match frame (-1 none): goes into a report.
void crash_stage(const char* stage, int frame = -1);
}  // namespace afc
