import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Award,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  Copy,
  Download,
  LayoutDashboard,
  Loader2,
  Lock,
  LockOpen,
  LogIn,
  MessageCircle,
  Pencil,
  Plus,
  Shield,
  Sparkles,
  Ticket,
  Trash2,
  Unlock,
  Users,
  X,
  Youtube,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { AuthDialog } from "@/components/AuthDialog";

const PAYMENT_METHODS = [
  "Moncash",
  "Natcash",
  "PayPal",
  "Carte de Crédit",
  "Transferencia",
] as const;
import {
  addModule,
  createAttendanceCode,
  deleteAttendanceCode,
  deleteModule,
  getAdminData,
  toggleAttendanceCode,
  updateAdminSetting,
  unlockAllCertificates,
  unlockCertificateByEmail,
  updateModule,
} from "@/admin.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Masterclass AI" },
      {
        name: "description",
          content:
            "Panno administrasyon pou mete lyen YouTube, debloque sètifika, epi jere resous Masterclass AI la.",
      },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  const getAdminDataFn = useServerFn(getAdminData);
  const updateAdminSettingFn = useServerFn(updateAdminSetting);
  const unlockAllCertificatesFn = useServerFn(unlockAllCertificates);
  const unlockCertificateByEmailFn = useServerFn(unlockCertificateByEmail);
  const addModuleFn = useServerFn(addModule);
  const updateModuleFn = useServerFn(updateModule);
  const deleteModuleFn = useServerFn(deleteModule);
  const createAttendanceCodeFn = useServerFn(createAttendanceCode);
  const toggleAttendanceCodeFn = useServerFn(toggleAttendanceCode);
  const deleteAttendanceCodeFn = useServerFn(deleteAttendanceCode);

  const {
    data,
    isLoading,
    refetch,
    error: adminDataError,
  } = useQuery({
    queryKey: ["admin-data"],
    queryFn: async () => getAdminDataFn(),
    staleTime: 1000 * 60,
  });

  const supabaseMisconfigured =
    adminDataError &&
    adminDataError instanceof Error &&
    (adminDataError.message.includes("Missing Supabase") ||
      adminDataError.message.includes("SUPABASE_SERVICE_ROLE_KEY"));

  const [youtubeLink, setYoutubeLink] = useState("");
  const [totalSpotsValue, setTotalSpotsValue] = useState<string>("");
  const [certDateValue, setCertDateValue] = useState<string>("");
  const [eventDateValue, setEventDateValue] = useState<string>("");
  const [unlockEmail, setUnlockEmail] = useState("");
  const [trainingTitle, setTrainingTitle] = useState("");
  const [whatsappAdmin, setWhatsappAdmin] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [resourceGuideUrl, setResourceGuideUrl] = useState("");
  const [resourceCodeUrl, setResourceCodeUrl] = useState("");
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [moduleDate, setModuleDate] = useState("");
  const [moduleIsPaid, setModuleIsPaid] = useState(false);
  const [modulePrice, setModulePrice] = useState("");
  const [modulePaymentMethods, setModulePaymentMethods] = useState<string[]>([]);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editModuleTitle, setEditModuleTitle] = useState("");
  const [editModuleDescription, setEditModuleDescription] = useState("");
  const [editModuleDate, setEditModuleDate] = useState("");
  const [editModuleIsPaid, setEditModuleIsPaid] = useState(false);
  const [editModulePrice, setEditModulePrice] = useState("");
  const [editModulePaymentMethods, setEditModulePaymentMethods] = useState<string[]>([]);
  const [attendanceModuleId, setAttendanceModuleId] = useState<string>("");
  const [attendanceCodeValue, setAttendanceCodeValue] = useState<string>("");
  const [attendanceExpiresAt, setAttendanceExpiresAt] = useState<string>("");

  const updateYoutubeLink = useMutation({
    mutationFn: async (value: string) =>
      updateAdminSettingFn({ data: { key: "youtube_link", value } }),
    onSuccess: async () => {
      toast.success("Lyen YouTube sove.");
      setYoutubeLink("");
      await refetch();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Missing Supabase") || msg.includes("SUPABASE_SERVICE_ROLE_KEY")) {
        toast.error(
          "Konfigirasyon Supabase pa konplè. Tanpri ajoute SUPABASE_SERVICE_ROLE_KEY nan .env.",
        );
      } else if (msg) {
        toast.error(`Pa t posib sove lyen YouTube la. Erè: ${msg}`);
      } else {
        toast.error("Pa t posib sove lyen YouTube la.");
      }
    },
  });

  const unlockAllMutation = useMutation({
    mutationFn: async () => unlockAllCertificatesFn(),
    onSuccess: async () => {
      toast.success("Tout sètifika debloque.");
      await refetch();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Missing Supabase") || msg.includes("SUPABASE_SERVICE_ROLE_KEY")) {
        toast.error(
          "Konfigirasyon Supabase pa konplè. Tanpri ajoute SUPABASE_SERVICE_ROLE_KEY nan .env.",
        );
      } else if (msg) {
        toast.error(`Pa t posib debloque tout sètifika yo. Erè: ${msg}`);
      } else {
        toast.error("Pa t posib debloque tout sètifika yo.");
      }
    },
  });

  const unlockEmailMutation = useMutation({
    mutationFn: async (email: string) => unlockCertificateByEmailFn({ data: { email } }),
    onSuccess: async () => {
      toast.success("Sètifika debloque pou imel sa a.");
      setUnlockEmail("");
      await refetch();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Missing Supabase") || msg.includes("SUPABASE_SERVICE_ROLE_KEY")) {
        toast.error(
          "Konfigirasyon Supabase pa konplè. Tanpri ajoute SUPABASE_SERVICE_ROLE_KEY nan .env.",
        );
      } else if (msg.includes("Invalid email") || msg.includes("email")) {
        toast.error("Imel la pa valid. Tanpri antre yon imel ki egziste.");
      } else if (msg) {
        toast.error(`Pa t posib debloque sètifika a. Erè: ${msg}`);
      } else {
        toast.error("Pa t posib debloque sètifika a.");
      }
    },
  });

  const addModuleMutation = useMutation({
    mutationFn: async (values: {
      title: string;
      description: string;
      module_date: string;
      is_paid?: boolean;
      price?: string;
      payment_methods?: string[];
    }) => addModuleFn({ data: values }),
    onSuccess: async () => {
      toast.success("Modil ajoute.");
      setModuleTitle("");
      setModuleDescription("");
      setModuleDate("");
      setModuleIsPaid(false);
      setModulePrice("");
      setModulePaymentMethods([]);
      await refetch();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Missing Supabase") || msg.includes("SUPABASE_SERVICE_ROLE_KEY")) {
        toast.error(
          "Konfigirasyon Supabase pa konplè. Tanpri kontakte administrasyon an oswa ajoute SUPABASE_SERVICE_ROLE_KEY nan .env.",
        );
      } else if (msg) {
        toast.error(`Pa t posib ajoute modil la. Erè: ${msg}`);
      } else {
        toast.error("Pa t posib ajoute modil la.");
      }
    },
  });

  const updateModuleMutation = useMutation({
    mutationFn: async (values: {
      id: string;
      title: string;
      description: string;
      module_date: string;
      is_paid?: boolean;
      price?: string;
      payment_methods?: string[];
    }) => updateModuleFn({ data: values }),
    onSuccess: async () => {
      toast.success("Modil modifye.");
      setEditingModuleId(null);
      setEditModuleTitle("");
      setEditModuleDescription("");
      setEditModuleDate("");
      setEditModuleIsPaid(false);
      setEditModulePrice("");
      setEditModulePaymentMethods([]);
      await refetch();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Missing Supabase") || msg.includes("SUPABASE_SERVICE_ROLE_KEY")) {
        toast.error(
          "Konfigirasyon Supabase pa konplè. Tanpri ajoute SUPABASE_SERVICE_ROLE_KEY nan .env.",
        );
      } else if (msg) {
        toast.error(`Pa t posib modifye modil la. Erè: ${msg}`);
      } else {
        toast.error("Pa t posib modifye modil la.");
      }
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: async (id: string) => deleteModuleFn({ data: { id } }),
    onSuccess: async () => {
      toast.success("Modil efase.");
      await refetch();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Missing Supabase") || msg.includes("SUPABASE_SERVICE_ROLE_KEY")) {
        toast.error(
          "Konfigirasyon Supabase pa konplè. Tanpri ajoute SUPABASE_SERVICE_ROLE_KEY nan .env.",
        );
      } else if (msg) {
        toast.error(`Pa t posib efase modil la. Erè: ${msg}`);
      } else {
        toast.error("Pa t posib efase modil la.");
      }
    },
  });

  const createAttendanceCodeMutation = useMutation({
    mutationFn: async () => {
      if (!attendanceModuleId) throw new Error("Tanpri chwazi yon modil.");
      return createAttendanceCodeFn({
        data: {
          module_id: attendanceModuleId,
          code: attendanceCodeValue.trim() || undefined,
          expires_at: attendanceExpiresAt.trim() || null,
        },
      });
    },
    onSuccess: async (res) => {
      toast.success(`Kòd asistans kreye: ${res.code}`, {
        description: "Pataje kòd sa a ak patisipan yo apre sesyon an.",
        icon: <Ticket />,
      });
      setAttendanceCodeValue("");
      setAttendanceExpiresAt("");
      await refetch();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Missing Supabase") || msg.includes("SUPABASE_SERVICE_ROLE_KEY")) {
        toast.error(
          "Konfigirasyon Supabase pa konplè. Tanpri ajoute SUPABASE_SERVICE_ROLE_KEY nan .env.",
        );
      } else if (msg) {
        toast.error(`Pa t posib kreye kòd la. Erè: ${msg}`);
      } else {
        toast.error("Pa t posib kreye kòd la. Eseye ankò.");
      }
    },
  });

  const toggleAttendanceCodeMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) =>
      toggleAttendanceCodeFn({ data: { id, is_active } }),
    onSuccess: async () => {
      toast.success("Eta kòd la modifye.");
      await refetch();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "";
      toast.error(msg || "Pa t posib modifye eta kòd la.");
    },
  });

  const deleteAttendanceCodeMutation = useMutation({
    mutationFn: async (id: string) => deleteAttendanceCodeFn({ data: { id } }),
    onSuccess: async () => {
      toast.success("Kòd la efase.");
      await refetch();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "";
      toast.error(msg || "Pa t posib efase kòd la.");
    },
  });

  const updateTrainingTitleMutation = useMutation({
    mutationFn: async (value: string) =>
      updateAdminSettingFn({ data: { key: "training_title", value } }),
    onSuccess: async () => {
      toast.success("Tit fòmasyon an sove.");
      setTrainingTitle("");
      await refetch();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Missing Supabase") || msg.includes("SUPABASE_SERVICE_ROLE_KEY")) {
        toast.error(
          "Konfigirasyon Supabase pa konplè. Tanpri ajoute SUPABASE_SERVICE_ROLE_KEY nan .env.",
        );
      } else if (msg) {
        toast.error(`Pa t posib sove tit fòmasyon an. Erè: ${msg}`);
      } else {
        toast.error("Pa t posib sove tit fòmasyon an.");
      }
    },
  });

  const settings = data?.settings ?? [];
  const existingYoutubeLink = settings.find((item) => item.key === "youtube_link")?.value;
  const existingTotalSpots = settings.find((item) => item.key === "total_spots")?.value;
  const existingCertificateDate = settings.find(
    (item) => item.key === "certificate_emission_date",
  )?.value;
  const existingEventDate = settings.find((item) => item.key === "event_date")?.value;
  const existingTrainingTitle = settings.find((item) => item.key === "training_title")?.value;
  const existingWhatsappAdmin = settings.find((item) => item.key === "whatsapp_admin")?.value;
  const existingWhatsappMessage = settings.find((item) => item.key === "whatsapp_message")?.value;
  const existingResourceGuideUrl = settings.find((item) => item.key === "resource_guide_url")?.value;
  const existingResourceCodeUrl = settings.find((item) => item.key === "resource_code_url")?.value;
  const totalEnrollments = data?.totalEnrollments ?? 0;
  const totalUnlocked = data?.totalUnlocked ?? 0;
  const modules = data?.modules ?? [];
  const attendanceCodes = data?.attendanceCodes ?? [];
  const attendanceRecords = data?.attendanceRecords ?? [];

  useEffect(() => {
    if (existingTotalSpots) setTotalSpotsValue(existingTotalSpots);
    if (existingCertificateDate)
      setCertDateValue(new Date(existingCertificateDate).toISOString().slice(0, 16));
    if (existingEventDate)
      setEventDateValue(new Date(existingEventDate).toISOString().slice(0, 16));
  }, [existingTotalSpots, existingCertificateDate, existingEventDate]);

  const completedModules = modules.filter((m) => new Date(m.module_date) < new Date()).length;
  const pendingModules = modules.length - completedModules;
  const progressCert =
    totalEnrollments > 0 ? Math.round((totalUnlocked / totalEnrollments) * 100) : 0;
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  type TabKey =
    | "dashboard"
    | "youtube"
    | "whatsapp"
    | "schedule"
    | "certificates"
    | "modules"
    | "attendance"
    | "resources";
  const tabColors: { [K in TabKey]: { active: string; badge: string; ring: string } } = {
    dashboard: {
      active:
        "data-[state=active]:bg-accent/15 data-[state=active]:text-accent data-[state=active]:shadow-[0_0_0_1px_rgba(var(--accent),0.4)]",
      badge: "border-accent/40 bg-accent/10 text-accent",
      ring: "border-accent/40 bg-accent/10",
    },
    youtube: {
      active:
        "data-[state=active]:bg-red-500/15 data-[state=active]:text-red-400 data-[state=active]:shadow-[0_0_0_1px_rgba(248,113,113,0.4)]",
      badge: "border-red-500/40 bg-red-500/10 text-red-400",
      ring: "border-red-500/40 bg-red-500/10",
    },
    whatsapp: {
      active:
        "data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 data-[state=active]:shadow-[0_0_0_1px_rgba(16,185,129,0.4)]",
      badge: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
      ring: "border-emerald-500/40 bg-emerald-500/10",
    },
    schedule: {
      active:
        "data-[state=active]:bg-blue-500/15 data-[state=active]:text-blue-400 data-[state=active]:shadow-[0_0_0_1px_rgba(96,165,250,0.4)]",
      badge: "border-blue-500/40 bg-blue-500/10 text-blue-400",
      ring: "border-blue-500/40 bg-blue-500/10",
    },
    certificates: {
      active:
        "data-[state=active]:bg-green-500/15 data-[state=active]:text-green-400 data-[state=active]:shadow-[0_0_0_1px_rgba(74,222,128,0.4)]",
      badge: "border-green-500/40 bg-green-500/10 text-green-400",
      ring: "border-green-500/40 bg-green-500/10",
    },
    modules: {
      active:
        "data-[state=active]:bg-purple-500/15 data-[state=active]:text-purple-400 data-[state=active]:shadow-[0_0_0_1px_rgba(168,85,247,0.4)]",
      badge: "border-purple-500/40 bg-purple-500/10 text-purple-400",
      ring: "border-purple-500/40 bg-purple-500/10",
    },
    attendance: {
      active:
        "data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-400 data-[state=active]:shadow-[0_0_0_1px_rgba(251,191,36,0.4)]",
      badge: "border-amber-500/40 bg-amber-500/10 text-amber-400",
      ring: "border-amber-500/40 bg-amber-500/10",
    },
    resources: {
      active:
        "data-[state=active]:bg-cyan-500/15 data-[state=active]:text-cyan-400 data-[state=active]:shadow-[0_0_0_1px_rgba(34,211,238,0.4)]",
      badge: "border-cyan-500/40 bg-cyan-500/10 text-cyan-400",
      ring: "border-cyan-500/40 bg-cyan-500/10",
    },
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="size-10 animate-spin text-accent" />
          <p className="text-muted-foreground">Tcheke otorizasyon...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="absolute inset-0 grid-backdrop opacity-20" />
        <div className="glass relative w-full max-w-md rounded-3xl p-8 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl border border-accent/40 bg-accent/10 shadow-[0_0_24px_-6px_rgba(var(--accent),0.45)]">
            <Shield className="size-8 text-accent" />
          </div>
          <h1 className="mt-6 font-display text-2xl font-black uppercase glow-title">
            Aksè Admin
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground font-medium">
            Ou dwe konekte ak yon kont admin pou w ka aksede panèl administrasyon an.
          </p>
          <div className="mt-8 space-y-3">
            <Button
              variant="neon"
              size="xl"
              className="w-full"
              onClick={() => setAuthOpen(true)}
            >
              <LogIn className="size-5" />
              Konekte pou Admin
            </Button>
            <Button variant="outlineNeon" size="lg" className="w-full" asChild>
              <Link to="/">Tounen sou paj akèy</Link>
            </Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Si w se yon elèv, ale nan paj <Link to="/live" className="text-accent underline">Live &amp; Resous</Link> pou telechaje apunti yo.
          </p>
        </div>
        <AuthDialog open={authOpen} onOpenChange={setAuthOpen} defaultTab="login" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="absolute inset-0 grid-backdrop opacity-20" />
        <div className="glass relative w-full max-w-md rounded-3xl p-8 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl border border-destructive/40 bg-destructive/10">
            <Lock className="size-8 text-destructive" />
          </div>
          <h1 className="mt-6 font-display text-2xl font-black uppercase text-destructive">
            Aksè Refize
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground font-medium">
            Kont ou a (<b className="text-foreground break-all">{user.email ?? "elèv"}</b>) pa gen otorizasyon admin.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Se sèlman akil admin ki ka jere panèl sa a. Si w se admin, chanje wòl ou nan baz done a oswa itilize lòt kont.
          </p>
          <div className="mt-8 space-y-3">
            <Button variant="outlineNeon" size="lg" className="w-full" asChild>
              <Link to="/live">Ale nan Live &amp; Resous</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">Tounen akèy</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 grid-backdrop opacity-20" />
      <div className="relative mx-auto max-w-7xl px-4 py-12">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-accent">
            <LockOpen className="size-3.5" /> Admin
          </span>
          <h1 className="mt-6 font-display text-3xl font-black uppercase glow-title sm:text-5xl">
            Panel Administrasyon
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Chwazi yon kategori anba a pou jere tout paramèt Masterclass AI.
          </p>
        </div>

        {supabaseMisconfigured && (
          <div className="mt-8 rounded-2xl border border-red-500/40 bg-red-500/10 p-5">
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-red-500/40 bg-red-500/15">
                <X className="size-5 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-lg font-bold text-red-400">
                  ⚠️ Konfigirasyon Supabase pa konplè
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Ou pa ka ajoute, modifye oswa efase done paske varyab anviwònman{" "}
                  <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-foreground">
                    SUPABASE_SERVICE_ROLE_KEY
                  </code>{" "}
                  la manke nan dosye{" "}
                  <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-foreground">
                    .env
                  </code>{" "}
                  la.
                </p>
                <div className="mt-3 rounded-xl border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">Kijan pou w rezoud:</p>
                  <ol className="mt-2 list-decimal space-y-1 pl-5">
                    <li>
                      Ale nan{" "}
                      <a
                        href="https://supabase.com/dashboard/project/uqkdzldxlqgzaimarafz/settings/api"
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent underline"
                      >
                        Supabase Dashboard → Project Settings → API
                      </a>
                    </li>
                    <li>
                      Kopi la kle <strong>service_role</strong> (pa publishable!)
                    </li>
                    <li>
                      Ouvri dosye{" "}
                      <code className="rounded bg-secondary px-1 py-0.5 font-mono">.env</code> la
                      nan pwojè a
                    </li>
                    <li>
                      Ajoute liy sa a:{" "}
                      <code className="mt-1 block rounded bg-secondary px-2 py-1 font-mono break-all">
                        SUPABASE_SERVICE_ROLE_KEY="kle_w_la"
                      </code>
                    </li>
                    <li>
                      Redemare sèvè devlopman an (CTRL+C epi{" "}
                      <code className="rounded bg-secondary px-1 py-0.5 font-mono">
                        npm run dev
                      </code>
                      )
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-10">
          <Tabs
            defaultValue="dashboard"
            className="w-full"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="glass h-auto w-full flex-wrap gap-2 rounded-2xl p-2 sm:grid sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9">
              <TabsTrigger
                value="dashboard"
                className={`h-14 rounded-xl transition-all ${tabColors.dashboard.active}`}
              >
                <div className="flex flex-col items-center gap-1 px-2">
                  <LayoutDashboard className="size-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Tablo bord</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="youtube"
                className={`h-14 rounded-xl transition-all ${tabColors.youtube.active}`}
              >
                <div className="flex flex-col items-center gap-1 px-2">
                  <Youtube className="size-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">YouTube</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="whatsapp"
                className={`h-14 rounded-xl transition-all ${tabColors.whatsapp.active}`}
              >
                <div className="flex flex-col items-center gap-1 px-2">
                  <MessageCircle className="size-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">WhatsApp</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="schedule"
                className={`h-14 rounded-xl transition-all ${tabColors.schedule.active}`}
              >
                <div className="flex flex-col items-center gap-1 px-2">
                  <Clock className="size-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Pwogram</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="certificates"
                className={`h-14 rounded-xl transition-all ${tabColors.certificates.active}`}
              >
                <div className="flex flex-col items-center gap-1 px-2">
                  <Award className="size-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Sètifika</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="modules"
                className={`h-14 rounded-xl transition-all ${tabColors.modules.active}`}
              >
                <div className="flex flex-col items-center gap-1 px-2">
                  <BookOpen className="size-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Modil yo</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="resources"
                className={`h-14 rounded-xl transition-all ${tabColors.resources.active}`}
              >
                <div className="flex flex-col items-center gap-1 px-2">
                  <Download className="size-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Resous</span>
                </div>
              </TabsTrigger>
            </TabsList>

            <div className="mt-8">
              <TabsContent value="dashboard" className="mt-0 space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="glass rounded-2xl p-5">
                    <div className="flex items-center gap-3">
                      <div className="grid size-11 place-items-center rounded-xl border border-accent/40 bg-accent/10">
                        <BarChart3 className="size-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Enskripsyon
                        </p>
                        <p className="mt-1 font-display text-2xl font-black">{totalEnrollments}</p>
                      </div>
                    </div>
                  </div>
                  <div className="glass rounded-2xl p-5">
                    <div className="flex items-center gap-3">
                      <div className="grid size-11 place-items-center rounded-xl border border-green-500/40 bg-green-500/10">
                        <Unlock className="size-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Debloque
                        </p>
                        <p className="mt-1 font-display text-2xl font-black">
                          {totalUnlocked}{" "}
                          <span className="text-sm font-normal text-muted-foreground">
                            / {totalEnrollments}
                          </span>
                        </p>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-green-500 transition-all"
                            style={{ width: `${progressCert}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="glass rounded-2xl p-5">
                    <div className="flex items-center gap-3">
                      <div className="grid size-11 place-items-center rounded-xl border border-blue-500/40 bg-blue-500/10">
                        <BookOpen className="size-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Modil
                        </p>
                        <p className="mt-1 font-display text-2xl font-black">{modules.length}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {completedModules} termine · {pendingModules} ap vini
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="glass rounded-2xl p-6">
                    <h2 className="flex items-center gap-2 font-display text-xl font-bold">
                      <Clock className="size-5 text-accent" /> Rezilta aktyèl
                    </h2>
                    <div className="mt-5 space-y-4 text-sm text-muted-foreground">
                      <div className="rounded-xl bg-muted/20 p-4">
                        <p className="font-semibold text-foreground">🎯 Tit fòmasyon</p>
                        <p className="mt-2">
                          {existingTrainingTitle ?? "(Default: Masterclass AI an Kreyòl)"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-muted/20 p-4">
                        <p className="font-semibold text-foreground">📅 Dat evènman an</p>
                        <p className="mt-2">
                          {existingEventDate
                            ? new Date(existingEventDate).toLocaleString()
                            : "(Pa defini — default: 31 Out 2026 22:00 UTC-4)"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-muted/20 p-4">
                        <p className="font-semibold text-foreground">🎫 Kapasite plas</p>
                        <p className="mt-2">
                          Total: <span className="font-bold">{existingTotalSpots ?? "200"}</span>{" "}
                          plas · Lòt:{" "}
                          <span className="font-bold text-green-400">
                            {Math.max(
                              0,
                              (parseInt(existingTotalSpots ?? "200", 10) || 200) - totalEnrollments,
                            )}
                          </span>{" "}
                          disponib
                        </p>
                      </div>
                      <div className="rounded-xl bg-muted/20 p-4">
                        <p className="font-semibold text-foreground">📺 YouTube</p>
                        <div className="mt-2 flex items-center gap-2">
                          {existingYoutubeLink ? (
                            <>
                              <CheckCircle2 className="size-4 text-green-400 shrink-0" />
                              <a
                                href={existingYoutubeLink}
                                target="_blank"
                                rel="noreferrer"
                                className="break-all text-accent underline"
                              >
                                {existingYoutubeLink}
                              </a>
                            </>
                          ) : (
                            <span className="text-destructive">
                              (Pa defini — ale nan onglet YouTube)
                            </span>
                          )}
                        </div>
                      </div>
                      {existingCertificateDate && (
                        <div className="rounded-xl bg-muted/20 p-4">
                          <p className="font-semibold text-foreground">🏅 Sètifika emisyon</p>
                          <p className="mt-2">
                            {new Date(existingCertificateDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="glass rounded-2xl p-6">
                    <h2 className="flex items-center gap-2 font-display text-xl font-bold">
                      <Youtube className="size-5 text-accent" /> Aksyon rapid
                    </h2>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <QuickActionCard
                        icon={<Youtube className="size-5" />}
                        label="Mete lyen YouTube"
                        goToTab="youtube"
                        onGoToTab={setActiveTab}
                        color="text-red-400"
                      />
                      <QuickActionCard
                        icon={<Clock className="size-5" />}
                        label="Pwograme fòmasyon"
                        goToTab="schedule"
                        onGoToTab={setActiveTab}
                        color="text-blue-400"
                      />
                      <QuickActionCard
                        icon={<Unlock className="size-5" />}
                        label="Debloque tout sètifika"
                        onClick={() => {
                          if (confirm("Eske ou sèten w vle debloque tout sètifika yo?")) {
                            unlockAllMutation.mutate();
                          }
                        }}
                        onGoToTab={setActiveTab}
                        color="text-green-400"
                      />
                      <QuickActionCard
                        icon={<Plus className="size-5" />}
                        label="Ajoute yon modil"
                        goToTab="modules"
                        onGoToTab={setActiveTab}
                        color="text-purple-400"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="youtube" className="mt-0">
                <div className="glass rounded-3xl p-6 sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${tabColors.youtube.badge}`}
                      >
                        <Youtube className="size-4" /> YouTube Live
                      </div>
                      <h2 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
                        Jere lyen YouTube la
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Mete ak mete ajou lyen live YouTube la pou paj live la chaje li otomatikman.
                      </p>
                    </div>
                    <div
                      className={`rounded-2xl px-5 py-3 text-sm font-bold ${existingYoutubeLink ? "bg-green-500/10 text-green-400 border border-green-500/40" : "bg-secondary text-muted-foreground"}`}
                    >
                      {existingYoutubeLink ? "✓ Lyen aktif" : "○ Pa gen lyen"}
                    </div>
                  </div>

                  {existingYoutubeLink && (
                    <div className="mt-6 rounded-2xl border border-accent/30 bg-muted/20 p-4">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        Lyen aktyèl la:
                      </p>
                      <a
                        href={existingYoutubeLink}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 block break-all font-medium text-accent underline hover:text-accent/80"
                      >
                        {existingYoutubeLink}
                      </a>
                      <Button asChild size="sm" variant="outlineNeon" className="mt-3">
                        <a href={existingYoutubeLink} target="_blank" rel="noreferrer">
                          <Youtube /> Ouvri nan YouTube
                        </a>
                      </Button>
                    </div>
                  )}

                  <div className="mt-8 space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="youtube-link" className="text-base font-semibold">
                        URL YouTube la
                      </Label>
                      <Input
                        id="youtube-link"
                        value={youtubeLink}
                        placeholder={existingYoutubeLink ?? "https://www.youtube.com/watch?v=..."}
                        onChange={(event) => setYoutubeLink(event.target.value)}
                        className="h-12 w-full text-base"
                      />
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="neon"
                        size="lg"
                        onClick={() => {
                          const value = youtubeLink.trim() || "";
                          if (!value) {
                            toast.error("Tanpri antre lyen YouTube la.");
                            return;
                          }
                          updateYoutubeLink.mutate(value);
                        }}
                        disabled={updateYoutubeLink.isPending}
                      >
                        {existingYoutubeLink ? "✓ Mete ajou lyen" : "➤ Mete lyen YouTube"}
                      </Button>
                      {existingYoutubeLink && (
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => setYoutubeLink(existingYoutubeLink)}
                        >
                          Retabli lyen ki la
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="whatsapp" className="mt-0">
                <div className="glass rounded-3xl p-6 sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${tabColors.whatsapp.badge}`}
                      >
                        <MessageCircle className="size-4" /> WhatsApp Premium
                      </div>
                      <h2 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
                        Konfigire WhatsApp ou pou modil Premium yo
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Mete nimewo WhatsApp ou (pou janm modil Premium la, kliyan yo ap voye yon
                        mesaj ba ou otomatikman) epi modifye mesaj ki pre-ekri a si ou vle.
                      </p>
                    </div>
                    <div
                      className={`rounded-2xl px-5 py-3 text-sm font-bold ${existingWhatsappAdmin ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/40" : "bg-secondary text-muted-foreground"}`}
                    >
                      {existingWhatsappAdmin ? "✓ WhatsApp aktify" : "○ Pa gen nimewo"}
                    </div>
                  </div>

                  <div className="mt-8 grid gap-6 lg:grid-cols-2">
                    <div className="space-y-5 rounded-2xl border border-border p-5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`grid size-9 place-items-center rounded-lg ${tabColors.whatsapp.ring} text-emerald-400`}
                        >
                          <MessageCircle className="size-4" />
                        </div>
                        <h3 className="font-display text-lg font-bold">Nimewo WhatsApp Admin</h3>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp-admin">
                          Nimewo a (san espas, san <code>+</code>, ak kòd peyi)
                        </Label>
                        <Input
                          id="whatsapp-admin"
                          value={whatsappAdmin}
                          onChange={(event) => setWhatsappAdmin(event.target.value)}
                          placeholder="Egzanp: 50937123456"
                          className="h-12 font-mono text-base"
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Aktif:{" "}
                          <span className="font-mono font-medium text-foreground">
                            {existingWhatsappAdmin || "(pa defini)"}
                          </span>
                          {existingWhatsappAdmin && (
                            <>
                              {" · "}
                              <a
                                className="text-emerald-400 underline"
                                target="_blank"
                                rel="noreferrer"
                                href={`https://wa.me/${existingWhatsappAdmin.replace(/\D/g, "")}`}
                              >
                                Teste →
                              </a>
                            </>
                          )}
                        </p>
                      </div>
                      <Button
                        variant="neon"
                        onClick={async () => {
                          const raw = (whatsappAdmin || "").trim();
                          if (!raw) {
                            toast.error("Tanpri antre nimewo WhatsApp ou.");
                            return;
                          }
                          const digitsOnly = raw.replace(/\D/g, "");
                          if (digitsOnly.length < 8) {
                            toast.error("Nimewo WhatsApp la twò kout. Tanpri ajoute kòd peyi a.");
                            return;
                          }
                          await updateAdminSettingFn({
                            data: { key: "whatsapp_admin", value: digitsOnly },
                          });
                          toast.success("Nimewo WhatsApp sove.");
                          await refetch();
                        }}
                      >
                        <Check /> Sove nimewo
                      </Button>
                    </div>

                    <div className="space-y-5 rounded-2xl border border-border p-5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`grid size-9 place-items-center rounded-lg ${tabColors.whatsapp.ring} text-emerald-400`}
                        >
                          <Sparkles className="size-4" />
                        </div>
                        <h3 className="font-display text-lg font-bold">
                          Mesaj WhatsApp ki pre-ekri
                        </h3>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp-message">
                          Model mesaj la — itilize{" "}
                          <code className="rounded bg-secondary px-1">{"{MODULE_TITLE}"}</code> pou
                          mete non modil la
                        </Label>
                        <Textarea
                          id="whatsapp-message"
                          value={whatsappMessage}
                          onChange={(event) => setWhatsappMessage(event.target.value)}
                          placeholder="Bonjou! Mwen ta renmen resevwa aksè a modil {MODULE_TITLE}..."
                          rows={7}
                        />
                        <div className="rounded-xl bg-muted/20 p-3 text-[11px] text-muted-foreground">
                          <p className="font-semibold text-foreground mb-1">
                            Aperçu (modil egzanp):
                          </p>
                          <p className="whitespace-pre-wrap font-medium text-foreground/90">
                            {(whatsappMessage || "").replaceAll(
                              "{MODULE_TITLE}",
                              "Modil 2 — Kreyasyon Aplikasyon",
                            )}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="neon"
                        onClick={async () => {
                          const val = (whatsappMessage || "").trim();
                          if (!val) {
                            toast.error("Tanpri ekri yon mesaj ki pral voye ba kliyan yo.");
                            return;
                          }
                          await updateAdminSettingFn({
                            data: { key: "whatsapp_message", value: val },
                          });
                          toast.success("Mesaj WhatsApp sove.");
                          await refetch();
                        }}
                      >
                        <Check /> Sove model mesaj
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="schedule" className="mt-0">
                <div className="glass rounded-3xl p-6 sm:p-8">
                  <div>
                    <div
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${tabColors.schedule.badge}`}
                    >
                      <Clock className="size-4" /> Pwogramasyon
                    </div>
                    <h2 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
                      Pwograme kapacitasyon an
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Mete tit, dat pwochen fòmasyon an, kantite plas, ak dat emisyon sètifika yo.
                    </p>
                  </div>

                  <div className="mt-8 grid gap-6 md:grid-cols-2">
                    <div className="space-y-4 rounded-2xl border-2 border-white/15 bg-background/40 p-6">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`grid size-11 place-items-center rounded-xl ${tabColors.schedule.ring} text-yellow-300`}
                        >
                          <Sparkles className="size-5" />
                        </div>
                        <h3 className="font-display text-xl font-bold">Tit fòmasyon</h3>
                      </div>
                      <div className="space-y-2.5">
                        <Label htmlFor="training-title">Non ki parèt nan paj akkèy la</Label>
                        <Input
                          id="training-title"
                          value={trainingTitle}
                          placeholder={existingTrainingTitle ?? "Masterclass AI an Kreyòl"}
                          onChange={(event) => setTrainingTitle(event.target.value)}
                        />
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Aktif:{" "}
                          <span className="font-semibold text-foreground">
                            {existingTrainingTitle ?? "Default"}
                          </span>
                        </p>
                      </div>
                      <Button
                        variant="neon"
                        size="lg"
                        onClick={() => {
                          const value = trainingTitle.trim();
                          if (!value) {
                            toast.error("Tanpri antre tit fòmasyon an.");
                            return;
                          }
                          updateTrainingTitleMutation.mutate(value);
                        }}
                        disabled={updateTrainingTitleMutation.isPending}
                      >
                        <Check /> Sove tit
                      </Button>
                    </div>

                    <div className="space-y-4 rounded-2xl border-2 border-white/15 bg-background/40 p-6">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`grid size-11 place-items-center rounded-xl ${tabColors.schedule.ring} text-purple-300`}
                        >
                          <Clock className="size-5" />
                        </div>
                        <h3 className="font-display text-xl font-bold">Dat & lè evènman</h3>
                      </div>
                      <div className="space-y-2.5">
                        <Label htmlFor="event-date">Pwochen sesyon live</Label>
                        <Input
                          id="event-date"
                          type="datetime-local"
                          value={eventDateValue}
                          onChange={(e) => setEventDateValue(e.target.value)}
                        />
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Sa a chanje Countdown la nan paj akkèy. Aktif:{" "}
                          <span className="font-semibold text-foreground">
                            {existingEventDate
                              ? new Date(existingEventDate).toLocaleString()
                              : "Default"}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 rounded-2xl border-2 border-white/15 bg-background/40 p-6">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`grid size-11 place-items-center rounded-xl ${tabColors.certificates.ring} text-green-300`}
                        >
                          <BarChart3 className="size-5" />
                        </div>
                        <h3 className="font-display text-xl font-bold">Kantite plas</h3>
                      </div>
                      <div className="space-y-2.5">
                        <Label htmlFor="total-spots">Total plas pou patisipan</Label>
                        <Input
                          id="total-spots"
                          type="number"
                          min="0"
                          step="10"
                          value={totalSpotsValue}
                          onChange={(e) => setTotalSpotsValue(e.target.value)}
                          placeholder={existingTotalSpots ?? "200"}
                        />
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Aktif:{" "}
                          <span className="font-bold text-foreground">
                            {existingTotalSpots ?? "200"} plas
                          </span>{" "}
                          · Rete:{" "}
                          <span className="font-bold text-green-400">
                            {Math.max(
                              0,
                              (parseInt(existingTotalSpots ?? "200", 10) || 200) - totalEnrollments,
                            )}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 rounded-2xl border-2 border-white/15 bg-background/40 p-6">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`grid size-11 place-items-center rounded-xl ${tabColors.youtube.ring} text-yellow-300`}
                        >
                          <Award className="size-5" />
                        </div>
                        <h3 className="font-display text-xl font-bold">Dat sètifika</h3>
                      </div>
                      <div className="space-y-2.5">
                        <Label htmlFor="cert-date">Emisyon sètifika patisipasyon</Label>
                        <Input
                          id="cert-date"
                          type="datetime-local"
                          value={certDateValue}
                          onChange={(e) => setCertDateValue(e.target.value)}
                        />
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Aktif:{" "}
                          <span className="font-semibold text-foreground">
                            {existingCertificateDate
                              ? new Date(existingCertificateDate).toLocaleDateString()
                              : "Pa defini"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <Button
                      variant="neon"
                      size="lg"
                      onClick={async () => {
                        let saved = false;
                        const eventVal = eventDateValue.trim();
                        const spotsVal = totalSpotsValue.trim();
                        const certVal = certDateValue.trim();

                        if (eventVal) {
                          const iso = new Date(eventVal).toISOString();
                          if (Number.isNaN(Date.parse(iso))) {
                            toast.error("Dat evènman an pa valid.");
                            return;
                          }
                          await updateAdminSettingFn({ data: { key: "event_date", value: iso } });
                          saved = true;
                        }
                        if (spotsVal) {
                          if (Number.isNaN(Number(spotsVal))) {
                            toast.error("Kantite plas la dwe yon nimewo valab.");
                            return;
                          }
                          await updateAdminSettingFn({
                            data: {
                              key: "total_spots",
                              value: String(Math.max(0, Number(spotsVal))),
                            },
                          });
                          saved = true;
                        }
                        if (certVal) {
                          const iso = new Date(certVal).toISOString();
                          if (Number.isNaN(Date.parse(iso))) {
                            toast.error("Dat sètifika a pa valid.");
                            return;
                          }
                          await updateAdminSettingFn({
                            data: { key: "certificate_emission_date", value: iso },
                          });
                          saved = true;
                        }
                        if (saved) {
                          toast.success("Konfigirasyon sove.");
                          setEventDateValue("");
                          setTotalSpotsValue("");
                          setCertDateValue("");
                          await refetch();
                        } else {
                          toast.info("Ou pa chanje anyen.");
                        }
                      }}
                    >
                      <Check /> Sove tout konfigirasyon
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        setEventDateValue(
                          existingEventDate
                            ? new Date(existingEventDate).toISOString().slice(0, 16)
                            : "",
                        );
                        setTotalSpotsValue(existingTotalSpots ?? "");
                        setCertDateValue(
                          existingCertificateDate
                            ? new Date(existingCertificateDate).toISOString().slice(0, 16)
                            : "",
                        );
                      }}
                    >
                      Retabli valè aktyèl
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="certificates" className="mt-0 space-y-6">
                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="glass rounded-3xl p-6 sm:p-8">
                    <div>
                      <div
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${tabColors.certificates.badge}`}
                      >
                        <Award className="size-4" /> Sètifika yo
                      </div>
                      <h2 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
                        Jere sètifika patisipan
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Debloque sètifika pou yon patisipan espesifik oswa pou tout moun nan menm
                        tan.
                      </p>
                    </div>

                    <div className="mt-8 rounded-2xl border border-border p-5 space-y-5">
                      <h3 className="flex items-center gap-2 font-display text-lg font-bold">
                        <Unlock className="size-5 text-green-400" /> Debloque pa imel
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Mete imel patisipan an pou debloque sèlman sètifika li a.
                      </p>
                      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                        <Input
                          placeholder="imel@egzanp.com"
                          value={unlockEmail}
                          onChange={(event) => setUnlockEmail(event.target.value)}
                          className="h-12 text-base"
                        />
                        <Button
                          variant="outlineNeon"
                          size="lg"
                          onClick={() => {
                            if (!unlockEmail.trim()) {
                              toast.error("Tanpri antre imel pou debloque.");
                              return;
                            }
                            unlockEmailMutation.mutate(unlockEmail.trim().toLowerCase());
                          }}
                          disabled={unlockEmailMutation.isPending}
                        >
                          <Check /> Debloque
                        </Button>
                      </div>
                    </div>

                    <div className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/5 p-5 space-y-5">
                      <h3 className="flex items-center gap-2 font-display text-lg font-bold text-destructive">
                        <Unlock className="size-5" /> Debloque TOUT sètifika
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Sa a pral debloke sètifika pou <strong>{totalEnrollments}</strong> patisipan
                        ki enskri yo. Aksyon sa a pa kapab anile.
                      </p>
                      <Button
                        variant="neon"
                        size="lg"
                        onClick={() => {
                          if (
                            confirm(
                              `Eske ou sèten? Sa a pral debloke sètifika pou tout ${totalEnrollments} patisipan yo.`,
                            )
                          ) {
                            unlockAllMutation.mutate();
                          }
                        }}
                        disabled={unlockAllMutation.isPending}
                      >
                        <Unlock /> Debloque tout sètifika kounye a
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="glass rounded-3xl p-6">
                      <h3 className="flex items-center gap-2 font-display text-lg font-bold">
                        <BarChart3 className="size-5 text-accent" /> Pwogrès debloqaj
                      </h3>
                      <div className="mt-5">
                        <div className="flex items-end justify-between">
                          <p className="font-display text-4xl font-black">{totalUnlocked}</p>
                          <p className="pb-1 text-muted-foreground">/ {totalEnrollments} total</p>
                        </div>
                        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-accent to-green-500 transition-all duration-700"
                            style={{ width: `${progressCert}%` }}
                          />
                        </div>
                        <p className="mt-2 text-right text-sm font-bold text-accent">
                          {progressCert}% debloque
                        </p>
                      </div>
                    </div>

                    <div className="glass rounded-3xl p-6 space-y-4 text-sm">
                      <div className="rounded-xl bg-muted/20 p-4">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Patisipan enskri
                        </p>
                        <p className="mt-1 font-display text-2xl font-black">{totalEnrollments}</p>
                      </div>
                      <div className="rounded-xl bg-green-500/10 p-4 border border-green-500/30">
                        <p className="text-xs uppercase tracking-wider text-green-400">
                          Sètifika debloke
                        </p>
                        <p className="mt-1 font-display text-2xl font-black text-green-400">
                          {totalUnlocked}
                        </p>
                      </div>
                      <div className="rounded-xl bg-yellow-500/10 p-4 border border-yellow-500/30">
                        <p className="text-xs uppercase tracking-wider text-yellow-400">
                          Rete pou debloke
                        </p>
                        <p className="mt-1 font-display text-2xl font-black text-yellow-400">
                          {totalEnrollments - totalUnlocked}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="modules" className="mt-0 space-y-6">
                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="glass rounded-3xl p-6 sm:p-8">
                    <div>
                      <div
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${tabColors.modules.badge}`}
                      >
                        <BookOpen className="size-4" /> Modil fòmasyon
                      </div>
                      <h2 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
                        Ajoute yon nouvo modil
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Chak modil gen yon dat. Lè dat la pase, modil la make otomatikman kòm{" "}
                        <strong className="text-green-400">Terminé</strong>.
                      </p>
                    </div>

                    <div className="mt-8 grid gap-6">
                      <div className="space-y-2.5">
                        <Label htmlFor="module-title">Non modil la</Label>
                        <Input
                          id="module-title"
                          value={moduleTitle}
                          onChange={(event) => setModuleTitle(event.target.value)}
                          placeholder="Egzanp: Modil 1 — Entwodiksyon ak entèlijans atifisyèl"
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label htmlFor="module-date">
                          <span className="mr-1.5">🗓️</span>Dat & Lè modil la
                        </Label>
                        <Input
                          id="module-date"
                          type="datetime-local"
                          value={moduleDate}
                          onChange={(event) => setModuleDate(event.target.value)}
                        />
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Lè dat ak lè sa a pase, modil la ap make otomatikman kòm "Terminé" nan paj
                          akkèy ak paj live la.
                        </p>
                      </div>
                      <div className="space-y-2.5">
                        <Label htmlFor="module-description">Deskripsyon modil la</Label>
                        <Textarea
                          id="module-description"
                          value={moduleDescription}
                          onChange={(event) => setModuleDescription(event.target.value)}
                          placeholder="Sa ki nan modil sa a... egzanp: Kijan pou w kreye kontni, zouti yo itilize, egzèsis pratik..."
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border-2 border-amber-500/40 bg-amber-500/10 p-4.5">
                        <div className="flex items-start gap-3.5">
                          <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-amber-500/50 bg-amber-500/15 text-amber-300">
                            <Lock className="size-5" />
                          </div>
                          <div>
                            <p className="font-bold text-amber-200 text-[1rem]">Modil Premium (Pou peye)</p>
                            <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">
                              Si ou aktive sa a, klikan yo ap dirije WhatsApp ou pou peye pou yo
                              jwenn aksè.
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={moduleIsPaid}
                          onCheckedChange={setModuleIsPaid}
                          className="data-[state=checked]:bg-amber-500 scale-110"
                        />
                      </div>

                      {moduleIsPaid && (
                        <div className="space-y-5 rounded-2xl border-2 border-amber-500/30 bg-amber-500/[0.06] p-5">
                          <div className="space-y-2.5">
                            <Label htmlFor="module-price" className="text-amber-200">
                              <span className="mr-1.5">💰</span>Pri a (monnen ak lajan)
                            </Label>
                            <Input
                              id="module-price"
                              value={modulePrice}
                              onChange={(e) => setModulePrice(e.target.value)}
                              placeholder="Egzanp: 500 HTG oswa 25 USD"
                              className="font-bold text-amber-200"
                            />
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              Mete pri a ak lajan an egzanp: "1500 HTG", "30 USD", "2500 Gdes"
                            </p>
                          </div>

                          <div className="space-y-3">
                            <Label className="text-amber-200">
                              <span className="mr-1.5">💳</span>Mwayen peman yo aksepte yo
                            </Label>
                            <div className="grid gap-2.5 sm:grid-cols-2">
                              {PAYMENT_METHODS.map((method) => (
                                <label
                                  key={method}
                                  className="flex items-center gap-3 rounded-2xl border-2 border-white/15 bg-secondary/60 p-3.5 cursor-pointer hover:bg-secondary hover:border-amber-500/40 transition-all"
                                >
                                  <Checkbox
                                    checked={modulePaymentMethods.includes(method)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setModulePaymentMethods([...modulePaymentMethods, method]);
                                      } else {
                                        setModulePaymentMethods(
                                          modulePaymentMethods.filter((m) => m !== method),
                                        );
                                      }
                                    }}
                                    className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 scale-110"
                                  />
                                  <span className="text-[0.95rem] font-semibold">{method}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      <Button
                        variant="neon"
                        size="xl"
                        onClick={() => {
                          if (
                            !moduleTitle.trim() ||
                            !moduleDescription.trim() ||
                            !moduleDate.trim()
                          ) {
                            toast.error("Tanpri ranpli non, deskripsyon ak dat modil la.");
                            return;
                          }
                          const iso = new Date(moduleDate).toISOString();
                          if (Number.isNaN(Date.parse(iso))) {
                            toast.error("Dat modil la pa valid.");
                            return;
                          }
                          addModuleMutation.mutate({
                            title: moduleTitle.trim(),
                            description: moduleDescription.trim(),
                            module_date: iso,
                            is_paid: moduleIsPaid,
                            price: moduleIsPaid ? modulePrice.trim() : "",
                            payment_methods: moduleIsPaid ? modulePaymentMethods : [],
                          });
                        }}
                        disabled={addModuleMutation.isPending}
                      >
                        <Plus /> Ajoute modil nan pwogram
                      </Button>
                    </div>
                  </div>

                  <div className="glass rounded-3xl p-6">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="flex items-center gap-2 font-display text-lg font-bold">
                        Lis modil yo
                      </h3>
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold">
                        {modules.length} total
                      </span>
                    </div>

                    <div className="mt-5 space-y-4 max-h-[550px] overflow-y-auto pr-2">
                      {isLoading ? (
                        <p className="text-sm text-muted-foreground py-8 text-center">
                          Chaje modil yo...
                        </p>
                      ) : modules.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border py-12 text-center">
                          <BookOpen className="mx-auto size-10 text-muted-foreground/40" />
                          <p className="mt-3 text-sm text-muted-foreground">Pa gen modil ankò.</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Ajoute premye modil la bò gòch la.
                          </p>
                        </div>
                      ) : (
                        modules.map((module) => {
                          const isCompleted = new Date(module.module_date) < new Date();
                          const isEditing = editingModuleId === module.id;
                          return (
                            <div
                              key={module.id}
                              className={`rounded-2xl border p-4 ${
                                isCompleted ? "border-green-500/40 bg-green-500/5" : "border-border"
                              }`}
                            >
                              {isEditing ? (
                                <div className="space-y-3">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Non modil la</Label>
                                    <Input
                                      value={editModuleTitle}
                                      onChange={(e) => setEditModuleTitle(e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Dat & lè</Label>
                                    <Input
                                      type="datetime-local"
                                      value={editModuleDate}
                                      onChange={(e) => setEditModuleDate(e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Deskripsyon</Label>
                                    <Textarea
                                      value={editModuleDescription}
                                      onChange={(e) => setEditModuleDescription(e.target.value)}
                                      rows={2}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                                    <div className="flex items-center gap-2">
                                      <Lock className="size-3.5 text-amber-400" />
                                      <span className="text-xs font-semibold text-amber-200">
                                        Modil Premium (Pou peye)
                                      </span>
                                    </div>
                                    <Switch
                                      checked={editModuleIsPaid}
                                      onCheckedChange={setEditModuleIsPaid}
                                      className="data-[state=checked]:bg-amber-500"
                                    />
                                  </div>

                                  {editModuleIsPaid && (
                                    <div className="space-y-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-3">
                                      <div className="space-y-1">
                                        <Label className="text-xs font-semibold text-amber-200">
                                          💰 Pri a
                                        </Label>
                                        <Input
                                          value={editModulePrice}
                                          onChange={(e) => setEditModulePrice(e.target.value)}
                                          placeholder="Egzanp: 500 HTG"
                                          className="h-9 text-sm font-semibold text-amber-300"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-amber-200">
                                          💳 Mwayen peman
                                        </Label>
                                        <div className="grid gap-1.5 sm:grid-cols-2">
                                          {PAYMENT_METHODS.map((method) => (
                                            <label
                                              key={method}
                                              className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 p-2 cursor-pointer hover:bg-secondary/70 transition-colors"
                                            >
                                              <Checkbox
                                                checked={editModulePaymentMethods.includes(method)}
                                                onCheckedChange={(checked) => {
                                                  if (checked) {
                                                    setEditModulePaymentMethods([
                                                      ...editModulePaymentMethods,
                                                      method,
                                                    ]);
                                                  } else {
                                                    setEditModulePaymentMethods(
                                                      editModulePaymentMethods.filter(
                                                        (m) => m !== method,
                                                      ),
                                                    );
                                                  }
                                                }}
                                                className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 size-4"
                                              />
                                              <span className="text-xs font-medium">{method}</span>
                                            </label>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="neon"
                                      onClick={() => {
                                        if (
                                          !editModuleTitle.trim() ||
                                          !editModuleDescription.trim() ||
                                          !editModuleDate.trim()
                                        ) {
                                          toast.error("Tanpri ranpli tout chan.");
                                          return;
                                        }
                                        const iso = new Date(editModuleDate).toISOString();
                                        if (Number.isNaN(Date.parse(iso))) {
                                          toast.error("Dat la pa valid.");
                                          return;
                                        }
                                        updateModuleMutation.mutate({
                                          id: module.id,
                                          title: editModuleTitle.trim(),
                                          description: editModuleDescription.trim(),
                                          module_date: iso,
                                          is_paid: editModuleIsPaid,
                                          price: editModuleIsPaid ? editModulePrice.trim() : "",
                                          payment_methods: editModuleIsPaid
                                            ? editModulePaymentMethods
                                            : [],
                                        });
                                      }}
                                      disabled={updateModuleMutation.isPending}
                                    >
                                      <Check /> Sove
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingModuleId(null);
                                        setEditModuleTitle("");
                                        setEditModuleDescription("");
                                        setEditModuleDate("");
                                        setEditModuleIsPaid(false);
                                        setEditModulePrice("");
                                        setEditModulePaymentMethods([]);
                                      }}
                                    >
                                      <X /> Anile
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-semibold truncate">{module.title}</p>
                                        {(module as unknown as { is_paid?: boolean }).is_paid && (
                                          <span className="inline-flex items-center gap-1 shrink-0 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-300">
                                            <Lock className="size-3" /> Premium
                                          </span>
                                        )}
                                        {isCompleted ? (
                                          <span className="inline-flex items-center gap-1 shrink-0 rounded-full border border-green-500/40 bg-green-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-green-400">
                                            <CheckCircle2 className="size-3" /> Terminé
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 shrink-0 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase text-accent">
                                            <Clock className="size-3" /> Ap vini
                                          </span>
                                        )}
                                      </div>
                                      <p className="mt-1 text-xs text-muted-foreground">
                                        🗓️ {new Date(module.module_date).toLocaleDateString()} ·{" "}
                                        {new Date(module.module_date).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </p>
                                      {(() => {
                                        const typedMod = module as unknown as {
                                          price?: string;
                                          payment_methods?: string[];
                                        };
                                        const paid = (module as unknown as { is_paid?: boolean })
                                          .is_paid;
                                        if (!paid) return null;
                                        return (
                                          <div className="mt-2 space-y-1.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-2.5">
                                            {typedMod.price && (
                                              <p className="text-xs font-bold text-amber-300">
                                                💰 Pri:{" "}
                                                <span className="font-black">{typedMod.price}</span>
                                              </p>
                                            )}
                                            {Array.isArray(typedMod.payment_methods) &&
                                              typedMod.payment_methods.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                  {typedMod.payment_methods.map((m) => (
                                                    <span
                                                      key={m}
                                                      className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200"
                                                    >
                                                      {m}
                                                    </span>
                                                  ))}
                                                </div>
                                              )}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const typedMod = module as unknown as {
                                            is_paid?: boolean;
                                            price?: string;
                                            payment_methods?: string[];
                                          };
                                          setEditingModuleId(module.id);
                                          setEditModuleTitle(module.title);
                                          setEditModuleDescription(module.description);
                                          setEditModuleIsPaid(typedMod.is_paid ?? false);
                                          setEditModulePrice(typedMod.price ?? "");
                                          setEditModulePaymentMethods(
                                            Array.isArray(typedMod.payment_methods)
                                              ? typedMod.payment_methods
                                              : [],
                                          );
                                          try {
                                            setEditModuleDate(
                                              new Date(module.module_date)
                                                .toISOString()
                                                .slice(0, 16),
                                            );
                                          } catch {
                                            setEditModuleDate("");
                                          }
                                        }}
                                      >
                                        <Pencil />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          if (
                                            confirm(`Eske ou vle efase modil: "${module.title}"?`)
                                          ) {
                                            deleteModuleMutation.mutate(module.id);
                                          }
                                        }}
                                        disabled={deleteModuleMutation.isPending}
                                      >
                                        <Trash2 />
                                      </Button>
                                    </div>
                                  </div>
                                  <p className="mt-3 text-sm text-muted-foreground whitespace-pre-line">
                                    {module.description}
                                  </p>
                                </>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="resources" className="mt-0">
                <div className="glass rounded-3xl p-6 sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${tabColors.resources.badge}`}
                      >
                        <Download className="size-4" /> Resous telechajman
                      </div>
                      <h2 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
                        Jere lyen resous yo (PDF &amp; ZIP)
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Mete lyen piblik yo pou chak resous. Ou ka itilize Supabase Storage, Google
                        Drive, Dropbox oswa nenpòt sèvis stockage ki bay lyen piblik.
                      </p>
                    </div>
                    <div
                      className={`rounded-2xl px-5 py-3 text-sm font-bold ${
                        existingResourceGuideUrl || existingResourceCodeUrl
                          ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/40"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {[existingResourceGuideUrl, existingResourceCodeUrl].filter(Boolean).length}/2
                      {" "}aktif
                    </div>
                  </div>

                  <div className="mt-8 grid gap-6 lg:grid-cols-2">
                    <div className="space-y-5 rounded-2xl border border-border p-5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`grid size-9 place-items-center rounded-lg ${tabColors.resources.ring} text-cyan-400`}
                        >
                          <BookOpen className="size-4" />
                        </div>
                        <div>
                          <h3 className="font-display text-lg font-bold">Gid konplè PDF</h3>
                          <p className="text-[11px] text-muted-foreground">Rezime tout sesyon an</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guide-url">URL piblik PDF la</Label>
                        <Input
                          id="guide-url"
                          value={resourceGuideUrl}
                          onChange={(e) => setResourceGuideUrl(e.target.value)}
                          placeholder={
                            existingResourceGuideUrl ??
                            "https://.../gid-komple-masterclass-ai.pdf"
                          }
                          className="h-12 font-mono text-sm"
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Aktif:{" "}
                          {existingResourceGuideUrl ? (
                            <a
                              href={existingResourceGuideUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-accent underline break-all"
                            >
                              {existingResourceGuideUrl}
                            </a>
                          ) : (
                            <span className="text-destructive">(Pa defini)</span>
                          )}
                        </p>
                      </div>
                      <Button
                        variant="neon"
                        onClick={async () => {
                          const val = resourceGuideUrl.trim();
                          if (!val) {
                            toast.error("Tanpri antre URL pou gid PDF la.");
                            return;
                          }
                          await updateAdminSettingFn({
                            data: { key: "resource_guide_url", value: val },
                          });
                          toast.success("URL gid PDF la sove.");
                          setResourceGuideUrl("");
                          await refetch();
                        }}
                      >
                        <Check /> Sove lyen sa
                      </Button>
                    </div>

                    <div className="space-y-5 rounded-2xl border border-border p-5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`grid size-9 place-items-center rounded-lg ${tabColors.resources.ring} text-cyan-400`}
                        >
                          <ClipboardList className="size-4" />
                        </div>
                        <div>
                          <h3 className="font-display text-lg font-bold">Egzanp kòd</h3>
                          <p className="text-[11px] text-muted-foreground">Kòd sous aplikasyon</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="code-url">URL piblik ZIP la</Label>
                        <Input
                          id="code-url"
                          value={resourceCodeUrl}
                          onChange={(e) => setResourceCodeUrl(e.target.value)}
                          placeholder={
                            existingResourceCodeUrl ??
                            "https://.../egzanp-kod-masterclass-ai.zip"
                          }
                          className="h-12 font-mono text-sm"
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Aktif:{" "}
                          {existingResourceCodeUrl ? (
                            <a
                              href={existingResourceCodeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-accent underline break-all"
                            >
                              {existingResourceCodeUrl}
                            </a>
                          ) : (
                            <span className="text-destructive">(Pa defini)</span>
                          )}
                        </p>
                      </div>
                      <Button
                        variant="neon"
                        onClick={async () => {
                          const val = resourceCodeUrl.trim();
                          if (!val) {
                            toast.error("Tanpri antre URL pou ZIP kòd la.");
                            return;
                          }
                          await updateAdminSettingFn({
                            data: { key: "resource_code_url", value: val },
                          });
                          toast.success("URL egzanp kòd la sove.");
                          setResourceCodeUrl("");
                          await refetch();
                        }}
                      >
                        <Check /> Sove lyen sa
                      </Button>
                    </div>
                  </div>

                  <div className="mt-8 rounded-2xl border border-border bg-muted/20 p-5">
                    <h3 className="font-semibold text-sm mb-3">
                      💡 Kijan pou w jwenn yon URL piblik valab?
                    </h3>
                    <ul className="text-xs text-muted-foreground space-y-2 list-decimal pl-5">
                      <li>
                        <strong className="text-foreground">Supabase Storage (Rekòmande):</strong>{" "}
                        Upload file nan bucket piblik la, lè sa a kopi URL piblik la.
                      </li>
                      <li>
                        <strong className="text-foreground">Google Drive:</strong>{" "}
                        Pataje fichye a ak "Nenpòt moun ki gen lyen" epi itilize lyen telechajman
                        dirèk la.
                      </li>
                      <li>
                        <strong className="text-foreground">Dropbox:</strong>{" "}
                        Kreye lyen pataje epi chanje `?dl=0` nan `?dl=1` nan fen URL la.
                      </li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>
            Pou jwenn aksè dirèk:{" "}
            <a className="font-medium text-accent underline" href="/admin">
              /admin
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({
  icon,
  label,
  goToTab,
  onClick,
  color,
  onGoToTab,
}: {
  icon: React.ReactNode;
  label: string;
  goToTab?: string;
  onClick?: () => void;
  color?: string;
  onGoToTab?: (tab: string) => void;
}) {
  const attrs = goToTab ? { "data-action": `go-tab-${goToTab}` as any } : {};
  return (
    <Button
      variant="outline"
      className={`h-auto !flex-col !items-start !justify-start gap-2 rounded-2xl border-border p-4 text-left hover:border-accent/50 hover:bg-accent/5 ${color ?? ""}`}
      onClick={() => {
        if (goToTab && onGoToTab) onGoToTab(goToTab);
        if (onClick) onClick();
      }}
      {...attrs}
    >
      <div className="grid size-10 place-items-center rounded-xl bg-secondary">{icon}</div>
      <span className="text-sm font-semibold !text-foreground">{label}</span>
    </Button>
  );
}
