-- Create 'avatars' bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Remove existing policies to avoid conflicts
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
drop policy if exists "Anyone can upload an avatar" on storage.objects;
drop policy if exists "Authenticated users can upload avatars" on storage.objects;
drop policy if exists "Users can update their own avatars" on storage.objects;
drop policy if exists "Users can delete their own avatars" on storage.objects;

-- Create policies

-- 1. Public read access
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- 2. Authenticated users can upload (insert)
create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

-- 3. Users can update/delete their own avatars
create policy "Users can update their own avatars"
  on storage.objects for update
  using ( bucket_id = 'avatars' and owner = auth.uid() )
  with check ( bucket_id = 'avatars' and owner = auth.uid() );

create policy "Users can delete their own avatars"
  on storage.objects for delete
  using ( bucket_id = 'avatars' and owner = auth.uid() );
