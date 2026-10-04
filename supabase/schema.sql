create table if not exists public.records (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type text not null,
  key text not null,
  payload jsonb,
  updated_at timestamptz not null,
  primary key (user_id, type, key)
);

alter table public.records enable row level security;

drop policy if exists "Users select own records" on public.records;
create policy "Users select own records" on public.records
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "Users insert own records" on public.records;
create policy "Users insert own records" on public.records
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "Users update own records" on public.records;
create policy "Users update own records" on public.records
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "Users delete own records" on public.records;
create policy "Users delete own records" on public.records
  for delete to authenticated using (user_id = auth.uid());

grant select, insert, update, delete on public.records to authenticated;
create index if not exists records_user_updated_at_idx on public.records (user_id, updated_at);

create or replace function public.keep_newer_record()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.updated_at < old.updated_at then
    return null;
  end if;
  return new;
end;
$$;

drop trigger if exists records_keep_newer on public.records;
create trigger records_keep_newer
  before update on public.records
  for each row execute function public.keep_newer_record();
