// Minimal stand-in for boost::intrusive_ptr (AFC native build: no Boost on Android).
#pragma once
#include <cstddef>
#include <functional>
#include <memory>
#include <utility>

namespace boost {
template <class T>
class intrusive_ptr {
 public:
  typedef T element_type;
  intrusive_ptr() noexcept : p_(nullptr) {}
  intrusive_ptr(std::nullptr_t) noexcept : p_(nullptr) {}
  intrusive_ptr(T* p, bool add_ref = true) : p_(p) {
    if (p_ && add_ref) intrusive_ptr_add_ref(p_);
  }
  intrusive_ptr(const intrusive_ptr& o) : p_(o.p_) {
    if (p_) intrusive_ptr_add_ref(p_);
  }
  template <class U>
  intrusive_ptr(const intrusive_ptr<U>& o) : p_(o.get()) {
    if (p_) intrusive_ptr_add_ref(p_);
  }
  intrusive_ptr(intrusive_ptr&& o) noexcept : p_(o.p_) { o.p_ = nullptr; }
  ~intrusive_ptr() {
    if (p_) intrusive_ptr_release(p_);
  }
  intrusive_ptr& operator=(const intrusive_ptr& o) {
    intrusive_ptr(o).swap(*this);
    return *this;
  }
  template <class U>
  intrusive_ptr& operator=(const intrusive_ptr<U>& o) {
    intrusive_ptr(o).swap(*this);
    return *this;
  }
  intrusive_ptr& operator=(intrusive_ptr&& o) noexcept {
    intrusive_ptr(std::move(o)).swap(*this);
    return *this;
  }
  intrusive_ptr& operator=(T* p) {
    intrusive_ptr(p).swap(*this);
    return *this;
  }
  void reset() { intrusive_ptr().swap(*this); }
  void reset(T* p) { intrusive_ptr(p).swap(*this); }
  T* get() const noexcept { return p_; }
  T* detach() noexcept {
    T* r = p_;
    p_ = nullptr;
    return r;
  }
  T& operator*() const { return *p_; }
  T* operator->() const { return p_; }
  explicit operator bool() const noexcept { return p_ != nullptr; }
  bool operator!() const noexcept { return p_ == nullptr; }
  void swap(intrusive_ptr& o) noexcept { std::swap(p_, o.p_); }

 private:
  T* p_;
};

template <class T, class U> inline bool operator==(const intrusive_ptr<T>& a, const intrusive_ptr<U>& b) { return a.get() == b.get(); }
template <class T, class U> inline bool operator!=(const intrusive_ptr<T>& a, const intrusive_ptr<U>& b) { return a.get() != b.get(); }
template <class T> inline bool operator==(const intrusive_ptr<T>& a, T* b) { return a.get() == b; }
template <class T> inline bool operator!=(const intrusive_ptr<T>& a, T* b) { return a.get() != b; }
template <class T> inline bool operator==(T* a, const intrusive_ptr<T>& b) { return a == b.get(); }
template <class T> inline bool operator!=(T* a, const intrusive_ptr<T>& b) { return a != b.get(); }
template <class T> inline bool operator==(const intrusive_ptr<T>& a, std::nullptr_t) { return a.get() == nullptr; }
template <class T> inline bool operator!=(const intrusive_ptr<T>& a, std::nullptr_t) { return a.get() != nullptr; }
template <class T> inline bool operator<(const intrusive_ptr<T>& a, const intrusive_ptr<T>& b) { return std::less<T*>()(a.get(), b.get()); }
template <class T, class U> intrusive_ptr<T> static_pointer_cast(const intrusive_ptr<U>& p) { return intrusive_ptr<T>(static_cast<T*>(p.get())); }
template <class T, class U> intrusive_ptr<T> dynamic_pointer_cast(const intrusive_ptr<U>& p) { return intrusive_ptr<T>(dynamic_cast<T*>(p.get())); }
template <class T> T* get_pointer(const intrusive_ptr<T>& p) { return p.get(); }
}  // namespace boost

namespace std {
template <class T> struct hash<boost::intrusive_ptr<T>> {
  size_t operator()(const boost::intrusive_ptr<T>& p) const { return std::hash<T*>()(p.get()); }
};
}
