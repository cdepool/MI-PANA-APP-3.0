-- ============================================================================
-- MATCHING ENGINE - Database Schema Enhancement
-- MI PANA APP v3.0 - Sprint 1
-- Non-destructive: adds new columns/tables without modifying existing data
-- ============================================================================

-- ============================================================================
-- TABLE: driver_locations
-- Real-time driver positions for geospatial matching
-- ============================================================================
CREATE TABLE IF NOT EXISTS driver_locations (
  driver_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  location GEOGRAPHY(Point, 4326) NOT NULL,
  heading NUMERIC CHECK (heading >= 0 AND heading <= 360),
  speed_kmh NUMERIC DEFAULT 0,
  is_available BOOLEAN DEFAULT false,
  current_trip_id UUID REFERENCES trips(id),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spatial index for fast geospatial queries
CREATE INDEX IF NOT EXISTS idx_driver_locations_geog 
  ON driver_locations USING GIST(location);

-- Index for available drivers only (partial index for efficiency)
CREATE INDEX IF NOT EXISTS idx_driver_locations_available 
  ON driver_locations(is_available) 
  WHERE is_available = true;

-- Composite index for matching queries
CREATE INDEX IF NOT EXISTS idx_driver_locations_available_updated 
  ON driver_locations(is_available, last_updated DESC) 
  WHERE is_available = true;

COMMENT ON TABLE driver_locations IS 'Real-time driver positions for geospatial matching. Updated by driver devices.';

-- ============================================================================
-- TRIPS TABLE ENHANCEMENT
-- Add matching-related columns without altering existing structure
-- ============================================================================
ALTER TABLE trips ADD COLUMN IF NOT EXISTS matching_attempt INTEGER DEFAULT 0;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS matching_radius_km NUMERIC;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS matching_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS matching_completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS assigned_driver_ids UUID[] DEFAULT '{}';
ALTER TABLE trips ADD COLUMN IF NOT EXISTS rejected_driver_ids UUID[] DEFAULT '{}';

COMMENT ON COLUMN trips.matching_attempt IS 'Number of matching attempts (radius expansions)';
COMMENT ON COLUMN trips.matching_radius_km IS 'Current search radius in kilometers';
COMMENT ON COLUMN trips.assigned_driver_ids IS 'Drivers notified for this trip';
COMMENT ON COLUMN trips.rejected_driver_ids IS 'Drivers who rejected or timed out';

-- ============================================================================
-- FUNCTION: find_nearby_drivers
-- PostGIS-powered search for available drivers within radius
-- ============================================================================
CREATE OR REPLACE FUNCTION find_nearby_drivers(
  p_origin_lat NUMERIC,
  p_origin_lng NUMERIC,
  p_radius_km NUMERIC,
  p_vehicle_type TEXT DEFAULT NULL,
  p_exclude_drivers UUID[] DEFAULT '{}'
)
RETURNS TABLE(
  driver_id UUID,
  driver_name TEXT,
  distance_km NUMERIC,
  heading NUMERIC,
  rating NUMERIC,
  vehicle_info JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dl.driver_id,
    p.name::TEXT AS driver_name,
    ROUND((ST_Distance(
      dl.location,
      ST_SetSRID(ST_MakePoint(p_origin_lng, p_origin_lat), 4326)::geography
    ) / 1000)::NUMERIC, 2) AS distance_km,
    dl.heading,
    COALESCE(p.rating, 4.0)::NUMERIC AS rating,
    p.vehicle
  FROM driver_locations dl
  INNER JOIN profiles p ON p.id = dl.driver_id
  WHERE 
    dl.is_available = true
    AND dl.current_trip_id IS NULL
    AND p.role = 'DRIVER'
    AND dl.last_updated > NOW() - INTERVAL '5 minutes' -- Only recent positions
    AND ST_DWithin(
      dl.location,
      ST_SetSRID(ST_MakePoint(p_origin_lng, p_origin_lat), 4326)::geography,
      p_radius_km * 1000 -- Convert km to meters
    )
    AND (p_vehicle_type IS NULL OR (p.vehicle->>'type')::TEXT = p_vehicle_type)
    AND NOT (dl.driver_id = ANY(p_exclude_drivers))
  ORDER BY distance_km ASC
  LIMIT 10; -- Return max 10 candidates per radius
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION find_nearby_drivers IS 'Find available drivers within radius using PostGIS ST_DWithin';

-- ============================================================================
-- FUNCTION: update_driver_location
-- Atomic update of driver position with upsert
-- ============================================================================
CREATE OR REPLACE FUNCTION update_driver_location(
  p_driver_id UUID,
  p_lat NUMERIC,
  p_lng NUMERIC,
  p_heading NUMERIC DEFAULT NULL,
  p_speed_kmh NUMERIC DEFAULT NULL,
  p_is_available BOOLEAN DEFAULT NULL
)
RETURNS driver_locations AS $$
DECLARE
  v_result driver_locations;
BEGIN
  INSERT INTO driver_locations (
    driver_id,
    location,
    heading,
    speed_kmh,
    is_available,
    last_updated
  ) VALUES (
    p_driver_id,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    COALESCE(p_heading, 0),
    COALESCE(p_speed_kmh, 0),
    COALESCE(p_is_available, false),
    NOW()
  )
  ON CONFLICT (driver_id) DO UPDATE SET
    location = EXCLUDED.location,
    heading = COALESCE(EXCLUDED.heading, driver_locations.heading),
    speed_kmh = COALESCE(EXCLUDED.speed_kmh, driver_locations.speed_kmh),
    is_available = COALESCE(p_is_available, driver_locations.is_available),
    last_updated = NOW()
  RETURNING * INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_driver_location IS 'Atomic upsert of driver location with PostGIS point';

-- ============================================================================
-- FUNCTION: start_trip_matching
-- Initialize matching process for a trip request
-- ============================================================================
CREATE OR REPLACE FUNCTION start_trip_matching(p_trip_id UUID)
RETURNS trips AS $$
DECLARE
  v_trip trips;
BEGIN
  UPDATE trips
  SET 
    matching_attempt = 1,
    matching_radius_km = 1.0, -- Start with 1km
    matching_started_at = NOW(),
    status = 'MATCHING'
  WHERE id = p_trip_id
    AND status = 'REQUESTED'
  RETURNING * INTO v_trip;
  
  IF v_trip IS NULL THEN
    RAISE EXCEPTION 'Trip not found or not in REQUESTED status';
  END IF;
  
  RETURN v_trip;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: expand_matching_radius
-- Expand search radius for trip matching
-- ============================================================================
CREATE OR REPLACE FUNCTION expand_matching_radius(p_trip_id UUID)
RETURNS trips AS $$
DECLARE
  v_trip trips;
  v_new_radius NUMERIC;
  v_radii NUMERIC[] := ARRAY[1.0, 3.0, 5.0];
BEGIN
  SELECT * INTO v_trip FROM trips WHERE id = p_trip_id FOR UPDATE;
  
  IF v_trip IS NULL THEN
    RAISE EXCEPTION 'Trip not found';
  END IF;
  
  IF v_trip.matching_attempt >= array_length(v_radii, 1) THEN
    -- Max radius reached, mark as unassigned
    UPDATE trips
    SET 
      status = 'UNASSIGNED',
      matching_completed_at = NOW()
    WHERE id = p_trip_id
    RETURNING * INTO v_trip;
  ELSE
    -- Expand to next radius
    v_new_radius := v_radii[v_trip.matching_attempt + 1];
    
    UPDATE trips
    SET 
      matching_attempt = matching_attempt + 1,
      matching_radius_km = v_new_radius
    WHERE id = p_trip_id
    RETURNING * INTO v_trip;
  END IF;
  
  RETURN v_trip;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: assign_driver_to_trip
-- Driver accepts trip - atomic assignment
-- ============================================================================
CREATE OR REPLACE FUNCTION assign_driver_to_trip(
  p_trip_id UUID,
  p_driver_id UUID
)
RETURNS trips AS $$
DECLARE
  v_trip trips;
BEGIN
  -- Lock and verify trip is still assignable
  SELECT * INTO v_trip 
  FROM trips 
  WHERE id = p_trip_id 
    AND status IN ('REQUESTED', 'MATCHING')
    AND driver_id IS NULL
  FOR UPDATE;
  
  IF v_trip IS NULL THEN
    RAISE EXCEPTION 'Trip not available for assignment';
  END IF;
  
  -- Assign driver
  UPDATE trips
  SET 
    driver_id = p_driver_id,
    status = 'ACCEPTED',
    matching_completed_at = NOW()
  WHERE id = p_trip_id
  RETURNING * INTO v_trip;
  
  -- Mark driver as busy
  UPDATE driver_locations
  SET 
    is_available = false,
    current_trip_id = p_trip_id
  WHERE driver_id = p_driver_id;
  
  RETURN v_trip;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION assign_driver_to_trip IS 'Atomic driver-to-trip assignment with race condition protection';

-- ============================================================================
-- FUNCTION: reject_trip_assignment
-- Driver rejects or times out - add to rejected list
-- ============================================================================
CREATE OR REPLACE FUNCTION reject_trip_assignment(
  p_trip_id UUID,
  p_driver_id UUID
)
RETURNS trips AS $$
DECLARE
  v_trip trips;
BEGIN
  UPDATE trips
  SET 
    rejected_driver_ids = array_append(rejected_driver_ids, p_driver_id),
    assigned_driver_ids = array_remove(assigned_driver_ids, p_driver_id)
  WHERE id = p_trip_id
  RETURNING * INTO v_trip;
  
  RETURN v_trip;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;

-- Drivers can update their own location
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'driver_locations' AND policyname = 'Drivers update own location'
  ) THEN
    CREATE POLICY "Drivers update own location"
      ON driver_locations
      FOR ALL
      USING (auth.uid() = driver_id)
      WITH CHECK (auth.uid() = driver_id);
  END IF;
END $$;

-- Anyone authenticated can read driver locations (needed for passenger tracking)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'driver_locations' AND policyname = 'Authenticated users can read driver locations'
  ) THEN
    CREATE POLICY "Authenticated users can read driver locations"
      ON driver_locations
      FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- ============================================================================
-- TRIGGER: Auto-update last_updated timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_driver_location_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_driver_locations_updated ON driver_locations;
CREATE TRIGGER trg_driver_locations_updated
  BEFORE UPDATE ON driver_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_driver_location_timestamp();

-- ============================================================================
-- Grant execute permissions to authenticated users
-- ============================================================================
GRANT EXECUTE ON FUNCTION find_nearby_drivers TO authenticated;
GRANT EXECUTE ON FUNCTION update_driver_location TO authenticated;
GRANT EXECUTE ON FUNCTION start_trip_matching TO authenticated;
GRANT EXECUTE ON FUNCTION expand_matching_radius TO authenticated;
GRANT EXECUTE ON FUNCTION assign_driver_to_trip TO authenticated;
GRANT EXECUTE ON FUNCTION reject_trip_assignment TO authenticated;
