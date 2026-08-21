import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  Download,
  FileCode2,
  FileText,
  Gift,
  Lock,
  LogIn,
  MessageCircle,
  Radio,
  Wand2,
  Youtube,
} from "lucide-react";
import { Countdown } from "@/components/Countdown";
import { Button } from "@/components/ui/button";
import { useReveal } from "@/lib/use-reveal";
import { getLiveData } from "@/admin.functions";
import { useAuth } from "@/hooks/useAuth";
import { AuthDialog } from "@/components/AuthDialog";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "Live & Resous — Masterclass AI an kreyòl" },
      {
        name: "description",
        content:
          "Swiv Masterclass AI la an dirèk sou YouTube epi telechaje tout resous yo: PDF ak egzanp kòd.",
      },
      { property: "og:title", content: "Live & Resous — Masterclass AI" },
      {
        property: "og:description",
        content: "Live YouTube ak resous gratis pou patisipan Masterclass AI la.",
      },
    ],
  }),
  component: LivePage,
});

type ResourceItem = {
  icon: typeof FileText;
  title: string;
  text: string;
  meta: string;
  url: string | null;
  downloadName: string;
};

function buildResources(
  guideUrl: string | null,
  codeUrl: string | null,
): ResourceItem[] {
  return [
    {
      icon: FileText,
      title: "Gid konplè PDF",
      text: "Rezime tout sesyon an ak etap pa etap pou chak zouti.",
      meta: "PDF · 2.4 MB",
      url: guideUrl,
      downloadName: "masterclass-ai-gid-komple.pdf",
    },
    {
      icon: FileCode2,
      title: "Egzanp kòd",
      text: "Kòd sous aplikasyon nou bati pandan live la.",
      meta: "ZIP · 1.1 MB",
      url: codeUrl,
      downloadName: "masterclass-ai-egzanp-kod.zip",
    },
  ];
}

function getYoutubeEmbedUrl(link: string) {
  if (!link) return "";
  try {
    const url = new URL(link);
    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.slice(1);
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.hostname.includes("youtube.com")) {
      if (url.pathname.includes("/watch")) {
        return `https://www.youtube.com/embed/${url.searchParams.get("v") ?? ""}`;
      }
      if (url.pathname.includes("/embed/")) {
        return link;
      }
    }
  } catch {
    // Ignore invalid URL and return raw string.
  }
  return link;
}

