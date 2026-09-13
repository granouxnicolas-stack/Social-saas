revoke all on function public.create_company(text, text) from public, anon;
revoke all on function public.is_company_member(uuid) from public, anon, authenticated;
revoke all on function public.has_company_role(uuid, public.company_role[]) from public, anon, authenticated;

grant execute on function public.create_company(text, text) to authenticated;
