-- !!! WARNING: THIS SCRIPT WILL DELETE ALL EXISTING CHAT DATA !!!
-- Run this to reset the chat schema and apply the new expiration logic.

-- Drop existing tables to avoid conflicts
drop table if exists public.messages cascade;
drop table if exists public.room_members cascade;
drop table if exists public.chat_rooms cascade;

-- Create Chat Rooms table
create table public.chat_rooms (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  emoji text,
  password text, -- Optional: Plain text for simplicity in this demo, or hash it for security
  created_by uuid references auth.users(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone default timezone('utc'::text, now() + interval '2 hours') not null -- Auto-expire in 2 hours
);

-- Create Room Members table
create table public.room_members (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.chat_rooms(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(room_id, user_id)
);

-- Create Messages table
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  user_id uuid references auth.users(id) not null,
  room_id uuid references public.chat_rooms(id) on delete cascade, -- NULL means Public Chat
  stream_id uuid, -- Optional: to distinguish between different live streams
  user_meta jsonb, -- Cache user info (name, avatar) to avoid complex joins on read
  role_badge text default 'user', -- 'user', 'vip', 'admin', 'moderator'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for faster cleanup
create index idx_messages_created_at on public.messages(created_at);

-- Enable RLS
alter table public.chat_rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.messages enable row level security;

-- Helper function to check membership without recursion (Security Definer bypasses RLS)
create or replace function public.is_member_of(_room_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.room_members
    where room_id = _room_id
    and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- RLS Policies

-- Chat Rooms:
-- Anyone can view rooms (to join them), BUT ONLY IF NOT EXPIRED
create policy "Rooms are viewable by everyone" on public.chat_rooms for select using (expires_at > now());

-- Authenticated users can create rooms
create policy "Users can create rooms" on public.chat_rooms for insert with check (auth.uid() = created_by);

-- Room Members:
-- Members can view other members in their rooms (Uses function to avoid recursion)
create policy "Members can view room members" on public.room_members for select using (
  public.is_member_of(room_id)
);

-- Users can join rooms (insert themselves)
create policy "Users can join rooms" on public.room_members for insert with check (auth.uid() = user_id);

-- Messages:
-- Public messages (room_id is NULL) are viewable by everyone
create policy "Public messages are viewable by everyone" on public.messages for select using (room_id is null);

-- Private messages are viewable by room members
create policy "Private messages are viewable by members" on public.messages for select using (
  room_id is not null and
  public.is_member_of(room_id)
);

-- Users can insert messages ONLY IF ROOM IS NOT EXPIRED
create policy "Users can insert messages" on public.messages for insert with check (
  auth.uid() = user_id and
  (
    room_id is null or -- Public chat always allowed
    exists (
      select 1 from public.chat_rooms
      where id = room_id and expires_at > now()
    )
  )
);
