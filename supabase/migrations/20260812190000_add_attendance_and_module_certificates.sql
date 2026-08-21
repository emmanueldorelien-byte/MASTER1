-- ============================================================
-- MIGRACIÓN: Sistema de Asistencia por Módulo + Certificados por Módulo
-- Fecha: 2026-08-12
-- ============================================================

-- 1. Tabla: attendance_codes (Códigos de asistencia que el admin genera por módulo)
CREATE TABLE IF NOT EXISTS public.attendance_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_attendance_codes_module ON public.attendance_codes(module_id);
CREATE INDEX IF NOT EXISTS idx_attendance_codes_code ON public.attendance_codes(code);

-- 2. Tabla: attendance_records (Asistencia registrada por cada usuario por módulo)
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  attendance_code_id uuid NOT NULL REFERENCES public.attendance_codes(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  verification_id text NOT NULL UNIQUE,
  marked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attendance_records_module ON public.attendance_records(module_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_email ON public.attendance_records(lower(trim(email)));
CREATE INDEX IF NOT EXISTS idx_attendance_records_vid ON public.attendance_records(verification_id);

-- Garantizar que un email no repita asistencia para el mismo módulo
CREATE UNIQUE INDEX IF NOT EXISTS uq_attendance_module_email
  ON public.attendance_records(module_id, lower(trim(email)));

-- ============================================================
-- FUNCIÓN RPC: marke_asistans() — Usuario marca asistencia
-- Retorna: status, verification_id, module_title, message
-- ============================================================
CREATE OR REPLACE FUNCTION public.marke_asistans(
  p_first_name text,
  p_last_name text,
  p_email text,
  p_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code public.attendance_codes;
  v_mod public.modules;
  v_exist public.attendance_records;
  v_vid text;
BEGIN
  v_code := NULL;
  SELECT * INTO v_code FROM public.attendance_codes
    WHERE upper(trim(code)) = upper(trim(p_code))
      AND (is_active = true)
      AND (expires_at IS NULL OR expires_at > now())
    LIMIT 1;
  IF v_code IS NULL THEN
    RETURN jsonb_build_object('status', 'invalid_code', 'message', 'Kòd asistans la pa valid oswa li ekspire.');
  END IF;

  SELECT * INTO v_mod FROM public.modules WHERE id = v_code.module_id;
  IF v_mod IS NULL THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Modil la pa egziste.');
  END IF;

  v_exist := NULL;
  SELECT * INTO v_exist FROM public.attendance_records
    WHERE module_id = v_code.module_id AND lower(trim(email)) = lower(trim(p_email));
  IF v_exist IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status', 'already',
      'message', 'Ou te deja make asistans pou modil sa a.',
      'verification_id', v_exist.verification_id,
      'module_title', v_mod.title
    );
  END IF;

  v_vid := 'MOD-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 8));

  BEGIN
    INSERT INTO public.attendance_records
      (module_id, attendance_code_id, first_name, last_name, email, verification_id)
      VALUES
      (v_code.module_id, v_code.id, trim(p_first_name), trim(p_last_name), trim(p_email), v_vid);
  EXCEPTION WHEN unique_violation THEN
    SELECT * INTO v_exist FROM public.attendance_records
      WHERE module_id = v_code.module_id AND lower(trim(email)) = lower(trim(p_email));
    IF v_exist IS NOT NULL THEN
      RETURN jsonb_build_object(
        'status', 'already',
        'message', 'Ou te deja make asistans pou modil sa a.',
        'verification_id', v_exist.verification_id,
        'module_title', v_mod.title
      );
    END IF;
    RAISE;
  END;

  RETURN jsonb_build_object(
    'status', 'ok',
    'message', 'Asistans make avèk siksè!',
    'verification_id', v_vid,
    'module_title', v_mod.title,
    'module_id', v_mod.id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.marke_asistans(text, text, text, text) TO anon, authenticated;

-- ============================================================
-- FUNCIÓN RPC: verifye_sertifika_modil() — Verificar certificado por módulo
-- Inputs: email, module_title (título del módulo, se busca por coincidencia)
-- ============================================================
CREATE OR REPLACE FUNCTION public.verifye_sertifika_modil(
  p_email text,
  p_module_title text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mod public.modules;
  v_rec public.attendance_records;
  v_email text;
BEGIN
  v_email := lower(trim(p_email));
  v_mod := NULL;

  SELECT * INTO v_mod FROM public.modules
    WHERE lower(trim(title)) = lower(trim(p_module_title))
    ORDER BY module_date DESC
    LIMIT 1;

  IF v_mod IS NULL THEN
    SELECT * INTO v_mod FROM public.modules
      WHERE lower(trim(title)) ILIKE '%' || lower(trim(p_module_title)) || '%'
      ORDER BY module_date DESC
      LIMIT 1;
  END IF;

  IF v_mod IS NULL THEN
    RETURN jsonb_build_object('status', 'module_not_found', 'message', 'Tit modil la pa jwenn nan baz done a.');
  END IF;

  SELECT * INTO v_rec FROM public.attendance_records
    WHERE module_id = v_mod.id AND lower(trim(email)) = v_email;

  IF v_rec IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'not_found',
      'message', 'Nou pa jwenn asistans pou imel sa a nan modil sa a.',
      'module_title', v_mod.title
    );
  END IF;

  RETURN jsonb_build_object(
    'status', 'ok',
    'full_name', (trim(v_rec.first_name) || ' ' || trim(v_rec.last_name)),
    'first_name', v_rec.first_name,
    'last_name', v_rec.last_name,
    'email', v_rec.email,
    'verification_id', v_rec.verification_id,
    'marked_at', v_rec.marked_at,
    'module_title', v_mod.title,
    'module_date', v_mod.module_date,
    'module_id', v_mod.id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verifye_sertifika_modil(text, text) TO anon, authenticated;

-- ============================================================
-- FUNCIÓN RPC: verifye_sertifika_modil_pa_kod() — Verificar por código único (para /verify)
-- ============================================================
CREATE OR REPLACE FUNCTION public.verifye_sertifika_modil_pa_kod(p_verification_id text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec public.attendance_records;
  v_mod public.modules;
BEGIN
  SELECT * INTO v_rec FROM public.attendance_records
    WHERE upper(trim(verification_id)) = upper(trim(p_verification_id));
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;

  SELECT * INTO v_mod FROM public.modules WHERE id = v_rec.module_id;

  RETURN jsonb_build_object(
    'status', 'valid',
    'type', 'module',
    'full_name', (trim(v_rec.first_name) || ' ' || trim(v_rec.last_name)),
    'email', v_rec.email,
    'verification_id', v_rec.verification_id,
    'marked_at', v_rec.marked_at,
    'module_title', COALESCE(v_mod.title, 'Modil'),
    'module_date', v_mod.module_date
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verifye_sertifika_modil_pa_kod(text) TO anon, authenticated;
