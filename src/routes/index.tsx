import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import {
  Award,
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code2,
  Gift,
  GraduationCap,
  Image as ImageIcon,
  KeyRound,
  Lock,
  MessageCircle,
  Radio,
  Rocket,
  Wand2,
  Workflow,
} from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { Countdown } from "@/components/Countdown";
import { RegistrationForm, SpotsCounter } from "@/components/RegistrationForm";
import { Button } from "@/components/ui/button";
import { useReveal } from "@/lib/use-reveal";
import { getLiveData } from "@/admin.functions";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Masterclass AI: Kreye Kontni & Fè Aplikasyon — 100% Gratis" },
      {
        name: "description",
        content:
          "Enskri gratis nan Masterclass AI la: kreyasyon kontni, kreyasyon aplikasyon ak AI, pwodiktivite. Live sou YouTube — sètifika patisipasyon enkli.",
      },
      { property: "og:title", content: "Masterclass AI: Kreye Kontni & Fè Aplikasyon" },
      {
        property: "og:description",
        content:
          "Fòmasyon AI an kreyòl, 100% gratis, live sou YouTube. Sèlman 200 plas ak sètifika patisipasyon.",
      },
    ],
  }),
  component: Index,
});

const badges = [
  { icon: Gift, label: "100% Gratis" },
  { icon: Radio, label: "Live sou YouTube" },
  { icon: Award, label: "Certificat de Participation enkli" },
];

const defaultStaticModules = [
  {
    icon: Wand2,
    title: "Kreyasyon Kontni",
    text: "Generasyon tèks, imaj, ak lide ak zouti AI: pwonp ki mache, kontni pou rezo sosyal, atik ak videyo.",
    tags: ["Tèks", "Imaj", "Lide"],
  },
  {
    icon: Code2,
    title: "Kreyasyon Aplikasyon",
    text: "Kijan pou w sèvi ak AI pou w kòde epi kreye aplikasyon fasilman — menm si w pa devlopè.",
    tags: ["Kòd", "App web", "Deplwaman"],
  },
  {
    icon: Workflow,
    title: "Pwodiktivite ak Automatisation",
    text: "Otomatize travay ki repete, òganize jounen w, epi double vitès ou ak asistan AI.",
    tags: ["Automatisation", "Ajanda", "Zouti"],
  },
];

const steps = [
  {
    icon: Rocket,
    title: "1. Enskri",
    text: "Ranpli fòm lan an mwens pase yon minit pou w resève plas ou.",
  },
  {
    icon: Radio,
    title: "2. Swiv live la",
    text: "Konekte sou YouTube pou w swiv sesyon ak tout modil yo.",
  },
  {
    icon: KeyRound,
    title: "3. Make asistans",
    text: "Apre chak sesyon, admin ba w kòd. Ranpli fòm asistans pou chak modil.",
  },
  {
    icon: Award,
    title: "4. Jwenn sètifika w",
    text: "Verifye ak imel + tit modil la, jenere sètifika ou epi telechaje l.",
  },
];

const heroCarouselImages = [
  {
    alt: "Robot AI ak je limine",
    src: "https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=futuristic%20female%20humanoid%20robot%20with%20glowing%20cyan%20blue%20eyes%20in%20a%20high%20tech%20sci-fi%20laboratory%20with%20neon%20blue%20lights%2C%20intricate%20circuitry%20visible%2C%20professional%20cinematic%208k%20render&image_size=portrait_4_3",
  },
  {
    alt: "Robot AI ak laptop",
    src: "https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=sleek%20white%20humanoid%20robot%20profile%20working%20on%20a%20laptop%2C%20futuristic%20holographic%20digital%20interface%20blue%20hud%20circles%20and%20data%20nodes%2C%20cyberpunk%20tech%20room%20background%2C%20cinematic%20lighting%208k&image_size=portrait_4_3",
  },
  {
    alt: "Robot AI analize done",
    src: "https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=beautiful%20blue%20metallic%20female%20android%20robot%20profile%20silhouette%20watching%20a%20giant%20glowing%20blue%20data%20code%20screen%2C%20golden%20sparkles%20particles%2C%20moody%20dramatic%20lighting%2C%20cinematic%20portrait&image_size=portrait_4_3",
  },
  {
    alt: "Robot AI cyberpunk neon",
    src: "https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=cyberpunk%20female%20humanoid%20robot%20side%20profile%20half%20human%20half%20machine%20with%20exposed%20circuitry%2C%20neon%20pink%20purple%20blue%20glowing%20lights%2C%20dark%20background%2C%20ultra%20detailed%208k%20artstation%20render&image_size=portrait_4_3",
  },
];

