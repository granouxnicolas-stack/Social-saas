create type public.social_connection_status as enum ('pending','connected','expired','revoked','error');

create table public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  platform public.social_platform not null,
  provider_account_id text not null,
  display_name text,
  username text,
  connection_status public.social_connection_status not null default 'pending',
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  scopes text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  connected_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, platform, provider_account_id)
);

create index social_accounts_company_platform_idx on public.social_accounts(company_id, platform);
alter table public.social_accounts enable row level security;

-- OAuth secrets must never be selectable by browser clients.
revoke all on public.social_accounts from anon, authenticated;
grant select (
  id, company_id, platform, provider_account_id, display_name, username,
  connection_status, token_expires_at, scopes, metadata, connected_by,
  created_at, updated_at
) on public.social_accounts to authenticated;

create policy "members can read social account metadata"
on public.social_accounts for select
using (public.is_company_member(company_id));

-- OAuth connection writes and token reads are performed only by trusted server code/service role.
