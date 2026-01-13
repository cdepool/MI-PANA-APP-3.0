-- Create a function to find nearby requested rides
-- This uses the Haversine formula if PostGIS is not full enabled, or PostGIS if available.
-- For now, we will use a raw SQL calculation for compatibility unless we confirm PostGIS extension exists.
-- Supabase usually has PostGIS enabled by default in new projects, but let's be safe or check first.
-- We can add 'create extension if not exists postgis;'

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

create or replace function get_nearby_rides(
  user_lat float,
  user_lng float,
  radius_km float
)
returns table (
  id uuid,
  passenger_id uuid,
  origin text,
  destination text,
  origin_coords jsonb,
  destination_coords jsonb,
  price_usd float,
  distance_km float,
  status text,
  created_at timestamptz,
  service_id text,
  vehicle_type text
)
language plpgsql
security definer
as $$
begin
  return query
  select
    t.id,
    t.passenger_id,
    t.origin,
    t.destination,
    t.origin_coords,
    t.destination_coords,
    t.price_usd,
    t.distance_km,
    t.status,
    t.created_at,
    t.service_id,
    t.vehicle_type
  from
    trips t
  where
    t.status = 'REQUESTED'
    and (
      ST_DistanceSphere(
        ST_MakePoint((t.origin_coords->>'lng')::float, (t.origin_coords->>'lat')::float),
        ST_MakePoint(user_lng, user_lat)
      ) / 1000
    ) <= radius_km;
end;
$$;
