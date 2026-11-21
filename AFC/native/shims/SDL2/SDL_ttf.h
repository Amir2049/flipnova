#pragma once
#include "SDL.h"
typedef struct TTF_Font TTF_Font;
int TTF_Init(void);
void TTF_Quit(void);
TTF_Font* TTF_OpenFont(const char* file, int ptsize);
TTF_Font* TTF_OpenFontIndexRW(SDL_RWops* src, int freesrc, int ptsize, long index);
void TTF_CloseFont(TTF_Font* f);
int TTF_SizeUTF8(TTF_Font* f, const char* text, int* w, int* h);
SDL_Surface* TTF_RenderUTF8_Blended(TTF_Font* f, const char* text, SDL_Color fg);
int TTF_GetFontOutline(const TTF_Font* f);
void TTF_SetFontOutline(TTF_Font* f, int outline);
