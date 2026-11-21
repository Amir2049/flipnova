#pragma once
#include <algorithm>
#include <cctype>
#include <string>
namespace boost {
inline std::string to_upper_copy(const std::string& s) {
  std::string r = s;
  std::transform(r.begin(), r.end(), r.begin(), [](unsigned char c) { return (char)std::toupper(c); });
  return r;
}
inline std::string to_lower_copy(const std::string& s) {
  std::string r = s;
  std::transform(r.begin(), r.end(), r.begin(), [](unsigned char c) { return (char)std::tolower(c); });
  return r;
}
}
