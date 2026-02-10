-- Ensure events table has correct RLS policies for viewing
alter table public.events enable row level security;

-- Drop existing select policy to ensure we recreate it correctly
drop policy if exists "Public can view active events" on public.events;
drop policy if exists "Everyone can view active events" on public.events;
drop policy if exists "Public can view all events" on public.events;

-- Create the correct policy: Everyone (Anon + Auth) can view events
-- We use 'true' to be permissive, or we can restrict to status='active' if preferred.
-- Given the player query filters by status='active', allow reading all is fine, 
-- or we can strict it to status='active'.
-- Let's stick to the standard "Public can view active events" which is common.
-- BUT, Admin needs to see DRAFT/COMPLETED events too.
-- So we need two policies or one permissive one.

-- 1. Policy for Admins (Authenticated) to view ALL events
create policy "Authenticated users can view all events"
  on public.events for select
  using (auth.role() = 'authenticated');

-- 2. Policy for Public (Anon) to view ACTIVE events
create policy "Public can view active events"
  on public.events for select
  using (status = 'active');

-- Note: If you want Anon to also view the events in the player, they need this.
-- If the user is logged in, they match the 'Authenticated' policy.

-- (Removed unused stream_config policies)
