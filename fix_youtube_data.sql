-- Fix bad data in events table (convert full URLs to IDs)
update public.events
set stream_url = substring(stream_url from 'v=([a-zA-Z0-9_-]{11})')
where stream_url like '%youtube.com/watch?v=%';

update public.events
set stream_url = substring(stream_url from 'youtu.be/([a-zA-Z0-9_-]{11})')
where stream_url like '%youtu.be/%';

-- Fix bad data in playlist table
update public.playlist
set video_id = substring(video_id from 'v=([a-zA-Z0-9_-]{11})')
where video_id like '%youtube.com/watch?v=%';

update public.playlist
set video_id = substring(video_id from 'youtu.be/([a-zA-Z0-9_-]{11})')
where video_id like '%youtu.be/%';
