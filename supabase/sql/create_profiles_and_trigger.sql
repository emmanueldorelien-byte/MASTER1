-- Idempotent creation of public.profiles, RLS policies, handle_new_user trigger
-- Run this in Supabase SQL editor. If you have the service_role connection string
-- you can also run via psql for owner changes.

-- 1) Create table if missing
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  whatsapp text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3) Grant service_role all privileges (best-effort - may fail if not privileged)
DO $$
BEGIN
  BEGIN
    EXECUTE 'GRANT ALL ON public.profiles TO service_role';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'GRANT ALL ON public.profiles TO service_role failed: %', SQLERRM;
  END;
END
$$;

-- 4) Grant authenticated minimal privileges (best-effort)
DO $$
BEGIN
  BEGIN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'GRANT to authenticated failed: %', SQLERRM;
  END;
END
$$;

-- 5) Create policies if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polrelid = 'public.profiles'::regclass AND polname = 'Users can view their own profile'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polrelid = 'public.profiles'::regclass AND polname = 'Users can insert their own profile'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polrelid = 'public.profiles'::regclass AND polname = 'Users can update their own profile'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id)';
  END IF;
END
$$;

-- 6) Create or replace the trigger function (SECURITY DEFINER so it can run with elevated rights)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7) Create trigger (drop existing with same name then create)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8) Create helper is_admin() function
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 9) Grant execute on functions (best-effort)
DO $$
BEGIN
  BEGIN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, service_role';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'GRANT EXECUTE on handle_new_user failed: %', SQLERRM;
  END;
  BEGIN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'GRANT EXECUTE on is_admin failed: %', SQLERRM;
  END;
END
$$;

-- Done. After running this script, try signing up again and check Auth logs if problems persist.
