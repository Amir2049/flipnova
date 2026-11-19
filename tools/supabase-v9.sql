-- FLIPNOVA v9 — unique player names + protected score submission.
-- Run once in Supabase → SQL Editor (after supabase-setup.sql, supabase-gifts.sql, supabase-update.sql).
--
-- What changes:
--  * every name belongs to ONE player (the device that claimed it first). "Amir", "amir" and "A mir" count as the same name.
--  * names already on the world board stay reserved for the device that used them.
--  * scores can only be added through submit_score(): it writes the player's own claimed name (no faking someone else),
--    checks the fields and limits how often one connection can post. Direct inserts with the public key stop working.

-- the same name ignoring case and spaces
create or replace function public.ff_key(n text) returns text language sql immutable as $$
  select lower(regexp_replace(coalesce(n, ''), '\s', '', 'g'))
$$;

create table if not exists public.ff_players (
  name_key    text primary key,
  name        text not null,
  token_hash  text,                       -- sha256 of a secret only the player's device knows
  device      text not null default '',
  created_at  timestamptz not null default now()
);
alter table public.ff_players enable row level security;   -- no policies: only the functions below touch it
create unique index if not exists ff_players_token on public.ff_players (token_hash) where token_hash is not null;

create table if not exists public.ff_hits (
  ip    text not null,
  kind  text not null,
  at    timestamptz not null default now()
);
create index if not exists ff_hits_ip on public.ff_hits (ip, kind, at);
alter table public.ff_hits enable row level security;      -- private

-- names already used on the board are kept for the device that used them last
insert into public.ff_players (name_key, name, device)
select distinct on (k) k, name, device
from (select public.ff_key(name) k, name, device, created_at from public.ff_scores) s
where k <> ''
order by k, created_at desc
on conflict (name_key) do nothing;

create or replace function public.ff_ip() returns text language sql stable as $$
  select coalesce(h ->> 'cf-connecting-ip', h ->> 'x-real-ip', split_part(h ->> 'x-forwarded-for', ',', 1), 'none')
  from (select current_setting('request.headers', true)::json h) x
$$;

-- returns 'ok' | 'taken' | 'bad' | 'limit'
create or replace function public.claim_name(p_name text, p_token text, p_device text)
returns text language plpgsql security definer set search_path = public as $$
declare
  nm  text := btrim(coalesce(p_name, ''));
  k   text := public.ff_key(p_name);
  th  text;
  v_ip text := public.ff_ip();
  r   public.ff_players;
begin
  if char_length(coalesce(p_token, '')) < 24 or char_length(coalesce(p_token, '')) > 80 then return 'bad'; end if;
  if char_length(nm) < 3 or char_length(nm) > 14 or nm !~ '^[A-Za-z0-9_ .؀-ۿ-]+$' then return 'bad'; end if;
  if k in ('flippo', 'فليبو', 'flipnova', 'flipfrenzy', 'admin', 'owner', 'player', 'guest') then return 'taken'; end if;
  if (select count(*) from public.ff_hits h where h.ip = v_ip and h.kind = 'claim' and h.at > now() - interval '1 day') >= 12 then return 'limit'; end if;
  insert into public.ff_hits (ip, kind) values (v_ip, 'claim');
  th := encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
  select * into r from public.ff_players where name_key = k;
  if found then
    if r.token_hash = th then
      update public.ff_players set name = nm where name_key = k;
      return 'ok';
    end if;
    -- a name reserved from the old board: the same device may take it
    if r.token_hash is null and r.device <> '' and r.device = coalesce(p_device, '') then
      delete from public.ff_players where token_hash = th;
      update public.ff_players set token_hash = th, name = nm where name_key = k;
      return 'ok';
    end if;
    return 'taken';
  end if;
  -- one name per player: picking a new one frees the old one
  delete from public.ff_players where token_hash = th;
  insert into public.ff_players (name_key, name, token_hash, device) values (k, nm, th, left(coalesce(p_device, ''), 20));
  return 'ok';
end $$;

-- returns 'ok' | 'noname' | 'bad' | 'limit'
create or replace function public.submit_score(p_token text, p_board text, p_score int, p_dist int, p_stage int, p_skin text, p_proof text, p_device text)
returns text language plpgsql security definer set search_path = public as $$
declare
  nm text;
  v_ip text := public.ff_ip();
