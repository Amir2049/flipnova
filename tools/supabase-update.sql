-- FLIPNOVA "new version available" notice — run once in Supabase → SQL Editor.
-- Every copy of the game (from build 11 on) reads this row when it opens. If `build` is bigger
-- than its own build number, the home screen shows a green "New version available" button
-- that opens `url`. To announce a new version later, just run the UPDATE line at the bottom.
create table if not exists public.ff_meta (
  id    int primary key,
  build int not null,
  url   text not null,
  note  text
);
alter table public.ff_meta enable row level security;
create policy "anyone can read" on public.ff_meta for select to anon, authenticated using (true);
insert into public.ff_meta (id, build, url, note) values (1, 11, 'https://example.com', '') on conflict (id) do nothing;

-- When you release a new version (example — put your real download link):
-- update public.ff_meta set build = 12, url = 'https://drive.google.com/...', note = 'New worlds!' where id = 1;
