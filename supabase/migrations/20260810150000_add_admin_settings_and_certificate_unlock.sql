ALTER TABLE public.enskripsyon
  ADD COLUMN IF NOT EXISTS certificate_unlocked boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.admin_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.admin_settings TO service_role;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  prompt text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.prompts TO service_role;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.jwenn_sertifika(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.enskripsyon;
BEGIN
  SELECT * INTO v_row FROM public.enskripsyon WHERE email = lower(trim(p_email));
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;
  IF NOT v_row.certificate_unlocked THEN
    RETURN jsonb_build_object(
      'status', 'locked',
      'full_name', v_row.full_name,
      'cert_lang', v_row.cert_lang,
      'verification_id', v_row.verification_id,
      'created_at', v_row.created_at
    );
  END IF;
  RETURN jsonb_build_object('status', 'ok', 'full_name', v_row.full_name,
    'cert_lang', v_row.cert_lang, 'verification_id', v_row.verification_id,
    'created_at', v_row.created_at, 'certificate_unlocked', v_row.certificate_unlocked);
END;
$$;

GRANT EXECUTE ON FUNCTION public.jwenn_sertifika(text) TO anon, authenticated;
