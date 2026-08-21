-- Make total spots and certificate emission configurable via admin_settings

-- Replace plas_ki_rete to read `total_spots` from admin_settings if present
CREATE OR REPLACE FUNCTION public.plas_ki_rete()
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_text text;
  v_total int := 200;
  v_count int;
BEGIN
  SELECT value INTO v_total_text FROM public.admin_settings WHERE key = 'total_spots' LIMIT 1;
  IF FOUND AND v_total_text IS NOT NULL THEN
    BEGIN
      v_total := GREATEST(0, (v_total_text::int));
    EXCEPTION WHEN others THEN
      v_total := 200;
    END;
  END IF;
  SELECT count(*)::int INTO v_count FROM public.enskripsyon;
  RETURN GREATEST(0, v_total - v_count);
END;
$$;

-- Update enskri_patisipan to use configured total_spots
CREATE OR REPLACE FUNCTION public.enskri_patisipan(
  p_full_name text,
  p_email text,
  p_whatsapp text,
  p_cert_lang text
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(trim(p_email));
  v_name text := trim(p_full_name);
  v_lang text := lower(coalesce(p_cert_lang, 'ht'));
  v_existing public.enskripsyon;
  v_code text;
  v_count int;
  v_total_text text;
  v_total int := 200;
BEGIN
  IF v_name = '' OR length(v_name) > 100 THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Non pa valid');
  END IF;
  IF v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR length(v_email) > 255 THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Imel pa valid');
  END IF;
  IF length(trim(p_whatsapp)) < 6 OR length(trim(p_whatsapp)) > 30 THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Nimewo WhatsApp pa valid');
  END IF;
  IF v_lang NOT IN ('ht', 'fr', 'es', 'en') THEN
    v_lang := 'ht';
  END IF;

  SELECT * INTO v_existing FROM public.enskripsyon WHERE email = v_email;
  IF FOUND THEN
    RETURN jsonb_build_object('status', 'already', 'verification_id', v_existing.verification_id,
      'full_name', v_existing.full_name, 'cert_lang', v_existing.cert_lang,
      'spots_left', public.plas_ki_rete());
  END IF;

  SELECT count(*)::int INTO v_count FROM public.enskripsyon;

  SELECT value INTO v_total_text FROM public.admin_settings WHERE key = 'total_spots' LIMIT 1;
  IF FOUND AND v_total_text IS NOT NULL THEN
    BEGIN
      v_total := GREATEST(0, (v_total_text::int));
    EXCEPTION WHEN others THEN
      v_total := 200;
    END;
  END IF;

  IF v_count >= v_total THEN
    RETURN jsonb_build_object('status', 'full', 'spots_left', 0);
  END IF;

  v_code := 'MAI-2026-' || upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 8));

  INSERT INTO public.enskripsyon (full_name, email, whatsapp, cert_lang, verification_id)
  VALUES (v_name, v_email, trim(p_whatsapp), v_lang, v_code);

  RETURN jsonb_build_object('status', 'ok', 'verification_id', v_code,
    'full_name', v_name, 'cert_lang', v_lang, 'spots_left', public.plas_ki_rete());
END;
$$;

-- Ensure execute permissions
GRANT EXECUTE ON FUNCTION public.plas_ki_rete() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enskri_patisipan(text, text, text, text) TO anon, authenticated;