function HeroCarousel() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
    const interval = setInterval(() => api.scrollNext(), 4500);
    return () => clearInterval(interval);
  }, [api]);

  return (
    <div className="relative">
      <div className="glass-glow rounded-[2rem] border border-accent/30 p-3 shadow-[0_0_60px_-10px_rgba(var(--accent),0.4)]">
        <Carousel opts={{ loop: true, align: "start" }} setApi={setApi} className="w-full">
          <CarouselContent className="-ml-0">
            {heroCarouselImages.map((img, idx) => (
              <CarouselItem key={idx} className="pl-0 basis-full">
                <div className="relative overflow-hidden rounded-[1.5rem] aspect-[4/5] ring-1 ring-white/10">
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/90 backdrop-blur">
                      <Bot className="size-3 text-accent" /> AI Masterclass
                    </span>
                    <span className="font-mono text-[11px] text-white/80">
                      {String(idx + 1).padStart(2, "0")} /{" "}
                      {String(heroCarouselImages.length).padStart(2, "0")}
                    </span>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      <button
        type="button"
        onClick={() => api?.scrollPrev()}
        className="group absolute left-6 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/40 text-white/90 backdrop-blur transition hover:bg-accent hover:text-accent-foreground hover:scale-110"
        aria-label="Imaj anvan"
      >
        <ChevronLeft className="size-5 transition-transform group-hover:-translate-x-0.5" />
      </button>
      <button
        type="button"
        onClick={() => api?.scrollNext()}
        className="group absolute right-6 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/40 text-white/90 backdrop-blur transition hover:bg-accent hover:text-accent-foreground hover:scale-110"
        aria-label="Imaj swivan"
      >
        <ChevronRight className="size-5 transition-transform group-hover:translate-x-0.5" />
      </button>

      <div className="mt-5 flex items-center justify-center gap-2">
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => api?.scrollTo(i)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === current
                ? "w-8 bg-accent shadow-[0_0_10px_rgba(var(--accent),0.7)]"
                : "w-1.5 bg-white/20 hover:bg-white/40",
            )}
            aria-label={`Ale nan imaj ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function Index() {
  const modulesReveal = useReveal<HTMLDivElement>();
  const stepsReveal = useReveal<HTMLDivElement>();
  const formReveal = useReveal<HTMLDivElement>();
  const getLiveDataFn = useServerFn(getLiveData);

  const { data } = useQuery({
    queryKey: ["home-data"],
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

  const dynamicModules = data?.modules ?? [];
  const trainingTitle = data?.trainingTitle ?? "";
  const whatsappAdmin = data?.whatsappAdmin ?? "";
  const whatsappTemplate = data?.whatsappMessage ?? "";
  const debugTraces = data?._debug ?? [];

  function buildWhatsAppLink(moduleTitle: string) {
    const rawPhone = (whatsappAdmin || "").replace(/\D/g, "");
    if (!rawPhone) return "";
    const message = (whatsappTemplate || "").replaceAll("{MODULE_TITLE}", moduleTitle);
    return `https://wa.me/${rawPhone}?text=${encodeURIComponent(message)}`;
  }
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-background" />
        <img
          src={heroBg}
          alt=""
          width={1920}
          height={1088}
          className="absolute inset-0 size-full object-cover opacity-80"
        />
        <div className="absolute inset-0 grid-backdrop opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background/95" />

        <div className="relative mx-auto max-w-7xl px-4 pt-6 pb-16 sm:pt-8">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            {/* LADO IZQUIERDO: CAROUSEL */}
            <div className="mx-auto w-full max-w-md lg:mx-0 order-2 lg:order-1">
              <HeroCarousel />
            </div>

            {/* LADO DERECHO: TEXTO Y CTA */}
            <div className="text-center lg:text-left order-1 lg:order-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-background/50 px-4 py-1.5 text-xs font-semibold tracking-[0.2em] text-accent uppercase">
                <Bot className="size-3.5" /> Fòmasyon an kreyòl
              </span>

              <h1 className="mt-7 font-display text-3xl leading-tight font-black uppercase glow-title sm:text-5xl lg:text-[3.4rem]">
                {trainingTitle ? (
                  <>
                    <span className="text-gradient-neon">{trainingTitle}</span>
                  </>
                ) : (
                  <>
                    <span className="text-gradient-neon">Masterclass AI:</span>
                    <br />
                    Kreye Kontni &amp; Fè Aplikasyon!
                  </>
                )}
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg lg:mx-0">
                Sesyon an dirèk pou w aprann sèvi ak entèlijans atifisyèl pou kreye kontni, bati
                aplikasyon, epi travay pi vit — san w pa bezwen eksperyans teknik.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                {badges.map((b) => (
                  <span
                    key={b.label}
                    className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm"
                  >
                    <b.icon className="size-4 text-accent" />
                    {b.label}
                  </span>
                ))}
              </div>

              <div className="mt-12">
                <Countdown />
              </div>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <Button variant="neon" size="xl" asChild>
                  <a href="#enskripsyon">Enskri kounye a</a>
                </Button>
                <Button variant="outlineNeon" size="xl" asChild>
                  <Link to="/live">Gade paj live la</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section className="mx-auto max-w-6xl px-4 py-5" id="pwogram">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-bold uppercase sm:text-4xl">
            Pwogram <span className="text-gradient-neon">fòmasyon an</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            {dynamicModules.length > 0
              ? "Konsa modil fòmasyon yo pwogrese. Chak modil make kòm 'Termine' lè dat li pase."
              : "Twa gwo pati, ak demonstrasyon an dirèk sou ekran."}
          </p>
        </div>

        {debugTraces.length > 0 && dynamicModules.length === 0 ? (
          <details className="mx-auto mt-8 max-w-5xl rounded-2xl border border-amber-500/40 bg-amber-950/40 p-5 text-left backdrop-blur">
            <summary className="cursor-pointer select-none text-sm font-bold uppercase tracking-wider text-amber-300">
              🐛 DEBUG: Poukisa modil yo pa parèt? (klike pou w wè)
            </summary>
            <ul className="mt-4 space-y-2 font-mono text-xs leading-relaxed text-amber-100/95">
              {debugTraces.map((line, i) => (
                <li key={i} className="whitespace-pre-wrap break-all">
                  · {line}
                </li>
              ))}
              <li className="mt-3 rounded-lg border border-amber-500/40 bg-black/40 p-3 text-[11px] normal-case tracking-normal text-amber-200 not-italic font-sans">
                <b className="text-amber-300">Si ou wè "[ENV] SUPABASE_URL is NOT defined" :</b> ale
                nan Vercel Dashboard → Masterclass → <b>Settings → Environment Variables</b>. Tcheke
                ke ou kreye tou senk (<b>5</b>) variables ak nòm <b>egzak</b>:{" "}
                <code className="text-amber-200">SUPABASE_URL</code>,{" "}
                <code className="text-amber-200">SUPABASE_PUBLISHABLE_KEY</code>,{" "}
                <code className="text-amber-200">SUPABASE_SERVICE_ROLE_KEY</code>,{" "}
                <code className="text-amber-200">VITE_SUPABASE_URL</code>,{" "}
                <code className="text-amber-200">VITE_SUPABASE_PUBLISHABLE_KEY</code>. Pa oubliye{" "}
                <b>twa (3) premye yo SANS</b> "VITE_" — yo sèvi ak sèlman nan servès Nitro.
                <br />
                <b className="text-amber-300 mt-1 block">
                  Si ou wè "[DB modules] ERROR code=MISSING_SUPABASE_ENV" :
                </b>{" "}
                ==&gt; menm pwoblèm:{" "}
                <code className="text-amber-200">SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY</code> pa
                egziste nan Vercel process.env.
                <br />
                <b className="text-amber-300 mt-1 block">
                  Si ou wè relation "modules" does not exist :
                </b>{" "}
                ou bezwen kouri migrasyon SQL la nan Supabase SQL Editor pou kreye tab modules,
                admin_settings, enskripsyon, etc.
                <br />
                <b className="text-amber-300 mt-1 block">
                  Si ou wè "[DB modules] OK rows=0":
                </b>{" "}
                DB konekte byen men tab "modules" a vide. Ale nan paj Admin nan fòm "Ajoute Modil"
                pou w ajoute, oubyen Insèman anndan Supabase Table Editor → <b>modules</b>.
              </li>
            </ul>
          </details>
        ) : null}

        {dynamicModules.length > 0 ? (
          <div
            ref={modulesReveal.ref}
            {...modulesReveal.props}
            className="reveal mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {dynamicModules.map((m) => {
              const isCompleted = new Date(m.module_date) < new Date();
              const dateObj = new Date(m.module_date);
              const typedM = m as unknown as {
                is_paid?: boolean;
                price?: string;
                payment_methods?: string[];
              };
              const paid = typedM?.is_paid ?? false;
              const waLink = paid ? buildWhatsAppLink(m.title) : "";
              const CardTag: any = paid && waLink ? "a" : "article";
              const cardExtraProps =
                paid && waLink ? { href: waLink, target: "_blank", rel: "noreferrer" } : {};
              const cardClass = cn(
                "glass glass-hover rounded-3xl p-7 relative block text-left",
                isCompleted && "border-green-500/40",
                paid &&
                  "border-amber-500/60 hover:border-amber-400 bg-gradient-to-br from-amber-950/80 via-purple-950/50 to-background/90",
              );
              const titleClass = cn(
                "mt-5 pr-20 font-display text-xl font-black tracking-wide",
                paid
                  ? "text-yellow-50"
                  : "text-foreground",
              );
              const descClass = cn(
                "text-base leading-relaxed whitespace-pre-line font-medium",
                paid ? "text-yellow-50/95" : "text-muted-foreground",
              );
              const waBtnClass = cn(
                "mt-5 inline-flex items-center justify-center w-full gap-2.5 rounded-full border border-amber-400/70 bg-gradient-to-r from-amber-600/50 via-yellow-500/35 to-amber-600/50 px-5 py-3 text-[13px] font-black uppercase tracking-wide text-yellow-50 transition-all shadow-[0_0_35px_-8px_rgba(251,191,36,0.85)] hover:shadow-[0_0_45px_-5px_rgba(251,191,36,1)] hover:scale-105",
              );
              return (
                <CardTag key={m.id} {...cardExtraProps} className={cardClass}>
                  {isCompleted ? (
                    <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border border-green-500/50 bg-green-500/20 px-3 py-1 text-[10px] font-bold uppercase text-green-300 z-20">
                      <CheckCircle2 className="size-3" /> Termine
                    </span>
                  ) : (
                    <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border border-accent/60 bg-cyan-500/20 px-3 py-1 text-[10px] font-bold uppercase text-cyan-200 z-20">
                      <Clock className="size-3" /> Ap vini
                    </span>
                  )}
                  {paid ? (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full border border-amber-400/70 bg-gradient-to-r from-amber-600/40 to-yellow-500/30 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-yellow-100 z-20">
                      <Lock className="size-3" /> Premium
                    </span>
                  ) : (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-2 rounded-full border-2 border-emerald-400/80 bg-gradient-to-r from-emerald-600/50 to-green-500/35 px-4 py-2 text-sm font-black uppercase tracking-widest text-white z-20 shadow-[0_0_25px_rgba(52,211,153,0.75)] ring-2 ring-emerald-300/50 ring-offset-1 ring-offset-purple-950">
                      <Gift className="size-4" /> Gratis
                    </span>
                  )}
                  <span className="mt-8 grid size-12 place-items-center rounded-2xl border border-accent/50 bg-accent/15">
                    <Wand2 className="size-6 text-accent" />
                  </span>
                  <h3 className={titleClass}>{m.title}</h3>
                  {paid && (
                    <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-amber-400/70 bg-gradient-to-r from-amber-600/40 to-yellow-500/25 px-6 py-3">
                      <span className="text-2xl">💰</span>
                      <span className="text-3xl font-black tracking-tight text-yellow-100">
                        {typedM.price && typedM.price.trim()
                          ? typedM.price
                          : "Pri sou demann"}
                      </span>
                    </div>
                  )}
                  <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-secondary/80 px-4 py-2 text-sm font-bold text-foreground/95 shadow-sm">
                    <Clock className="size-3.5 text-accent" />
                    {dateObj.toLocaleDateString()} —{" "}
                    {dateObj.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  {paid && (
                    <div className="mt-5 rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-950/70 to-amber-900/40 p-4">
                      <p className="mb-3 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-yellow-200">
                        <span className="size-2 rounded-full bg-yellow-400" />
                        Mwayen peman yo aksepte
                      </p>
                      {Array.isArray(typedM.payment_methods) &&
                      typedM.payment_methods.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {typedM.payment_methods.map((pm) => (
                            <span
                              key={pm}
                              className="rounded-full border border-amber-400/60 bg-gradient-to-r from-amber-700/40 to-amber-600/30 px-4 py-1.5 text-[12px] font-bold text-yellow-50"
                            >
                              {pm}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-yellow-100/90 italic">
                          📩 Kontakte nou sou WhatsApp pou plis enfòmasyon sou mwayen peman.
                        </p>
                      )}
                    </div>
                  )}
                  <div className="mt-5">
                    <p className={descClass}>{m.description}</p>
                    {paid && (
                      <div className={waBtnClass}>
                        <MessageCircle className="size-5" /> Klike pou peye ak WhatsApp
                      </div>
                    )}
                  </div>
                </CardTag>
              );
            })}
          </div>
        ) : (
          <div
            ref={modulesReveal.ref}
            {...modulesReveal.props}
            className="reveal mt-12 grid gap-6 md:grid-cols-3"
          >
            {defaultStaticModules.map((m) => (
              <article key={m.title} className="glass glass-hover rounded-3xl p-7">
                <span className="grid size-12 place-items-center rounded-2xl border border-accent/40 bg-accent/10 shadow-[0_0_24px_-6px_rgba(var(--accent),0.45)]">
                  <m.icon className="size-6 text-accent" />
                </span>
                <h3 className="mt-5 font-display text-xl font-black leading-tight">{m.title}</h3>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground font-medium">{m.text}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {m.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-secondary px-4 py-1.5 text-sm font-semibold text-secondary-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* STEPS */}
      <section className="relative overflow-hidden py-16">
        <div className="absolute inset-0 grid-backdrop opacity-30" />
        <div
          ref={stepsReveal.ref}
          {...stepsReveal.props}
          className="reveal relative mx-auto grid max-w-6xl gap-6 px-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {steps.map((s) => (
            <div key={s.title} className="glass flex items-start gap-5 rounded-2xl p-7">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-accent/40 bg-accent/10 text-accent shadow-[0_0_24px_-6px_rgba(var(--accent),0.45)]">
                <s.icon className="size-5.5" />
              </div>
              <div className="space-y-2">
                <h3 className="font-display text-lg font-black leading-tight">{s.title}</h3>
                <p className="text-base leading-relaxed text-muted-foreground font-medium">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* REGISTRATION */}
      <section id="enskripsyon" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
        <div
          ref={formReveal.ref}
          {...formReveal.props}
          className="reveal grid items-start gap-10 lg:grid-cols-2"
        >
          <div>
            <h2 className="font-display text-2xl font-bold uppercase sm:text-4xl">
              Enskripsyon <span className="text-gradient-neon">limite</span>
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground font-medium">
              Nou aksepte sèlman 200 patisipan pou nou ka reponn kesyon tout moun pandan live la.
              Enskri pou w gen plas ou nan pwochen sesyon yo.
            </p>
            <div className="mt-8">
              <SpotsCounter />
            </div>
            <ul className="mt-8 space-y-4 text-base text-muted-foreground">
              <li className="flex items-center gap-3.5 leading-relaxed font-medium">
                <ImageIcon className="size-5 shrink-0 text-accent" /> Aksè ak tout resous yo (PDF,
                kòd)
              </li>
              <li className="flex items-center gap-3.5 leading-relaxed font-medium">
                <Award className="size-5 shrink-0 text-accent" /> Sètifika pa modil — an 4 lang
                disponib
              </li>
              <li className="flex items-center gap-3.5 leading-relaxed font-medium">
                <Radio className="size-5 shrink-0 text-accent" /> Repetisyon disponib apre live la
              </li>
            </ul>
          </div>
          <RegistrationForm />
        </div>
      </section>
    </div>
  );
}
