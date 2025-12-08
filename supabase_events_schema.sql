-- Create events table
create table events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  status text not null check (status in ('active', 'completed', 'draft')),
  sales_start_date timestamp with time zone,
  access_expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table events enable row level security;

-- Policies
create policy "Public can view active events"
  on events for select
  using (true);

create policy "Authenticated users can insert events"
  on events for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update events"
  on events for update
  using (auth.role() = 'authenticated');
