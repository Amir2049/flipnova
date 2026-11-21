#!/bin/sh
# Fetch what the native build needs, at pinned versions:
#   google-research/football (the engine, Apache-2.0) with AFC's headless patch, and godot-cpp 4.5.
#   sh native/prepare.sh <deps dir>
set -e
D=${1:-native/deps}
FOOTBALL_COMMIT=3d9e754720a95621bba6475c4d3b0d56fe919014
GODOT_CPP_TAG=godot-4.5-stable
HERE=$(cd "$(dirname "$0")" && pwd)
mkdir -p "$D"
cd "$D"
if [ ! -d football ]; then
  git init -q football
  git -C football remote add origin https://github.com/google-research/football
  git -C football sparse-checkout set third_party/gfootball_engine/src third_party/gfootball_engine/sources.cmake
  git -C football fetch -q --depth 1 origin $FOOTBALL_COMMIT
  git -C football checkout -q FETCH_HEAD
  git -C football apply --directory=third_party/gfootball_engine "$HERE/patches/gfootball-headless.patch"
fi
if [ ! -d godot-cpp ]; then
  git clone -q --depth 1 --branch $GODOT_CPP_TAG https://github.com/godotengine/godot-cpp godot-cpp
fi
echo "GF_ROOT=$PWD/football/third_party/gfootball_engine"
echo "GODOT_CPP=$PWD/godot-cpp"
