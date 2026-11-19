-- FLIPNOVA — ⭐ player reviews. Run this ONCE in Supabase → SQL Editor (after tools/supabase-v9.sql).
-- Players rate the version they are playing (1-5 stars + a short comment). One review per device per version:
-- sending again just updates it. Nobody can read the reviews except the owner (owner_reviews needs your secret code).
create table if not exists public.ff_reviews (
  id bigserial primary key,
  device text not null,
  build int not null,
  stars int not null check (stars between 1 and 5),
  body text not null default '' check (char_length(body) <= 300),
  name text not null default '' check (char_length(name) <= 16),
  lang text not null default '' check (char_length(lang) <= 4),
  at timestamptz not null default now(),
  unique (device, build)
);
alter table public.ff_reviews enable row level security; -- no policies: only the functions below touch it
revoke all on public.ff_reviews from anon, authenticated;

create or replace function public.submit_review(p_device text, p_build int, p_stars int, p_body text, p_name text, p_lang text)
returns text language plpgsql security definer set search_path = public as $$
declare v_ip text := public.ff_ip();
begin
  if p_device is null or char_length(p_device) not between 6 and 64 then return 'bad'; end if;
  if p_stars is null or p_stars not between 1 and 5 or p_build is null or p_build not between 1 and 100000 then return 'bad'; end if;
  if (select count(*) from public.ff_hits h where h.ip = v_ip and h.kind = 'review' and h.at > now() - interval '1 hour') >= 6 then return 'limit'; end if;
  insert into public.ff_hits (ip, kind) values (v_ip, 'review');
  insert into public.ff_reviews (device, build, stars, body, name, lang)
  values (p_device, p_build, p_stars, left(coalesce(p_body, ''), 300), left(coalesce(p_name, ''), 16), left(coalesce(p_lang, ''), 4))
  on conflict (device, build) do update set stars = excluded.stars, body = excluded.body, name = excluded.name, lang = excluded.lang, at = now();
  return 'ok';
end $$;
revoke all on function public.submit_review(text, int, int, text, text, text) from public;
grant execute on function public.submit_review(text, int, int, text, text, text) to anon, authenticated;

-- the owner reads them: newest first (up to 300), only with the right secret code
create or replace function public.owner_reviews(p_code text)
returns table (build int, stars int, body text, name text, lang text, at timestamptz)
language plpgsql security definer set search_path = public as $$
declare v_ip text := public.ff_ip();
begin
  if (select count(*) from public.ff_hits h where h.ip = v_ip and h.kind = 'admin' and h.at > now() - interval '1 hour') >= 10 then return; end if;
  insert into public.ff_hits (ip, kind) values (v_ip, 'admin');
  if not exists (select 1 from public.ff_admin where code_hash = encode(sha256(convert_to(upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g')), 'UTF8')), 'hex')) then return; end if;
  return query select r.build, r.stars, r.body, r.name, r.lang, r.at from public.ff_reviews r order by r.at desc limit 300;
end $$;
revoke all on function public.owner_reviews(text) from public;
grant execute on function public.owner_reviews(text) to anon, authenticated;
