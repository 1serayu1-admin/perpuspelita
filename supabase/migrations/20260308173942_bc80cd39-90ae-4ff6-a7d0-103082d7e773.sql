ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS ip_access_mode text NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS allowed_ips text[] NOT NULL DEFAULT '{}';