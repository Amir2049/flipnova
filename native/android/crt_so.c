// Stand-in for the NDK's crtbegin_so.o / crtend_so.o (bionic/libc/arch-common/bionic/crtbegin_so.c):
// the shared library's __dso_handle, atexit() (64-bit libc.so does not export it), and the clean-up on dlclose.
extern void __cxa_finalize(void*);
extern int __cxa_atexit(void (*)(void*), void*, void*);

__attribute__((visibility("hidden"))) void* __dso_handle = &__dso_handle;

__attribute__((visibility("hidden"))) int atexit(void (*func)(void)) {
  return __cxa_atexit((void (*)(void*))func, (void*)0, &__dso_handle);
}

__attribute__((visibility("hidden"), destructor)) void __on_dlclose(void) { __cxa_finalize(&__dso_handle); }

// overridden by compiler-rt's emutls when the library uses thread_local
__attribute__((weak, visibility("hidden"))) void __emutls_unregister_key(void) {}

__attribute__((visibility("hidden"), destructor)) void __on_dlclose_late(void) { __emutls_unregister_key(); }
