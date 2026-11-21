# AFC native: Google Research Football's game engine (Apache-2.0) running headless inside Godot as a GDExtension.
#   cmake -S native -B build -DGF_ROOT=<football>/third_party/gfootball_engine -DGODOT_CPP=<godot-cpp>
# The engine sources are not copied here: prepare.sh fetches them at a pinned commit and applies patches/.
cmake_minimum_required(VERSION 3.20)
project(afcnative CXX C)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)
if(NOT CMAKE_BUILD_TYPE)
  set(CMAKE_BUILD_TYPE Release)
endif()

set(GF_ROOT "" CACHE PATH "gfootball_engine folder (patched)")
set(GODOT_CPP "" CACHE PATH "godot-cpp folder")
option(AFC_GDEXTENSION "build the Godot extension (off: only the engine + a test program)" ON)

# ---- the engine
set(CMAKE_CURRENT_SOURCE_DIR_SAVE ${CMAKE_CURRENT_SOURCE_DIR})
include(${GF_ROOT}/sources.cmake)
set(GF_LISTS BASE_SOURCES SYSTEMS_GRAPHICS_SOURCES LOADERS_SOURCES TYPES_SOURCES SCENE_SOURCES UTILS_SOURCES
    UTILS_GUI2_SOURCES BLUNTED_CORE_SOURCES GAME_SOURCES MENU_SOURCES DATA_SOURCES CORE_SOURCES)
set(GF_SRCS ${GF_ROOT}/src/ai/ai_keyboard.cpp ${GF_ROOT}/src/game_env.cpp)
foreach(L ${GF_LISTS})
  foreach(F ${${L}})
    if(F MATCHES "\\.(cpp|cc|c)$" AND NOT F MATCHES "opengl_renderer3d")
      list(APPEND GF_SRCS ${GF_ROOT}/${F})
    endif()
  endforeach()
endforeach()
list(REMOVE_DUPLICATES GF_SRCS)

add_library(gfengine STATIC ${GF_SRCS} src/sdl_stub.cpp src/gf_api.cpp src/tizero.cpp)
# TiZero's network: let the compiler reorder the dot products so they vectorise (NEON on phones)
set_source_files_properties(src/tizero.cpp PROPERTIES COMPILE_OPTIONS "-O3;-ffast-math")
target_include_directories(gfengine PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/shims ${GF_ROOT}/src ${GF_ROOT}/src/cmake ${CMAKE_CURRENT_SOURCE_DIR}/src)
target_compile_definitions(gfengine PUBLIC GF_HEADLESS=1)
target_compile_options(gfengine PRIVATE -w -O2 -fno-strict-aliasing "SHELL:-include ${CMAKE_CURRENT_SOURCE_DIR}/shims/gf_prelude.h")
if(ANDROID)
  target_link_libraries(gfengine PUBLIC log)
endif()

# ---- a command-line check: plays a match and prints what happened
if(NOT ANDROID)
  add_executable(gftest src/gftest.cpp)
  target_link_libraries(gftest gfengine pthread)
  add_executable(tztest src/tztest.cpp src/tizero.cpp)
endif()

# ---- the Godot extension
if(AFC_GDEXTENSION)
  add_subdirectory(${GODOT_CPP} godot-cpp EXCLUDE_FROM_ALL)
  add_library(afcgf SHARED src/register_types.cpp src/gf_engine.cpp)
  target_link_libraries(afcgf PRIVATE gfengine godot-cpp)
  set_target_properties(afcgf PROPERTIES PREFIX "lib")
  # only the entry point is exported: the engine and its C++ library stay private to this .so
  target_link_options(afcgf PRIVATE -Wl,--version-script=${CMAKE_CURRENT_SOURCE_DIR}/afcgf.map)
  set_target_properties(afcgf PROPERTIES LINK_DEPENDS ${CMAKE_CURRENT_SOURCE_DIR}/afcgf.map)
endif()
