-- SECURITY HARDENING PATCH (Step 1.1)

-- 1. Hardening Profiles
-- Drop permissive policy
drop policy "Public profiles are viewable by everyone." on profiles;

-- Create stricter policy: Only authenticated users
create policy "Authenticated users can view profiles." on profiles
  for select using (auth.role() = 'authenticated');

-- 2. Hardening Rides (Prevent Price Tampering)
-- Function to check excessive updates
create or replace function check_ride_update_permissions()
returns trigger as $$
begin
  -- Prevent changing price or distance after creation (unless admin)
  if (old.price is distinct from new.price) or (old.distance_km is distinct from new.distance_km) then
      if auth.jwt() ->> 'role' != 'service_role' then
          raise exception 'Modification of price/distance is not allowed.';
      end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger check_ride_price_update
before update on rides
for each row execute function check_ride_update_permissions();

-- 3. Hardening Drivers (Only Active Drivers visible to passengers)
drop policy "Drivers are viewable by everyone." on drivers;

create policy "Active drivers are viewable by everyone." on drivers
  for select using (is_active = true);
