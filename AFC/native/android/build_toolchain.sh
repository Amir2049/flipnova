#!/bin/sh
# Builds, from source and with the host's clang/lld (18 or newer), everything the Android NDK would provide for an
# arm64 shared library - so AFC's native library can be built anywhere git works, with no NDK download:
#   * a sysroot: bionic's C headers (and the kernel's), link stubs for libc.so / libm.so / libdl.so / liblog.so
#   * libc++ and libc++abi (static, no exceptions), from the LLVM release that matches the host clang
#   * compiler-rt builtins (long double maths, emulated TLS) and a crtbegin/crtend stand-in
#
#   sh native/android/build_toolchain.sh <work dir>
# then configure with  -DCMAKE_TOOLCHAIN_FILE=<work dir>/toolchain.cmake
set -e
W=${1:-native/deps/android}
mkdir -p "$W"
W=$(cd "$W" && pwd)
HERE=$(cd "$(dirname "$0")" && pwd)
API=24
T=aarch64-linux-android$API
BIONIC_COMMIT=731631f300090436d7f5df80d50b6275c8c60a93
LLVM_VERSION=$(clang --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
S=$W/sysroot
cd "$W"

# --- sources ------------------------------------------------------------------------------------------------------
if [ ! -d llvm/libcxx ]; then
  rm -rf llvm
  git clone -q --depth 1 --branch "llvmorg-$LLVM_VERSION" --filter=blob:none --sparse \
    https://github.com/llvm/llvm-project llvm
  git -C llvm sparse-checkout set libcxx libcxxabi libunwind compiler-rt/lib/builtins compiler-rt/cmake \
    compiler-rt/include runtimes cmake llvm/cmake llvm/utils/llvm-lit
fi
if [ ! -d bionic/libc ]; then
  rm -rf bionic
  git init -q bionic
  git -C bionic remote add origin https://github.com/aosp-mirror/platform_bionic
  git -C bionic sparse-checkout set --no-cone /libc/include/ /libc/kernel/uapi/ /libc/kernel/android/ \
    /libc/libc.map.txt /libm/libm.map.txt /libdl/libdl.map.txt
  git -C bionic fetch -q --depth 1 --filter=blob:none origin $BIONIC_COMMIT
  git -C bionic checkout -q FETCH_HEAD
fi

# --- headers ------------------------------------------------------------------------------------------------------
rm -rf "$S"
mkdir -p "$S/usr/include/aarch64-linux-android" "$S/usr/lib" "$S/usr/include/android"
cp -r bionic/libc/include/. "$S/usr/include/"
for d in asm-generic drm linux misc mtd rdma regulator scsi sound video xen; do
  cp -r "bionic/libc/kernel/uapi/$d" "$S/usr/include/"
done
cp -r bionic/libc/kernel/android/uapi/. "$S/usr/include/"
cp -r bionic/libc/kernel/uapi/asm-arm64/asm "$S/usr/include/aarch64-linux-android/asm"
cp "$HERE/log.h" "$S/usr/include/android/log.h"

# --- system library stubs (link time only) ------------------------------------------------------------------------
mkdir -p stubs
for lib in libc:bionic/libc/libc.map.txt libm:bionic/libm/libm.map.txt libdl:bionic/libdl/libdl.map.txt; do
  name=${lib%%:*}
  python3 "$HERE/gen_stubs.py" "${lib#*:}" $API "stubs/$name.S"
done
cat > stubs/liblog.S <<'EOF'
.text
.globl __android_log_write
.type __android_log_write, %function
__android_log_write: ret
.globl __android_log_print
.type __android_log_print, %function
__android_log_print: ret
.globl __android_log_vprint
.type __android_log_vprint, %function
__android_log_vprint: ret
.globl __android_log_assert
.type __android_log_assert, %function
__android_log_assert: ret
EOF
for name in libc libm libdl liblog; do
  clang --target=$T -c "stubs/$name.S" -o "stubs/$name.o"
  clang --target=$T -shared -nostdlib -fuse-ld=lld -Wl,-soname,$name.so -o "$S/usr/lib/$name.so" "stubs/$name.o"
done

COMMON="-DCMAKE_SYSTEM_NAME=Linux -DCMAKE_SYSTEM_PROCESSOR=aarch64 -DCMAKE_SYSROOT=$S
  -DCMAKE_C_COMPILER=clang -DCMAKE_CXX_COMPILER=clang++ -DCMAKE_ASM_COMPILER=clang
  -DCMAKE_C_COMPILER_TARGET=$T -DCMAKE_CXX_COMPILER_TARGET=$T -DCMAKE_ASM_COMPILER_TARGET=$T
  -DCMAKE_AR=$(command -v llvm-ar || echo /usr/lib/llvm-${LLVM_VERSION%%.*}/bin/llvm-ar)
  -DCMAKE_RANLIB=$(command -v llvm-ranlib || echo /usr/lib/llvm-${LLVM_VERSION%%.*}/bin/llvm-ranlib)
  -DCMAKE_NM=$(command -v llvm-nm || echo /usr/lib/llvm-${LLVM_VERSION%%.*}/bin/llvm-nm)
  -DCMAKE_TRY_COMPILE_TARGET_TYPE=STATIC_LIBRARY -DCMAKE_BUILD_TYPE=Release
  -DCMAKE_C_FLAGS=-fPIC -DCMAKE_CXX_FLAGS=-fPIC -DCMAKE_ASM_FLAGS=-fPIC"

# --- compiler-rt builtins -----------------------------------------------------------------------------------------
rm -rf build-builtins
cmake -G Ninja -S llvm/compiler-rt/lib/builtins -B build-builtins $COMMON \
  -DCOMPILER_RT_DEFAULT_TARGET_ONLY=ON -DCOMPILER_RT_BUILD_BUILTINS=ON -DCOMPILER_RT_BUILTINS_HIDE_SYMBOLS=ON \
  -DLLVM_CMAKE_DIR="$W/llvm/llvm/cmake/modules" > build-builtins.log
ninja -C build-builtins >> build-builtins.log
cp "$(find build-builtins -name 'libclang_rt.builtins*.a' | head -1)" "$S/usr/lib/libclang_rt.builtins.a"

# --- libc++ / libc++abi -------------------------------------------------------------------------------------------
rm -rf build-runtimes
cmake -G Ninja -S llvm/runtimes -B build-runtimes $COMMON \
  -DLLVM_ENABLE_RUNTIMES="libcxxabi;libcxx" -DCMAKE_INSTALL_PREFIX="$S/usr" \
  -DLLVM_ENABLE_PER_TARGET_RUNTIME_DIR=OFF -DLLVM_INCLUDE_TESTS=OFF \
  -DLIBCXX_ENABLE_SHARED=OFF -DLIBCXXABI_ENABLE_SHARED=OFF \
  -DLIBCXX_ENABLE_EXCEPTIONS=OFF -DLIBCXXABI_ENABLE_EXCEPTIONS=OFF \
  -DLIBCXX_USE_COMPILER_RT=ON -DLIBCXXABI_USE_COMPILER_RT=ON -DLIBCXXABI_USE_LLVM_UNWINDER=OFF \
  -DLIBCXX_HAS_PTHREAD_LIB=OFF -DLIBCXX_HAS_RT_LIB=OFF -DLIBCXX_HAS_ATOMIC_LIB=OFF \
  -DLIBCXXABI_HAS_PTHREAD_LIB=OFF -DLIBCXX_ABI_NAMESPACE=__afc1 \
  -DLIBCXX_INCLUDE_TESTS=OFF -DLIBCXX_INCLUDE_BENCHMARKS=OFF -DLIBCXXABI_INCLUDE_TESTS=OFF \
  -DLIBCXX_ENABLE_STATIC_ABI_LIBRARY=ON > build-runtimes.log
ninja -C build-runtimes install-cxx install-cxxabi >> build-runtimes.log

# --- crt ----------------------------------------------------------------------------------------------------------
clang --target=$T -fPIC -O2 -c "$HERE/crt_so.c" -o "$S/usr/lib/crt_so.o"

# --- CMake toolchain file -----------------------------------------------------------------------------------------
cat > "$W/toolchain.cmake" <<EOF
# generated by native/android/build_toolchain.sh: arm64 Android (API $API) with the host clang
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR aarch64)
set(ANDROID ON)
set(CMAKE_SYSROOT "$S")
set(CMAKE_C_COMPILER clang)
set(CMAKE_CXX_COMPILER clang++)
set(CMAKE_C_COMPILER_TARGET $T)
set(CMAKE_CXX_COMPILER_TARGET $T)
set(CMAKE_ASM_COMPILER_TARGET $T)
set(CMAKE_TRY_COMPILE_TARGET_TYPE STATIC_LIBRARY)
set(CMAKE_C_FLAGS_INIT "-fPIC -ffunction-sections -fdata-sections -fstack-protector-strong")
set(CMAKE_CXX_FLAGS_INIT "-fPIC -ffunction-sections -fdata-sections -fstack-protector-strong -nostdinc++ -isystem $S/usr/include/c++/v1 -fno-exceptions")
set(CMAKE_SHARED_LINKER_FLAGS_INIT "-fuse-ld=lld -nostdlib $S/usr/lib/crt_so.o -Wl,-z,max-page-size=16384 -Wl,--build-id=sha1 -Wl,-z,noexecstack -Wl,-z,relro -Wl,-z,now -Wl,--hash-style=both -Wl,--gc-sections -Wl,--exclude-libs,ALL -Wl,-z,defs")
set(CMAKE_C_STANDARD_LIBRARIES "$S/usr/lib/libclang_rt.builtins.a -L$S/usr/lib -lc -lm -ldl -llog")
set(CMAKE_CXX_STANDARD_LIBRARIES "$S/usr/lib/libc++.a $S/usr/lib/libc++abi.a $S/usr/lib/libclang_rt.builtins.a -L$S/usr/lib -lc -lm -ldl -llog")
set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
EOF
echo "toolchain: $W/toolchain.cmake"
