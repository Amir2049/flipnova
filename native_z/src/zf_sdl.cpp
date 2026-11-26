// Z Football: the SDL / SDL_image / SDL_ttf / SDL2_gfx functions zocram4cc's tree calls, headless. Real SDL2 headers
// give the types; nothing here opens a window, reads a device or draws text - the engine only simulates, Godot draws.
// Surfaces are real (memory, pixel formats, blits) because the engine builds some data through them.
#include <SDL2/SDL.h>
#include <SDL2/SDL_image.h>
#include <SDL2/SDL_ttf.h>
#include <SDL2/SDL2_rotozoom.h>

#include <cstdlib>
#include <cstring>
#include <string>

extern "C" {

static SDL_PixelFormat* zf_format(Uint32 fmt, int bpp) {
  SDL_PixelFormat* f = (SDL_PixelFormat*)calloc(1, sizeof(SDL_PixelFormat));
  f->format = fmt;
  f->BytesPerPixel = (Uint8)bpp;
  f->BitsPerPixel = (Uint8)(bpp * 8);
  f->Rmask = 0x000000ff;
  f->Gmask = 0x0000ff00;
  f->Bmask = 0x00ff0000;
  f->Amask = bpp == 4 ? 0xff000000 : 0;
  f->Rshift = 0; f->Gshift = 8; f->Bshift = 16; f->Ashift = bpp == 4 ? 24 : 0;
  f->refcount = 1;
  return f;
}

static SDL_Surface* zf_surface(int w, int h, int bpp) {
  if (w < 1) w = 1;
  if (h < 1) h = 1;
  SDL_Surface* s = (SDL_Surface*)calloc(1, sizeof(SDL_Surface));
  s->format = zf_format(bpp == 4 ? SDL_PIXELFORMAT_ABGR8888 : SDL_PIXELFORMAT_RGB24, bpp);
  s->w = w;
  s->h = h;
  s->pitch = w * bpp;
  s->pixels = calloc((size_t)s->pitch * h, 1);
  s->clip_rect.x = 0; s->clip_rect.y = 0; s->clip_rect.w = w; s->clip_rect.h = h;
  s->refcount = 1;
  return s;
}

int SDL_Init(Uint32) { return 0; }
void SDL_Quit(void) {}
const char* SDL_GetError(void) { return ""; }

SDL_Surface* SDL_CreateRGBSurface(Uint32, int w, int h, int depth, Uint32, Uint32, Uint32, Uint32 amask) {
  return zf_surface(w, h, (depth == 32 || amask) ? 4 : 3);
}
void SDL_FreeSurface(SDL_Surface* s) {
  if (!s || --s->refcount > 0) return;
  free(s->pixels);
  free(s->format);
  free(s);
}
int SDL_LockSurface(SDL_Surface*) { return 0; }
void SDL_UnlockSurface(SDL_Surface*) {}
int SDL_SetSurfaceAlphaMod(SDL_Surface*, Uint8) { return 0; }
int SDL_SetSurfaceBlendMode(SDL_Surface*, SDL_BlendMode) { return 0; }

Uint32 SDL_MapRGB(const SDL_PixelFormat* f, Uint8 r, Uint8 g, Uint8 b) { return SDL_MapRGBA(f, r, g, b, 255); }
Uint32 SDL_MapRGBA(const SDL_PixelFormat* f, Uint8 r, Uint8 g, Uint8 b, Uint8 a) {
  return (Uint32)r | ((Uint32)g << 8) | ((Uint32)b << 16) | (f && f->BytesPerPixel == 4 ? ((Uint32)a << 24) : 0);
}
void SDL_GetRGBA(Uint32 p, const SDL_PixelFormat* f, Uint8* r, Uint8* g, Uint8* b, Uint8* a) {
  *r = p & 0xff; *g = (p >> 8) & 0xff; *b = (p >> 16) & 0xff;
  *a = (f && f->BytesPerPixel == 4) ? (p >> 24) & 0xff : 255;
}
void SDL_GetRGB(Uint32 p, const SDL_PixelFormat* f, Uint8* r, Uint8* g, Uint8* b) {
  Uint8 a;
  SDL_GetRGBA(p, f, r, g, b, &a);
}

static void zf_put(SDL_Surface* s, int x, int y, Uint32 c) {
  Uint8* p = (Uint8*)s->pixels + y * s->pitch + x * s->format->BytesPerPixel;
  memcpy(p, &c, s->format->BytesPerPixel);
}
static Uint32 zf_get(SDL_Surface* s, int x, int y) {
  Uint32 c = 0;
  memcpy(&c, (Uint8*)s->pixels + y * s->pitch + x * s->format->BytesPerPixel, s->format->BytesPerPixel);
  if (s->format->BytesPerPixel == 3) c |= 0xff000000u;
  return c;
}

int SDL_FillRect(SDL_Surface* s, const SDL_Rect* r, Uint32 c) {
  if (!s) return -1;
  SDL_Rect a = r ? *r : s->clip_rect;
  for (int y = SDL_max(a.y, 0); y < SDL_min(a.y + a.h, s->h); y++)
    for (int x = SDL_max(a.x, 0); x < SDL_min(a.x + a.w, s->w); x++) zf_put(s, x, y, c);
  return 0;
}
int SDL_UpperBlit(SDL_Surface* src, const SDL_Rect* sr, SDL_Surface* dst, SDL_Rect* dr) {
  if (!src || !dst) return -1;
  SDL_Rect a = sr ? *sr : src->clip_rect;
  int dx = dr ? dr->x : 0, dy = dr ? dr->y : 0;
  for (int y = 0; y < a.h; y++)
    for (int x = 0; x < a.w; x++) {
      int sx = a.x + x, sy = a.y + y, tx = dx + x, ty = dy + y;
      if (sx < 0 || sy < 0 || sx >= src->w || sy >= src->h || tx < 0 || ty < 0 || tx >= dst->w || ty >= dst->h) continue;
      zf_put(dst, tx, ty, zf_get(src, sx, sy));
    }
  return 0;
}
SDL_Surface* SDL_ConvertSurface(SDL_Surface* src, const SDL_PixelFormat* fmt, Uint32) {
  if (!src) return nullptr;
  SDL_Surface* d = zf_surface(src->w, src->h, fmt ? fmt->BytesPerPixel : 4);
  SDL_UpperBlit(src, nullptr, d, nullptr);
  return d;
}

int SDL_GetNumDisplayModes(int) { return 1; }
int SDL_GetDisplayMode(int, int, SDL_DisplayMode* m) {
  if (m) { memset(m, 0, sizeof(*m)); m->w = 1280; m->h = 720; m->refresh_rate = 60; }
  return 0;
}
SDL_Keycode zf_dummy_key;
const char* SDL_GetKeyName(SDL_Keycode) { return ""; }
Uint32 SDL_GetRelativeMouseState(int* x, int* y) { if (x) *x = 0; if (y) *y = 0; return 0; }

// no pads: the human's input comes from Godot
int SDL_NumJoysticks(void) { return 0; }
SDL_Joystick* SDL_JoystickOpen(int) { return nullptr; }
void SDL_JoystickClose(SDL_Joystick*) {}
int SDL_JoystickEventState(int) { return 0; }
SDL_JoystickID SDL_JoystickInstanceID(SDL_Joystick*) { return -1; }
SDL_JoystickID SDL_JoystickGetDeviceInstanceID(int) { return -1; }
const char* SDL_JoystickNameForIndex(int) { return ""; }

// images: a small grey surface (the engine's images feed only its renderer, which is the null one)
SDL_Surface* IMG_Load(const char*) {
  SDL_Surface* s = zf_surface(4, 4, 4);
  memset(s->pixels, 128, (size_t)s->pitch * s->h);
  return s;
}

// text: measured as nothing, drawn as nothing (Godot writes every label)
int TTF_Init(void) { return 0; }
void TTF_Quit(void) {}
TTF_Font* TTF_OpenFont(const char*, int) { static int dummy; return (TTF_Font*)&dummy; }
void TTF_CloseFont(TTF_Font*) {}
int TTF_GetFontOutline(const TTF_Font*) { return 0; }
void TTF_SetFontOutline(TTF_Font*, int) {}
int TTF_SizeUTF8(TTF_Font*, const char* t, int* w, int* h) {
  if (w) *w = t ? 8 * (int)strlen(t) : 0;
  if (h) *h = 16;
  return 0;
}
SDL_Surface* TTF_RenderUTF8_Blended(TTF_Font*, const char* t, SDL_Color) { return zf_surface(t ? 8 * (int)strlen(t) : 1, 16, 4); }

SDL_Surface* zoomSurface(SDL_Surface* src, double zx, double zy, int) {
  if (!src) return nullptr;
  int w = SDL_max(1, (int)(src->w * zx)), h = SDL_max(1, (int)(src->h * zy));
  SDL_Surface* d = zf_surface(w, h, src->format->BytesPerPixel);
  for (int y = 0; y < h; y++)
    for (int x = 0; x < w; x++) zf_put(d, x, y, zf_get(src, SDL_min(src->w - 1, (int)(x / zx)), SDL_min(src->h - 1, (int)(y / zy))));
  return d;
}

}  // extern "C"

// the OpenGL renderer's free functions (screenshots, frame recording) - nothing to record headless
namespace blunted {
void RequestScreenshot(const std::string&) {}
void StartFrameRecording(const std::string&) {}
void StopFrameRecording() {}
}  // namespace blunted
