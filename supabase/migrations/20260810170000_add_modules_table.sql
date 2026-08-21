-- Modules table with date and auto-completed status
CREATE TABLE IF NOT EXISTS public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  module_date timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.modules TO service_role;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- Policy: allow read access for everyone
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polrelid = 'public.modules'::regclass AND polname = 'Modules are viewable by everyone'
  ) THEN
    CREATE POLICY "Modules are viewable by everyone" ON public.modules
      FOR SELECT USING (true);
  END IF;
END $$;

-- Function to check if module is completed (date has passed)
CREATE OR REPLACE FUNCTION public.module_is_completed(p_module public.modules)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT p_module.module_date < now();
$$;

GRANT EXECUTE ON FUNCTION public.module_is_completed(public.modules) TO anon, authenticated;
