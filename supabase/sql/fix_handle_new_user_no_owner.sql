-- Safe version without ALTER OWNER/SET (for non-admin SQL editor sessions)
-- Run this in Supabase SQL editor if you cannot change function owner.

-- Re-create function as SECURITY DEFINER (idempotent)
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

-- Grant execute so it's callable (grant may require privileges; safe to run)
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- Optional checks:
-- SELECT proname, pg_get_userbyid(proowner) AS owner FROM pg_proc WHERE proname = 'handle_new_user';
-- SELECT polname, polcmd, polqual, polcheck FROM pg_policy WHERE polrelid = 'public.profiles'::regclass;

-- After running, try signing up again and check Auth logs if errors persist.
