"use client";

import * as React from "react";
import type { Mode } from "@/features/today/types";
import type { StatsHabitRow, StatsPeriod } from "@/features/stats/statsSchema";
import { useStats } from "@/features/stats/hooks/useStats";
import { toDateKey } from "@/features/today/utils/dateKey";
import {
  formatAdherenceTrend,
  formatPercent01,
  formatRatio,
} from "@/features/stats/formatters";
import { Button } from "@/components/ui/button";
import { DatePopover } from "@/features/today/components/DatePopover";
import { CalendarDays, ChevronDown, ChevronUp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

function sortHabitsForAction(habits: StatsHabitRow[]): StatsHabitRow[] {
  return [...habits].sort((a, b) => {
    if (b.missed !== a.missed) return b.missed - a.missed;
    const aAdh = a.adherence ?? 2; // null planned goes last
    const bAdh = b.adherence ?? 2;
    if (aAdh !== bAdh) return aAdh - bAdh;
    return a.name.localeCompare(b.name);
  });
}

function toneClass(tone: "up" | "down" | "flat" | "na") {
  // theme-safe: use semantic tokens, no hardcoded colors
  if (tone === "up") return "bg-primary text-primary-foreground";
  if (tone === "down") return "bg-destructive text-destructive-foreground";
  if (tone === "flat") return "bg-muted text-muted-foreground";
  return "bg-muted text-muted-foreground";
}

function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function nextAnchor(startKey: string, period: StatsPeriod): string {
  if (period === "week") return addDays(startKey, 7);
  // month: jump to first of next month
  const [y, m] = startKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, 1));
  dt.setUTCMonth(dt.getUTCMonth() + 1, 1);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}-01`;
}
function dateKeyToLocalDate(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d); // local date (stable for popover UI)
}

function localDateToDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatMMDDYYYY(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = d.getFullYear();
  return `${mm}/${dd}/${yy}`;
}
function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Help"
          className="inline-flex items-center justify-center rounded-full p-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <Info className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-sm leading-snug">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

export function StatsScreen({ mode }: { mode: Mode }) {
  const [period, setPeriod] = React.useState<StatsPeriod>("week");
  const [anchorKey, setAnchorKey] = React.useState<string>(() =>
    toDateKey(new Date())
  );
  const [status] = React.useState<"active" | "activePaused" | "all">("active");

  const { data, isLoading, error } = useStats(mode, period, anchorKey, status);

  const visibleHabits = React.useMemo(() => {
    if (!data) return [];
    return data.habits.filter(
      (h) => h.planned > 0 || h.completed > 0 || h.missed > 0
    );
  }, [data]);
  const rankedHabits = React.useMemo(() => {
    if (!visibleHabits) return [];
    return sortHabitsForAction(visibleHabits);
  }, [visibleHabits]);
  const compareText = React.useMemo(() => {
    const base = period === "week" ? "vs last week" : "vs last month";
    if (!data) return base;
    const isPartial = data.meta.asOfKey < data.meta.endKey;
    return isPartial ? `${base} (so far)` : base;
  }, [data, period]);
  const anchorDate = React.useMemo(
    () => dateKeyToLocalDate(anchorKey),
    [anchorKey]
  );
  const anchorLabel = React.useMemo(
    () => formatMMDDYYYY(anchorDate),
    [anchorDate]
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="w-full">
        {/* sticky controls */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border">
          <div className="mx-auto w-full max-w-[var(--momentum-page-max)] px-[var(--momentum-page-padding)] py-3 flex items-center gap-2">
            {/* Header (like Today) */}
            <div className="flex items-center justify-between gap-3 my-4 mr-10">
              <div className="min-w-0">
                <h1 className="truncate text-3xl font-semibold tracking-tight text-foreground">
                  Progress
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-1 rounded-xl bg-muted p-1">
              <Button
                type="button"
                size="sm"
                variant={period === "week" ? "default" : "ghost"}
                onClick={() => setPeriod("week")}
              >
                Week
              </Button>
              <Button
                type="button"
                size="sm"
                variant={period === "month" ? "default" : "ghost"}
                onClick={() => setPeriod("month")}
              >
                Month
              </Button>
            </div>

            <div className="flex-1" />
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  {/* date picker */}
                  <DatePopover
                    value={anchorDate}
                    onChange={(next) => setAnchorKey(localDateToDateKey(next))}
                    trigger={
                      <div className="h-9 rounded-xl border border-input bg-background px-3 text-sm inline-flex items-center gap-2">
                        <span className="tabular-nums">{anchorLabel}</span>
                        <CalendarDays className="h-4 w-4 opacity-70" />
                      </div>
                    }
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-sm leading-snug">
                Pick a date to anchor the selected period. For Week, we show the
                week that contains this date. For Month, we show the month that
                contains this date.
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[var(--momentum-page-max)] px-[var(--momentum-page-padding)] py-4">
          {isLoading && (
            <div className="space-y-3">
              <div className="h-28 rounded-2xl border border-border bg-card animate-pulse" />
              <div className="h-40 rounded-2xl border border-border bg-card animate-pulse" />
              <div className="h-72 rounded-2xl border border-border bg-card animate-pulse" />
            </div>
          )}

          {error && !isLoading && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="text-sm font-medium">Couldn’t load progress</div>
              <div className="text-sm text-muted-foreground mt-1">
                {error.message}
              </div>
            </div>
          )}

          {!isLoading && !error && data && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Left column: overall + chart */}
              <div className="space-y-4">
                <OverallCard
                  label={data.meta.label}
                  adherence={data.overall.adherence}
                  completed={data.overall.completed}
                  planned={data.overall.planned}
                  missed={data.overall.missed}
                  deltaAdherencePP={data.overall.deltaAdherencePP}
                  metTarget={data.overall.metTarget}
                  trendLabel={data.overall.trendLabel ?? null}
                  compareText={compareText}
                />

                <SeriesMiniChart
                  title={period === "week" ? "This week" : "This month"}
                  unit={data.meta.seriesUnit}
                  series={data.series}
                />

                {/* Prev/next */}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setAnchorKey(data.meta.prevStartKey)}
                  >
                    Prev
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      setAnchorKey(nextAnchor(data.meta.startKey, period))
                    }
                  >
                    Next
                  </Button>
                  <div className="flex-1" />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>as of {data.meta.asOfKey}</span>
                    <InfoTip text="Stats are calculated up to this day (not the full week/month) to avoid counting future planned check-ins." />
                  </div>
                </div>
              </div>

              {/* Right column: habits list */}
              <div className="space-y-4">
                <HabitsRankedList
                  habits={rankedHabits}
                  empty={data.habits.length === 0}
                  compareText={compareText}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

function OverallCard(props: {
  label: string;
  adherence: number | null;
  completed: number;
  planned: number;
  missed: number;
  deltaAdherencePP: number | null;
  metTarget: boolean;
  trendLabel: "new" | "na" | null;
  compareText: string; // <-- added
}) {
  const adh = formatPercent01(props.adherence);

  let message = "Keep going.";
  if (props.planned === 0) message = "Nothing scheduled yet.";
  else if (props.trendLabel === "new") message = "New this period.";
  else if (props.metTarget) message = "On track.";
  else message = "You can still catch up.";

  const trend = formatAdherenceTrend({
    current: props.adherence,
    deltaPP: props.deltaAdherencePP,
    compareText: props.compareText,
    planned: props.planned,
    trendLabel: props.trendLabel,
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-momentum)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">{props.label}</div>
          <div className="mt-1 flex items-center gap-2">
            <div className="text-3xl font-semibold tracking-tight">{adh}</div>
            <InfoTip text="Adherence = completed check-ins ÷ planned check-ins for the selected period (so far). If nothing was planned, adherence is not shown." />
          </div>

          <div className="mt-1 text-sm text-muted-foreground">
            <span>
              Overall Habit Check-Ins:
              {formatRatio(props.completed, props.planned)}• {props.missed}{" "}
              missed
            </span>
            <InfoTip text="Completed/planned are total check-in instances across all habits in this period (so far). Missed = planned minus completed." />
          </div>
        </div>

        {/* ✅ Trend badge: Better/Worse + % change + from→to (NO pp) */}
        {trend ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="shrink-0 text-right">
                <div
                  className={`inline-flex rounded-xl px-2 py-1 text-xs font-medium ${toneClass(
                    trend.tone
                  )}`}
                >
                  {trend.title === "New this period"
                    ? "New"
                    : trend.changeText || trend.title}
                </div>

                {trend.title !== "New this period" ? (
                  <>
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      {trend.title}
                    </div>
                    {trend.fromToText ? (
                      <div className="text-[10px] text-muted-foreground">
                        {trend.fromToText}
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-sm leading-snug">
              This compares adherence to the previous{" "}
              {props.compareText.includes("month") ? "month" : "week"}.
              “Up/Down” is the relative % change. The arrow line shows previous
              → current.
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>

      <div className="mt-3 text-sm text-muted-foreground">{message}</div>
    </div>
  );
}

function SeriesMiniChart(props: {
  title: string;
  unit: "day" | "week";
  series: Array<{ key: string; planned: number; completed: number }>;
}) {
  const maxPlanned = Math.max(1, ...props.series.map((p) => p.planned));

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{props.title}</div>

        <div className="text-xs text-muted-foreground">
          <InfoTip text="Each bar shows completed (solid) vs planned (ghost) check-ins for that day/week bucket. Totals include all habits." />
          <span>{props.unit === "day" ? "Daily" : "Weekly"} buckets</span>
        </div>
      </div>

      <div className="mt-4 flex items-end gap-2 h-24">
        {props.series.map((p) => {
          const plannedH = Math.round((p.planned / maxPlanned) * 100);
          const completedH = Math.round((p.completed / maxPlanned) * 100);
          return (
            <div
              key={p.key}
              className="flex-1 min-w-0 flex flex-col items-center gap-1"
            >
              <div className="relative w-full h-20 rounded-lg bg-muted overflow-hidden">
                <div
                  className="absolute bottom-0 left-0 w-full bg-muted-foreground/20"
                  style={{ height: `${plannedH}%` }}
                  title={`${p.planned} planned`}
                />
                <div
                  className="absolute bottom-0 left-0 w-full bg-primary"
                  style={{ height: `${completedH}%` }}
                  title={`${p.completed} completed`}
                />
              </div>
              <div className="text-[10px] text-muted-foreground truncate w-full text-center">
                {props.unit === "day" ? p.key.slice(8) : p.key.slice(5)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-muted-foreground">
        Completed (solid) vs planned (ghost)
      </div>
    </div>
  );
}
function plural(n: number, unit: string) {
  return n === 1 ? unit : `${unit}s`;
}

function pickStreakUnit(h: StatsHabitRow): "day" | "week" {
  const anyWeeks = h.currentStreakWeeks != null || h.longestStreakWeeks != null;

  return anyWeeks ? "week" : "day";
}
function HabitsRankedList(props: {
  habits: StatsHabitRow[];
  empty: boolean;
  compareText: string;
}) {
  const [openHabitId, setOpenHabitId] = React.useState<string | null>(null);

  if (props.empty) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="text-sm font-medium">No habits yet</div>
        <div className="mt-1 text-sm text-muted-foreground">
          Create a habit to start seeing progress here.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="p-4 border-b border-border">
        <div className="text-sm font-medium">Habits</div>
        <div className="text-xs text-muted-foreground mt-1">
          Sorted by most missed (action-first) • Expand a habit to see streaks
        </div>
      </div>

      <div className="divide-y divide-border">
        {props.habits.map((h) => {
          const isOpen = openHabitId === h.habitId;

          const adh = formatPercent01(h.adherence);

          // (keep whatever trend pill you already render)
          const trend = formatAdherenceTrend({
            current: h.adherence,
            deltaPP: h.deltaAdherencePP,
            compareText: props.compareText,
            planned: h.planned,
            trendLabel: h.trendLabel ?? null,
          });

          const unit = pickStreakUnit(h);

          const current =
            unit === "week"
              ? h.currentStreakWeeks ?? 0
              : h.currentStreakDays ?? 0;

          const longest =
            unit === "week"
              ? h.longestStreakWeeks ?? 0
              : h.longestStreakDays ?? 0;

          return (
            <div key={h.habitId} className="p-4">
              {/* Row */}
              <div className="flex items-center gap-3">
                <div className="text-2xl w-9 text-center">
                  {h.emoji ?? "✅"}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{h.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatRatio(h.completed, h.planned)} • {adh} • {h.missed}{" "}
                    missed
                  </div>
                </div>

                {/* Right side: trend pill + expand button */}
                <div className="flex items-center gap-2">
                  {trend ? (
                    <div
                      className={`rounded-xl px-2 py-1 text-xs font-medium ${toneClass(
                        trend.tone
                      )}`}
                    >
                      {trend.title === "New this period"
                        ? "New"
                        : trend.changeText || "No change"}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setOpenHabitId(isOpen ? null : h.habitId)}
                    aria-expanded={isOpen}
                    aria-label={isOpen ? "Collapse habit" : "Expand habit"}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-xl border border-border bg-background/40 hover:bg-background/60 transition"
                  >
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 opacity-80" />
                    ) : (
                      <ChevronDown className="h-4 w-4 opacity-80" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded panel */}
              {isOpen ? (
                <div className="mt-3 ml-12 rounded-2xl border border-border bg-muted/20 p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-background/40 p-3">
                      <div className="text-xs text-muted-foreground">
                        Current streak
                      </div>
                      <div className="mt-1 text-sm font-semibold">
                        {current} {plural(current, unit)}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1">
                        Consecutive on-schedule completions
                      </div>
                    </div>

                    <div className="rounded-xl bg-background/40 p-3">
                      <div className="text-xs text-muted-foreground">
                        Longest streak
                      </div>
                      <div className="mt-1 text-sm font-semibold">
                        {longest} {plural(longest, unit)}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1">
                        Best streak achieved so far
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
