-- 1. TABELA CHAT_ROOMS (Salas Privadas)
create table if not exists public.chat_rooms (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  emoji text,
  password text,
  created_by uuid references auth.users(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone default timezone('utc'::text, now() + interval '2 hours') not null
);

alter table public.chat_rooms enable row level security;

create policy "Rooms are viewable by everyone" on public.chat_rooms for select using (expires_at > now());
create policy "Users can create rooms" on public.chat_rooms for insert with check (auth.uid() = created_by);
create policy "Users can delete own rooms" on public.chat_rooms for delete using (auth.uid() = created_by);


-- 2. TABELA ROOM_MEMBERS (Membros de Salas Privadas)
create table if not exists public.room_members (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.chat_rooms(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(room_id, user_id)
);

alter table public.room_members enable row level security;

-- Função auxiliar para verificar membro (evita recursão infinita no RLS)
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

create policy "Users can join rooms" on public.room_members for insert with check (auth.uid() = user_id);
create policy "Members can view room members" on public.room_members for select using (public.is_member_of(room_id));


-- 3. TABELA MESSAGES (Mensagens e Doações)
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  user_id uuid references auth.users(id) not null,
  room_id uuid references public.chat_rooms(id) on delete cascade, -- NULL = Chat Geral
  user_meta jsonb, -- Cache para Nome e Avatar
  
  -- Colunas para Super Chat / Doações
  is_donation boolean default false,
  donation_amount decimal(10,2),
  status text check (status in ('PENDING', 'CONFIRMED')), -- PENDING = Aguardando Pagamento, CONFIRMED = Pago
  
  role_badge text default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.messages enable row level security;

-- Políticas de Mensagens:
-- Chat Geral (room_id NULL): Todos podem ver mensagens confirmadas ou normais
create policy "Public messages are viewable by everyone" on public.messages 
for select using (room_id is null);

-- Salas Privadas: Apenas membros podem ver
create policy "Private messages are viewable by members" on public.messages 
for select using (room_id is not null and public.is_member_of(room_id));

-- Inserir Mensagens: Usuário deve ser o autor
create policy "Users can insert messages" on public.messages 
for insert with check (auth.uid() = user_id);
