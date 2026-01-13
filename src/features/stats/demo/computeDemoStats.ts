import type {
  StatsPeriod,
  StatsResponse,
  StatsHabitRow,
} from "@/features/stats/statsSchema";
import type { Mode, TodayHabit } from "@/features/today/types";
import { getDemoHabitsForDate } from "@/features/today/demo/todaySeed";
import { toDateKey } from "@/features/today/utils/dateKey";

type StatsStatus = "active" | "activePaused" | "all";

type Range = { startKey: string; endKey: string };
type WeekStartsOn = 0 | 1;
function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s
  );
}

// Fast 32-bit FNV-1a
function fnv1a32(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    // multiply by FNV prime 16777619 (no BigInt)
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

function hex8(n: number): string {
  return (n >>> 0).toString(16).padStart(8, "0");
}

// Deterministic UUID-like string (v4-ish) from any stable id
function stableDemoUuid(raw: string): string {
  if (isUuid(raw)) return raw;

  // build 128 bits from four 32-bit hashes
  const a = fnv1a32(`demo:a:${raw}`);
  const b = fnv1a32(`demo:b:${raw}`);
  const c = fnv1a32(`demo:c:${raw}`);
  const d = fnv1a32(`demo:d:${raw}`);

  // 32 hex chars
  let hex = hex8(a) + hex8(b) + hex8(c) + hex8(d);

  // set version nibble to 4 (uuid v4)
  hex = hex.slice(0, 12) + "4" + hex.slice(13);

  // set variant to 8,9,a,b (we’ll force 8)
  const variantNibble = "8";
  hex = hex.slice(0, 16) + variantNibble + hex.slice(17);

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
    12,
    16
  )}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function dateKeyToUtcDate(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
function utcDateToDateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function addDaysDateKey(dateKey: string, days: number): string {
  const dt = dateKeyToUtcDate(dateKey);
  dt.setUTCDate(dt.getUTCDate() + days);
  return utcDateToDateKey(dt);
}
function minDateKey(a: string, b: string): string {
  return a <= b ? a : b;
}
function startOfWeekDateKey(
  dateKey: string,
  weekStartsOn: WeekStartsOn
): string {
  const dt = dateKeyToUtcDate(dateKey);
  const dow = dt.getUTCDay(); // 0..6
  const offset = (dow - weekStartsOn + 7) % 7;
  dt.setUTCDate(dt.getUTCDate() - offset);
  return utcDateToDateKey(dt);
}
function endOfWeekDateKey(dateKey: string, weekStartsOn: WeekStartsOn): string {
  return addDaysDateKey(startOfWeekDateKey(dateKey, weekStartsOn), 6);
}
function startOfMonthDateKey(dateKey: string): string {
  const dt = dateKeyToUtcDate(dateKey);
  dt.setUTCDate(1);
  return utcDateToDateKey(dt);
}
function endOfMonthDateKey(dateKey: string): string {
  const dt = dateKeyToUtcDate(dateKey);
  dt.setUTCMonth(dt.getUTCMonth() + 1, 1);
  dt.setUTCDate(dt.getUTCDate() - 1);
  return utcDateToDateKey(dt);
}
function* iterateDateKeys(startKey: string, endKey: string): Generator<string> {
  let k = startKey;
  while (k <= endKey) {
    yield k;
    k = addDaysDateKey(k, 1);
  }
}

function getRange(
  period: StatsPeriod,
  anchorKey: string,
  weekStartsOn: WeekStartsOn
): Range {
  if (period === "week") {
    return {
      startKey: startOfWeekDateKey(anchorKey, weekStartsOn),
      endKey: endOfWeekDateKey(anchorKey, weekStartsOn),
    };
  }
  return {
    startKey: startOfMonthDateKey(anchorKey),
    endKey: endOfMonthDateKey(anchorKey),
  };
}
function getPrevRange(period: StatsPeriod, range: Range): Range {
  if (period === "week")
    return {
      startKey: addDaysDateKey(range.startKey, -7),
      endKey: addDaysDateKey(range.endKey, -7),
    };
  const prevMonthAnchor = addDaysDateKey(range.startKey, -1);
  return {
    startKey: startOfMonthDateKey(prevMonthAnchor),
    endKey: endOfMonthDateKey(prevMonthAnchor),
  };
}

function deltaPP(curr: number | null, prev: number | null): number | null {
  if (curr == null || prev == null) return null;
  return (curr - prev) * 100;
}

type DayMapEntry = { planned: boolean; completed: boolean; habit: TodayHabit };
type DayMap = Map<string, Map<string, DayMapEntry>>; // dayKey -> habitId -> entry

function buildDayMap(startKey: string, endKey: string): DayMap {
  const map: DayMap = new Map();
  for (const dayKey of iterateDateKeys(startKey, endKey)) {
    const date = dateKeyToUtcDate(dayKey);
    const habits = getDemoHabitsForDate(date);
    const inner = new Map<string, DayMapEntry>();
    for (const h of habits) {
      const id = stableDemoUuid(h.id);

      inner.set(id, {
        planned: true,
        completed: Boolean(h.completedToday),
        habit: h, // keep original habit object
      });
    }
    map.set(dayKey, inner);
  }
  return map;
}

function collectHabitsFromDayMap(dayMap: DayMap): Map<string, TodayHabit> {
  const habits = new Map<string, TodayHabit>();
  for (const inner of dayMap.values()) {
    for (const [id, entry] of inner.entries()) {
      if (!habits.has(id)) habits.set(id, { ...entry.habit, id });
    }
  }
  return habits;
}

function habitAllowedByStatus(h: TodayHabit, status: StatsStatus): boolean {
  if (status === "all") return true;
  if (status === "activePaused")
    return h.status === "active" || h.status === "paused";
  return h.status === "active";
}

type Counts = {
  planned: number;
  completed: number;
  missed: number;
  adherence: number | null;
  metTarget: boolean;
};

function computeCountsForRangeDemo(input: {
  habit: TodayHabit;
  range: Range;
  asOfKey: string;
  weekStartsOn: WeekStartsOn;
  dayMap: DayMap;
}): Counts {
  const evalEnd = minDateKey(input.range.endKey, input.asOfKey);
  let planned = 0;
  let completed = 0;

  const isQuotaMode =
    input.habit.frequency === "weekly" && (input.habit.weeklyTarget ?? 0) > 0;

  if (!isQuotaMode) {
    for (const k of iterateDateKeys(input.range.startKey, evalEnd)) {
      const inner = input.dayMap.get(k);
      const entry = inner?.get(input.habit.id);
      if (!entry) continue;
      planned += 1;
      if (entry.completed) completed += 1;
    }
  } else {
    const target = input.habit.weeklyTarget;
    let weekStart = startOfWeekDateKey(
      input.range.startKey,
      input.weekStartsOn
    );

    while (weekStart <= evalEnd) {
      const weekEnd = addDaysDateKey(weekStart, 6);
      const sliceStart =
        weekStart < input.range.startKey ? input.range.startKey : weekStart;
      const sliceEnd = weekEnd > evalEnd ? evalEnd : weekEnd;

      let eligibleDays = 0;
      let completedDays = 0;

      for (const k of iterateDateKeys(sliceStart, sliceEnd)) {
        const inner = input.dayMap.get(k);
        const entry = inner?.get(input.habit.id);
        if (!entry) continue;
        eligibleDays += 1;
        if (entry.completed) completedDays += 1;
      }

      planned += Math.min(target, eligibleDays);
      completed += completedDays;

      weekStart = addDaysDateKey(weekStart, 7);
    }
  }

  const missed = Math.max(0, planned - completed);
  const adherence = planned === 0 ? null : Math.min(1, completed / planned);
  const metTarget = planned > 0 && completed >= planned;

  return { planned, completed, missed, adherence, metTarget };
}

export function computeDemoStats(input: {
  period: StatsPeriod;
  anchorKey?: string;
  status: StatsStatus;
}): StatsResponse {
  const weekStartsOn: WeekStartsOn = 1; // demo default: Monday
  const todayKey = toDateKey(new Date());
  const anchorKey = input.anchorKey ?? todayKey;

  const range = getRange(input.period, anchorKey, weekStartsOn);
  const prevRange = getPrevRange(input.period, range);

  // match server clamp: asOfKey = min(range.end, min(anchor, today))
  const asOfKey = minDateKey(range.endKey, minDateKey(anchorKey, todayKey));

  // build day map that covers BOTH prev + current range (so we can compute deltas)
  const dayMap = buildDayMap(prevRange.startKey, range.endKey);
  const allHabits = collectHabitsFromDayMap(dayMap);

  const habitsFiltered = Array.from(allHabits.values()).filter((h) =>
    habitAllowedByStatus(h, input.status)
  );

  const rows: StatsHabitRow[] = habitsFiltered.map((h) => {
    const curr = computeCountsForRangeDemo({
      habit: h,
      range,
      asOfKey,
      weekStartsOn,
      dayMap,
    });
    const prev = computeCountsForRangeDemo({
      habit: h,
      range: prevRange,
      asOfKey: prevRange.endKey,
      weekStartsOn,
      dayMap,
    });

    const trendLabel = prev.planned === 0 && curr.planned > 0 ? "new" : null;

    return {
      habitId: h.id,
      name: h.name,
      emoji: h.emoji ?? null,
      color: null,

      planned: curr.planned,
      completed: curr.completed,
      missed: curr.missed,
      adherence: curr.adherence,
      deltaAdherencePP: deltaPP(curr.adherence, prev.adherence),

      deltaCompleted: curr.completed - prev.completed,
      deltaMissed: curr.missed - prev.missed,

      metTarget: curr.metTarget,
      trendLabel,
    };
  });

  const overallPlanned = rows.reduce((s, r) => s + r.planned, 0);
  const overallCompleted = rows.reduce((s, r) => s + r.completed, 0);
  const overallMissed = rows.reduce((s, r) => s + r.missed, 0);
  const overallAdh =
    overallPlanned === 0
      ? null
      : Math.min(1, overallCompleted / overallPlanned);

  // prev overall
  const prevCounts = habitsFiltered.map((h) =>
    computeCountsForRangeDemo({
      habit: h,
      range: prevRange,
      asOfKey: prevRange.endKey,
      weekStartsOn,
      dayMap,
    })
  );
  const prevPlanned = prevCounts.reduce((s, c) => s + c.planned, 0);
  const prevCompleted = prevCounts.reduce((s, c) => s + c.completed, 0);
  const prevMissed = prevCounts.reduce((s, c) => s + c.missed, 0);
  const prevAdh =
    prevPlanned === 0 ? null : Math.min(1, prevCompleted / prevPlanned);

  const overallTrendLabel =
    prevPlanned === 0 && overallPlanned > 0 ? "new" : null;
  const overallMetTarget =
    overallPlanned > 0 && overallCompleted >= overallPlanned;

  // series
  const series =
    input.period === "week"
      ? Array.from(iterateDateKeys(range.startKey, range.endKey)).map(
          (dayKey) => {
            let planned = 0;
            let completed = 0;
            for (const h of habitsFiltered) {
              const c = computeCountsForRangeDemo({
                habit: h,
                range: { startKey: dayKey, endKey: dayKey },
                asOfKey,
                weekStartsOn,
                dayMap,
              });
              planned += c.planned;
              completed += c.completed;
            }
            return { key: dayKey, planned, completed };
          }
        )
      : (() => {
          const points: { key: string; planned: number; completed: number }[] =
            [];
          let weekStart = startOfWeekDateKey(range.startKey, weekStartsOn);
          while (weekStart <= range.endKey) {
            const weekEnd = addDaysDateKey(weekStart, 6);
            const sliceStart =
              weekStart < range.startKey ? range.startKey : weekStart;
            const sliceEnd = weekEnd > range.endKey ? range.endKey : weekEnd;

            let planned = 0;
            let completed = 0;
            for (const h of habitsFiltered) {
              const c = computeCountsForRangeDemo({
                habit: h,
                range: { startKey: sliceStart, endKey: sliceEnd },
                asOfKey,
                weekStartsOn,
                dayMap,
              });
              planned += c.planned;
              completed += c.completed;
            }

            points.push({ key: weekStart, planned, completed });
            weekStart = addDaysDateKey(weekStart, 7);
          }
          return points;
        })();

  const label =
    input.period === "week"
      ? `Week of ${range.startKey}`
      : range.startKey.slice(0, 7);

  return {
    meta: {
      period: input.period,
      seriesUnit: input.period === "week" ? "day" : "week",
      startKey: range.startKey,
      endKey: range.endKey,
      prevStartKey: prevRange.startKey,
      prevEndKey: prevRange.endKey,
      asOfKey,
      label,
    },
    overall: {
      planned: overallPlanned,
      completed: overallCompleted,
      missed: overallMissed,
      adherence: overallAdh,
      deltaAdherencePP: deltaPP(overallAdh, prevAdh),
      deltaCompleted: overallCompleted - prevCompleted,
      deltaMissed: overallMissed - prevMissed,
      trendLabel: overallTrendLabel,
      metTarget: overallMetTarget,
    },
    series,
    habits: rows,
  };
}
