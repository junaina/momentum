"use client";

import { useMemo, useRef, useState } from "react";
import { Calendar, Plus } from "lucide-react";
import { CreateHabitSheet } from "@/features/today/components/CreateHabitSheet";
import { DatePopover } from "@/features/today/components/DatePopover";
import { TodayHabitsPanel } from "@/features/today/components/TodayHabitsPanel";

type Mode = "app" | "demo";

type TodayScreenProps = {
  mode: Mode;
};

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toISODateInputValue(date: Date): string {
  const y = String(date.getFullYear());
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatHeading(date: Date): string {
  const now = new Date();
  if (isSameDay(now, date)) return "Today";
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function TodayScreen({ mode }: TodayScreenProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [createOpen, setCreateOpen] = useState<boolean>(false);

  const dateInputRef = useRef<HTMLInputElement | null>(null);

  const heading = useMemo(() => formatHeading(selectedDate), [selectedDate]);

  function onDateChange(value: string) {
    // value is YYYY-MM-DD
    const next = new Date(`${value}T00:00:00`);
    if (!Number.isNaN(next.getTime())) setSelectedDate(next);
  }

  return (
    <div className="mx-auto w-full max-w-(--momentum-page-max) px(--momentum-page-padding) py-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-3xl font-semibold tracking-tight text-foreground">
            {heading}
          </h1>
          {mode === "demo" ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Demo mode — behaves like the real app, but uses seeded/stubbed
              data.
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              Your scheduled habits for this day will show here.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* hidden native date input */}
          <input
            ref={dateInputRef}
            type="date"
            value={toISODateInputValue(selectedDate)}
            onChange={(e) => onDateChange(e.currentTarget.value)}
            className="sr-only"
            aria-label="Select date"
          />
          <DatePopover
            value={selectedDate}
            onChange={setSelectedDate}
            trigger={
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-background text-foreground hover:bg-muted"
                aria-label="Open calendar"
              >
                <Calendar className="h-5 w-5" aria-hidden="true" />
              </button>
            }
          />

          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
            <span className="hidden sm:inline">New habit</span>
          </button>
        </div>
      </div>

      <TodayHabitsPanel
        mode={mode}
        date={selectedDate}
        onCreateHabit={() => setCreateOpen(true)}
      />

      <CreateHabitSheet
        mode={mode}
        open={createOpen}
        onOpenChange={setCreateOpen}
        activeDate={selectedDate}
      />
    </div>
  );
}
