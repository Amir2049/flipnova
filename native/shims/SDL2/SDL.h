// Headless stand-in for SDL2 (AFC native build). The engine runs without a window, renderer, fonts or images:
// surfaces are plain memory, images load as small blank surfaces, text renders blank, GL calls do nothing.
#pragma once
#include <cstdint>
#include <cstddef>

typedef uint8_t Uint8;
typedef uint16_t Uint16;
typedef uint32_t Uint32;
typedef int32_t Sint32;
typedef uint64_t Uint64;
typedef int64_t Sint64;

#define SDL_LIL_ENDIAN 1234
#define SDL_BIG_ENDIAN 4321
#define SDL_BYTEORDER SDL_LIL_ENDIAN

#define SDL_PIXELFORMAT_UNKNOWN 0u
#define SDL_PIXELFORMAT_RGB24 0x17101803u
#define SDL_PIXELFORMAT_BGR24 0x17401803u
#define SDL_PIXELFORMAT_ARGB8888 0x16362004u
#define SDL_PIXELFORMAT_ABGR8888 0x16762004u
#define SDL_ISPIXELFORMAT_ALPHA(f) ((f) == SDL_PIXELFORMAT_ARGB8888 || (f) == SDL_PIXELFORMAT_ABGR8888)

#define SDL_SWSURFACE 0
#define SDL_RLEACCEL 0x00000002
#define SDL_INIT_VIDEO 0x00000020u
#define SDL_WINDOWPOS_UNDEFINED 0x1FFF0000u
#define SDL_WINDOW_OPENGL 0x00000002u

typedef struct SDL_Color { Uint8 r, g, b, a; } SDL_Color;
typedef struct SDL_Rect { int x, y, w, h; } SDL_Rect;
typedef struct SDL_PixelFormat {
  Uint32 format;
  Uint8 BitsPerPixel;
  Uint8 BytesPerPixel;
  Uint32 Rmask, Gmask, Bmask, Amask;
} SDL_PixelFormat;
typedef struct SDL_Surface {
  Uint32 flags;
  SDL_PixelFormat* format;
  int w, h;
  int pitch;
  void* pixels;
  void* userdata;
  int locked;
  SDL_Rect clip_rect;
  int refcount;
} SDL_Surface;
typedef struct SDL_RWops { const void* mem; size_t size; } SDL_RWops;
typedef struct SDL_Window SDL_Window;
typedef void* SDL_GLContext;

typedef enum {
  SDL_GL_RED_SIZE, SDL_GL_GREEN_SIZE, SDL_GL_BLUE_SIZE, SDL_GL_ALPHA_SIZE, SDL_GL_BUFFER_SIZE, SDL_GL_DOUBLEBUFFER,
  SDL_GL_DEPTH_SIZE, SDL_GL_STENCIL_SIZE, SDL_GL_ACCELERATED_VISUAL, SDL_GL_CONTEXT_MAJOR_VERSION,
  SDL_GL_CONTEXT_MINOR_VERSION, SDL_GL_CONTEXT_PROFILE_MASK
} SDL_GLattr;
#define SDL_GL_CONTEXT_PROFILE_CORE 0x0001

int SDL_Init(Uint32 flags);
void SDL_Quit(void);
const char* SDL_GetError(void);
int SDL_SetError(const char* fmt, ...);

SDL_Surface* SDL_CreateRGBSurface(Uint32 flags, int w, int h, int depth, Uint32 R, Uint32 G, Uint32 B, Uint32 A);
void SDL_FreeSurface(SDL_Surface* s);
int SDL_LockSurface(SDL_Surface* s);
void SDL_UnlockSurface(SDL_Surface* s);
int SDL_FillRect(SDL_Surface* s, const SDL_Rect* r, Uint32 color);
int SDL_BlitSurface(SDL_Surface* src, const SDL_Rect* sr, SDL_Surface* dst, SDL_Rect* dr);
SDL_Surface* SDL_ConvertSurface(SDL_Surface* s, const SDL_PixelFormat* fmt, Uint32 flags);
SDL_Surface* SDL_ConvertSurfaceFormat(SDL_Surface* s, Uint32 fmt, Uint32 flags);
Uint32 SDL_MapRGB(const SDL_PixelFormat* f, Uint8 r, Uint8 g, Uint8 b);
Uint32 SDL_MapRGBA(const SDL_PixelFormat* f, Uint8 r, Uint8 g, Uint8 b, Uint8 a);
void SDL_GetRGB(Uint32 p, const SDL_PixelFormat* f, Uint8* r, Uint8* g, Uint8* b);
void SDL_GetRGBA(Uint32 p, const SDL_PixelFormat* f, Uint8* r, Uint8* g, Uint8* b, Uint8* a);
SDL_RWops* SDL_RWFromConstMem(const void* mem, int size);
SDL_Surface* SDL_LoadBMP_RW(SDL_RWops* src, int freesrc);

SDL_Window* SDL_CreateWindow(const char* title, int x, int y, int w, int h, Uint32 flags);
int SDL_GL_SetAttribute(SDL_GLattr attr, int value);
SDL_GLContext SDL_GL_CreateContext(SDL_Window* w);
int SDL_GL_MakeCurrent(SDL_Window* w, SDL_GLContext c);
void SDL_GL_SwapWindow(SDL_Window* w);
void* SDL_GL_GetProcAddress(const char* proc);
