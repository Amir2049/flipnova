-- FLIPNOVA — show each player's CURRENT name on the world board (after supabase-v9.sql).
-- A score keeps the name it was posted with; this public view lets the game show the name the player uses now.
-- It only exposes device id + name (both already public on the board), never the secret token.
create or replace view public.ff_names as
  select distinct on (device) device, name from public.ff_players
  where token_hash is not null and device <> ''
  order by device, created_at desc;
grant select on public.ff_names to anon, authenticated;