function LivePage() {
  const reveal = useReveal<HTMLDivElement>();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const getLiveDataFn = useServerFn(getLiveData);
  const { data, isLoading } = useQuery({
    queryKey: ["live-data"],
    queryFn: async () => getLiveDataFn(),
    staleTime: 60_000,
  });

  const youtubeLink = data?.youtubeLink ?? "";
  const embedUrl = getYoutubeEmbedUrl(youtubeLink);
  const modules = data?.modules ?? [];
  const whatsappAdmin = data?.whatsappAdmin ?? "";
  const whatsappTemplate = data?.whatsappMessage ?? "";
  const resources = buildResources(
    data?.resourceGuideUrl ?? null,
    data?.resourceCodeUrl ?? null,
  );

  function buildWhatsAppLink(moduleTitle: string) {
    const rawPhone = (whatsappAdmin || "").replace(/\D/g, "");
    if (!rawPhone) return "";
    const message = (whatsappTemplate || "").replaceAll("{MODULE_TITLE}", moduleTitle);
    return `https://wa.me/${rawPhone}?text=${encodeURIComponent(message)}`;
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 grid-backdrop opacity-25" />
      <div className="relative mx-auto max-w-5xl px-4 py-16">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-destructive/50 bg-destructive/10 px-5 py-2 text-sm font-black tracking-[0.2em] uppercase">
            <span className="size-2.5 animate-pulse-glow rounded-full bg-destructive" /> Live
          </span>
          <h1 className="mt-6 font-display text-2xl font-black uppercase glow-title sm:text-4xl">
            Sant <span className="text-gradient-neon">Live</span> &amp; Resous
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground font-medium">
            Sesyon an ap difize dirèkteman sou YouTube. Paj sa a ap vin aktif otomatikman lè lyen
            admin nan defini.
          </p>
        </div>

        <div className="glass mt-10 overflow-hidden rounded-3xl p-2 sm:p-3">
          {youtubeLink ? (
            <div className="relative w-full overflow-hidden rounded-2xl bg-black/60 pt-[56.25%]">
              <iframe
                className="absolute inset-0 size-full"
                src={embedUrl}
                title="Masterclass AI — Live YouTube"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          ) : (
            <div className="relative flex min-h-[280px] items-center justify-center rounded-2xl bg-black/80 px-6 py-12 text-center text-base text-muted-foreground">
              <div className="max-w-md space-y-3">
                <p className="text-xl font-bold text-foreground">Lyen YouTube pa defini ankò.</p>
                <p className="leading-relaxed font-medium">
                  Mete li nan panèl administrasyon pou pèmèt live la ekri sou paj sa a.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button variant="neon" size="lg" asChild disabled={!youtubeLink}>
            <a href={youtubeLink || "https://www.youtube.com"} target="_blank" rel="noreferrer">
              <Youtube /> Ouvri sou YouTube
            </a>
          </Button>
          <Button variant="outlineNeon" size="lg" asChild>
            <a href="#resous">
              <Download /> Resous yo
            </a>
          </Button>
        </div>

        <div className="mt-14">
          <Countdown />
        </div>

        <section id="resous" className="mt-20 scroll-mt-20">
          <h2 className="font-display text-2xl font-black uppercase sm:text-3xl">
            Resous pou <span className="text-gradient-neon">patisipan</span>
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground font-medium">
            Telechaje dokiman yo pandan oswa apre sesyon an.
          </p>

          <div ref={reveal.ref} {...reveal.props} className="reveal mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {resources.map((r) => {
              const hasUrl = r.url && r.url.trim().length > 0;
              const canDownload = !!user && hasUrl;
              const needsLogin = hasUrl && !user;
              return (
                <article key={r.title} className="glass glass-hover flex flex-col rounded-3xl p-7">
                  <span className="grid size-12 place-items-center rounded-2xl border border-accent/40 bg-accent/10 shadow-[0_0_24px_-6px_rgba(var(--accent),0.45)]">
                    <r.icon className="size-5.5 text-accent" />
                  </span>
                  <h3 className="mt-5 font-display text-xl font-black leading-tight">{r.title}</h3>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground font-medium">{r.text}</p>
                  <p className="mt-auto pt-5 text-sm tracking-widest text-muted-foreground uppercase font-bold">
                    {r.meta}
                  </p>
                  {canDownload ? (
                    <Button variant="outlineNeon" size="sm" className="mt-4 w-full" asChild>
                      <a
                        href={r.url!}
                        download={r.downloadName}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download /> Telechaje
                      </a>
                    </Button>
                  ) : needsLogin ? (
                    <Button
                      variant="neon"
                      size="sm"
                      className="mt-4 w-full"
                      onClick={() => setAuthOpen(true)}
                    >
                      <LogIn className="size-4" /> Konekte pou Telechaje
                    </Button>
                  ) : (
                    <Button
                      variant="outlineNeon"
                      size="sm"
                      className="mt-4 w-full opacity-60"
                      disabled
                      title="Lyen telechajman la poko disponib."
                    >
                      <Download /> Pa disponib ankò
                    </Button>
                  )}
                </article>
              );
            })}
          </div>

          <section className="mt-16">
            <h3 className="font-display text-2xl font-black uppercase leading-tight">
              Pwogram <span className="text-gradient-neon">fòmasyon an</span>
            </h3>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground font-medium">
              {modules.length > 0
                ? "Modil fòmasyon yo ki make kòm 'Termine' lè dat yo pase."
                : "Modil fòmasyon yo ap bientòt disponib."}
            </p>
            {modules.length > 0 && (
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {modules.map((module) => {
                  const isCompleted = new Date(module.module_date) < new Date();
                  const dateObj = new Date(module.module_date);
                  const typedMod = module as unknown as {
                    is_paid?: boolean;
                    price?: string;
                    payment_methods?: string[];
                  };
                  const paid = typedMod?.is_paid ?? false;
                  const waLink = paid ? buildWhatsAppLink(module.title) : "";
                  const CardTag = paid && waLink ? "a" : "article";
                  const cardExtraProps =
                    paid && waLink ? { href: waLink, target: "_blank", rel: "noreferrer" } : {};
                  return (
                    <CardTag
                      key={module.id}
                      {...cardExtraProps}
                      className={`glass rounded-3xl p-6 relative block ${
                        isCompleted ? "border-green-500/40" : ""
                      } ${paid ? "border-amber-500/40 hover:border-amber-400/70 hover:shadow-[0_0_30px_-10px_rgba(245,158,11,0.5)] transition-all" : ""}`}
                    >
                      {paid ? (
                        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-amber-500/50 bg-amber-500/15 px-3.5 py-1.5 text-xs font-black uppercase tracking-wide text-amber-300 z-10 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
                          <Lock className="size-3.5" /> Premium
                        </span>
                      ) : (
                        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-green-500/40 bg-green-500/10 px-3.5 py-1.5 text-xs font-black uppercase tracking-wide text-green-400 z-10">
                          <Gift className="size-3.5" /> Gratis
                        </span>
                      )}
                      {isCompleted ? (
                        <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-green-500/40 bg-green-500/10 px-3 py-1 text-xs font-bold uppercase text-green-400 z-10">
                          <CheckCircle2 className="size-3.5" /> Termine
                        </span>
                      ) : (
                        <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-bold uppercase text-accent z-10">
                          <Clock className="size-3.5" /> Ap vini
                        </span>
                      )}
                      <div className="mt-8 flex items-start gap-5">
                        <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-accent/40 bg-accent/10 shadow-[0_0_24px_-6px_rgba(var(--accent),0.45)]">
                          <Wand2 className={`size-6 ${paid ? "text-amber-400" : "text-accent"}`} />
                        </span>
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-2 pr-10">
                            <h4
                              className={`text-lg font-bold leading-tight ${paid ? "text-amber-200/95" : ""}`}
                            >
                              {module.title}
                            </h4>
                          </div>
                          {paid && (
                            <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/50 bg-gradient-to-r from-amber-500/20 to-amber-400/5 px-5 py-2 shadow-[0_0_18px_-4px_rgba(245,158,11,0.45)]">
                              <span className="text-2xl">💰</span>
                              <span className="text-2xl font-black tracking-tight text-amber-300">
                                {typedMod.price && typedMod.price.trim()
                                  ? typedMod.price
                                  : "Pri sou demann"}
                              </span>
                            </div>
                          )}
                          <div className="inline-flex items-center gap-2 rounded-xl bg-secondary/60 px-4 py-2 text-sm font-bold text-foreground/90">
                            <Clock className="size-4 text-accent" />
                            {dateObj.toLocaleDateString()} —{" "}
                            {dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                          {paid && (
                            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
                              <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-300">
                                <span className="size-2 rounded-full bg-amber-400" />
                                Mwayen peman yo aksepte
                              </p>
                              {Array.isArray(typedMod.payment_methods) &&
                              typedMod.payment_methods.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {typedMod.payment_methods.map((pm) => (
                                    <span
                                      key={pm}
                                      className="rounded-full border border-amber-500/40 bg-amber-500/15 px-4 py-1.5 text-sm font-bold text-amber-200 shadow-sm"
                                    >
                                      {pm}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-amber-200/80 italic leading-relaxed">
                                  📩 Kontakte nou sou WhatsApp pou plis enfòmasyon sou mwayen peman.
                                </p>
                              )}
                            </div>
                          )}
                          <div className="space-y-4">
                            <p className="text-base leading-relaxed text-muted-foreground font-medium whitespace-pre-line">
                              {module.description}
                            </p>
                            {paid && (
                              <div className="inline-flex items-center justify-center w-full gap-2.5 rounded-full border border-amber-500/40 bg-gradient-to-r from-amber-500/15 to-amber-400/5 px-5 py-3 text-sm font-black uppercase text-amber-300 transition-all shadow-[0_0_20px_-6px_rgba(245,158,11,0.5)]">
                                <MessageCircle className="size-5" /> Klike pou peye ak WhatsApp
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardTag>
                  );
                })}
              </div>
            )}
          </section>
        </section>

        <section className="mt-16">
          <p className="mt-8 flex items-center gap-2.5 text-sm leading-relaxed text-muted-foreground font-medium">
            <Radio className="size-4 text-accent" />
            Lyen yo aktive pou patisipan ki enskri yo jou fòmasyon an.
          </p>
        </section>
      </div>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} defaultTab="login" />
    </div>
  );
}
