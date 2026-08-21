// ⚠️ ARCHIVO OBSOLETO / DEPRECATED ⚠️
// Usa `@/admin.functions.ts` en su lugar: tiene las mismas funciones +
// `requireAdmin()` nativo, códigos de asistencia, búsqueda de certificados
// y firma del admin. Este archivo se mantiene SOLO por compatibilidad
// histórica y NO debe importarse desde rutas/cliente.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Json } from "@/integrations/supabase/types";

// ============================================================
// SEGURIDAD SERVER-SIDE (idéntica a admin.functions.ts)
// NUNCA confíes en isAdmin del cliente.
// ============================================================
function getCookieHeader(): string | undefined {
  try {
    const g = globalThis as unknown as { __SSR_REQUEST__?: { headers?: Record<string, string> } };
    const h = g.__SSR_REQUEST__?.headers;
    if (h && typeof h === "object" && "cookie" in h) return String((h as any).cookie);
  } catch {
    return undefined;
  }
  return undefined;
}

async function requireAdmin(): Promise<{ user_id: string }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { createClient } = await import("@supabase/supabase-js");
  const SUPABASE_URL =
    (process.env["SUPABASE_URL"] as string | undefined) ??
    (globalThis as any).import_meta_env?.["VITE_SUPABASE_URL"];
  const SUPABASE_SERVICE_ROLE_KEY = process.env["SUPABASE_SERVICE_ROLE_KEY"] as string | undefined;
  const SUPABASE_PUBLISHABLE_KEY =
    (process.env["SUPABASE_PUBLISHABLE_KEY"] as string | undefined) ??
    (globalThis as any).import_meta_env?.["VITE_SUPABASE_PUBLISHABLE_KEY"];

  let userId: string | null = null;

  const cookieHeader = getCookieHeader();
  if (SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY) {
    try {
      const globalOpts: { headers?: Record<string, string> } = {};
      if (cookieHeader) globalOpts.headers = { Cookie: cookieHeader };
      const sb = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: globalOpts,
      });
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (user) userId = user.id;
    } catch {
      userId = null;
    }
  }

  if (!userId) {
    throw new Error("Ou pa konekte / No has iniciado sesión");
  }

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile || profile.role !== "admin") {
    throw new Error("Ou pa gen otorizasyon / No autorizado");
  }

  return { user_id: userId };
}

async function getSupabaseAdmin() {
  const mod = await import("@/integrations/supabase/client.server");
  return mod.supabaseAdmin;
}

const settingSchema = z.object({
  key: z.string(),
  value: z.string(),
});

const promptSchema = z.object({
  title: z.string().trim().min(1),
  prompt: z.string().trim().min(1),
});

const promptDeleteSchema = z.object({
  id: z.string().uuid(),
});

const moduleSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  module_date: z
    .string()
    .trim()
    .min(1)
    .refine((val) => !Number.isNaN(Date.parse(val)), { message: "Dat modil la pa valid." }),
  is_paid: z.boolean().optional().default(false),
  price: z.string().optional().default(""),
  payment_methods: z.array(z.string()).optional().default([]),
});

const moduleUpdateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  module_date: z
    .string()
    .trim()
    .min(1)
    .refine((val) => !Number.isNaN(Date.parse(val)), { message: "Dat modil la pa valid." }),
  is_paid: z.boolean().optional().default(false),
  price: z.string().optional().default(""),
  payment_methods: z.array(z.string()).optional().default([]),
});

const moduleDeleteSchema = z.object({
  id: z.string().uuid(),
});

const unlockByEmailSchema = z.object({
  email: z.string().trim().email(),
});

// 1 — getAdminData — requiere admin
export const getAdminData = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const supabaseAdmin = await getSupabaseAdmin();

  const { data: settings, error: settingsError } = await supabaseAdmin
    .from("admin_settings")
    .select("key, value, updated_at");
  if (settingsError) throw settingsError;

  const { data: prompts, error: promptsError } = await supabaseAdmin
    .from("prompts")
    .select("id, title, prompt, created_at, updated_at")
    .order("updated_at", { ascending: false });
  if (promptsError) throw promptsError;

  const { data: modules, error: modulesError } = await supabaseAdmin
    .from("modules")
    .select(
      "id, title, description, module_date, is_paid, price, payment_methods, created_at, updated_at",
    )
    .order("module_date", { ascending: true });
  if (modulesError) throw modulesError;

  const { data: enrolled, error: enrolledError } = await supabaseAdmin
    .from("enskripsyon")
    .select("id");
  if (enrolledError) throw enrolledError;

  const { data: unlocked, error: unlockedError } = await supabaseAdmin
    .from("enskripsyon")
    .select("id")
    .eq("certificate_unlocked", true);
  if (unlockedError) throw unlockedError;

  return {
    settings: settings ?? [],
    prompts: prompts ?? [],
    modules: modules ?? [],
    totalEnrollments: enrolled?.length ?? 0,
    totalUnlocked: unlocked?.length ?? 0,
  };
});

