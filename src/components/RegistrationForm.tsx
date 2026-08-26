import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLiveData, registerParticipant, type ModuleRow, type RegisterResult } from "@/admin.functions";
import { sendConfirmationEmail } from "@/email.functions";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  AlertTriangle,
  BookOpen,
  GraduationCap,
  Loader2,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CERT_LANGS, type CertLang } from "@/lib/certificate-copy";

export const FALLBACK_TOTAL_SPOTS = 200;

const schema = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, { message: "Non ou dwe gen omwen 3 karaktè" })
    .max(100, { message: "Non an twò long" }),
  email: z
    .string()
    .trim()
    .email({ message: "Imel la pa valid" })
    .max(255, { message: "Imel la twò long" }),
  whatsapp: z
    .string()
    .trim()
    .min(6, { message: "Nimewo WhatsApp pa valid" })
    .max(30, { message: "Nimewo WhatsApp pa valid" }),
  cert_lang: z.enum(["ht", "fr", "es", "en"]),
  training_title: z
    .string()
    .trim()
    .min(1, { message: "Tanpri chwazi tit fòmasyon ou vle a" })
    .max(300),
});

type RpcResult = RegisterResult;

export function useSpotsLeft() {
  return useQuery({
    queryKey: ["spots-left"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc("plas_ki_rete");
        if (error) throw error;
        if (typeof data === "number" && Number.isFinite(data)) return data;
        return FALLBACK_TOTAL_SPOTS;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err ?? "");
        const isMissingDbSetup =
          /function.*does not exist/i.test(msg) ||
          /permission denied/i.test(msg) ||
          /relation.*does not exist/i.test(msg) ||
          /MISSING_SUPABASE_ENV/i.test(msg) ||
          /Missing Supabase environment/i.test(msg) ||
          /ERR_ABORTED/i.test(msg);
        if (isMissingDbSetup) {
          console.warn(
            "[spots] DB not yet initialised (migrations not run). Falling back to default spots.",
            msg,
          );
        } else {
          console.warn("[spots] Failed to load spots, using fallback:", err);
        }
        return FALLBACK_TOTAL_SPOTS;
      }
    },
    staleTime: 15_000,
    throwOnError: false,
    retry: (failures, err) => {
      const msg = err instanceof Error ? err.message : String(err ?? "");
      const isMissingDbSetup =
        /function.*does not exist/i.test(msg) ||
        /permission denied/i.test(msg) ||
        /relation.*does not exist/i.test(msg) ||
        /MISSING_SUPABASE_ENV/i.test(msg) ||
        /Missing Supabase environment/i.test(msg);
      if (isMissingDbSetup && failures >= 1) return false;
      return failures < 2;
    },
  });
}

