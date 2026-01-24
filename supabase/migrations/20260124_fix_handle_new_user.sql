-- FIX: handle_new_user trigger
-- Optimization: Remove legacy JSONB wallet and add automatic SQL wallet creation

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- 1. Create Profile (Schema Unification: Removed JSONB wallet)
  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    role, 
    phone, 
    "avatarUrl", 
    "documentId", 
    "savedPlaces", 
    "favoriteDriverIds", 
    verified
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      (NEW.raw_user_meta_data->>'first_name') || ' ' || (NEW.raw_user_meta_data->>'last_name'),
      NEW.raw_user_meta_data->>'full_name', 
      NEW.raw_user_meta_data->>'name',
      'Usuario Nuevo'
    ),
    COALESCE(NEW.raw_user_meta_data->>'role', 'PASSENGER'),
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatarUrl', 'https://ui-avatars.com/api/?name=Usuario&background=random'),
    COALESCE(NEW.raw_user_meta_data->>'documentId', ''),
    '[]'::jsonb,
    '[]'::jsonb,
    false
  );

  -- 2. Create Wallet (SQL Table)
  -- This ensures compatibility with the new wallet system immediately upon registration
  INSERT INTO public.wallets (user_id, balance_ves, balance_usd, status)
  VALUES (NEW.id, 0, 0, 'active');

  RETURN NEW;
END;
$function$;
