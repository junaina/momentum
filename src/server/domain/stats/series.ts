import {
  iterateDateKeys,
  startOfWeekDateKey,
  addDaysDateKey,
  type WeekStartsOn,
} from "./dateKey";
import type { Range, StatsPeriod } from "./period";
import type { HabitForStats } from "./lifecycle";
import { computeCountsForRange } from "./compute";

export type SeriesPoint = { key: string; planned: number; completed: number };

export function buildSeries(input: {
  period: StatsPeriod;
  range: Range;
  asOfKey: string;
  todayKey: string;
  weekStartsOn: WeekStartsOn;
  habits: HabitForStats[];
  completedByHabit: Map<string, ReadonlySet<string>>;
}): { seriesUnit: "day" | "week"; points: SeriesPoint[] } {
  if (input.period === "week") {
    const points: SeriesPoint[] = [];
    for (const dayKey of iterateDateKeys(
      input.range.startKey,
      input.range.endKey
    )) {
      // day-level series uses dayKey; clamp by asOfKey via computeCounts range slicing below
      let planned = 0;
      let completed = 0;

      for (const h of input.habits) {
        const completedSet =
          input.completedByHabit.get(h.id) ?? new Set<string>();

        // treat each day as a mini-range [dayKey..dayKey]
        const c = computeCountsForRange({
          habit: h,
          range: { startKey: dayKey, endKey: dayKey },
          asOfKey: input.asOfKey,
          todayKey: input.todayKey,
          weekStartsOn: input.weekStartsOn,
          completed: completedSet,
        });

        planned += c.planned;
        completed += c.completed;
      }

      points.push({ key: dayKey, planned, completed });
    }
    return { seriesUnit: "day", points };
  }

  // month: week buckets (4–6)
  const points: SeriesPoint[] = [];
  let weekStart = startOfWeekDateKey(input.range.startKey, input.weekStartsOn);

  while (weekStart <= input.range.endKey) {
    const weekEnd = addDaysDateKey(weekStart, 6);
    const sliceStart =
      weekStart < input.range.startKey ? input.range.startKey : weekStart;
    const sliceEnd =
      weekEnd > input.range.endKey ? input.range.endKey : weekEnd;

    let planned = 0;
    let completed = 0;

    for (const h of input.habits) {
      const completedSet =
        input.completedByHabit.get(h.id) ?? new Set<string>();
      const c = computeCountsForRange({
        habit: h,
        range: { startKey: sliceStart, endKey: sliceEnd },
        asOfKey: input.asOfKey,
        todayKey: input.todayKey,
        weekStartsOn: input.weekStartsOn,
        completed: completedSet,
      });
      planned += c.planned;
      completed += c.completed;
    }

    points.push({ key: weekStart, planned, completed });
    weekStart = addDaysDateKey(weekStart, 7);
  }

  return { seriesUnit: "week", points };
}
