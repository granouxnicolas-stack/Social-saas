create type public.post_status as enum ('draft','scheduled','publishing','published','failed');
create type public.social_platform as enum ('facebook','instagram','tiktok');

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict default auth.uid(),
  title text,
  content text not null default '',
  media_urls text[] not null default '{}',
  status public.post_status not null default 'draft',
  scheduled_at timestamptz,
  published_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scheduled_posts_need_date check (status <> 'scheduled' or scheduled_at is not null)
);

create table public.post_targets (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  platform public.social_platform not null,
  remote_post_id text,
  status public.post_status not null default 'draft',
  published_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  unique(post_id, platform)
);

create index posts_company_schedule_idx on public.posts(company_id, scheduled_at);
create index posts_company_status_idx on public.posts(company_id, status);
create index post_targets_company_idx on public.post_targets(company_id);

alter table public.posts enable row level security;
alter table public.post_targets enable row level security;

create policy "members can read posts" on public.posts for select using (public.is_company_member(company_id));
create policy "editors can create posts" on public.posts for insert with check (public.has_company_role(company_id, array['owner','admin','editor']::public.company_role[]) and created_by = auth.uid());
create policy "editors can update posts" on public.posts for update using (public.has_company_role(company_id, array['owner','admin','editor']::public.company_role[])) with check (public.has_company_role(company_id, array['owner','admin','editor']::public.company_role[]));
create policy "editors can delete posts" on public.posts for delete using (public.has_company_role(company_id, array['owner','admin','editor']::public.company_role[]));

create policy "members can read post targets" on public.post_targets for select using (public.is_company_member(company_id));
create policy "editors can create post targets" on public.post_targets for insert with check (public.has_company_role(company_id, array['owner','admin','editor']::public.company_role[]) and exists (select 1 from public.posts p where p.id = post_id and p.company_id = company_id));
create policy "editors can update post targets" on public.post_targets for update using (public.has_company_role(company_id, array['owner','admin','editor']::public.company_role[])) with check (public.has_company_role(company_id, array['owner','admin','editor']::public.company_role[]));
create policy "editors can delete post targets" on public.post_targets for delete using (public.has_company_role(company_id, array['owner','admin','editor']::public.company_role[]));
