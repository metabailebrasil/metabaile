
-- Add donation fields to messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_donation boolean DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS donation_amount numeric(10, 2);
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS donation_currency text DEFAULT 'BRL';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS status text DEFAULT 'CONFIRMED' CHECK (status IN ('PENDING', 'CONFIRMED'));
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS highlight_color text;

-- Create Donation Ranking table
CREATE TABLE IF NOT EXISTS public.donation_ranking (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid REFERENCES public.events(id),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  total_amount numeric(10, 2) DEFAULT 0,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(event_id, user_id)
);

-- Enable RLS for donation_ranking
ALTER TABLE public.donation_ranking ENABLE ROW LEVEL SECURITY;

-- Policies for donation_ranking
-- Everyone can view rankings
DROP POLICY IF EXISTS "Rankings are viewable by everyone" ON public.donation_ranking;
CREATE POLICY "Rankings are viewable by everyone" ON public.donation_ranking FOR SELECT USING (true);

-- Update Messages Policies to filter out PENDING donations
-- "Public messages are viewable by everyone"
DROP POLICY IF EXISTS "Public messages are viewable by everyone" ON public.messages;
CREATE POLICY "Public messages are viewable by everyone" ON public.messages
FOR SELECT USING (
  room_id IS NULL AND
  (is_donation = false OR status = 'CONFIRMED')
);

-- "Private messages are viewable by members"
DROP POLICY IF EXISTS "Private messages are viewable by members" ON public.messages;
CREATE POLICY "Private messages are viewable by members" ON public.messages
FOR SELECT USING (
  room_id IS NOT NULL AND
  public.is_member_of(room_id) AND
  (is_donation = false OR status = 'CONFIRMED')
);
