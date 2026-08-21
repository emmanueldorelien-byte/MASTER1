-- ============================================================
-- MIGRACIÓN: Módulos Premium (is_paid) + WhatsApp Admin
-- Fecha: 2026-08-11
-- ============================================================

-- 1. Columna is_paid en modules (true = módulo pago/premium)
ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS is_paid boolean NOT NULL DEFAULT false;

-- 2. Admin setting: whatsapp_admin (número de WhatsApp del admin,
--    con formato internacional sin + ni espacios, ej: 50937123456)
INSERT INTO public.admin_settings (key, value)
VALUES ('whatsapp_admin', '')
ON CONFLICT (key) DO NOTHING;

-- 3. Admin setting: whatsapp_message (plantilla de mensaje pre-cargado)
INSERT INTO public.admin_settings (key, value)
VALUES ('whatsapp_message', 'Bonjou! Mwen ta renmen resevwa aksè a modil \"{MODULE_TITLE}\" nan Masterclass AI la. Tanpri di m ki pri a ak kijan pou m peye.')
ON CONFLICT (key) DO NOTHING;

-- Permisos siguen siendo los mismos (service_role ya tiene acceso).
