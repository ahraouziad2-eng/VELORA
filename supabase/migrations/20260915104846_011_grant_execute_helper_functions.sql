-- Grant EXECUTE on helper functions to authenticated role
-- These are SECURITY DEFINER functions used in RLS policy definitions.
-- RLS policy expressions run with the querying role's privileges, so if
-- authenticated can't EXECUTE is_admin()/is_super_admin(), the policies
-- that reference them (e.g. select_own_profile) fail with 403.
-- The functions are SECURITY DEFINER so they run as the owner (postgres) internally;
-- the security is in the function body, not in the EXECUTE privilege.

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated;
