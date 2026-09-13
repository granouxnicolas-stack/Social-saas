create extension if not exists pgcrypto;

create type public.company_role as enum ('owner', 'admin', 'editor', 'viewer');

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.company_role not null default 'viewer',
  created_at timestamptz not null default now(),
  unique(company_id, user_id)
);

create index company_members_user_id_idx on public.company_members(user_id);
create index company_members_company_id_idx on public.company_members(company_id);

alter table public.companies enable row level security;
alter table public.company_members enable row level security;

create or replace function public.is_company_member(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_members cm
    where cm.company_id = target_company_id
      and cm.user_id = auth.uid()
  );
$$;

create or replace function public.has_company_role(target_company_id uuid, allowed_roles public.company_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_members cm
    where cm.company_id = target_company_id
      and cm.user_id = auth.uid()
      and cm.role = any(allowed_roles)
  );
$$;

create policy "members can read companies"
on public.companies
for select
using (public.is_company_member(id));

create policy "owners and admins can update companies"
on public.companies
for update
using (public.has_company_role(id, array['owner','admin']::public.company_role[]))
with check (public.has_company_role(id, array['owner','admin']::public.company_role[]));

create policy "members can read company membership"
on public.company_members
for select
using (public.is_company_member(company_id));

create policy "owners and admins can add members"
on public.company_members
for insert
with check (public.has_company_role(company_id, array['owner','admin']::public.company_role[]));

create policy "owners and admins can update members"
on public.company_members
for update
using (public.has_company_role(company_id, array['owner','admin']::public.company_role[]))
with check (public.has_company_role(company_id, array['owner','admin']::public.company_role[]));

create policy "owners and admins can remove members"
on public.company_members
for delete
using (public.has_company_role(company_id, array['owner','admin']::public.company_role[]));

create or replace function public.create_company(company_name text, company_slug text)
returns public.companies
language plpgsql
security definer
set search_path = public
as $$
declare
  new_company public.companies;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  insert into public.companies(name, slug)
  values (company_name, company_slug)
  returning * into new_company;

  insert into public.company_members(company_id, user_id, role)
  values (new_company.id, auth.uid(), 'owner');

  return new_company;
end;
$$;

grant execute on function public.create_company(text, text) to authenticated;
