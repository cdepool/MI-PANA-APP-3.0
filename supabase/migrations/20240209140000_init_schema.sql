-- Create a table for public profiles
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  phone text,
  role text check (role in ('passenger', 'driver', 'admin')) default 'passenger',

  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Create a table for drivers
create table drivers (
  id uuid references profiles(id) on delete cascade not null primary key,
  vehicle_model text,
  vehicle_plate text,
  vehicle_color text,
  is_active boolean default false,
  -- Note: PostGIS extension is required for Geography type. 
  -- If not available, use simple floats for lat/lng or enable extension manually.
  -- current_location geography(Point), 
  current_lat float,
  current_lng float,
  rating numeric default 5.0,
  updated_at timestamp with time zone
);

alter table drivers enable row level security;

create policy "Drivers are viewable by everyone." on drivers
  for select using (true);

create policy "Drivers can update their own status." on drivers
  for update using (auth.uid() = id);

-- Create a table for rides
create table rides (
  id uuid default gen_random_uuid() primary key,
  passenger_id uuid references profiles(id) not null,
  driver_id uuid references drivers(id),
  status text check (status in ('searching', 'accepted', 'arriving', 'in_progress', 'completed', 'cancelled')) default 'searching',
  
  origin_lat float not null,
  origin_lng float not null,
  origin_address text,
  
  dest_lat float not null,
  dest_lng float not null,
  dest_address text,
  
  price numeric(10,2),
  distance_km numeric(10,2),
  duration_min numeric,
  
  vehicle_type text check (vehicle_type in ('car', 'moto')),
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table rides enable row level security;

-- Policies for Rides
create policy "Passengers can see their own rides." on rides
  for select using (auth.uid() = passenger_id);

create policy "Drivers can see available rides (searching) or their assigned rides." on rides
  for select using (
    (status = 'searching') or 
    (driver_id = auth.uid())
  );

create policy "Passengers can insert new rides." on rides
  for insert with check (auth.uid() = passenger_id);

create policy "Participants can update the ride." on rides
  for update using (
    auth.uid() = passenger_id or 
    auth.uid() = driver_id
  );

-- Realtime subscription setup (Optional, enables listening to changes)
alter publication supabase_realtime add table rides;
alter publication supabase_realtime add table drivers;
