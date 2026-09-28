insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('social-media', 'social-media', false, 52428800, array['image/jpeg','image/png','image/webp','video/mp4','video/quicktime'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict default auth.uid(),
  bucket_id text not null default 'social-media',
  object_path text not null unique,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  created_at timestamptz not null default now()
);
create index media_assets_company_created_idx on public.media_assets(company_id, created_at desc);
alter table public.media_assets enable row level security;
create policy "members can read media assets" on public.media_assets for select using (public.is_company_member(company_id));
create policy "editors can create media assets" on public.media_assets for insert with check (public.has_company_role(company_id, array['owner','admin','editor']::public.company_role[]) and created_by = auth.uid());
create policy "editors can delete media assets" on public.media_assets for delete using (public.has_company_role(company_id, array['owner','admin','editor']::public.company_role[]));

create policy "company members can read social media objects" on storage.objects for select to authenticated using (
  bucket_id = 'social-media' and public.is_company_member(((storage.foldername(name))[1])::uuid)
);
create policy "company editors can upload social media objects" on storage.objects for insert to authenticated with check (
  bucket_id = 'social-media' and public.has_company_role(((storage.foldername(name))[1])::uuid, array['owner','admin','editor']::public.company_role[])
);
create policy "company editors can update social media objects" on storage.objects for update to authenticated using (
  bucket_id = 'social-media' and public.has_company_role(((storage.foldername(name))[1])::uuid, array['owner','admin','editor']::public.company_role[])
) with check (
  bucket_id = 'social-media' and public.has_company_role(((storage.foldername(name))[1])::uuid, array['owner','admin','editor']::public.company_role[])
);
create policy "company editors can delete social media objects" on storage.objects for delete to authenticated using (
  bucket_id = 'social-media' and public.has_company_role(((storage.foldername(name))[1])::uuid, array['owner','admin','editor']::public.company_role[])
);