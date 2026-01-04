"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type DatePopoverProps = {
  value: Date;
  onChange: (next: Date) => void;
  trigger: React.ReactNode; // button/icon
};

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, delta: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function weekdayIndexSun0(d: Date): number {
  // 0=Sun .. 6=Sat
  return d.getDay();
}

function formatMonthYear(d: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(d);
}

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

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

export function DatePopover({ value, onChange, trigger }: DatePopoverProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [viewMonth, setViewMonth] = useState<Date>(() => startOfMonth(value));

  const triggerRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useOnClickOutside([triggerRef, popoverRef], () => setOpen(false), open);

  // keep view month synced when value changes
  useEffect(() => {
    setViewMonth(startOfMonth(value));
  }, [value]);

  const grid = useMemo(() => {
    const first = startOfMonth(viewMonth);
    const offset = weekdayIndexSun0(first); // how many blanks before day 1
    const totalDays = daysInMonth(viewMonth);

    const cells: Array<{ kind: "blank" } | { kind: "day"; date: Date }> = [];
    for (let i = 0; i < offset; i += 1) cells.push({ kind: "blank" });

    for (let d = 1; d <= totalDays; d += 1) {
      cells.push({
        kind: "day",
        date: new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d),
      });
    }

    // pad to full weeks (optional)
    while (cells.length % 7 !== 0) cells.push({ kind: "blank" });

    return cells;
  }, [viewMonth]);

  const today = useMemo(() => new Date(), []);

  return (
    <div className="relative" ref={triggerRef}>
      <div
        onClick={() => setOpen((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setOpen((v) => !v);
        }}
      >
        {trigger}
      </div>

      {open ? (
        <div
          ref={popoverRef}
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(20rem,calc(100vw-2rem))] rounded-3xl border border-border bg-card p-3 shadow-[var(--shadow-momentum)]"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-2 px-1">
            <button
              type="button"
              onClick={() => setViewMonth((m) => addMonths(m, -1))}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-background text-foreground hover:bg-muted"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="text-sm font-semibold text-foreground">
              {formatMonthYear(viewMonth)}
            </div>

            <button
              type="button"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-background text-foreground hover:bg-muted"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 px-1">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="pb-1 text-center text-xs font-medium text-muted-foreground"
              >
                {w}
              </div>
            ))}

            {grid.map((cell, idx) => {
              if (cell.kind === "blank")
                return <div key={`b-${idx}`} className="h-10" />;

              const selected = isSameDay(cell.date, value);
              const isToday = isSameDay(cell.date, today);

              return (
                <button
                  key={cell.date.toISOString()}
                  type="button"
                  onClick={() => {
                    onChange(cell.date);
                    setOpen(false);
                  }}
                  className={[
                    "h-10 rounded-2xl text-sm font-medium",
                    "border border-transparent hover:bg-muted",
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-foreground border-border",
                    !selected && isToday ? "ring-2 ring-ring/40" : "",
                  ].join(" ")}
                >
                  {cell.date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => {
                onChange(new Date());
                setOpen(false);
              }}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
