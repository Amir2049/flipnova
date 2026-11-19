-- FLIPNOVA anonymous counter (build 35). Run once in Supabase → SQL Editor, after the other ff_*.sql files.
-- It stores ONLY daily totals per event (e.g. "4 Nov: 37 opens, 12 returning players, 80 runs").
-- No names, no device ids, no IP addresses are kept in it. Each device adds each event at most once a day
-- (runs: at most 20 a day), the game remembers that on the device itself.
create table if not exists public.ff_count (
  day   date not null,
  event text not null,
  n     integer not null default 0,
  primary key (day, event)
);
alter table public.ff_count enable row level security;
drop policy if exists ff_count_read on public.ff_count;
create policy ff_count_read on public.ff_count for select using (true);   -- totals are public, nobody writes directly

create or replace function public.count_event(ev text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if ev not in ('open', 'back', 'tut', 'run', 'stage3', 'share', 'vs_open') then return; end if;
  insert into public.ff_count (day, event, n) values ((now() at time zone 'Africa/Cairo')::date, ev, 1)
  on conflict (day, event) do update set n = public.ff_count.n + 1;
end $$;
revoke all on function public.count_event(text) from public;
grant execute on function public.count_event(text) to anon, authenticated;

-- what Amir reads (Table editor → ff_count, or this query):
-- select day, event, n from public.ff_count order by day desc, event;
