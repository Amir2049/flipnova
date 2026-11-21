// The part of the NDK's <android/log.h> AFC uses (liblog.so is on every Android device).
#pragma once
#include <stdarg.h>
#include <sys/cdefs.h>

__BEGIN_DECLS

typedef enum android_LogPriority {
  ANDROID_LOG_UNKNOWN = 0,
  ANDROID_LOG_DEFAULT,
  ANDROID_LOG_VERBOSE,
  ANDROID_LOG_DEBUG,
  ANDROID_LOG_INFO,
  ANDROID_LOG_WARN,
  ANDROID_LOG_ERROR,
  ANDROID_LOG_FATAL,
  ANDROID_LOG_SILENT,
} android_LogPriority;

int __android_log_write(int prio, const char* tag, const char* text);
int __android_log_print(int prio, const char* tag, const char* fmt, ...) __attribute__((__format__(printf, 3, 4)));
int __android_log_vprint(int prio, const char* tag, const char* fmt, va_list ap);
void __android_log_assert(const char* cond, const char* tag, const char* fmt, ...) __attribute__((__noreturn__));

__END_DECLS
