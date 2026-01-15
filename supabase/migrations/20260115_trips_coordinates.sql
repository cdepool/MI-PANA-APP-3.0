-- TRIPS TABLE - Add coordinate columns for matching
-- Non-destructive: adds new columns without modifying existing data

ALTER TABLE trips ADD COLUMN IF NOT EXISTS origin_lat NUMERIC;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS origin_lng NUMERIC;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS destination_lat NUMERIC;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS destination_lng NUMERIC;

COMMENT ON COLUMN trips.origin_lat IS 'Origin latitude for PostGIS matching';
COMMENT ON COLUMN trips.origin_lng IS 'Origin longitude for PostGIS matching';
COMMENT ON COLUMN trips.destination_lat IS 'Destination latitude';
COMMENT ON COLUMN trips.destination_lng IS 'Destination longitude';
