
-- Fix handle_new_user to also save wilaya and commune from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, wilaya, commune)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'wilaya',
    NEW.raw_user_meta_data->>'commune'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    wilaya = COALESCE(EXCLUDED.wilaya, profiles.wilaya),
    commune = COALESCE(EXCLUDED.commune, profiles.commune);

  INSERT INTO public.users_roles (user_id, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'role', 'USER'))
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- Add INSERT policy for profiles so users can insert their own profile (needed if trigger hasn't fired yet)
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- Add profile photo storage bucket policies
-- Users can upload to their own profile-images path
-- Others can read profile images (they're public)

-- Ensure the is_admin and is_super_admin functions are properly granted
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated;
