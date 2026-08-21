-- ============================================================
--  SCRIPT COMPLETO: BASE DE DATOS MASTERCLASS AI
--  Proyecto: Masterclass AI an Kreyòl
--  Uso: Ejecuta TODO este script en el SQL Editor de Supabase
--  de tu NUEVO proyecto.
-- ============================================================

-- ============================================================
-- 1. TABLA: enskripsyon (Inscripciones / Registros)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.enskripsyon (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  whatsapp text NOT NULL,
  cert_lang text NOT NULL DEFAULT 'ht',
  verification_id text NOT NULL UNIQUE,
  certificate_unlocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.enskripsyon ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.enskripsyon TO service_role;

-- ============================================================
-- 2. TABLA: admin_settings (Configuraciones del Admin)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.admin_settings TO service_role;

-- Valores por defecto (opcional, puedes cambiarlos luego en el panel admin)
INSERT INTO public.admin_settings (key, value) VALUES
  ('training_title', 'Masterclass AI an Kreyòl')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.admin_settings (key, value) VALUES
  ('total_spots', '200')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 3. TABLA: prompts (Prompts / Plantillas)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  prompt text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.prompts TO service_role;

-- Política RLS: los prompts son visibles para todo el mundo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polrelid = 'public.prompts'::regclass AND polname = 'Prompts are viewable by everyone'
  ) THEN
    CREATE POLICY "Prompts are viewable by everyone" ON public.prompts
      FOR SELECT USING (true);
  END IF;
END $$;

-- ============================================================
-- 4. TABLA: modules (Módulos / Clases de la formación)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  module_date timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.modules TO service_role;

-- Política RLS: los módulos son visibles para todo el mundo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polrelid = 'public.modules'::regclass AND polname = 'Modules are viewable by everyone'
  ) THEN
    CREATE POLICY "Modules are viewable by everyone" ON public.modules
      FOR SELECT USING (true);
  END IF;
END $$;

-- ============================================================
-- 5. FUNCIÓN: plas_ki_rete() — Cupos disponibles
-- ============================================================
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

GRANT EXECUTE ON FUNCTION public.plas_ki_rete() TO anon, authenticated;

-- ============================================================
-- 6. FUNCIÓN: enskri_patisipan() — Inscribir participante
-- ============================================================
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
  -- Validaciones
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

  -- ¿Ya está inscrito?
  SELECT * INTO v_existing FROM public.enskripsyon WHERE email = v_email;
  IF FOUND THEN
    RETURN jsonb_build_object('status', 'already', 'verification_id', v_existing.verification_id,
      'full_name', v_existing.full_name, 'cert_lang', v_existing.cert_lang,
      'spots_left', public.plas_ki_rete());
  END IF;

  -- Verificar cupos totales
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

  -- Generar código único
  v_code := 'MAI-2026-' || upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 8));

  -- Insertar
  INSERT INTO public.enskripsyon (full_name, email, whatsapp, cert_lang, verification_id)
  VALUES (v_name, v_email, trim(p_whatsapp), v_lang, v_code);

  RETURN jsonb_build_object('status', 'ok', 'verification_id', v_code,
    'full_name', v_name, 'cert_lang', v_lang, 'spots_left', public.plas_ki_rete());
END;
$$;

GRANT EXECUTE ON FUNCTION public.enskri_patisipan(text, text, text, text) TO anon, authenticated;

-- ============================================================
-- 7. FUNCIÓN: jwenn_sertifika() — Buscar certificado por email
-- ============================================================
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

-- ============================================================
-- 8. FUNCIÓN: module_is_completed() — Módulo completado?
-- ============================================================
CREATE OR REPLACE FUNCTION public.module_is_completed(p_module public.modules)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT p_module.module_date < now();
$$;

GRANT EXECUTE ON FUNCTION public.module_is_completed(public.modules) TO anon, authenticated;

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
-- 📝 Pasos siguientes:
-- 1. Copia este SCRIPT completo
-- 2. Abre: Supabase Dashboard → SQL Editor
-- 3. Pega y ejecuta (Run)
-- 4. ¡Listo! Ahora actualiza el archivo .env con tus nuevas keys
-- ============================================================
