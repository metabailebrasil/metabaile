-- 1. UPDATING PROFILES (Table: User)
-- We use the existing 'profiles' table which maps to auth.users
-- Adding fields for Role, Ticket Expiration, and Stripe ID

alter table profiles 
add column if not exists role text default 'USER' check (role in ('USER', 'ADMIN')),
add column if not exists current_ticket_expires_at timestamp with time zone,
add column if not exists stripe_customer_id text;


-- 2. UPDATING EVENTS (Table: Event)
-- Adjusting 'events' table to match strict requirements

-- Rename sales_start_date to show_date_start if you prefer, or we just add the new column. 
-- For cleanliness, let's add the specific columns requested if they don't exist.
alter table events 
add column if not exists description text,
add column if not exists show_date_start timestamp with time zone,
add column if not exists cover_image_url text;

-- Ensure status is strict (we already have a check constraint from previous migration, but let's reinforce or ensure it covers these)
-- Previous constraint was: check (status in ('active', 'completed', 'draft'))
-- This matches the requirement ('DRAFT', 'ACTIVE', 'COMPLETED').

-- 3. CREATING PURCHASES (Table: Purchase)
create table if not exists purchases (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  event_id uuid references events(id) not null,
  stripe_session_id text,
  amount decimal(10,2),
  status text check (status in ('PAID', 'REFUNDED')),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS FOR PURCHASES
alter table purchases enable row level security;

-- Admin can see all purchases
create policy "Admins can view all purchases"
  on purchases for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() 
      and profiles.role = 'ADMIN'
    )
  );

-- Users can view their own purchases
create policy "Users can view own purchases"
  on purchases for select
  using (auth.uid() = user_id);
