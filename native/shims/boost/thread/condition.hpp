#pragma once
#include <condition_variable>
#include <mutex>
namespace boost {
typedef std::condition_variable_any condition;
typedef std::mutex mutex;
}
