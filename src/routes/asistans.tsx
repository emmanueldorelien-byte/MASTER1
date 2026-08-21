import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Award,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  KeyRound,
  Radio,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { AttendanceForm } from "@/components/AttendanceForm";
import { useReveal } from "@/lib/use-reveal";

export const Route = createFileRoute("/asistans")({
  head: () => ({
    meta: [
      { title: "Make Asistans — Masterclass AI" },
      {
        name: "description",
        content:
          "Make asistans w ap chak sesyon live Masterclass AI lè w itilize kòd admin la, epi resevwa kòd sètifika inik pou chak modil.",
      },
      { property: "og:title", content: "Make Asistans — Masterclass AI" },
      {
        property: "og:description",
        content:
          "Make asistans ap chak sesyon. Kòd inik ba ou sètifika pou chak modil fòmasyon AI la.",
      },
    ],
  }),
  component: AttendancePage,
});

const flowSteps = [
  {
    icon: Radio,
    title: "1. Swiv sesyon live la",
    text: "Konekte sou YouTube oswa paj Live la pandan modil la ap pase.",
  },
  {
    icon: KeyRound,
    title: "2. Resevwa kòd asistans lan",
    text: "Apre chak sesyon, admin la pataje yon kòd (eg: ABCD-1234) nan chat la oswa WhatsApp.",
  },
  {
    icon: BookOpen,
    title: "3. Ranpli fòm sa a",
    text: "Mete non w, non fanmi w, imel ou, ak kòd sesyon ki fèt la.",
  },
  {
    icon: Sparkles,
    title: "4. Jwenn kòd sètifika w",
    text: "Systèm la jenere yon kòd verification inik pou modil sa a.",
  },
  {
    icon: Award,
    title: "5. Telechaje sètifika w",
    text: "Ale nan paj Sètifika, verifye imel + tit modil la, epi telechaje li an PNG / PDF.",
  },
];

