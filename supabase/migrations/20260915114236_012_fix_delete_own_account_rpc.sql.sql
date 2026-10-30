-- Fix delete_own_account: auth.admin_delete_user does not exist in this instance.
-- Replace with a direct DELETE from auth.users, which cascades to all FK-linked data.
-- SECURITY DEFINER is required because authenticated users cannot DELETE from auth.users directly.
-- search_path set to 'auth, public' to prevent search_path injection.

CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_is_super_admin boolean := false;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Prevent SUPER_ADMIN from deleting their own account via this function
  SELECT EXISTS (
    SELECT 1 FROM public.users_roles
    WHERE user_id = v_uid AND role = 'SUPER_ADMIN'
  ) INTO v_is_super_admin;

  IF v_is_super_admin THEN
    RAISE EXCEPTION 'Super admin accounts cannot be deleted via self-service';
  END IF;

  -- Delete the auth user row; ON DELETE CASCADE on foreign keys removes all related data
  DELETE FROM auth.users WHERE id = v_uid;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_own_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;
