-- Revoke EXECUTE from PUBLIC on all SECURITY DEFINER functions
-- These are internal functions used by triggers and RLS policies, not callable via RPC
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(p_user_id uuid, p_role text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC;
