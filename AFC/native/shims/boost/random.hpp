#pragma once
#include <random>
namespace boost {
typedef std::mt19937 mt19937;
template <class R = double>
struct uniform_real {
  uniform_real(R a = 0, R b = 1) : d(a, b) {}
  template <class G> R operator()(G& g) { return d(g); }
  std::uniform_real_distribution<R> d;
};
template <class G, class D>
struct variate_generator {
  variate_generator(G g, D d) : g_(g), d_(d) {}
  typename std::decay<decltype(std::declval<D&>()(std::declval<G&>()))>::type operator()() { return d_(g_); }
  G& engine() { return g_; }
  D& distribution() { return d_; }
  G g_;
  D d_;
};
}
