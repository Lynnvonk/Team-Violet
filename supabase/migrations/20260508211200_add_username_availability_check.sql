create or replace function public.username_is_available(username_input text)
returns boolean
language plpgsql
security definer
set search_path = 'public', 'app_private'
as $$
declare
  clean_username text := app_private.normalize_username(username_input);
  exists_profile boolean;
begin
  if clean_username is null then
    return false;
  end if;

  select exists (
    select 1 from public.profiles p where lower(p.username) = clean_username
  ) into exists_profile;

  return not exists_profile;
end;
$$;

grant execute on function public.username_is_available(text) to anon, authenticated;
