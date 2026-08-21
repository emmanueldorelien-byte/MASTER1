import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  CheckCircle2,
  Clock,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
  Sparkles,
  Ticket,
  User,
} from "lucide-react";
import { markAttendance, type MarkAttendanceResult } from "@/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@tanstack/react-router";

const schema = z.object({
  first_name: z
    .string()
    .trim()
    .min(2, { message: "Non ou dwe gen omwen 2 karaktè" })
    .max(100, { message: "Non an twò long" }),
  last_name: z
    .string()
    .trim()
    .min(2, { message: "Non fanmi ou dwe gen omwen 2 karaktè" })
    .max(100, { message: "Non fanmi an twò long" }),
  email: z
    .string()
    .trim()
    .email({ message: "Imel la pa valid" })
    .max(255, { message: "Imel la twò long" }),
  code: z
    .string()
    .trim()
    .min(4, { message: "Kòd la dwe gen omwen 4 karaktè" })
    .max(50, { message: "Kòd la twò long" }),
});

type SuccessInfo = {
  verification_id: string;
  module_title?: string;
  module_id?: string;
  email: string;
  full_name: string;
};

export function AttendanceForm() {
  const markAttendanceFn = useServerFn(markAttendance);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    code: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<SuccessInfo | null>(null);

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof schema>): Promise<MarkAttendanceResult> => {
      return markAttendanceFn({ data: values });
    },
    onSuccess: (result, values) => {
      if (result.status === "ok" || result.status === "already") {
        const info: SuccessInfo = {
          verification_id: result.verification_id ?? "",
          ...(result.module_title ? { module_title: result.module_title } : {}),
          ...(result.module_id ? { module_id: result.module_id } : {}),
          email: values.email,
          full_name: `${values.first_name} ${values.last_name}`.trim(),
        };
        setSuccess(info);
        if (result.status === "ok") {
          toast.success("Asistans make avèk siksè! 🎉", {
            description: result.message,
            icon: <CheckCircle2 />,
          });
        } else {
          toast.info("Ou te deja make asistans", {
            description: result.message,
            icon: <Clock />,
          });
        }
      } else if (result.status === "invalid_code") {
        toast.error("Kòd a pa valid", {
          description: result.message ?? "Verifye kòd la epi eseye ankò.",
        });
      } else if (result.status === "expired") {
        toast.error("Kòd sa a ekspire", {
          description: result.message ?? "Kòd la pa valab ankò.",
        });
      } else if (result.status === "inactive") {
        toast.error("Kòd sa a poko aktif", {
          description: result.message ?? "Kòd la pa disponib kounye a.",
        });
      } else {
        toast.error(result.message ?? "Yon erè rive. Eseye ankò.");
      }
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : String(err ?? "");
      toast.error("Koneksyon an echwe.", {
        description: msg ? `${msg}` : "Tanpri verifye koneksyon ou epi eseye ankò.",
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

  if (success) {
    return (
      <div className="glass space-y-5 rounded-3xl p-6 sm:p-8 border-emerald-500/40">
        <div className="flex items-start gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/40">
            <CheckCircle2 className="size-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-xl font-bold text-emerald-400">
              Asistans konte pou modil la!
            </h3>
            {success.module_title && (
              <p className="mt-1 text-sm text-muted-foreground">
                Modil: <span className="font-semibold text-foreground">{success.module_title}</span>
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl bg-background/50 p-4">
          <div className="space-y-0.5">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Non patisipan an
            </dt>
            <dd className="text-sm font-medium">{success.full_name}</dd>
          </div>
          <div className="space-y-0.5">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Imel
            </dt>
            <dd className="text-sm font-medium">{success.email}</dd>
          </div>
          <div className="space-y-0.5">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Kòd verifikasyon sètifika
            </dt>
            <dd className="font-mono text-sm font-bold tracking-wider text-accent">
              {success.verification_id}
            </dd>
          </div>
        </div>

        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4">
          <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <Sparkles className="size-4 text-accent" />
            Sètifika ou disponib kounye a!
          </p>
          <p className="text-xs text-muted-foreground mb-3">Pou jenere ak telechaje sètifika ou:</p>
          <div className="space-y-2">
            <Button asChild variant="neon" size="lg" className="w-full">
              <Link to="/sertifika">Ale nan paj sètifika →</Link>
            </Button>
            <p className="text-[11px] text-center text-muted-foreground">
              Nan paj sètifika a, mete imel{" "}
              <code className="rounded bg-black/30 px-1">{success.email}</code> ak tit modil la.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outlineNeon"
          className="w-full"
          onClick={() => {
            setSuccess(null);
            setForm({ first_name: "", last_name: "", email: "", code: "" });
          }}
        >
          Make yon lòt asistans
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="glass space-y-5 rounded-3xl p-6 sm:p-8">
      <div className="flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent/5 px-4 py-3">
        <Ticket className="size-5 text-accent shrink-0" />
        <p className="text-sm text-muted-foreground">
          Mete <span className="font-semibold text-foreground">kòd asistans</span> ke admin la
          pataje avèk ou apre sesyon an.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="att-first-name">
            <User className="inline size-3.5 mr-1 text-accent" />
            Non
          </Label>
          <Input
            id="att-first-name"
            value={form.first_name}
            maxLength={100}
            placeholder="Marie"
            onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
          />
          {errors["first_name"] && (
            <p className="text-xs text-destructive">{errors["first_name"]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="att-last-name">Non fanmi</Label>
          <Input
            id="att-last-name"
            value={form.last_name}
            maxLength={100}
            placeholder="Pierre-Louis"
            onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
          />
          {errors["last_name"] && <p className="text-xs text-destructive">{errors["last_name"]}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="att-email">
          <Mail className="inline size-3.5 mr-1 text-accent" />
          Adrès imel
        </Label>
        <Input
          id="att-email"
          type="email"
          value={form.email}
          maxLength={255}
          placeholder="ou@imel.com"
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        {errors["email"] && <p className="text-xs text-destructive">{errors["email"]}</p>}
        <p className="text-[11px] text-muted-foreground">
          Menm imel la ou pral itilize pou verifye ak telechaje sètifika ou.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="att-code">
          <KeyRound className="inline size-3.5 mr-1 text-accent" />
          Kòd asistans (admin ba w li)
        </Label>
        <Input
          id="att-code"
          value={form.code}
          maxLength={50}
          placeholder="ABCD-1234"
          className="font-mono tracking-wider uppercase"
          onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
        />
        {errors["code"] && <p className="text-xs text-destructive">{errors["code"]}</p>}
      </div>

      <Button
        type="submit"
        variant="neon"
        size="xl"
        className="w-full"
        disabled={mutation.isPending}
      >
        {mutation.isPending ? <Loader2 className="animate-spin" /> : <KeyRound />}
        Make asistans mwen
      </Button>

      <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5 text-accent" />
        Enfòmasyon ou rete prive. Nou pa pataje yo ak pèsonn.
      </p>
    </form>
  );
}
