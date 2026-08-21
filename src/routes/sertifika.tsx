import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState, type ComponentProps } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Award,
  BookOpen,
  Download,
  GraduationCap,
  Loader2,
  LogIn,
  Mail,
  Printer,
  Search,
  ShieldCheck,
} from "lucide-react";
import {
  getLiveData,
  findCertificateByEmailAndTitle,
  type CertificateLookupResult,
  getAdminSigner,
} from "@/admin.functions";
import {
  CertificateCanvas,
  downloadCertificate,
  printCertificate,
  type CertData,
} from "@/components/CertificateCanvas";
import { CERT_LANGS, type CertLang } from "@/lib/certificate-copy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { AuthDialog } from "@/components/AuthDialog";

export const Route = createFileRoute("/sertifika")({
  head: () => ({
    meta: [
      { title: "Jenere Sètifika w — Masterclass AI" },
      {
        name: "description",
        content:
          "Patisipan yo ka jenere epi telechaje sètifika patisipasyon yo an kreyòl, fransè, panyòl oswa anglè.",
      },
      { property: "og:title", content: "Jenere Sètifika w — Masterclass AI" },
      {
        property: "og:description",
        content: "Sètifika patisipasyon ofisyèl an 4 lang, ak ID verifikasyon inik.",
      },
    ],
  }),
  component: CertificatePage,
});

type FoundFromAttendance = {
  full_name: string;
  cert_lang: CertLang;
  verification_id: string;
  created_at: string;
  module_title: string;
  module_id: string;
  certificate_unlocked: boolean;
};

type FormSubmitEvent = Parameters<NonNullable<ComponentProps<"form">["onSubmit"]>>[0];

const FALLBACK_CERT_DATE = new Date(Date.UTC(2026, 7, 31));