begin
  select name into nm from public.ff_players where token_hash = encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex');
  if nm is null then return 'noname'; end if;
  if not (p_board = 'endless' or p_board = 'legend' or p_board ~ '^daily-[0-9]{4}-[0-9]{2}-[0-9]{2}$') then return 'bad'; end if;
  if p_score is null or p_score < 0 or p_score > 100000000 or coalesce(p_dist, 0) < 0 or coalesce(p_stage, 1) < 0 then return 'bad'; end if;
  if char_length(coalesce(p_proof, '')) not between 10 and 200000 or char_length(coalesce(p_skin, '')) > 20 then return 'bad'; end if;
  if (select count(*) from public.ff_hits h where h.ip = v_ip and h.kind = 'score' and h.at > now() - interval '1 hour') >= 30 then return 'limit'; end if;
  if (select count(*) from public.ff_scores s where s.name = nm and s.created_at > now() - interval '1 hour') >= 20 then return 'limit'; end if;
  insert into public.ff_hits (ip, kind) values (v_ip, 'score');
  delete from public.ff_hits where at < now() - interval '2 days';
  insert into public.ff_scores (board, name, score, dist, stage, skin, proof, device)
  values (p_board, nm, p_score, coalesce(p_dist, 0), coalesce(p_stage, 1), coalesce(nullif(p_skin, ''), 'flippo'), p_proof, left(coalesce(p_device, ''), 20));
  return 'ok';
end $$;

revoke all on function public.claim_name(text, text, text) from public;
revoke all on function public.submit_score(text, text, int, int, int, text, text, text) from public;
grant execute on function public.claim_name(text, text, text) to anon, authenticated;
grant execute on function public.submit_score(text, text, int, int, int, text, text, text) to anon, authenticated;

-- from now on scores only come in through submit_score()
drop policy if exists "add scores" on public.ff_scores;

-- the stage book can be published to every player from the in-game Stage Maker (owner only)
create table if not exists public.ff_meta (id int primary key, build int not null, url text not null, note text);
alter table public.ff_meta enable row level security;
drop policy if exists "anyone can read" on public.ff_meta;
create policy "anyone can read" on public.ff_meta for select to anon, authenticated using (true);
insert into public.ff_meta (id, build, url, note) values (1, 12, 'https://github.com/Amir2049/Afc-gmae/raw/ccr-2aa9f916-rybcna/dist/FLIPNOVA.apk', '') on conflict (id) do nothing;
-- copies of the game from before this update (build 11) show a "new version" button that downloads it
update public.ff_meta set build = 12, url = 'https://github.com/Amir2049/Afc-gmae/raw/ccr-2aa9f916-rybcna/dist/FLIPNOVA.apk' where id = 1 and build < 12;
alter table public.ff_meta add column if not exists book jsonb;
create table if not exists public.ff_admin (code_hash text primary key);
alter table public.ff_admin enable row level security;     -- private: the owner's code hash lives here (see the note you got in chat)

create or replace function public.publish_book(p_code text, p_book jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare v_ip text := public.ff_ip();
begin
  if (select count(*) from public.ff_hits h where h.ip = v_ip and h.kind = 'admin' and h.at > now() - interval '1 hour') >= 10 then return 'limit'; end if;
  insert into public.ff_hits (ip, kind) values (v_ip, 'admin');
  if not exists (select 1 from public.ff_admin where code_hash = encode(sha256(convert_to(upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g')), 'UTF8')), 'hex')) then return 'denied'; end if;
  if p_book is not null and (jsonb_typeof(p_book) <> 'object' or char_length(p_book::text) > 60000) then return 'bad'; end if;
  update public.ff_meta set book = p_book where id = 1;
  return 'ok';
end $$;
revoke all on function public.publish_book(text, jsonb) from public;
grant execute on function public.publish_book(text, jsonb) to anon, authenticated;

-- is this the owner's code? (the code itself is never stored, only its sha256 in ff_admin)
create or replace function public.owner_check(p_code text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_ip text := public.ff_ip();
begin
  if (select count(*) from public.ff_hits h where h.ip = v_ip and h.kind = 'admin' and h.at > now() - interval '1 hour') >= 10 then return false; end if;
  insert into public.ff_hits (ip, kind) values (v_ip, 'admin');
  return exists (select 1 from public.ff_admin where code_hash = encode(sha256(convert_to(upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g')), 'UTF8')), 'hex'));
end $$;
revoke all on function public.owner_check(text) from public;
grant execute on function public.owner_check(text) to anon, authenticated;
