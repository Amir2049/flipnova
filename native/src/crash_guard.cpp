// A crash in the native engine, caught and written down by the engine itself before the app goes.
//
// On a phone the game cannot read the system's crash report (debuggerd's tombstone belongs to another user), so the
// engine installs its own handler: on SIGSEGV / SIGBUS / SIGFPE / SIGILL / SIGABRT (and an uncaught C++ exception)
// it appends to a file in the game's data folder the signal, the fault address, the step it was on (crash_stage),
// the program counter and return address, and a backtrace - each frame as library + offset (the library is stripped:
// tools/symbolize_crash.sh turns offsets into function names with the unstripped copy in native/symbols/).
// Then it hands the signal on to the previous handler, so the system sees the crash exactly as before.
// Only async-signal-safe calls in the handler (open/write/close, no malloc, no stdio).
#include "crash_guard.h"

#include <dlfcn.h>
#include <fcntl.h>
#include <signal.h>
#include <string.h>
#include <ucontext.h>
#include <unistd.h>
#include <unwind.h>

#include <cstdint>
#include <cstdlib>
#include <exception>

namespace afc {

static char g_path[600] = {0};
static const char* volatile g_stage = "idle";
static int g_frame = -1;
static struct sigaction g_old[NSIG];
static bool g_installed = false;
static std::terminate_handler g_old_terminate = nullptr;

static void put(int fd, const char* s) {
  if (s) (void)!write(fd, s, strlen(s));
}

static void put_hex(int fd, uintptr_t v) {
  char b[19];
  b[0] = '0';
  b[1] = 'x';
  for (int i = 0; i < 16; i++) b[2 + i] = "0123456789abcdef"[(v >> (60 - 4 * i)) & 15];
  b[18] = 0;
  put(fd, b);
}

static void put_int(int fd, long v) {
  char b[24];
  int n = 0;
  bool neg = v < 0;
  unsigned long u = neg ? (unsigned long)(-v) : (unsigned long)v;
  do {
    b[n++] = (char)('0' + u % 10);
    u /= 10;
  } while (u && n < 22);
  if (neg) b[n++] = '-';
  char o[24];
  for (int i = 0; i < n; i++) o[i] = b[n - 1 - i];
  o[n] = 0;
  put(fd, o);
}

// one frame: "  #3 pc 0x... libafcgf.so +0x1234 (symbol)"
static void put_frame(int fd, int i, uintptr_t pc) {
  put(fd, "  #");
  put_int(fd, i);
  put(fd, " pc ");
  put_hex(fd, pc);
  Dl_info di;
  if (pc && dladdr((void*)pc, &di) && di.dli_fname) {
    const char* base = strrchr(di.dli_fname, '/');
    put(fd, " ");
    put(fd, base ? base + 1 : di.dli_fname);
    put(fd, " +");
    put_hex(fd, pc - (uintptr_t)di.dli_fbase);
    if (di.dli_sname) {
      put(fd, " (");
      put(fd, di.dli_sname);
      put(fd, ")");
    }
  }
  put(fd, "\n");
}

struct Trace {
  uintptr_t pc[40];
  int n;
};

static _Unwind_Reason_Code unwind_cb(struct _Unwind_Context* c, void* arg) {
  Trace* t = (Trace*)arg;
  uintptr_t pc = _Unwind_GetIP(c);
  if (pc && t->n < 40) t->pc[t->n++] = pc;
  return t->n >= 40 ? _URC_END_OF_STACK : _URC_NO_REASON;
}

static void write_report(const char* what, uintptr_t addr, void* uctx) {
  if (!g_path[0]) return;
  int fd = open(g_path, O_WRONLY | O_CREAT | O_APPEND, 0644);
  if (fd < 0) return;
  put(fd, "=== native crash: ");
  put(fd, what);
  put(fd, " at ");
  put_hex(fd, addr);
  put(fd, "\nstep: ");
  put(fd, g_stage);
  if (g_frame >= 0) {
    put(fd, ", frame ");
    put_int(fd, g_frame);
  }
  put(fd, "\n");
#if defined(__aarch64__)
  if (uctx) {
    ucontext_t* uc = (ucontext_t*)uctx;
    put(fd, "where it stopped:\n");
    put_frame(fd, 0, (uintptr_t)uc->uc_mcontext.pc);
    put_frame(fd, 1, (uintptr_t)uc->uc_mcontext.regs[30]);   // the return address (lr)
  }
#elif defined(__x86_64__)
  if (uctx) {
    ucontext_t* uc = (ucontext_t*)uctx;
    put(fd, "where it stopped:\n");
    put_frame(fd, 0, (uintptr_t)uc->uc_mcontext.gregs[REG_RIP]);
  }
#endif
  Trace t;
  t.n = 0;
  _Unwind_Backtrace(unwind_cb, &t);
  put(fd, "backtrace:\n");
  for (int i = 0; i < t.n; i++) put_frame(fd, i, t.pc[i]);
  close(fd);
}

static const char* signame(int sig) {
  switch (sig) {
    case SIGSEGV: return "SIGSEGV (bad memory access)";
    case SIGBUS: return "SIGBUS (bad memory alignment)";
    case SIGFPE: return "SIGFPE (arithmetic)";
    case SIGILL: return "SIGILL (illegal instruction)";
    case SIGABRT: return "SIGABRT (abort)";
  }
  return "signal";
}

static const int kSignals[] = {SIGSEGV, SIGBUS, SIGFPE, SIGILL, SIGABRT};

static void on_signal(int sig, siginfo_t* si, void* uctx) {
  // one report per crash: put every previous handler back first (Godot's own handler aborts after us)
  for (int s : kSignals) sigaction(s, &g_old[s], nullptr);
  write_report(signame(sig), si ? (uintptr_t)si->si_addr : 0, uctx);
  // hand it on: the previous handler (Android's debuggerd) or the default, so the crash is reported as before
  raise(sig);
}

static void on_terminate() {
  if (g_path[0]) {
    int fd = open(g_path, O_WRONLY | O_CREAT | O_APPEND, 0644);
    if (fd >= 0) {
      put(fd, "=== uncaught C++ exception, step: ");
      put(fd, g_stage);
      put(fd, "\n");
      close(fd);
    }
  }
  if (g_old_terminate) g_old_terminate();
  abort();
}

void crash_guard_install(const char* path) {
  strncpy(g_path, path, sizeof(g_path) - 1);
  if (g_installed) return;
  g_installed = true;
  // its own stack, so a stack overflow can still be written down
  static char alt[64 * 1024];
  stack_t ss;
  ss.ss_sp = alt;
  ss.ss_size = sizeof(alt);
  ss.ss_flags = 0;
  sigaltstack(&ss, nullptr);
  struct sigaction sa;
  memset(&sa, 0, sizeof(sa));
  sa.sa_sigaction = on_signal;
  sa.sa_flags = SA_SIGINFO | SA_ONSTACK;
  sigemptyset(&sa.sa_mask);
  for (int s : kSignals) sigaction(s, &sa, &g_old[s]);
  g_old_terminate = std::set_terminate(on_terminate);
}

void crash_stage(const char* stage, int frame) {
  g_stage = stage;
  g_frame = frame;
}

}  // namespace afc
