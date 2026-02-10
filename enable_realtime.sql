-- Enable REPLICA IDENTITY FULL to ensure we get all data in updates
ALTER TABLE messages REPLICA IDENTITY FULL;

-- Add messages table to the supabase_realtime publication
-- This is often necessary if the table was created without enabling realtime explicitly
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table messages;
commit;

-- Verify it's added (you can run this part separately if you want to check)
select * from pg_publication_tables where pubname = 'supabase_realtime';
