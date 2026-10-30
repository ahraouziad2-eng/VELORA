/*
# Core: Profiles and User Roles

1. New Tables
- `profiles` — extends auth.users with full_name, phone, avatar_url, wilaya, commune, bio, experience, is_active, is_verified. PK = auth.users.id.
- `users_roles` — many-to-many roles per user (USER, LAND_OWNER, FARMER, INVESTOR, LEGAL_ADVISOR, ADMIN, SUPER_ADMIN).

2. Security
- RLS enabled on both tables.
- profiles: users can SELECT/UPDATE their own row; ADMIN/SUPER_ADMIN can SELECT all.
- users_roles: users can SELECT their own roles; only SUPER_ADMIN can INSERT/UPDATE/DELETE.

3. Notes
- `profiles.id` is FK to auth.users(id) ON DELETE CASCADE.
- `users_roles.user_id` is FK to auth.users(id) ON DELETE CASCADE.
- Helper functions: has_role, is_admin, is_super_admin.
- Auto-create profile + default role on signup via trigger.
- Auto-update updated_at on profiles.
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  avatar_url text,
  wilaya text,
  commune text,
  bio text,
  experience text,
  is_active boolean NOT NULL DEFAULT true,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Users roles table
CREATE TABLE IF NOT EXISTS public.users_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('USER', 'LAND_OWNER', 'FARMER', 'INVESTOR', 'LEGAL_ADVISOR', 'ADMIN', 'SUPER_ADMIN')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Helper: check if a user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(p_user_id uuid, p_role text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users_roles
    WHERE user_id = p_user_id AND role = p_role
  );
$$;

-- Helper: is current user admin or super_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users_roles
    WHERE user_id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
  );
$$;

-- Helper: is current user super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users_roles
    WHERE user_id = auth.uid() AND role = 'SUPER_ADMIN'
  );
$$;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_roles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
CREATE POLICY "select_own_profile" ON public.profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "select_all_profiles_admin" ON public.profiles;
CREATE POLICY "select_all_profiles_admin" ON public.profiles FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
CREATE POLICY "update_own_profile" ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Users roles policies
DROP POLICY IF EXISTS "select_own_roles" ON public.users_roles;
CREATE POLICY "select_own_roles" ON public.users_roles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_all_roles_admin" ON public.users_roles;
CREATE POLICY "select_all_roles_admin" ON public.users_roles FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "insert_role_super_admin" ON public.users_roles;
CREATE POLICY "insert_role_super_admin" ON public.users_roles FOR INSERT
  TO authenticated WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "update_role_super_admin" ON public.users_roles;
CREATE POLICY "update_role_super_admin" ON public.users_roles FOR UPDATE
  TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "delete_role_super_admin" ON public.users_roles;
CREATE POLICY "delete_role_super_admin" ON public.users_roles FOR DELETE
  TO authenticated USING (public.is_super_admin());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.users_roles (user_id, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'role', 'USER'))
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_roles_user_id ON public.users_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_users_roles_role ON public.users_roles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_wilaya ON public.profiles(wilaya);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
