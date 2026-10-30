/*
# Add delete_own_account RPC function

1. Purpose
- Allows an authenticated user to permanently delete their own account.
- Deletes the auth.users row, which cascades to all related data via foreign key ON DELETE CASCADE.
- This is a SECURITY DEFINER function because the anon/authenticated role cannot delete from auth.users directly.

2. Security
- SECURITY DEFINER so it can call auth.admin_delete_user().
- Checks auth.uid() matches the account being deleted — a user can only delete their own account.
- EXECUTE granted to authenticated only.
- search_path set to 'auth, public' to prevent search_path injection.
*/

CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete the auth user — ON DELETE CASCADE on foreign keys removes all related data
  PERFORM auth.admin_delete_user(v_uid);
END;
$$;

REVOKE ALL ON FUNCTION public.delete_own_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;