function AttendancePage() {
  const stepsReveal = useReveal<HTMLDivElement>();
  const formReveal = useReveal<HTMLDivElement>();

  return (
    <div className="relative">
      <div className="absolute inset-0 grid-backdrop opacity-25" />
      <div className="relative mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1.5 text-xs font-bold tracking-[0.2em] text-amber-400 uppercase">
            <KeyRound className="size-3.5" /> Apre Chak Sesyon
          </span>
          <h1 className="mt-6 font-sans text-3xl font-black leading-[1.15] sm:text-5xl">
            Make <span className="text-gradient-neon">asistans ou</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            <b>Chak modil gen pwòp sètifika li.</b> Pou jwenn sètifika ou, ou dwe make asistans pou
            chak sesyon ou patisipe nan li lè w itilize kòd inik administratè a ba w.
          </p>
        </div>

        {/* STEPS */}
        <section className="mt-16">
          <div
            ref={stepsReveal.ref}
            {...stepsReveal.props}
            className="reveal grid gap-5 md:grid-cols-2 lg:grid-cols-5"
          >
            {flowSteps.map((s) => (
              <div
                key={s.title}
                className="glass glass-hover flex flex-col items-start gap-4 rounded-3xl p-7 border-2 border-border/60 ring-1 ring-white/5 bg-[color-mix(in_oklch,var(--surface)_82%,black)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
              >
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl border-2 border-accent/60 bg-accent/15 text-accent shadow-[0_0_28px_-4px_rgba(var(--accent),0.55)]">
                  <s.icon className="size-6" />
                </span>
                <div className="space-y-3">
                  <h3 className="font-sans text-[1.125rem] font-bold leading-[1.35] text-foreground">
                    {s.title}
                  </h3>
                  <p className="text-[1rem] leading-[1.7] font-semibold text-foreground/90">
                    {s.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FORM + INFO SIDE BY SIDE */}
        <section className="mt-16">
          <div
            ref={formReveal.ref}
            {...formReveal.props}
            className="reveal grid items-start gap-10 lg:grid-cols-2"
          >
            <div className="space-y-6">
              <div className="glass rounded-3xl p-7 border-accent/30 border-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <h2 className="font-sans text-xl font-bold text-accent flex items-center gap-2.5">
                  <ShieldCheck className="size-6" />
                  Poukisa ou dwe make asistans ou?
                </h2>
                <ul className="mt-6 space-y-5 text-base text-foreground/95 font-medium">
                  <li className="flex gap-3.5">
                    <CheckCircle2 className="mt-0.5 size-5.5 shrink-0 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.55)]" />
                    <span className="leading-[1.75]">
                      <b className="text-foreground font-bold">Sètifika otantisite:</b> se
                      sèlman moun ki make asistans yo kap resevwa sètifika.
                    </span>
                  </li>
                  <li className="flex gap-3.5">
                    <CheckCircle2 className="mt-0.5 size-5.5 shrink-0 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.55)]" />
                    <span className="leading-[1.75]">
                      <b className="text-foreground font-bold">Yon sètifika pa modil:</b> si
                      ou gen 3 modil, ou gen 3 sètifika diferan.
                    </span>
                  </li>
                  <li className="flex gap-3.5">
                    <CheckCircle2 className="mt-0.5 size-5.5 shrink-0 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.55)]" />
                    <span className="leading-[1.75]">
                      <b className="text-foreground font-bold">Verifyab piblikman:</b> chak
                      sètifika gen kòd QR + ID ke nenpòt moun ka verifye sou sistem Masterclass la .
                    </span>
                  </li>
                  <li className="flex gap-3.5">
                    <CheckCircle2 className="mt-0.5 size-5.5 shrink-0 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.55)]" />
                    <span className="leading-[1.75]">
                      <b className="text-foreground font-bold">Nan 4 lang:</b> Kreyòl,
                      Fransè, Panyòl, ak Anglè.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="glass rounded-3xl p-7 border-2 border-border/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <h3 className="font-sans text-lg font-bold flex items-center gap-2.5 text-foreground">
                  <GraduationCap className="size-5.5 text-accent drop-shadow-[0_0_8px_rgba(var(--accent),0.5)]" />
                  Ki sa ou bezwen
                </h3>
                <div className="mt-5 space-y-5 text-base">
                  <div className="rounded-2xl bg-background/80 p-5 border border-border/60">
                    <p className="font-black text-foreground text-[1.05rem]">1. Non ou konplè</p>
                    <p className="mt-2 text-[1rem] leading-[1.7] text-foreground/90 font-semibold">
                      Non ak non fanmi — yo pral parèt sou sètifika a.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-background/80 p-5 border border-border/60">
                    <p className="font-black text-foreground text-[1.05rem]">2. Imel ou</p>
                    <p className="mt-2 text-[1rem] leading-[1.7] text-foreground/90 font-semibold">
                      Menm imel ou ap itilize pita pou verifye ak telechaje sètifika a.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-background/80 p-5 border border-border/60">
                    <p className="font-black text-foreground text-[1.05rem]">3. Kòd asistans la</p>
                    <p className="mt-2 text-[1rem] leading-[1.7] text-foreground/90 font-semibold">
                      Admin la pataje l nan fen chak sesyon. Egzanp:{" "}
                      <code className="rounded-lg bg-black/60 px-2.5 py-1 font-mono text-accent border border-accent/30">
                        KREYOL-2026
                      </code>
                      .
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/sertifika"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-border px-5 py-3.5 text-base font-bold text-foreground transition-colors hover:bg-secondary hover:border-accent/60"
                >
                  <Award className="size-4.5" />
                  Mwen deja make — Ale nan Sètifika
                </Link>
                <Link
                  to="/verify"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-border px-5 py-3.5 text-base font-bold text-foreground transition-colors hover:bg-secondary hover:border-accent/60"
                >
                  <ShieldCheck className="size-4.5" />
                  Verifye yon sètifika
                </Link>
              </div>
            </div>

            <AttendanceForm />
          </div>
        </section>
      </div>
    </div>
  );
}