function CertificatePage() {
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [found, setFound] = useState<FoundFromAttendance | null>(null);
  const [lang, setLang] = useState<CertLang>("ht");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const getLiveDataFn = useServerFn(getLiveData);
  const findCertFn = useServerFn(findCertificateByEmailAndTitle);
  const getAdminSignerFn = useServerFn(getAdminSigner);
  const { data: settings } = useQuery({
    queryKey: ["public-settings"],
    queryFn: async () => {
      try {
        return await getLiveDataFn();
      } catch (e: any) {
        console.warn("[live-settings] fallback (non-fatal):", e?.message ?? String(e));
        return {
          youtubeLink: null as string | null,
          trainingTitle: "Masterclass AI",
          whatsappAdmin: "",
          whatsappMessage: "",
          modules: [],
          totalSpots: 200,
          certificateEmissionDate: null as string | null,
          eventDate: null as string | null,
          resourceGuideUrl: null as string | null,
          resourceCodeUrl: null as string | null,
        };
      }
    },
    staleTime: 60_000,
    retry: 1,
    retryDelay: 500,
  });
  const { data: signer } = useQuery({
    queryKey: ["admin-signer"],
    queryFn: async () => {
      try {
        return await getAdminSignerFn();
      } catch (e: any) {
        console.warn("[signer] fallback (non-fatal):", e?.message ?? String(e));
        return { name: "Emmanuel Dorélien", email: null as string | null };
      }
    },
    staleTime: Infinity,
    retry: 1,
    retryDelay: 500,
  });

  const modules = settings?.modules ?? [];

  const certDate = useMemo(() => {
    const configured = settings?.certificateEmissionDate
      ? new Date(settings.certificateEmissionDate)
      : null;
    return configured && Number.isFinite(configured.getTime())
      ? configured
      : settings?.eventDate && Number.isFinite(new Date(settings.eventDate).getTime())
        ? new Date(settings.eventDate)
        : FALLBACK_CERT_DATE;
  }, [settings?.certificateEmissionDate, settings?.eventDate]);

  const lookup = useMutation({
    mutationFn: async (values: {
      email: string;
      course_title: string;
    }): Promise<CertificateLookupResult> => {
      return findCertFn({ data: values });
    },
    onSuccess: (result) => {
      if (result.status === "not_found") {
        setFound(null);
        toast.error("Tit fòmasyon an pa jwenn", {
          description: result.message ?? "Verifye tit la epi eseye ankò.",
        });
        return;
      }
      if (result.status === "mismatch") {
        setFound(null);
        toast.error("Pa gen sètifika pou enfo sa yo", {
          description: result.message ?? "Verifye imel ak tit fòmasyon an.",
        });
        return;
      }
      if (result.status === "error") {
        setFound(null);
        toast.error("Erè sistèm", {
          description: result.message ?? "Eseye ankò pita.",
        });
        return;
      }
      if (result.status === "ok") {
        setFound({
          full_name: result.full_name ?? "",
          cert_lang: (result.cert_lang as CertLang) ?? "ht",
          verification_id: result.verification_id ?? "",
          created_at: result.created_at ?? new Date().toISOString(),
          module_title: result.module_title ?? "",
          module_id: result.module_id ?? "",
          certificate_unlocked: result.certificate_unlocked ?? true,
        });
        setLang((result.cert_lang as CertLang) ?? "ht");
        toast.success(`Sètifika jwenn! ${result.full_name}`, {
          description: `Modil: ${result.module_title ?? "—"}`,
          icon: <GraduationCap />,
        });
      }
    },
    onError: () => toast.error("Koneksyon an echwe. Eseye ankò."),
  });

  const canvasData: CertData = {
    name: found?.full_name ?? "Non Patisipan An",
    lang,
    date: found?.created_at ? new Date(found.created_at) : certDate,
    verificationId: found?.verification_id ?? "MAI-2026-XXXXXXXX",
    ...(found?.module_title ? { courseTitle: found.module_title } : {}),
    ...(signer?.name ? { signerName: signer.name } : {}),
  };

  function onSubmit(e: FormSubmitEvent) {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanTitle = courseTitle.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
      toast.error("Tanpri mete yon imel valid.");
      return;
    }
    if (!cleanTitle) {
      toast.error("Tanpri mete tit fòmasyon / modil la.");
      return;
    }
    lookup.mutate({ email: cleanEmail, course_title: cleanTitle });
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 grid-backdrop opacity-25" />
      <div className="relative mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-4 py-1.5 text-xs font-bold tracking-[0.2em] text-gold uppercase">
            <Award className="size-3.5" /> Sètifika pa Modil
          </span>
          <h1 className="mt-6 font-display text-2xl font-black uppercase glow-title sm:text-4xl">
            Jenere <span className="text-gradient-neon">sètifika</span> ou
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Chak modil gen pwòp sètifika li. Mete <b>imel ou</b> ak <b>tit fòmasyon/modil la</b>,
            chwazi lang ou vle, epi telechaje l.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[380px_1fr]">
          <div className="space-y-6">
            <form className="glass space-y-4 rounded-3xl p-6" onSubmit={onSubmit}>
              <div className="rounded-2xl border border-accent/30 bg-accent/5 p-3">
                <p className="text-xs font-semibold text-foreground flex items-center gap-2 mb-1">
                  <ShieldCheck className="size-3.5 text-accent" />
                  Verifikasyon de pa
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Ou dwe antre menm imel ou te itilize pou make asistans la, ak tit egzak modil la.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cert-email">
                  <Mail className="inline size-3.5 mr-1 text-accent" />
                  Imel ou te make asistans avèk li
                </Label>
                <Input
                  id="cert-email"
                  type="email"
                  maxLength={255}
                  value={email}
                  placeholder="ou@imel.com"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cert-title">
                  <BookOpen className="inline size-3.5 mr-1 text-accent" />
                  Tit fòmasyon / modil la
                </Label>
                <Input
                  id="cert-title"
                  type="text"
                  maxLength={300}
                  value={courseTitle}
                  placeholder="eg: Kreyasyon Kontni"
                  list="module-titles-list"
                  onChange={(e) => setCourseTitle(e.target.value)}
                />
                <datalist id="module-titles-list">
                  {modules.map((m) => (
                    <option key={m.id} value={m.title} />
                  ))}
                </datalist>
                {modules.length > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    Egzanp ki disponib: klike sou bwat la pou w chwazi.
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="neon"
                size="lg"
                className="w-full"
                disabled={lookup.isPending}
              >
                {lookup.isPending ? <Loader2 className="animate-spin" /> : <Search />}
                Verifye &amp; jwenn sètifika
              </Button>
            </form>

            <div className="glass rounded-3xl p-6">
              <h2 className="font-display text-sm font-bold tracking-wide uppercase">
                Lang sètifika a
              </h2>
              <div className="mt-4 grid gap-2">
                {CERT_LANGS.map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setLang(l.value)}
                    className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                      lang === l.value
                        ? "border-accent/70 bg-accent/10 text-accent"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="block font-semibold">{l.label}</span>
                    <span className="block text-xs opacity-80">{l.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {found && (
              <div className="glass rounded-3xl p-6 border-emerald-500/40 space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className="rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40">
                    <ShieldCheck className="size-3 mr-1" />
                    Verifye
                  </Badge>
                </div>
                <div className="space-y-3 text-xs">
                  <Row label="Non" value={found.full_name} />
                  <Row label="Modil" value={found.module_title} />
                  <Row
                    label="Kòd verifikasyon"
                    value={
                      <span className="font-mono tracking-wider text-accent">
                        {found.verification_id}
                      </span>
                    }
                  />
                  <Row
                    label="Jounal make"
                    value={
                      found.created_at
                        ? new Date(found.created_at).toLocaleDateString("fr-FR", {
                            dateStyle: "long",
                          })
                        : "—"
                    }
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {user ? (
                <>
                  <Button
                    variant="neon"
                    size="lg"
                    disabled={!found}
                    onClick={() => {
                      if (canvasRef.current && found)
                        downloadCertificate(canvasRef.current, found.verification_id);
                    }}
                  >
                    <Download /> Telechaje (PNG)
                  </Button>
                  <Button
                    variant="outlineNeon"
                    size="lg"
                    disabled={!found}
                    onClick={() => {
                      if (!canvasRef.current) return;
                      if (!printCertificate(canvasRef.current))
                        toast.error("Otorize fenèt pop-up pou w ka enprime.");
                    }}
                  >
                    <Printer /> Enprime / PDF
                  </Button>
                  {!found && (
                    <p className="text-center text-xs text-muted-foreground">
                      Verifye imel + tit modil ou anvan pou w ka telechaje.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <Button
                    variant="neon"
                    size="lg"
                    onClick={() => setAuthOpen(true)}
                    className="w-full"
                  >
                    <LogIn className="size-5" /> Konekte pou Telechaje Sètifika
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Ou dwe anrejistre ak konekte nan kont ou pou w jenere sètifika w.
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="glass rounded-3xl p-3 sm:p-5">
            <CertificateCanvas
              data={canvasData}
              canvasRef={canvasRef}
              className="h-auto w-full rounded-2xl shadow-[var(--shadow-panel)]"
            />
            <p className="mt-4 text-center text-xs text-muted-foreground">
              {found ? (
                <>
                  <Link
                    to="/verify"
                    search={{ code: found.verification_id }}
                    className="font-semibold tracking-wider underline underline-offset-2 hover:text-accent"
                  >
                    Kòd verifikasyon: {found.verification_id}
                  </Link>
                  {" — "}klike pou w verifye otantisite li sou paj piblik la.
                </>
              ) : (
                "Prévizualizasyon — non ou, kòd inik, ak tit modil yo ap parèt apre verifikasyon."
              )}
            </p>
          </div>
        </div>
      </div>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} defaultTab="login" />
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm font-medium text-foreground break-words">{value}</dd>
    </div>
  );
}
