-- FLIPNOVA world leaderboard — run this once in Supabase → SQL Editor.
-- Anyone may READ and ADD scores. Nobody (with the public key) can edit or delete them.
-- Fake scores can still be inserted, but every game re-plays each entry's proof and hides anything that doesn't reproduce.

create table if not exists public.ff_scores (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  board       text not null,            -- 'endless' | 'daily-YYYY-MM-DD' | 'legend'
  name        text not null,
  score       integer not null,
  dist        integer not null default 0,
  stage       integer not null default 1,
  skin        text not null default 'flippo',
  proof       text not null,            -- replay proof (FFRUN:/FFLEGEND:)
  device      text not null default ''
);

create index if not exists ff_scores_board_score on public.ff_scores (board, score desc);
create index if not exists ff_scores_board_time  on public.ff_scores (board, created_at);

alter table public.ff_scores enable row level security;

drop policy if exists "read scores" on public.ff_scores;
create policy "read scores" on public.ff_scores for select to anon using (true);

drop policy if exists "add scores" on public.ff_scores;
create policy "add scores" on public.ff_scores for insert to anon with check (
  char_length(name) between 1 and 14
  and (board = 'endless' or board = 'legend' or board ~ '^daily-[0-9]{4}-[0-9]{2}-[0-9]{2}$')
  and score between 0 and 100000000
  and char_length(proof) < 200000
  and char_length(skin) < 20
  and char_length(device) < 20
);
-- no update / delete policies → impossible with the public key.
