-- ============================================================
-- MIGRACIÓN: Precio + Métodos de Pago en módulos Premium
-- Fecha: 2026-08-12
-- ============================================================

-- 1. Columna price (precio del módulo, como texto para permitir monedas)
ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS price text DEFAULT '';

-- 2. Columna payment_methods (JSON array con los métodos aceptados)
--    Ejemplos: ["Moncash", "Natcash"]  /  ["PayPal", "Carte de Crédit"]
ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS payment_methods jsonb DEFAULT '[]'::jsonb;

-- Permisos siguen siendo los mismos (service_role ya tiene acceso).
