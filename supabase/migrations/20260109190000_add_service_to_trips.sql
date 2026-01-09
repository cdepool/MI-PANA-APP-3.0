-- Add service_id and vehicle_type to trips table
ALTER TABLE public.trips 
ADD COLUMN IF NOT EXISTS "serviceId" TEXT,
ADD COLUMN IF NOT EXISTS "vehicleType" TEXT;

-- Verify policies (optional cleanup or validation)
DO $$ 
BEGIN
    -- Ensure RLS is enabled (should already be)
    ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
END $$;
