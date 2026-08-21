import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Tables } from "@/integrations/supabase/types";

// ============================================================
// SEGURIDAD: Helper de autenticación SERVER-SIDE
// NUNCA confíes en isAdmin del cliente; las funciones de server
// deben validar el rol contra la DB usando el JWT real.
//
// Obtiene el token de dos fuentes (en orden de prioridad):
//   1. Header "Authorization: Bearer <token>"  (llamadas cliente → serverFn)
//   2. Cookies del request via getRequest()    (SSR y server-side)
// ============================================================
async function requireAdmin(): Promise<{ user_id: string }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { createClient } = await import("@supabase/supabase-js");
  const SUPABASE_URL =
    (process.env["SUPABASE_URL"] as string | undefined) ??
    (globalThis as any).import_meta_env?.["VITE_SUPABASE_URL"];
  const SUPABASE_PUBLISHABLE_KEY =
    (process.env["SUPABASE_PUBLISHABLE_KEY"] as string | undefined) ??
    (globalThis as any).import_meta_env?.["VITE_SUPABASE_PUBLISHABLE_KEY"];

  let userId: string | null = null;
  let bearerToken: string | null = null;
  let cookieHeader: string | null = null;

  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();
    if (request?.headers) {
      const auth = request.headers.get("authorization");
      if (auth && auth.startsWith("Bearer ")) {
        bearerToken = auth.slice("Bearer ".length);
      }
      const cookie = request.headers.get("cookie");
      if (cookie) cookieHeader = cookie;
    }
  } catch {
    // getRequest() no disponible (contexto cliente o edge)
  }

  // Fallback SSR antiguo por compatibilidad
  if (!cookieHeader) {
    try {
      const g = globalThis as unknown as { __SSR_REQUEST__?: { headers?: Record<string, string> } };
      const h = g.__SSR_REQUEST__?.headers;
      if (h && typeof h === "object" && "cookie" in h) cookieHeader = String((h as any).cookie);
    } catch {
      // ignora
    }
  }

  if (SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY) {
    try {
      const headers: Record<string, string> = {};
      if (cookieHeader) headers["Cookie"] = cookieHeader;
      if (bearerToken) headers["Authorization"] = `Bearer ${bearerToken}`;

      const sb = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers },
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

export type AdminSettingRow = { key: string; value: string; updated_at: string };
export type ModuleRow = Tables<"modules">;

export type AttendanceCodeRow = Tables<"attendance_codes">;
export type AttendanceRecordRow = Tables<"attendance_records">;

export type AdminDataResponse = {
  settings: AdminSettingRow[];
  modules: ModuleRow[];
  attendanceCodes: AttendanceCodeRow[];
  attendanceRecords: (AttendanceRecordRow & { module_title?: string })[];
  totalEnrollments: number;
  totalUnlocked: number;
};

export type LiveDataResponse = {
  youtubeLink: string | null;
  modules: ModuleRow[];
  totalSpots: number;
  certificateEmissionDate: string | null;
  eventDate: string | null;
  trainingTitle: string | null;
  whatsappAdmin: string | null;
  whatsappMessage: string | null;
  resourceGuideUrl: string | null;
  resourceCodeUrl: string | null;
  _debug?: string[];
};

const settingSchema = z.object({
  key: z.string(),
  value: z.string(),
});

const moduleSchema = z.object({
  title: z.string().trim().min(1, { message: "Tit modil la obligatwa." }),
  description: z.string().trim().min(1, { message: "Deskripsyon modil la obligatwa." }),
  module_date: z
    .string()
    .trim()
    .min(1, { message: "Dat modil la obligatwa." })
    .refine(
      (val) => {
        const parsed = Date.parse(val);
        return !Number.isNaN(parsed);
      },
      { message: "Dat modil la pa valid." },
    ),
  is_paid: z.boolean().optional().default(false),
  price: z.string().optional().default(""),
  payment_methods: z.array(z.string()).optional().default([]),
});

const moduleUpdateSchema = z.object({
  id: z.string().uuid({ message: "ID modil la pa valid." }),
  title: z.string().trim().min(1, { message: "Tit modil la obligatwa." }),
  description: z.string().trim().min(1, { message: "Deskripsyon modil la obligatwa." }),
  module_date: z
    .string()
    .trim()
    .min(1, { message: "Dat modil la obligatwa." })
    .refine(
      (val) => {
        const parsed = Date.parse(val);
        return !Number.isNaN(parsed);
      },
      { message: "Dat modil la pa valid." },
    ),
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

export const getAdminData = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminDataResponse> => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: settings, error: settingsError } = await supabaseAdmin
      .from("admin_settings")
      .select("key, value, updated_at");
    if (settingsError) throw settingsError;

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

    const { data: attendanceCodes, error: acError } = await supabaseAdmin
      .from("attendance_codes")
      .select("*")
      .order("created_at", { ascending: false });
    if (acError) {
      console.warn("[admin] attendance_codes table not yet migrated:", acError.message);
    }

    let attendanceRecords: any[] = [];
    try {
      const { data: arData, error: arError } = await supabaseAdmin
        .from("attendance_records")
        .select("*, modules(title)")
        .order("marked_at", { ascending: false });
      if (!arError && arData) {
        attendanceRecords = arData.map((r: any) => ({
          ...r,
          module_title: (r as any).modules?.title,
        }));
      }
    } catch (arErr: any) {
      console.warn("[admin] attendance_records table not yet migrated:", arErr?.message);
    }

    return {
      settings: (settings ?? []) as AdminSettingRow[],
      modules: (modules ?? []) as ModuleRow[],
      attendanceCodes: (attendanceCodes ?? []) as AttendanceCodeRow[],
      attendanceRecords: attendanceRecords as any,
      totalEnrollments: enrolled?.length ?? 0,
      totalUnlocked: unlocked?.length ?? 0,
    };
  },
);

