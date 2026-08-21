-- ============================================================
-- FUNCIÓN: verifye_sertifika() — Verificar certificado por código
-- ============================================================
CREATE OR REPLACE FUNCTION public.verifye_sertifika(p_verification_id text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.enskripsyon;
BEGIN
  SELECT * INTO v_row FROM public.enskripsyon
    WHERE upper(trim(verification_id)) = upper(trim(p_verification_id));
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
  RETURN jsonb_build_object(
    'status', 'valid',
    'full_name', v_row.full_name,
    'cert_lang', v_row.cert_lang,
    'verification_id', v_row.verification_id,
    'created_at', v_row.created_at,
    'certificate_unlocked', v_row.certificate_unlocked
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verifye_sertifika(text) TO anon, authenticated;
