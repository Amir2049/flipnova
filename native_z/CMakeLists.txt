# Z Football: zocram4cc/GameplayFootball (Apache-2.0) built headless - no window, no GL, no OpenAL - against AFC's
# SDL stand-in (native/shims, native/src/sdl_stub.cpp), so the same build works on a phone.
#   cmake -S native_z -B build-z -DZF_ROOT=<their tree with patches/zocram-headless.patch applied>
cmake_minimum_required(VERSION 3.20)
project(zfnative C CXX)
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)
if(NOT CMAKE_BUILD_TYPE)
  set(CMAKE_BUILD_TYPE Release)
endif()
set(ZF_ROOT "" CACHE PATH "zocram4cc tree (patched)")
set(AFC_NATIVE ${CMAKE_CURRENT_SOURCE_DIR}/../native)

include(${ZF_ROOT}/sources.cmake)
set(ZF_LISTS BASE_MATH_SOURCES BASE_SOURCES SYSTEMS_COMMON_SOURCES SYSTEMS_GRAPHICS_SOURCES
    SYSTEMS_AUDIO_SOURCES LOADERS_SOURCES TYPES_SOURCES FRAMEWORK_SOURCES SCENE_SOURCES MANAGERS_SOURCES UTILS_SOURCES
    UTILS_GUI2_SOURCES BLUNTED_CORE_SOURCES LEAGUE_SOURCES CORE_SOURCES GAME_SOURCES HID_SOURCES MENU_SOURCES DATA_SOURCES)
set(ZF_SRCS ${ZF_ROOT}/src/onthepitch/ballphysics.cpp)
foreach(L ${ZF_LISTS})
  foreach(F ${${L}})
    if(F MATCHES "\\.(cpp|cc|c)$" AND NOT F MATCHES "opengl_renderer3d|openal_renderer|/viewer/")
      list(APPEND ZF_SRCS ${ZF_ROOT}/${F})
    endif()
  endforeach()
endforeach()
list(REMOVE_DUPLICATES ZF_SRCS)

# only SDL from AFC's shims (its boost subset would shadow the real boost headers)
# SDL: the real SDL2 headers (zlib licence) for the types, and only the functions this tree calls, implemented
# headless in zf_sdl.cpp (no SDL library linked: the phone has none)
set(SDL2_HEADERS "/usr/include" CACHE PATH "folder holding SDL2/SDL.h")

add_executable(zfheadless ${ZF_SRCS} ${CMAKE_CURRENT_SOURCE_DIR}/src/zf_sdl.cpp)
target_include_directories(zfheadless PRIVATE ${ZF_ROOT}/src ${ZF_ROOT}/src/cmake ${SDL2_HEADERS})
target_compile_definitions(zfheadless PRIVATE GF_HEADLESS=1 ZF_HEADLESS=1)
target_compile_options(zfheadless PRIVATE -w -O2 -fno-strict-aliasing)
find_package(SQLite3 REQUIRED)
target_link_libraries(zfheadless PRIVATE SQLite::SQLite3 pthread)