export const getLiveData = createServerFn({ method: "GET" }).handler(
  async (): Promise<LiveDataResponse> => {
    const FALLBACK: LiveDataResponse = {
      youtubeLink: null,
      modules: [],
      totalSpots: 200,
      certificateEmissionDate: null,
      eventDate: null,
      trainingTitle: null,
      whatsappAdmin: null,
      whatsappMessage: null,
      resourceGuideUrl: null,
      resourceCodeUrl: null,
      _debug: [],
    };
    const debug: string[] = [];
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const SUPABASE_URL = process.env["SUPABASE_URL"];
      const SUPABASE_SERVICE_ROLE_KEY = process.env["SUPABASE_SERVICE_ROLE_KEY"];
      if (!SUPABASE_URL) debug.push("[ENV] SUPABASE_URL is NOT defined in process.env");
      if (!SUPABASE_SERVICE_ROLE_KEY)
        debug.push("[ENV] SUPABASE_SERVICE_ROLE_KEY is NOT defined in process.env");
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
        debug.push(
          `[ENV] SUPABASE_URL=${SUPABASE_URL.slice(0, 20)}... / service_role key prefix: ${SUPABASE_SERVICE_ROLE_KEY.slice(0, 10)}...`,
        );

      const { data: settings, error: settingsError } = await supabaseAdmin
        .from("admin_settings")
        .select("key, value");
      if (settingsError) {
        debug.push(
          `[DB admin_settings] ERROR code=${settingsError.code} message=${settingsError.message} hint=${settingsError.hint ?? ""} details=${settingsError.details ?? ""}`,
        );
        console.warn("[getLiveData] admin_settings failed:", settingsError.message);
        return { ...FALLBACK, _debug: debug };
      }
      debug.push(`[DB admin_settings] OK rows=${settings?.length ?? 0}`);

      const { data: modules, error: modulesError } = await supabaseAdmin
        .from("modules")
        .select(
          "id, title, description, module_date, is_paid, price, payment_methods, created_at, updated_at",
        )
        .order("module_date", { ascending: true });
      if (modulesError) {
        debug.push(
          `[DB modules] ERROR code=${modulesError.code} message=${modulesError.message} hint=${modulesError.hint ?? ""} details=${modulesError.details ?? ""}`,
        );
        console.warn("[getLiveData] modules failed:", modulesError.message);
        return { ...FALLBACK, _debug: debug };
      }
      debug.push(`[DB modules] OK rows=${modules?.length ?? 0}`);

      const map = new Map<string, string>();
      for (const s of settings ?? []) map.set(s.key, s.value);

      return {
        youtubeLink: map.get("youtube_link") ?? null,
        modules: (modules ?? []) as ModuleRow[],
        totalSpots: map.has("total_spots")
          ? parseInt(map.get("total_spots") as string, 10) || 200
          : 200,
        certificateEmissionDate: map.get("certificate_emission_date") ?? null,
        eventDate: map.get("event_date") ?? null,
        trainingTitle: map.get("training_title") ?? null,
        whatsappAdmin: map.get("whatsapp_admin") ?? null,
        whatsappMessage: map.get("whatsapp_message") ?? null,
        resourceGuideUrl: map.get("resource_guide_url") ?? null,
        resourceCodeUrl: map.get("resource_code_url") ?? null,
        _debug: debug,
      };
    } catch (err: any) {
      debug.push(
        `[EXCEPTION] ${err?.name ?? "Error"}: ${err?.message ?? String(err)}. Stack-first: ${(err?.stack ?? "").split("\n")[0] ?? ""}`,
      );
      console.warn(
        "[getLiveData] Supabase not available (env vars missing?). Returning fallback.",
        err?.message ?? err,
      );
      return { ...FALLBACK, _debug: debug };
    }
  },
);

