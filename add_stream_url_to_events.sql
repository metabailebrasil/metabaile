-- Add stream_url column to events table to allow dynamic stream links
ALTER TABLE events 
ADD COLUMN stream_url text;

-- Optional: Add a check constraint if we want to ensure it's a valid URL, 
-- but for flexibility (iframe codes vs raw URLs) we'll keep it as text for now.

-- Comment explaining the column
COMMENT ON COLUMN events.stream_url IS 'URL for the live stream embed (e.g. YouTube embed URL) or HLS source';
