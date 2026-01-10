import type { WeekStartsOn } from "./dateKey";
import { minDateKey } from "./dateKey";
import type { StatsPeriod } from "./period";
import { getPrevRange, getRange } from "./period";
import type { HabitForStats } from "./lifecycle";
import { computeCountsForRange } from "./compute";
import { buildSeries } from "./series";
import type {
  StatsHabitRow,
  StatsResponse,
} from "@/features/stats/statsSchema";

function deltaPP(curr: number | null, prev: number | null): number | null {
  if (curr == null || prev == null) return null;
  return (curr - prev) * 100;
}

export function buildStatsEngine(input: {
  period: StatsPeriod;
  anchorKey: string;
  todayKey: string;
  weekStartsOn: WeekStartsOn;
  habits: HabitForStats[];
  completedByHabit: Map<string, ReadonlySet<string>>;
}): StatsResponse {
  const range = getRange(input.period, input.anchorKey, input.weekStartsOn);
  const prevRange = getPrevRange(input.period, range);

  // clamp evaluation end (no future “missed”)
  const asOfKey = minDateKey(
    range.endKey,
    minDateKey(input.anchorKey, input.todayKey)
  );

  // compute per habit for current + prev
  const habitRows: StatsHabitRow[] = input.habits.map((h) => {
    const completed = input.completedByHabit.get(h.id) ?? new Set<string>();

    const curr = computeCountsForRange({
      habit: h,
      range,
      asOfKey,
      todayKey: input.todayKey,
      weekStartsOn: input.weekStartsOn,
      completed,
    });

    const prev = computeCountsForRange({
      habit: h,
      range: prevRange,
      asOfKey: prevRange.endKey, // previous period: full period
      todayKey: input.todayKey,
      weekStartsOn: input.weekStartsOn,
      completed,
    });

    const trendLabel: StatsHabitRow["trendLabel"] =
      prev.planned === 0 && curr.planned > 0 ? "new" : null;

    const row = {
      habitId: h.id,
      name: h.name,
      emoji: h.emoji,
      color: h.color,

      planned: curr.planned,
      completed: curr.completed,
      missed: curr.missed,
      adherence: curr.adherence,
      deltaAdherencePP: deltaPP(curr.adherence, prev.adherence),

      deltaCompleted: curr.completed - prev.completed,
      deltaMissed: curr.missed - prev.missed,

      metTarget: curr.metTarget,
      trendLabel,
    } satisfies StatsHabitRow;

    return row;
  });

  // overall sums
  const overallPlanned = habitRows.reduce((s, r) => s + r.planned, 0);
  const overallCompleted = habitRows.reduce((s, r) => s + r.completed, 0);
  const overallMissed = habitRows.reduce((s, r) => s + r.missed, 0);
  const overallAdh =
    overallPlanned === 0
      ? null
      : Math.min(1, overallCompleted / overallPlanned);

  // prev overall for delta
  const prevRows = input.habits.map((h) => {
    const completed = input.completedByHabit.get(h.id) ?? new Set<string>();
    return computeCountsForRange({
      habit: h,
      range: prevRange,
      asOfKey: prevRange.endKey,
      todayKey: input.todayKey,
      weekStartsOn: input.weekStartsOn,
      completed,
    });
  });

  const prevPlanned = prevRows.reduce((s, r) => s + r.planned, 0);
  const prevCompleted = prevRows.reduce((s, r) => s + r.completed, 0);
  const prevMissed = prevRows.reduce((s, r) => s + r.missed, 0);
  const prevAdh =
    prevPlanned === 0 ? null : Math.min(1, prevCompleted / prevPlanned);

  const overallTrendLabel =
    prevPlanned === 0 && overallPlanned > 0 ? "new" : null;

  const overallMetTarget =
    overallPlanned > 0 && overallCompleted >= overallPlanned;

  const seriesBuilt = buildSeries({
    period: input.period,
    range,
    asOfKey,
    todayKey: input.todayKey,
    weekStartsOn: input.weekStartsOn,
    habits: input.habits,
    completedByHabit: input.completedByHabit,
  });

  const label =
    input.period === "week"
      ? `Week of ${range.startKey}`
      : range.startKey.slice(0, 7); // "YYYY-MM" (UI can prettify later)

  return {
    meta: {
      period: input.period,
      startKey: range.startKey,
      endKey: range.endKey,
      prevStartKey: prevRange.startKey,
      prevEndKey: prevRange.endKey,
      asOfKey,
      label,
      seriesUnit: seriesBuilt.seriesUnit,
    },

    overall: {
      planned: overallPlanned,
      completed: overallCompleted,
      missed: overallMissed,
      adherence: overallAdh,
      deltaAdherencePP: deltaPP(overallAdh, prevAdh),

      deltaCompleted: overallCompleted - prevCompleted,
      deltaMissed: overallMissed - prevMissed,

      metTarget: overallMetTarget,
      trendLabel: overallTrendLabel,
    },

    habits: habitRows,
    series: seriesBuilt.points,
  };
}