export const updateAdminSetting = createServerFn({ method: "POST" })
  .validator(settingSchema)
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin.from("admin_settings").upsert(
      {
        key: data.key,
        value: data.value,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "key",
      },
    );
    if (error) throw error;
    return { success: true };
  });

export const unlockAllCertificates = createServerFn({ method: "POST" }).handler(async () => {
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { error } = await supabaseAdmin
    .from("enskripsyon")
    .update({ certificate_unlocked: true })
    .neq("certificate_unlocked", true);
  if (error) throw error;
  return { success: true };
});

export const unlockCertificateByEmail = createServerFn({ method: "POST" })
  .validator(unlockByEmailSchema)
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("enskripsyon")
      .update({ certificate_unlocked: true })
      .eq("email", data.email.toLowerCase());
    if (error) throw error;
    return { success: true };
  });

export const addModule = createServerFn({ method: "POST" })
  .validator(moduleSchema)
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: moduleData, error } = await supabaseAdmin
      .from("modules")
      .insert({
        title: data.title,
        description: data.description,
        module_date: data.module_date,
        is_paid: data.is_paid ?? false,
        price: data.price ?? "",
        payment_methods: data.payment_methods ?? [],
      })
      .select(
        "id, title, description, module_date, is_paid, price, payment_methods, created_at, updated_at",
      )
      .single();
    if (error) throw error;
    return moduleData;
  });

export const updateModule = createServerFn({ method: "POST" })
  .validator(moduleUpdateSchema)
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: moduleData, error } = await supabaseAdmin
      .from("modules")
      .update({
        title: data.title,
        description: data.description,
        module_date: data.module_date,
        is_paid: data.is_paid ?? false,
        price: data.price ?? "",
        payment_methods: data.payment_methods ?? [],
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

export const deleteModule = createServerFn({ method: "POST" })
  .validator(moduleDeleteSchema)
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin.from("modules").delete().eq("id", data.id);
    if (error) throw error;
    return { success: true };
  });

