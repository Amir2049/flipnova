-- FLIPNOVA gift codes — run this once in Supabase → SQL Editor (after supabase-setup.sql).
-- A gift = a secret code that unlocks a skin (and trail) designed with tools/gift-maker.html.
-- Nobody can list the gifts: the table has no public policies. The game can only ask
-- "is THIS code a gift?" through redeem_gift(), which returns the design for a matching code.

create table if not exists public.ff_gifts (
  code_hash   text primary key,          -- sha256 of the code in UPPER CASE without spaces (never the code itself)
  name        text not null,             -- who it is for (just a note)
  gift        jsonb not null,            -- { skin: {...}, trail: {...}, message: "..." } from the gift maker
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
alter table public.ff_gifts enable row level security;
-- no policies: the public key can't read, add, change or delete gifts directly.

create or replace function public.redeem_gift(code text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select g.gift
  from public.ff_gifts g
  where g.active
    and g.code_hash = encode(sha256(convert_to(upper(regexp_replace(coalesce(code, ''), '\s', '', 'g')), 'UTF8')), 'hex')
  limit 1;
$$;
revoke all on function public.redeem_gift(text) from public;
grant execute on function public.redeem_gift(text) to anon, authenticated;
