-- SCRIPT DE CORREÇÃO GERAL
-- Rode este arquivo COMPLETO para garantir que todas as tabelas existam.

-- 1. TABELA PROFILES (Perfis de Usuário)
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  birth_date date,
  music_preferences text[],
  subscription_status text default 'free',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Adiciona colunas novas na tabela Profiles (se não existirem)
do $$ 
begin
  alter table public.profiles add column role text default 'USER' check (role in ('USER', 'ADMIN'));
  exception when duplicate_column then null;
end $$;

do $$ 
begin
  alter table public.profiles add column current_ticket_expires_at timestamp with time zone;
  exception when duplicate_column then null;
end $$;

do $$ 
begin
  alter table public.profiles add column stripe_customer_id text;
  exception when duplicate_column then null;
end $$;

-- Segurança (RLS) para Profiles
alter table public.profiles enable row level security;

-- (Removemos políticas antigas para recriar e evitar erros)
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);

drop policy if exists "Users can insert their own profile." on public.profiles;
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile." on public.profiles;
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);


-- 2. TABELA EVENTS (Eventos)
create table if not exists public.events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  status text not null check (status in ('active', 'completed', 'draft')),
  sales_start_date timestamp with time zone,
  access_expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Adiciona colunas novas na tabela Events
do $$ 
begin
  alter table public.events add column description text;
  exception when duplicate_column then null;
end $$;

do $$ 
begin
  alter table public.events add column show_date_start timestamp with time zone;
  exception when duplicate_column then null;
end $$;

do $$ 
begin
  alter table public.events add column cover_image_url text;
  exception when duplicate_column then null;
end $$;

-- Segurança (RLS) para Events
alter table public.events enable row level security;

drop policy if exists "Public can view active events" on public.events;
create policy "Public can view active events" on public.events for select using (true);

drop policy if exists "Authenticated users can insert events" on public.events;
create policy "Authenticated users can insert events" on public.events for insert with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update events" on public.events;
create policy "Authenticated users can update events" on public.events for update using (auth.role() = 'authenticated');


-- 3. TABELA PURCHASES (Vendas)
create table if not exists public.purchases (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  event_id uuid references public.events(id) not null,
  stripe_session_id text,
  amount decimal(10,2),
  status text check (status in ('PAID', 'REFUNDED')),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Segurança (RLS) para Purchases
alter table public.purchases enable row level security;

drop policy if exists "Admins can view all purchases" on public.purchases;
create policy "Admins can view all purchases"
  on public.purchases for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() 
      and profiles.role = 'ADMIN'
    )
  );

drop policy if exists "Users can view own purchases" on public.purchases;
create policy "Users can view own purchases" on public.purchases for select using (auth.uid() = user_id);
