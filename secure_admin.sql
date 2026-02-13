-- Secure Admin Access Logic

-- 1. Enable RLS on events and playlist tables
alter table public.events enable row level security;
alter table public.playlist enable row level security;

-- 2. Clean up existing policies (to ensure clean slate)
drop policy if exists "Enable read access for all users" on public.events;
drop policy if exists "Enable write access for authenticated users" on public.events;
drop policy if exists "Enable read for all" on public.playlist;
drop policy if exists "Enable write for authenticated" on public.playlist;

-- 3. Create strict policies for EVENTS table

-- Allow everyone to view events (public)
create policy "Public view events"
  on public.events for select
  using ( true );

-- Allow ONLY the specific admin email to INSERT
create policy "Admin insert events"
  on public.events for insert
  with check ( auth.jwt() ->> 'email' = 'andinho@hotmail.com' );

-- Allow ONLY the specific admin email to UPDATE
create policy "Admin update events"
  on public.events for update
  using ( auth.jwt() ->> 'email' = 'andinho@hotmail.com' );

-- Allow ONLY the specific admin email to DELETE
create policy "Admin delete events"
  on public.events for delete
  using ( auth.jwt() ->> 'email' = 'andinho@hotmail.com' );


-- 4. Create strict policies for PLAYLIST table

-- Allow everyone to view playlist (public)
create policy "Public view playlist"
  on public.playlist for select
  using ( true );

-- Allow ONLY the specific admin email to modify playlist
create policy "Admin full access playlist"
  on public.playlist for all
  using ( auth.jwt() ->> 'email' = 'andinho@hotmail.com' )
  with check ( auth.jwt() ->> 'email' = 'andinho@hotmail.com' );
