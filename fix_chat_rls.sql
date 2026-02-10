-- 1. Permitir que usuários atualizem status das próprias mensagens (para funcionar simulação)
create policy "Users can update own messages" on public.messages for update using (auth.uid() = user_id);

-- 2. Permitir que usuários deletem mensagens (para funcionar limpeza)
create policy "Users can delete own messages" on public.messages for delete using (auth.uid() = user_id);
