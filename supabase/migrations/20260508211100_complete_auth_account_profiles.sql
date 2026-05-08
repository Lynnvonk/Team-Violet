alter table public.profiles
  add column if not exists avatar_icon text not null default 'violet_flower',
  add column if not exists updated_at timestamptz not null default now();

update public.profiles
set avatar_icon = coalesce(nullif(avatar_icon, ''), 'violet_flower'),
    updated_at = coalesce(updated_at, now());

create or replace function app_private.set_profile_updated_at()
returns trigger
language plpgsql
set search_path = 'public', 'pg_temp'
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function app_private.set_profile_updated_at();

drop policy if exists "Users can delete their own profile" on public.profiles;
create policy "Users can delete their own profile"
on public.profiles
for delete
to authenticated
using (id = (select auth.uid()));

create or replace function app_private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = 'public', 'app_private'
as $$
declare
  metadata_username text := app_private.normalize_username(new.raw_user_meta_data ->> 'username');
  metadata_display_name text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'username')), '');
begin
  insert into public.profiles (id, display_name, username, email, avatar_icon)
  values (new.id, metadata_display_name, metadata_username, new.email, 'violet_flower')
  on conflict (id) do update
  set display_name = coalesce(excluded.display_name, public.profiles.display_name),
      username = coalesce(excluded.username, public.profiles.username),
      email = coalesce(excluded.email, public.profiles.email),
      avatar_icon = coalesce(public.profiles.avatar_icon, 'violet_flower');

  return new;
end;
$$;

create or replace function app_private.sync_profile_from_auth()
returns trigger
language plpgsql
security definer
set search_path = 'public', 'app_private', 'pg_temp'
as $$
declare
  metadata_username text := app_private.normalize_username(new.raw_user_meta_data ->> 'username');
  metadata_display_name text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'username')), '');
begin
  insert into public.profiles (id, email, display_name, username, avatar_icon)
  values (new.id, new.email, coalesce(metadata_display_name, new.email), metadata_username, 'violet_flower')
  on conflict (id) do update
  set email = excluded.email,
      display_name = coalesce(public.profiles.display_name, excluded.display_name),
      username = coalesce(public.profiles.username, excluded.username),
      avatar_icon = coalesce(public.profiles.avatar_icon, 'violet_flower');
  return new;
end;
$$;
