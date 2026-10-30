-- Revoke EXECUTE on helper functions that should only be used internally by RLS policies
-- These functions are SECURITY DEFINER and used in policy definitions, but should not be
-- directly callable via the REST API by authenticated users.

-- is_admin(), is_super_admin(), has_role() are used in RLS policy definitions
-- RLS policies run with the table owner's privileges, so they can still use these functions
-- even if EXECUTE is revoked from authenticated/anon.
-- delete_own_account() IS intended to be called by users via RPC, so we keep it.

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(p_user_id uuid, p_role text) FROM PUBLIC, authenticated, anon;

-- Keep delete_own_account callable since it's meant to be called by users
-- (it checks auth.uid() internally and only deletes the calling user's own account)
