-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis SCHEMA extensions;

-- Create profiles table (CamelCase support)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    phone TEXT,
    role TEXT DEFAULT 'PASSENGER',
    "avatarUrl" TEXT,
    "documentId" TEXT,
    "isOnline" BOOLEAN DEFAULT FALSE,
    wallet JSONB DEFAULT '{"balance": 0, "transactions": []}'::jsonb,
    "savedPlaces" JSONB DEFAULT '[]'::jsonb,
    "favoriteDriverIds" JSONB DEFAULT '[]'::jsonb,
    verified BOOLEAN DEFAULT FALSE,
    vehicle JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "lastLocation" GEOGRAPHY(Point)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Public profiles are viewable by everyone') THEN
        CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile') THEN
        CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;

-- Create trips table
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    passenger_id UUID REFERENCES public.profiles(id),
    driver_id UUID REFERENCES public.profiles(id),
    status TEXT DEFAULT 'REQUESTED',
    origin TEXT,
    destination TEXT,
    "originCoords" GEOGRAPHY(Point),
    "destinationCoords" GEOGRAPHY(Point),
    "priceUsd" NUMERIC,
    "priceVes" NUMERIC,
    "distanceKm" NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trips' AND policyname = 'Users can CRUD own trips') THEN
        CREATE POLICY "Users can CRUD own trips" ON public.trips USING (auth.uid() = passenger_id OR auth.uid() = driver_id);
    END IF;
END $$;

-- Handle New User Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, phone, "avatarUrl", "documentId", wallet, "savedPlaces", "favoriteDriverIds", verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'Usuario Nuevo'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'PASSENGER'),
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatarUrl', ''),
    COALESCE(NEW.raw_user_meta_data->>'documentId', ''),
    '{"balance": 0, "transactions": []}'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    false
  );
  RETURN NEW;
END;
$function$;
