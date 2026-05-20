CREATE OR REPLACE FUNCTION public.is_admin(_email text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE email = _email
      AND (
        LOWER(role) IN ('admin', 'super admin', 'super_admin', 'superadmin')
        OR LOWER(account_type) IN ('admin', 'super admin', 'super_admin', 'superadmin')
      )
  )
$function$;