const toggleAttendanceCodeSchema = z.object({
  id: z.string().uuid(),
  is_active: z.boolean(),
});

const deleteAttendanceCodeSchema = z.object({
  id: z.string().uuid(),
});

function randomAttendanceCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += letters[Math.floor(Math.random() * letters.length)];
  return `${s.slice(0, 4)}-${s.slice(4, 8)}`;
}

export const createAttendanceCode = createServerFn({ method: "POST" })
  .validator(
    z.object({
      module_id: z.string().uuid({ message: "ID modil la pa valid." }),
      code: z.string().trim().min(1).max(50).optional(),
      expires_at: z.string().trim().optional().nullable(),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = (data.code && data.code.trim()) || randomAttendanceCode();
    const isoExpiry =
      data.expires_at && data.expires_at.trim() ? new Date(data.expires_at).toISOString() : null;

    const { data: row, error } = await supabaseAdmin
      .from("attendance_codes")
      .insert({
        module_id: data.module_id,
        code: code.toUpperCase(),
        expires_at: isoExpiry,
        is_active: true,
      })
      .select("*")
      .single();
    if (error) throw error;
    return row as AttendanceCodeRow;
  });

export const toggleAttendanceCode = createServerFn({ method: "POST" })
  .validator(toggleAttendanceCodeSchema)
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("attendance_codes")
      .update({ is_active: data.is_active })
      .eq("id", data.id);
    if (error) throw error;
    return { success: true };
  });

export const deleteAttendanceCode = createServerFn({ method: "POST" })
  .validator(deleteAttendanceCodeSchema)
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("attendance_codes").delete().eq("id", data.id);
    if (error) throw error;
    return { success: true };
  });

function randomCertificateId(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += letters[Math.floor(Math.random() * letters.length)];
  const date = new Date();
  const year = date.getFullYear();
  return `MAI-${year}-${s.slice(0, 4)}-${s.slice(4, 8)}`;
}

export type MarkAttendanceResult = {
  status: "ok" | "already" | "invalid_code" | "expired" | "inactive" | "error";
  message?: string;
  verification_id?: string;
  module_title?: string;
  module_id?: string;
};

export const markAttendance = createServerFn({ method: "POST" })
  .validator(
    z.object({
      first_name: z.string().trim().min(2, { message: "Non ou dwe gen omwen 2 karaktè." }).max(100),
      last_name: z
        .string()
        .trim()
        .min(2, { message: "Non fanmi ou dwe gen omwen 2 karaktè." })
        .max(100),
      email: z.string().trim().email({ message: "Imel la pa valid." }).max(255),
      code: z.string().trim().min(4, { message: "Kòd la dwe gen omwen 4 karaktè." }).max(50),
    }),
  )
  .handler(async ({ data }): Promise<MarkAttendanceResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const codeUpper = data.code.toUpperCase();

    const { data: codeRow, error: codeError } = await supabaseAdmin
      .from("attendance_codes")
      .select("*")
      .eq("code", codeUpper)
      .limit(1)
      .maybeSingle();

    if (codeError) {
      console.error("[attendance] code lookup error:", codeError);
      return { status: "error", message: "Erè sistèm. Eseye ankò." };
    }
    if (!codeRow) {
      return { status: "invalid_code", message: "Kòd asistans sa a pa egziste." };
    }
    if (!codeRow.is_active) {
      return { status: "inactive", message: "Kòd asistans sa a poko aktif oswa fèm." };
    }
    if (codeRow.expires_at && new Date(codeRow.expires_at) < new Date()) {
      return { status: "expired", message: "Kòd asistans sa a ekspire dejà." };
    }

    const normalizedEmail = data.email.toLowerCase();

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("attendance_records")
      .select("id, verification_id")
      .eq("module_id", codeRow.module_id)
      .eq("email", normalizedEmail)
      .limit(1)
      .maybeSingle();
    if (existingError) console.warn("[attendance] existing check error:", existingError);

    if (existing) {
      return {
        status: "already",
        message: "Ou te deja make asistans pou modil sa a.",
        verification_id: existing.verification_id,
        module_id: codeRow.module_id,
      };
    }

    const verificationId = randomCertificateId();

    const { error: insertError } = await supabaseAdmin.from("attendance_records").insert({
      module_id: codeRow.module_id,
      attendance_code_id: codeRow.id,
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      email: normalizedEmail,
      verification_id: verificationId,
    });
    if (insertError) {
      console.error("[attendance] insert error:", insertError);
      return { status: "error", message: "Pa t posib sove asistans la. Eseye ankò." };
    }

    const { data: modRow, error: modErr } = await supabaseAdmin
      .from("modules")
      .select("title")
      .eq("id", codeRow.module_id)
      .limit(1)
      .maybeSingle();
    const moduleTitle = modErr ? undefined : modRow?.title;

    return {
      status: "ok",
      verification_id: verificationId,
      module_id: codeRow.module_id,
      ...(moduleTitle ? { module_title: moduleTitle } : {}),
      message: `Asistans make avèk siksè. Kòd sètifika ou: ${verificationId}`,
    };
  });

export type CertificateLookupResult = {
  status: "ok" | "not_found" | "mismatch" | "error";
  message?: string;
  full_name?: string;
  cert_lang?: CertLang;
  verification_id?: string;
  created_at?: string;
  module_title?: string;
  module_id?: string;
  certificate_unlocked?: boolean;
};

export type CertLang = "ht" | "fr" | "es" | "en";

export const findCertificateByEmailAndTitle = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string().trim().email().max(255),
      course_title: z.string().trim().min(1, { message: "Tit fòmasyon an obligatwa." }).max(300),
    }),
  )
  .handler(async ({ data }): Promise<CertificateLookupResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const normalizedEmail = data.email.toLowerCase();
    const titleQuery = data.course_title.trim();

    try {
      const { data: modules, error: modSearchErr } = await supabaseAdmin
        .from("modules")
        .select("id, title")
        .ilike("title", `%${titleQuery}%`);
      if (modSearchErr) throw modSearchErr;

      const titleExactMatch = modules?.find(
        (m: any) => m.title.toLowerCase() === titleQuery.toLowerCase(),
      );
      const moduleToUse = titleExactMatch ?? modules?.[0];
      if (!moduleToUse) {
        return { status: "not_found", message: "Pa t jwenn okenn modil ki koresponn ak tit sa a." };
      }

      const { data: record, error: recErr } = await supabaseAdmin
        .from("attendance_records")
        .select("*")
        .eq("email", normalizedEmail)
        .eq("module_id", moduleToUse.id)
        .limit(1)
        .maybeSingle();
      if (recErr) throw recErr;

      if (!record) {
        return {
          status: "mismatch",
          message: "Imel sa a pa jwenn nan lis asistans pou fòmasyon sa a.",
        };
      }

      const fullName =
        `${(record as any).first_name ?? ""} ${(record as any).last_name ?? ""}`.trim();
      const markDate =
        (record as any).marked_at ?? (record as any).created_at ?? new Date().toISOString();

      return {
        status: "ok",
        full_name: fullName,
        verification_id: (record as any).verification_id,
        created_at: markDate,
        module_title: moduleToUse.title,
        module_id: moduleToUse.id,
        cert_lang: "ht",
        certificate_unlocked: true,
      };
    } catch (e: any) {
      console.error("[cert-lookup] error:", e);
      return { status: "error", message: e?.message ?? "Erè sistèm." };
    }
  });

export const getAdminSigner = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("role", "admin")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    return { name: "J. Baptiste", email: null as string | null };
  }
  return {
    name: data.full_name?.trim()
      ? data.full_name.trim()
      : data.email
        ? data.email.split("@")[0]
        : "J. Baptiste",
    email: data.email ?? null,
  };
});