export function SpotsCounter() {
  const spotsQ = useSpotsLeft();
  const { data, isLoading, failureCount, isError, error } = spotsQ;
  const getLiveDataFn = useServerFn(getLiveData);
  const { data: liveData } = useQuery({
    queryKey: ["public-settings"],
    queryFn: async () => getLiveDataFn(),
    staleTime: 60_000,
    throwOnError: false,
    retry: (failures, err) => {
      const msg = err instanceof Error ? err.message : String(err ?? "");
      const skip =
        /MISSING_SUPABASE_ENV|Missing Supabase environment|does not exist|permission denied|relation/i.test(
          msg,
        );
      if (skip) return false;
      return failures < 2;
    },
  });

  const totalSpots = liveData?.totalSpots ?? FALLBACK_TOTAL_SPOTS;
  const left = data ?? totalSpots;
  const pct = Math.min(100, Math.round(((totalSpots - left) / Math.max(1, totalSpots)) * 100));
  const errMsg = error instanceof Error ? error.message : error ? String(error) : "";
  const usingFallback =
    isError || failureCount > 0 || /does not exist|permission denied|relation/i.test(errMsg);

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-muted-foreground">Sèlman {totalSpots} plas disponib!</p>
        <p className="font-display text-sm text-accent">
          Plas ki rete: <span className="text-xl font-bold">{isLoading ? "…" : left}</span>
        </p>
      </div>
      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.max(3, pct)}%`, backgroundImage: "var(--gradient-neon)" }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {totalSpots - left} moun deja enskri · {pct}% plen
      </p>
      {usingFallback && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          <p>
            <span className="font-semibold">Mod demo:</span> ki nan plase yo se valè default paske
            baz done Supabase poko gen fonksyon{" "}
            <code className="rounded bg-black/30 px-1">plas_ki_rete</code>. Egzekite migrasyon SQL
            yo nan SQL Editor pou yo konekte byen.
          </p>
        </div>
      )}
    </div>
  );
}

export function RegistrationForm() {
  const qc = useQueryClient();
  const sendConfirmationEmailFn = useServerFn(sendConfirmationEmail);
  const registerFn = useServerFn(registerParticipant);
  const getLiveDataFn = useServerFn(getLiveData);
  const { data: liveData, isLoading: modulesLoading } = useQuery({
    queryKey: ["public-settings"],
    queryFn: async () => getLiveDataFn(),
    staleTime: 60_000,
  });
  const modules: ModuleRow[] = liveData?.modules ?? [];

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    whatsapp: "",
    cert_lang: "ht" as CertLang,
    training_title: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof schema>) => {
      const result = await registerFn({ data: values });
      if (!result) throw new Error("Pa gen repons nan sèvè a.");
      if (result.status === "error") {
        throw new Error(result.message ?? "Yon erè sistèm rive. Eseye ankò.");
      }
      return result as unknown as RpcResult & { cert_lang: CertLang; full_name: string };
    },
    onSuccess: (result, values) => {
      qc.invalidateQueries({ queryKey: ["spots-left"] });
      if (result.status === "ok" || result.status === "already") {
        const vid = result.verification_id ?? "";
        const name = (result as { full_name?: string }).full_name || values.full_name;
        const lang: CertLang =
          ((result as { cert_lang?: CertLang }).cert_lang as CertLang | undefined) ||
          values.cert_lang ||
          "ht";

        Promise.resolve()
          .then(async () => {
            try {
              const origin = (typeof window !== "undefined" && window.location?.origin) || "";
              await sendConfirmationEmailFn({
                data: {
                  toEmail: values.email,
                  fullName: name,
                  verificationId: vid,
                  lang,
                  origin: origin || "https://example.com",
                },
              });
            } catch (e) {
              console.warn("[registration] confirmation email failed silently:", e);
            }
          })
          .catch(() => undefined);

        if (result.status === "ok") {
          toast.success("Enskripsyon ou konfime! 🎉", {
            description: `Kòd sètifika ou: ${vid}. Nou voye imel sou ${values.email} tou.`,
            icon: <Sparkles />,
          });
          setForm({
            full_name: "",
            email: "",
            whatsapp: "",
            cert_lang: "ht",
            training_title: "",
          });
        } else {
          toast.info("Ou te deja enskri", {
            description: `Kòd sètifika ou se ${vid}. Yon rapèl voye sou ${values.email}.`,
            icon: <Mail />,
          });
        }
      } else if (result.status === "full") {
        toast.error("Tout plas yo pran deja", {
          description: "Swiv nou sou YouTube pou pwochen sesyon an.",
        });
      } else {
        toast.error((result as any).message ?? "Yon erè rive. Eseye ankò.");
      }
    },
    onError: (err) => {
      const anyErr = err as any;
      let msg: string = "";
      if (anyErr != null && typeof anyErr === "object") {
        msg =
          anyErr.message ??
          anyErr.error_description ??
          anyErr.details ??
          anyErr.hint ??
          (typeof anyErr.toString === "function" && anyErr.toString() !== "[object Object]"
            ? anyErr.toString()
            : "");
      }
      if (!msg) {
        try {
          msg = err instanceof Error ? err.message : String(err ?? "");
        } catch {
          msg = "";
        }
      }
      if (msg === "[object Object]") msg = "";
      toast.error("Koneksyon an echwe.", {
        description: msg
          ? msg
          : "Tanpri verifye ke migrasyon SQL yo te kouri nan Supabase epi eseye ankò.",
      });
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      toast.error("Tanpri korije enfòmasyon yo.");
      return;
    }
    setErrors({});
    mutation.mutate(parsed.data);
  }

  return (
    <form onSubmit={submit} className="glass space-y-7 rounded-3xl p-6 sm:p-9">
      <div className="space-y-2.5">
        <Label htmlFor="full_name">Non konplè</Label>
        <Input
          id="full_name"
          value={form.full_name}
          maxLength={100}
          placeholder="Jan Batis Pyè"
          onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
        />
        {errors["full_name"] && (
          <p className="text-sm font-semibold text-destructive">{errors["full_name"]}</p>
        )}
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="email">Adrès imel</Label>
        <Input
          id="email"
          type="email"
          value={form.email}
          maxLength={255}
          placeholder="ou@imel.com"
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        {errors["email"] && (
          <p className="text-sm font-semibold text-destructive">{errors["email"]}</p>
        )}
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="whatsapp">Nimewo WhatsApp</Label>
        <Input
          id="whatsapp"
          type="tel"
          value={form.whatsapp}
          maxLength={30}
          placeholder="+509 0000 0000"
          onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
        />
        {errors["whatsapp"] && (
          <p className="text-sm font-semibold text-destructive">{errors["whatsapp"]}</p>
        )}
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="training_title">
          <GraduationCap className="inline size-5 mr-1.5 text-accent -translate-y-0.5" />
          Tit fòmasyon / modil ou vle patisipe
        </Label>
        {modulesLoading || modules.length === 0 ? (
          <div className="flex h-12 items-center rounded-2xl border-2 border-white/15 bg-background/70 px-4 text-[1rem] font-medium text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            {modulesLoading ? "Chajman modil yo…" : "Pa gen modil disponib kounye a."}
          </div>
        ) : (
          <Select
            value={form.training_title}
            onValueChange={(v) => setForm((f) => ({ ...f, training_title: v }))}
          >
            <SelectTrigger id="training_title">
              <SelectValue placeholder="Chwazi tit fòmasyon an" />
            </SelectTrigger>
            <SelectContent>
              {modules.map((m) => (
                <SelectItem key={m.id} value={m.title}>
                  <div className="flex items-center gap-2.5 py-1">
                    <BookOpen className="size-4.5 text-accent shrink-0" />
                    <span className="text-[0.95rem]">{m.title}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {errors["training_title"] && (
          <p className="text-sm font-semibold text-destructive">{errors["training_title"]}</p>
        )}
        <p className="text-sm text-muted-foreground leading-relaxed">
          Ou ka toujou enskri pou lòt modil pita. Chak modil gen pwòp sètifika li.
        </p>
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="cert_lang">Lang sètifika w pito</Label>
        <Select
          value={form.cert_lang}
          onValueChange={(v) => setForm((f) => ({ ...f, cert_lang: v as CertLang }))}
        >
          <SelectTrigger id="cert_lang">
            <SelectValue placeholder="Chwazi yon lang" />
          </SelectTrigger>
          <SelectContent>
            {CERT_LANGS.map((l) => (
              <SelectItem key={l.value} value={l.value}>
                <span className="text-[0.95rem]">{l.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="submit"
        variant="neon"
        size="xl"
        className="w-full"
        disabled={mutation.isPending}
      >
        {mutation.isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
        Rezève plas mwen — Gratis
      </Button>

      <p className="flex items-center justify-center gap-2.5 text-sm text-muted-foreground">
        <ShieldCheck className="size-4.5 text-accent" />
        Enfòmasyon ou rete prive. Nou pa pataje yo ak pèsonn.
      </p>
    </form>
  );
}
