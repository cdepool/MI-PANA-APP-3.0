-- Optimize trigger to handle metadata correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    role, 
    phone, 
    "avatarUrl", 
    "documentId", 
    wallet, 
    "savedPlaces", 
    "favoriteDriverIds", 
    verified
  )
  VALUES (
    NEW.id,
    NEW.email,
    -- Combine first_name + last_name from metadata, or fallback to full_name
    COALESCE(
      (NEW.raw_user_meta_data->>'first_name') || ' ' || (NEW.raw_user_meta_data->>'last_name'),
      NEW.raw_user_meta_data->>'full_name', 
      'Usuario Nuevo'
    ),
    COALESCE(NEW.raw_user_meta_data->>'role', 'PASSENGER'),
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''),
    -- Generate simple avatar if missing
    COALESCE(NEW.raw_user_meta_data->>'avatarUrl', 'https://ui-avatars.com/api/?name=Usuario&background=random'),
    COALESCE(NEW.raw_user_meta_data->>'documentId', ''),
    '{"balance": 0, "transactions": []}'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    false
  );
  RETURN NEW;
END;
$function$;
