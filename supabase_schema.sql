-- Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  birth_date date,
  music_preferences text[], -- Array of strings
  subscription_status text default 'free',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );
