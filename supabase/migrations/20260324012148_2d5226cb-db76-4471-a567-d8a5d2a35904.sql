
-- Fix overly permissive RLS policies on security_logs
DROP POLICY IF EXISTS "System can insert security logs" ON public.security_logs;
DROP POLICY IF EXISTS "Anon can insert security logs" ON public.security_logs;

-- Authenticated users can only insert logs for themselves
CREATE POLICY "Authenticated can insert own security logs" ON public.security_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Create a security definer function for edge functions to insert security logs
CREATE OR REPLACE FUNCTION public.insert_security_log(
  _user_email text,
  _ip_address text,
  _device_fingerprint text,
  _action text,
  _status text,
  _detail text,
  _school_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_logs (user_email, ip_address, device_fingerprint, action, status, detail, school_id)
  VALUES (_user_email, _ip_address, _device_fingerprint, _action, _status, _detail, _school_id);
END;
$$;
