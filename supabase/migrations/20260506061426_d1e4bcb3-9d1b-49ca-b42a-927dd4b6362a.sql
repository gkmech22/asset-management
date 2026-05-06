
-- Helper: is_admin (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE email = _email
      AND (role = 'admin' OR role = 'super_admin' OR account_type = 'Admin' OR account_type = 'Super Admin')
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin(text) TO authenticated;

-- ============ users table ============
DROP POLICY IF EXISTS "Admin can manage users" ON public.users;

CREATE POLICY "Authenticated can view users"
ON public.users FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can insert users"
ON public.users FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.email()));

CREATE POLICY "Admins can update users"
ON public.users FOR UPDATE TO authenticated
USING (public.is_admin(auth.email()))
WITH CHECK (public.is_admin(auth.email()));

CREATE POLICY "Admins can delete users"
ON public.users FOR DELETE TO authenticated
USING (public.is_admin(auth.email()));

-- ============ history table ============
DROP POLICY IF EXISTS users_own_history ON public.history;

CREATE POLICY "history_select_auth"
ON public.history FOR SELECT TO authenticated
USING (true);

CREATE POLICY "history_insert_own"
ON public.history FOR INSERT TO authenticated
WITH CHECK (updated_by = auth.email());

CREATE POLICY "history_update_own"
ON public.history FOR UPDATE TO authenticated
USING (updated_by = auth.email())
WITH CHECK (updated_by = auth.email());

CREATE POLICY "history_delete_own_or_admin"
ON public.history FOR DELETE TO authenticated
USING (updated_by = auth.email() OR public.is_admin(auth.email()));

-- ============ devices table ============
DROP POLICY IF EXISTS users_own_devices ON public.devices;

CREATE POLICY "devices_select_auth"
ON public.devices FOR SELECT TO authenticated
USING (true);

CREATE POLICY "devices_insert_own"
ON public.devices FOR INSERT TO authenticated
WITH CHECK (created_by = auth.email());

CREATE POLICY "devices_update_own_or_admin"
ON public.devices FOR UPDATE TO authenticated
USING (created_by = auth.email() OR public.is_admin(auth.email()))
WITH CHECK (created_by = auth.email() OR public.is_admin(auth.email()));

CREATE POLICY "devices_delete_own_or_admin"
ON public.devices FOR DELETE TO authenticated
USING (created_by = auth.email() OR public.is_admin(auth.email()));

-- ============ asset_documents (replace permissive policies) ============
DROP POLICY IF EXISTS auth_view_documents ON public.asset_documents;
DROP POLICY IF EXISTS auth_insert_documents ON public.asset_documents;
DROP POLICY IF EXISTS auth_delete_documents ON public.asset_documents;

CREATE POLICY "docs_select_auth"
ON public.asset_documents FOR SELECT TO authenticated
USING (true);

CREATE POLICY "docs_insert_own"
ON public.asset_documents FOR INSERT TO authenticated
WITH CHECK (uploaded_by IS NULL OR uploaded_by = auth.email());

CREATE POLICY "docs_delete_own_or_admin"
ON public.asset_documents FOR DELETE TO authenticated
USING (uploaded_by = auth.email() OR public.is_admin(auth.email()));

-- ============ Function search_path hardening ============
ALTER FUNCTION public.stock_summary() SET search_path = public;
ALTER FUNCTION public.employee_summary() SET search_path = public;
ALTER FUNCTION public.log_asset_edit_history() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- Trigger function should not be callable directly
REVOKE EXECUTE ON FUNCTION public.log_asset_edit_history() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
