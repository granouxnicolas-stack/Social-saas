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

-- Ordinary members may see connection metadata but tokens remain server-only.
create view public.social_account_connections
with (security_invoker = true)
as
select id, company_id, platform, provider_account_id, display_name, username,
       connection_status, token_expires_at, scopes, metadata, connected_by,
       created_at, updated_at
from public.social_accounts;

grant select on public.social_account_connections to authenticated;
revoke all on public.social_accounts from anon, authenticated;

-- Direct table access is reserved for service-role/server code so OAuth tokens are never exposed to browsers.
-- Membership metadata is exposed through the token-free view above and protected by this underlying RLS policy.
create policy "members can read social account metadata"
on public.social_accounts for select
using (public.is_company_member(company_id));

-- Service role bypasses RLS and performs OAuth connection writes from trusted server routes only.
