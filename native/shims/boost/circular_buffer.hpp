// Minimal stand-in for boost::circular_buffer: fixed capacity, oldest element dropped on overflow.
#pragma once
#include <cstddef>
#include <deque>
namespace boost {
template <class T>
class circular_buffer {
 public:
  explicit circular_buffer(size_t cap = 0) : cap_(cap) {}
  void set_capacity(size_t c) {
    cap_ = c;
    while (d_.size() > cap_) d_.pop_front();
  }
  size_t capacity() const { return cap_; }
  size_t size() const { return d_.size(); }
  bool empty() const { return d_.empty(); }
  bool full() const { return d_.size() >= cap_; }
  void push_back(const T& v) {
    if (cap_ == 0) return;
    if (d_.size() >= cap_) d_.pop_front();
    d_.push_back(v);
  }
  void push_front(const T& v) {
    if (cap_ == 0) return;
    if (d_.size() >= cap_) d_.pop_back();
    d_.push_front(v);
  }
  void pop_front() { d_.pop_front(); }
  void pop_back() { d_.pop_back(); }
  void clear() { d_.clear(); }
  T& operator[](size_t i) { return d_[i]; }
  const T& operator[](size_t i) const { return d_[i]; }
  T& at(size_t i) { return d_.at(i); }
  T& front() { return d_.front(); }
  T& back() { return d_.back(); }
  const T& front() const { return d_.front(); }
  const T& back() const { return d_.back(); }
  typename std::deque<T>::iterator begin() { return d_.begin(); }
  typename std::deque<T>::iterator end() { return d_.end(); }
  typename std::deque<T>::const_iterator begin() const { return d_.begin(); }
  typename std::deque<T>::const_iterator end() const { return d_.end(); }

 private:
  size_t cap_;
  std::deque<T> d_;
};
}