// getLiveData — PÚBLICO (no requiere admin), igual que en admin.functions.ts
export const getLiveData = createServerFn({ method: "GET" }).handler(async () => {
  const supabaseAdmin = await getSupabaseAdmin();

  const { data: settings, error: settingsError } = await supabaseAdmin
    .from("admin_settings")
    .select("key, value");
  if (settingsError) throw settingsError;

  const findSetting = (key: string) => settings?.find((s) => s.key === key)?.value ?? "";

  const { data: prompts, error: promptsError } = await supabaseAdmin
    .from("prompts")
    .select("id, title, prompt, created_at, updated_at")
    .order("updated_at", { ascending: false });
  if (promptsError) throw promptsError;

  const { data: modules, error: modulesError } = await supabaseAdmin
    .from("modules")
    .select(
      "id, title, description, module_date, is_paid, price, payment_methods, created_at, updated_at",
    )
    .order("module_date", { ascending: true });
  if (modulesError) throw modulesError;

  return {
    youtubeLink: findSetting("youtube_link") || null,
    trainingTitle: findSetting("training_title"),
    whatsappAdmin: findSetting("whatsapp_admin"),
    whatsappMessage: findSetting("whatsapp_message"),
    prompts: prompts ?? [],
    modules: modules ?? [],
  };
});

// 2 — updateAdminSetting — requiere admin
export const updateAdminSetting = createServerFn({ method: "POST" })
  .validator(settingSchema)
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabaseAdmin = await getSupabaseAdmin();
    const { error } = await supabaseAdmin.from("admin_settings").upsert(
      {
        key: data.key,
        value: data.value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );
    if (error) throw error;
    return { success: true };
  });

// 3 — unlockAllCertificates — requiere admin
export const unlockAllCertificates = createServerFn({ method: "POST" }).handler(async () => {
  await requireAdmin();
  const supabaseAdmin = await getSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from("enskripsyon")
    .update({ certificate_unlocked: true })
    .neq("certificate_unlocked", true);
  if (error) throw error;
  return { success: true };
});

// 4 — unlockCertificateByEmail — requiere admin
export const unlockCertificateByEmail = createServerFn({ method: "POST" })
  .validator(unlockByEmailSchema)
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabaseAdmin = await getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from("enskripsyon")
      .update({ certificate_unlocked: true })
      .eq("email", data.email.toLowerCase());
    if (error) throw error;
    return { success: true };
  });

// 5 — addPrompt — requiere admin
export const addPrompt = createServerFn({ method: "POST" })
  .validator(promptSchema)
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabaseAdmin = await getSupabaseAdmin();
    const { data: promptData, error } = await supabaseAdmin
      .from("prompts")
      .insert({ title: data.title, prompt: data.prompt })
      .select("id, title, prompt, created_at, updated_at")
      .single();
    if (error) throw error;
    return promptData;
  });

// 6 — deletePrompt — requiere admin
export const deletePrompt = createServerFn({ method: "POST" })
  .validator(promptDeleteSchema)
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabaseAdmin = await getSupabaseAdmin();
    const { error } = await supabaseAdmin.from("prompts").delete().eq("id", data.id);
    if (error) throw error;
    return { success: true };
  });

// 7 — addModule — requiere admin
export const addModule = createServerFn({ method: "POST" })
  .validator(moduleSchema)
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabaseAdmin = await getSupabaseAdmin();
    const { data: moduleData, error } = await supabaseAdmin
      .from("modules")
      .insert({
        title: data.title,
        description: data.description,
        module_date: data.module_date,
        is_paid: data.is_paid ?? false,
        price: data.price ?? "",
        payment_methods: (data.payment_methods ?? []) as unknown as Json,
      })
      .select(
        "id, title, description, module_date, is_paid, price, payment_methods, created_at, updated_at",
      )
      .single();
    if (error) throw error;
    return moduleData;
  });

// 8 — updateModule — requiere admin
export const updateModule = createServerFn({ method: "POST" })
  .validator(moduleUpdateSchema)
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabaseAdmin = await getSupabaseAdmin();
    const { data: moduleData, error } = await supabaseAdmin
      .from("modules")
      .update({
        title: data.title,
        description: data.description,
        module_date: data.module_date,
        is_paid: data.is_paid ?? false,
        price: data.price ?? "",
        payment_methods: (data.payment_methods ?? []) as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .select(
        "id, title, description, module_date, is_paid, price, payment_methods, created_at, updated_at",
      )
      .single();
    if (error) throw error;
    return moduleData;
  });

// 9 — deleteModule — requiere admin
export const deleteModule = createServerFn({ method: "POST" })
  .validator(moduleDeleteSchema)
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabaseAdmin = await getSupabaseAdmin();
    const { error } = await supabaseAdmin.from("modules").delete().eq("id", data.id);
    if (error) throw error;
    return { success: true };
  });
