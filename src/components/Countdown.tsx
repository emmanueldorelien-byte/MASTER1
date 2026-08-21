import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLiveData } from "@/admin.functions";
import { useReveal } from "@/lib/use-reveal";

/** Dimanch 30 out 2026, 10:00 PM lè Ayiti (UTC-4) — default fallback */
export const EVENT_DATE_UTC = Date.UTC(2026, 7, 31, 2, 0, 0);

function diff(target: number, now: number) {
  const total = Math.max(0, target - now);
  return {
    total,
    jou: Math.floor(total / 86400000),
    è: Math.floor((total % 86400000) / 3600000),
    minit: Math.floor((total % 3600000) / 60000),
    segond: Math.floor((total % 60000) / 1000),
  };
}

function parseEventDate(value: string | null | undefined): number | null {
  if (!value) return null;
  const n = new Date(value).getTime();
  if (Number.isFinite(n) && n > 0) return n;
  return null;
}

const PLACEHOLDER = { total: 0, jou: 0, è: 0, minit: 0, segond: 0 };

export function Countdown({ overrideTarget }: { overrideTarget?: number } = {}) {
  const getLiveDataFn = useServerFn(getLiveData);
  const { data } = useQuery({
    queryKey: ["public-settings"],
    queryFn: async () => getLiveDataFn(),
    staleTime: 60_000,
  });

  const targetMs = useMemo(() => {
    if (typeof overrideTarget === "number") return overrideTarget;
    return parseEventDate(data?.eventDate) ?? EVENT_DATE_UTC;
  }, [overrideTarget, data?.eventDate]);

  // mounted=false on SSR + first client paint → always match server output.
  // Numbers start animating only after useEffect (purely client).
  const [mounted, setMounted] = useState(false);
  const [left, setLeft] = useState(() => PLACEHOLDER);
  const { ref, props } = useReveal<HTMLDivElement>();

  useEffect(() => {
    setMounted(true);
    setLeft(diff(targetMs, Date.now()));
    const id = setInterval(() => setLeft(diff(targetMs, Date.now())), 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  const live = mounted ? left : PLACEHOLDER;
  const cells = [
    { label: "Jou", value: live.jou },
    { label: "Èdtan", value: live.è },
    { label: "Minit", value: live.minit },
    { label: "Segond", value: live.segond },
  ];

  return (
    <div ref={ref} {...props} className="reveal w-full">
      <p className="mb-3 text-center text-xs tracking-[0.35em] text-accent uppercase">
        {mounted && live.total === 0 ? "Sesyon an kòmanse" : "Kont pou lansman an"}
      </p>
      <div className="mx-auto grid max-w-2xl grid-cols-4 gap-2 sm:gap-4">
        {cells.map((cell) => (
          <div
            key={cell.label}
            className="glass glass-hover rounded-2xl px-2 py-4 text-center sm:px-4 sm:py-6"
          >
            <div
              className={`font-display text-3xl font-bold sm:text-5xl ${mounted ? "text-gradient-neon" : "text-transparent"}`}
              aria-hidden={!mounted}
            >
              {String(cell.value).padStart(2, "0")}
            </div>
            <div className="mt-1 text-[0.65rem] tracking-[0.2em] text-muted-foreground uppercase sm:text-xs">
              {cell.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
