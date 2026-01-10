-- Enable PostGIS for location features
CREATE EXTENSION IF NOT EXISTS postgis;

-- 0. PUBLIC PROFILES (Base User Data)
-- Used by authService to store common data (name, avatar, role, phone)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    phone TEXT,
    role TEXT DEFAULT 'PASSENGER',
    avatarUrl TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    favoriteDriverIds TEXT[] DEFAULT '{}',
    location_permission TEXT
);

-- Trigger to auto-create profile on signup (Optional but recommended)
-- create function public.handle_new_user() returns trigger as $$
-- begin
--   insert into public.profiles (id, email, name)
--   values (new.id, new.email, new.raw_user_meta_data->>'name');
--   return new;
-- end;
-- $$ language plpgsql security definer;
-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute procedure public.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 1. PROFILES & USERS

-- Note: 'users' table is managed by Supabase Auth (auth.users). 
-- We'll use public profiles tables linked by user_id.

-- Passenger Profile
CREATE TABLE IF NOT EXISTS public.passenger_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    personalData JSONB DEFAULT '{}'::jsonb,
    photoProfile JSONB DEFAULT '{}'::jsonb,
    preferences JSONB DEFAULT '{}'::jsonb,
    security JSONB DEFAULT '{}'::jsonb,
    contactVerification JSONB DEFAULT '{}'::jsonb,
    profileCompleteness INTEGER DEFAULT 0,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Driver Profile
CREATE TABLE IF NOT EXISTS public.driver_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    personalData JSONB DEFAULT '{}'::jsonb,
    vehicle JSONB DEFAULT '{}'::jsonb,
    fiscalData JSONB DEFAULT '{}'::jsonb,
    bankingData JSONB DEFAULT '{}'::jsonb,
    documents JSONB DEFAULT '[]'::jsonb,
    auditLog JSONB DEFAULT '[]'::jsonb,
    pendingChanges JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TRIPS / RIDES
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    passenger_id UUID REFERENCES auth.users(id),
    driver_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'REQUESTED', -- REQUESTED, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED
    origin TEXT,
    destination TEXT,
    originCoords GEOGRAPHY(POINT),
    destinationCoords GEOGRAPHY(POINT),
    priceUsd NUMERIC,
    priceVes NUMERIC,
    distanceKm NUMERIC,
    serviceId TEXT,
    vehicleType TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. LOGS & AUDIT
CREATE TABLE IF NOT EXISTS public.recharge_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'VES', -- 'VES' or 'USD'
    reference_code TEXT,
    proof_url TEXT,
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_By UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.access_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    userId UUID REFERENCES auth.users(id),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    ipAddress TEXT,
    userAgent TEXT,
    browser TEXT,
    device TEXT,
    os TEXT,
    location TEXT,
    accessType TEXT,
    success BOOLEAN,
    failureReason TEXT
);

CREATE TABLE IF NOT EXISTS public.profile_changes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    userId UUID REFERENCES auth.users(id),
    changeType TEXT,
    fieldModified TEXT,
    oldValue JSONB,
    newValue JSONB,
    performedBy TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    verified BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.user_devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    userId UUID REFERENCES auth.users(id),
    deviceId TEXT,
    deviceName TEXT,
    deviceType TEXT,
    browser TEXT,
    os TEXT,
    ipAddress TEXT,
    lastAccessAt TIMESTAMPTZ,
    isActive BOOLEAN DEFAULT TRUE,
    sessionToken TEXT
);

-- 4. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('passenger-photos', 'passenger-photos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('driver-documents', 'driver-documents', false) ON CONFLICT (id) DO NOTHING;

-- Policies for storage
CREATE POLICY "Public Access Passenger Photos" ON storage.objects FOR SELECT USING (bucket_id = 'passenger-photos');
CREATE POLICY "Passenger Upload Own Photo" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'passenger-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Drivers Upload Own Docs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'driver-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Drivers Read Own Docs" ON storage.objects FOR SELECT USING (bucket_id = 'driver-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
ALTER TABLE public.passenger_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- Allow users to read/update their own profile
CREATE POLICY "Users can view own passenger profile" ON public.passenger_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own passenger profile" ON public.passenger_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Drivers can view own profile" ON public.driver_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Drivers can update own profile" ON public.driver_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Trips: Passengers can see their trips, Drivers can see their trips
CREATE POLICY "Passengers see own trips" ON public.trips FOR SELECT USING (auth.uid() = passenger_id);
CREATE POLICY "Drivers see assigned trips" ON public.trips FOR SELECT USING (auth.uid() = driver_id);
