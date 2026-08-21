import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CheckCircle2,
  Loader2,
  Search,
  ShieldCheck,
  ShieldAlert,
  XCircle,
  Lock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CertLang } from "@/lib/certificate-copy";

export const Route = createFileRoute("/verify")({
  head: () => ({
    meta: [
      { title: "Verifye Sètifika — Masterclass AI" },
      {
        name: "description",
        content:
          "Verifye otantisite yon sètifika Masterclass AI lè w itilize kòd verifikasyon inik la.",
      },
      { property: "og:title", content: "Verifye Sètifika — Masterclass AI" },
      {
        property: "og:description",
        content: "Verifye si yon sètifika Masterclass AI se otantik.",
      },
    ],
  }),
  component: VerifyPage,
});

type VerifyResult = {
  status: "valid" | "invalid" | "locked" | "not_found";
  full_name?: string;
  cert_lang?: CertLang;
  verification_id?: string;
  created_at?: string;
  certificate_unlocked?: boolean;
};

const LANG_LABELS: Record<CertLang, string> = {
  ht: "Kreyòl Ayisyen",
  fr: "Fransè",
  es: "Panyòl",
  en: "Anglè",
};

function VerifyPage() {
  const search = useSearch({ strict: false }) as { code?: string };
  const [code, setCode] = useState(search.code ?? "");

  const verify = useMutation({
    mutationFn: async (value: string): Promise<VerifyResult> => {
      const trimmed = value.trim().toUpperCase();
      if (!trimmed) return { status: "invalid" };
      const { data, error } = await supabase.rpc("verifye_sertifika", {
        p_verification_id: trimmed,
      });
      if (error) throw error;
      const result = data as unknown as VerifyResult;
      return result;
    },
    onError: () => toast.error("Koneksyon an echwe. Eseye ankò."),
  });

  const submittedCode = useMemo(() => {
    if (verify.data) return code.trim().toUpperCase();
    return null;
  }, [verify.data, code]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = code.trim();
    if (!value) {
      toast.error("Tanpri mete kòd verifikasyon an.");
      return;
    }
    verify.mutate(value);
  };

  const handlePrefilled = () => {
    if (search.code) verify.mutate(search.code);
  };

  return (
    <div className="relative">
      <div className="absolute inset-0 grid-backdrop opacity-25" />
      <div className="relative mx-auto max-w-3xl px-4 py-16">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-4 py-1.5 text-xs font-bold tracking-[0.2em] text-gold uppercase">
            <ShieldCheck className="size-3.5" /> Verifikasyon
          </span>
          <h1 className="mt-6 font-display text-2xl font-black uppercase glow-title sm:text-4xl">
            Verifye <span className="text-gradient-neon">sètifika</span> ou
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Mete kòd verifikasyon inik ki sou sètifika a oswa eskanne QR la pou w konfime si li se
            yon sètifika otantik Masterclass AI.
          </p>
        </div>

        <div className="mt-10 space-y-6">
          <Card className="glass border-border/50 rounded-3xl p-6 sm:p-8">
            <CardContent className="p-0">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="verify-code">Kòd Verifikasyon</Label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Input
                      id="verify-code"
                      type="text"
                      maxLength={50}
                      value={code}
                      placeholder="MAI-2026-XXXXXXXX"
                      onChange={(e) => setCode(e.target.value)}
                      className="font-mono tracking-wider uppercase"
                    />
                    <Button
                      type="submit"
                      variant="neon"
                      size="lg"
                      disabled={verify.isPending}
                      className="sm:min-w-[180px]"
                    >
                      {verify.isPending ? <Loader2 className="animate-spin" /> : <Search />}
                      Verifye
                    </Button>
                  </div>
                  {search.code && !verify.data && (
                    <p className="text-xs text-muted-foreground">
                      Kòd la nan URL la:{" "}
                      <button
                        type="button"
                        onClick={handlePrefilled}
                        className="underline underline-offset-2 hover:text-accent"
                      >
                        Klike la pou verifye {search.code}
                      </button>
                    </p>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {verify.data && submittedCode && <ResultCard result={verify.data} code={submittedCode} />}
        </div>
      </div>
    </div>
  );
}

function ResultCard({ result, code }: { result: VerifyResult; code: string }) {
  const emitted = result.created_at ? new Date(result.created_at) : null;

  if (result.status === "valid") {
    return (
      <Card className="glass border-emerald-500/40 rounded-3xl p-6 sm:p-8">
        <CardContent className="p-0">
          <div className="flex items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/40">
              <CheckCircle2 className="size-6" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="font-display text-xl font-bold text-emerald-400">
                  Sètifika otantik ✓
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Kòd la koresponn a yon sètifika ki te dekouvri nan baz done Masterclass AI.
                </p>
              </div>
              <div className="grid gap-3 rounded-2xl bg-background/50 p-4 sm:grid-cols-2">
                <InfoRow label="Non patisipan an" value={result.full_name ?? "—"} />
                <InfoRow
                  label="Kòd verifikasyon"
                  value={
                    <span className="font-mono tracking-wider">
                      {result.verification_id ?? code}
                    </span>
                  }
                />
                <InfoRow
                  label="Lang sètifika a"
                  value={result.cert_lang ? LANG_LABELS[result.cert_lang] : "—"}
                />
                <InfoRow
                  label="Enskripsyon fet"
                  value={
                    emitted
                      ? emitted.toLocaleDateString("fr-FR", {
                          dateStyle: "long",
                        }) +
                        " " +
                        emitted.toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"
                  }
                />
              </div>
              <Badge className="w-full justify-center rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40">
                <ShieldCheck className="size-3.5" /> Verifikasyon reisi
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (result.status === "locked") {
    return (
      <Card className="glass border-amber-500/40 rounded-3xl p-6 sm:p-8">
        <CardContent className="p-0">
          <div className="flex items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/40">
              <Lock className="size-6" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="font-display text-xl font-bold text-amber-400">
                  Sètifika poko debloque
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enskripsyon an egziste, men admin poko debloke sètifika a pou patisipan an.
                </p>
              </div>
              <div className="grid gap-3 rounded-2xl bg-background/50 p-4 sm:grid-cols-2">
                <InfoRow label="Non patisipan an" value={result.full_name ?? "—"} />
                <InfoRow
                  label="Kòd verifikasyon"
                  value={
                    <span className="font-mono tracking-wider">
                      {result.verification_id ?? code}
                    </span>
                  }
                />
              </div>
              <Badge className="w-full justify-center rounded-full bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/40">
                <ShieldAlert className="size-3.5" /> Lòj an fèm toujou
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (result.status === "not_found") {
    return (
      <Card className="glass border-destructive/40 rounded-3xl p-6 sm:p-8">
        <CardContent className="p-0">
          <div className="flex items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-destructive/15 text-destructive ring-1 ring-destructive/40">
              <XCircle className="size-6" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="font-display text-xl font-bold text-destructive">
                  Sètifika pa jwenn
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Okenn sètifika nan baz done Masterclass AI pa koresponn ak kòd sa a. Verifye si
                  kòd la antre kòrèkteman.
                </p>
              </div>
              <div className="rounded-2xl bg-background/50 p-4">
                <InfoRow
                  label="Kòd ki te teste"
                  value={<span className="font-mono tracking-wider">{code}</span>}
                />
              </div>
              <Badge className="w-full justify-center rounded-full bg-destructive/15 text-destructive-foreground ring-1 ring-destructive/40">
                <ShieldAlert className="size-3.5" /> Verifikasyon echwe
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
