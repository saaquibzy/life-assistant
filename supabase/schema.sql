create table if not exists public.roadmap_records (
  user_id uuid not null references auth.users (id) on delete cascade,
  record_type text not null check (record_type in ('task', 'review', 'project-link', 'resume-check', 'setting')),
  record_key text not null,
  payload jsonb,
  updated_at timestamptz not null,
  primary key (user_id, record_type, record_key)
);

alter table public.roadmap_records enable row level security;

drop policy if exists "Users manage their own roadmap records" on public.roadmap_records;
create policy "Users manage their own roadmap records"
  on public.roadmap_records
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update, delete on public.roadmap_records to authenticated;

create or replace function public.keep_newer_roadmap_record()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.updated_at <= old.updated_at then
    return null;
  end if;
  return new;
end;
$$;

drop trigger if exists roadmap_records_keep_newer on public.roadmap_records;
create trigger roadmap_records_keep_newer
  before update on public.roadmap_records
  for each row execute function public.keep_newer_roadmap_record();
