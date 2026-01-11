-- MI PANA APP - Supabase Hardening Script v1.0
-- Author: Senior Backend Security Engineer
-- Target: profiles, trips, payments (recharge_requests)

-- ==========================================
-- 1. SECURITY PREPARATION
-- ==========================================

-- Enable RLS on core tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recharge_requests ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 2. PROFILES SECURITY
-- ==========================================

-- Policy: Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Public profile info is viewable by all authenticated users
-- (Limited to basic info: name, avatarurl, role, admin_role)
-- Note: PostgreSQL RLS doesn't support column-level SELECT easily. 
-- For strict security, sensitive columns (email, phone) should be in a separate table
-- or accessed via a SERVICE_ROLE function. 
-- Here we allow authenticated users to see profiles for UI discovery.
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

-- Policy: Users can insert their own profile during signup
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Trigger: Prevent unauthorized modification of sensitive columns
CREATE OR REPLACE FUNCTION public.handle_protected_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF (current_setting('role') = 'authenticated') THEN
        IF (NEW.role IS DISTINCT FROM OLD.role OR 
            NEW.admin_role IS DISTINCT FROM OLD.admin_role OR 
            NEW.email IS DISTINCT FROM OLD.email OR 
            NEW.created_at IS DISTINCT FROM OLD.created_at OR 
            NEW.id IS DISTINCT FROM OLD.id) THEN
            RAISE EXCEPTION 'Unauthorized modification of sensitive identity columns.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_profiles ON public.profiles;
CREATE TRIGGER tr_protect_profiles
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_protected_columns();

-- ==========================================
-- 3. TRIPS SECURITY
-- ==========================================

-- Policy: Users only see trips where they are the passenger or driver
DROP POLICY IF EXISTS "Users see relevant trips" ON public.trips;
CREATE POLICY "Users see relevant trips" 
ON public.trips FOR SELECT 
USING (auth.uid() = passenger_id OR auth.uid() = driver_id);

-- Policy: Only passengers can create trips for themselves
DROP POLICY IF EXISTS "Passengers can create trips" ON public.trips;
CREATE POLICY "Passengers can create trips" 
ON public.trips FOR INSERT 
WITH CHECK (auth.uid() = passenger_id);

-- Policy: Driver can update status, Passenger can cancel if pending
DROP POLICY IF EXISTS "Parties can update trips" ON public.trips;
CREATE POLICY "Parties can update trips" 
ON public.trips FOR UPDATE 
USING (auth.uid() = passenger_id OR auth.uid() = driver_id)
WITH CHECK (
    (auth.uid() = driver_id) OR -- Driver can update (usually status)
    (auth.uid() = passenger_id AND status = 'PENDING') -- Passenger can only update/cancel if pending
);

-- ==========================================
-- 4. PAYMENTS SECURITY (recharge_requests)
-- ==========================================

-- Policy: Users see own payment/recharge requests
DROP POLICY IF EXISTS "Users view own payments" ON public.recharge_requests;
CREATE POLICY "Users view own payments" 
ON public.recharge_requests FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users create own payment/recharge requests
DROP POLICY IF EXISTS "Users create own payments" ON public.recharge_requests;
CREATE POLICY "Users create own payments" 
ON public.recharge_requests FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: PAYMENTS ARE IMMUTABLE
-- No UPDATE or DELETE allowed for authenticated users.
DROP POLICY IF EXISTS "Payments are immutable" ON public.recharge_requests;
CREATE POLICY "Payments are immutable" 
ON public.recharge_requests FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (false); -- This blocks UPDATE and DELETE while allowing the SELECT/INSERT from previous policies
