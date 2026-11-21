// Headless SDL stand-in: see shims/SDL2/SDL.h.
#include <SDL2/SDL.h>
#include <SDL2/SDL_image.h>
#include <SDL2/SDL_ttf.h>
#include <SDL2/SDL2_rotozoom.h>

#include <cstdlib>
#include <cstring>

static SDL_PixelFormat* make_format(Uint32 fmt, int bpp) {
  SDL_PixelFormat* f = new SDL_PixelFormat();
  f->format = fmt;
  f->BytesPerPixel = (Uint8)bpp;
  f->BitsPerPixel = (Uint8)(bpp * 8);
  f->Rmask = 0x000000ff;
  f->Gmask = 0x0000ff00;
  f->Bmask = 0x00ff0000;
  f->Amask = bpp == 4 ? 0xff000000 : 0;
  return f;
}

static SDL_Surface* make_surface(int w, int h, Uint32 fmt, int bpp) {
  if (w < 1) w = 1;
  if (h < 1) h = 1;
  SDL_Surface* s = new SDL_Surface();
  s->format = make_format(fmt, bpp);
  s->w = w;
  s->h = h;
  s->pitch = w * bpp;
  s->pixels = calloc((size_t)s->pitch * h, 1);
  s->clip_rect = {0, 0, w, h};
  s->refcount = 1;
  return s;
}

int SDL_Init(Uint32) { return 0; }
void SDL_Quit(void) {}
const char* SDL_GetError(void) { return ""; }
int SDL_SetError(const char*, ...) { return -1; }

SDL_Surface* SDL_CreateRGBSurface(Uint32, int w, int h, int depth, Uint32, Uint32, Uint32, Uint32 A) {
  int bpp = depth / 8;
  if (bpp < 1) bpp = 4;
  return make_surface(w, h, bpp == 4 ? (A ? SDL_PIXELFORMAT_ABGR8888 : SDL_PIXELFORMAT_ABGR8888) : SDL_PIXELFORMAT_RGB24, bpp);
}
void SDL_FreeSurface(SDL_Surface* s) {
  if (!s) return;
  free(s->pixels);
  delete s->format;
  delete s;
}
int SDL_LockSurface(SDL_Surface*) { return 0; }
void SDL_UnlockSurface(SDL_Surface*) {}
int SDL_FillRect(SDL_Surface* s, const SDL_Rect* r, Uint32 color) {
  if (!s || !s->pixels) return -1;
  SDL_Rect a = r ? *r : SDL_Rect{0, 0, s->w, s->h};
  int bpp = s->format->BytesPerPixel;
  for (int y = a.y; y < a.y + a.h && y < s->h; y++) {
    if (y < 0) continue;
    for (int x = a.x; x < a.x + a.w && x < s->w; x++) {
      if (x < 0) continue;
      memcpy((Uint8*)s->pixels + y * s->pitch + x * bpp, &color, bpp);
    }
  }
  return 0;
}
int SDL_BlitSurface(SDL_Surface*, const SDL_Rect*, SDL_Surface*, SDL_Rect*) { return 0; }
SDL_Surface* SDL_ConvertSurface(SDL_Surface* s, const SDL_PixelFormat* fmt, Uint32) {
  SDL_Surface* r = make_surface(s ? s->w : 1, s ? s->h : 1, fmt ? fmt->format : SDL_PIXELFORMAT_ABGR8888, fmt ? fmt->BytesPerPixel : 4);
  return r;
}
SDL_Surface* SDL_ConvertSurfaceFormat(SDL_Surface* s, Uint32 fmt, Uint32) {
  return make_surface(s ? s->w : 1, s ? s->h : 1, fmt, (fmt == SDL_PIXELFORMAT_RGB24 || fmt == SDL_PIXELFORMAT_BGR24) ? 3 : 4);
}
Uint32 SDL_MapRGB(const SDL_PixelFormat*, Uint8 r, Uint8 g, Uint8 b) { return r | (g << 8) | (b << 16) | 0xff000000u; }
Uint32 SDL_MapRGBA(const SDL_PixelFormat*, Uint8 r, Uint8 g, Uint8 b, Uint8 a) { return r | (g << 8) | (b << 16) | ((Uint32)a << 24); }
void SDL_GetRGB(Uint32 p, const SDL_PixelFormat*, Uint8* r, Uint8* g, Uint8* b) {
  *r = p & 255; *g = (p >> 8) & 255; *b = (p >> 16) & 255;
}
void SDL_GetRGBA(Uint32 p, const SDL_PixelFormat*, Uint8* r, Uint8* g, Uint8* b, Uint8* a) {
  *r = p & 255; *g = (p >> 8) & 255; *b = (p >> 16) & 255; *a = (p >> 24) & 255;
}
SDL_RWops* SDL_RWFromConstMem(const void* mem, int size) { return new SDL_RWops{mem, (size_t)size}; }
SDL_Surface* SDL_LoadBMP_RW(SDL_RWops* src, int freesrc) {
  if (freesrc) delete src;
  return make_surface(4, 4, SDL_PIXELFORMAT_ABGR8888, 4);
}
SDL_Window* SDL_CreateWindow(const char*, int, int, int, int, Uint32) { return nullptr; }
int SDL_GL_SetAttribute(SDL_GLattr, int) { return 0; }
SDL_GLContext SDL_GL_CreateContext(SDL_Window*) { return nullptr; }
int SDL_GL_MakeCurrent(SDL_Window*, SDL_GLContext) { return 0; }
void SDL_GL_SwapWindow(SDL_Window*) {}
void* SDL_GL_GetProcAddress(const char*) { return nullptr; }

SDL_Surface* IMG_Load(const char*) { return make_surface(4, 4, SDL_PIXELFORMAT_ABGR8888, 4); }
SDL_Surface* IMG_LoadBmp(const char*) { return make_surface(4, 4, SDL_PIXELFORMAT_ABGR8888, 4); }

struct TTF_Font { int outline; };
int TTF_Init(void) { return 0; }
void TTF_Quit(void) {}
TTF_Font* TTF_OpenFont(const char*, int) { return new TTF_Font{0}; }
TTF_Font* TTF_OpenFontIndexRW(SDL_RWops* src, int freesrc, int, long) {
  if (freesrc) delete src;
  return new TTF_Font{0};
}
void TTF_CloseFont(TTF_Font* f) { delete f; }
int TTF_SizeUTF8(TTF_Font*, const char* text, int* w, int* h) {
  if (w) *w = (int)strlen(text) * 8;
  if (h) *h = 16;
  return 0;
}
SDL_Surface* TTF_RenderUTF8_Blended(TTF_Font*, const char* text, SDL_Color) {
  return make_surface((int)strlen(text) * 8, 16, SDL_PIXELFORMAT_ARGB8888, 4);
}
int TTF_GetFontOutline(const TTF_Font* f) { return f ? f->outline : 0; }
void TTF_SetFontOutline(TTF_Font* f, int o) { if (f) f->outline = o; }
SDL_Surface* zoomSurface(SDL_Surface* src, double zx, double zy, int) {
  return make_surface((int)(src ? src->w * zx : 1), (int)(src ? src->h * zy : 1), SDL_PIXELFORMAT_ABGR8888, 4);
}
