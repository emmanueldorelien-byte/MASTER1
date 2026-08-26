-- Fix for handle_new_user trigger ownership / RLS issues
-- Run this in Supabase SQL editor for your project.
--
-- Purpose:
-- 1) Ensure the trigger function executes with the service_role privileges
-- 2) Set a safe search_path
-- 3) Recreate the SECURITY DEFINER function (no-op if identical)
-- 4) Grant execute to relevant roles

-- 1) Make the trigger function owned by service_role so it executes with elevated rights
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'handle_new_user' AND n.nspname = 'public') THEN
    EXECUTE 'ALTER FUNCTION public.handle_new_user() OWNER TO service_role';
  END IF;
END
$$;

-- 2) Ensure the function uses a safe search_path (avoids lookup issues)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'handle_new_user' AND n.nspname = 'public') THEN
    EXECUTE 'ALTER FUNCTION public.handle_new_user() SET search_path = ''public, pg_catalog''';
  END IF;
END
$$;

-- 3) Re-create function as SECURITY DEFINER (idempotent)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4) Grant execute to service_role and authenticated (trigger runs automatically, grant is precautionary)
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role, authenticated;

-- Optional checks (uncomment to run):
-- SELECT proname, pg_get_userbyid(proowner) AS owner FROM pg_proc WHERE proname = 'handle_new_user';
-- SELECT polname, polcmd, polqual, polcheck FROM pg_policy WHERE polrelid = 'public.profiles'::regclass;

-- After running, try signing up again. If errors persist, check Auth logs and the output of the optional checks above.
