"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Clock } from "lucide-react";

type TimePopoverProps = {
  value: string; // "HH:MM"
  onChange: (next: string) => void;
};

function useOnClickOutside(
  refs: ReadonlyArray<React.RefObject<HTMLElement | null>>,
  handler: () => void,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled) return;

    const onPointerDown = (e: PointerEvent) => {
      const t = e.target;
      if (!(t instanceof Node)) return;

      const inside = refs.some((r) => r.current?.contains(t) ?? false);
      if (!inside) handler();
    };

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [enabled, handler, refs]);
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function buildTimes(stepMinutes: number): string[] {
  const out: string[] = [];
  for (let h = 0; h < 24; h += 1) {
    for (let m = 0; m < 60; m += stepMinutes) {
      out.push(`${pad2(h)}:${pad2(m)}`);
    }
  }
  return out;
}

function formatHuman(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return hhmm;

  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${pad2(m)} ${suffix}`;
}

export function TimePopover({ value, onChange }: TimePopoverProps) {
  const [open, setOpen] = useState<boolean>(false);

  const triggerRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useOnClickOutside([triggerRef, popoverRef], () => setOpen(false), open);

  const times = useMemo(() => buildTimes(15), []);
  const currentLabel = useMemo(() => formatHuman(value), [value]);

  return (
    <div className="relative" ref={triggerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-2xl border border-border bg-background px-3 text-sm text-foreground hover:bg-muted"
      >
        <span>{currentLabel}</span>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </button>

      {open ? (
        <div
          ref={popoverRef}
          className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-[min(18rem,calc(100vw-2rem))] rounded-3xl border border-border bg-card p-2 shadow-(--shadow-momentum)"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="max-h-64 overflow-auto rounded-2xl">
            {times.map((t) => {
              const active = t === value;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    onChange(t);
                    setOpen(false);
                  }}
                  className={[
                    "flex w-full items-center justify-between rounded-2xl px-3 py-2 text-sm",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted",
                  ].join(" ")}
                >
                  <span>{formatHuman(t)}</span>
                  <span className="text-xs opacity-70">{t}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
