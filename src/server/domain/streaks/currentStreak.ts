import type { DayOfWeek } from "@/features/today/schema";
import { shouldHabitAppearOnDate } from "@/server/domain/habits/schedule";

function dateKeyToUtcDate(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map((x) => Number(x));
  return new Date(Date.UTC(y, m - 1, d));
}

function utcDateToDateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function previousDateKey(dateKey: string): string {
  const d = dateKeyToUtcDate(dateKey);
  d.setUTCDate(d.getUTCDate() - 1);
  return utcDateToDateKey(d);
}

function addDaysDateKey(dateKey: string, deltaDays: number): string {
  const d = dateKeyToUtcDate(dateKey);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return utcDateToDateKey(d);
}
function dayOfWeek(dateKey: string): number {
  return dateKeyToUtcDate(dateKey).getUTCDay();
}
function startOfWeekDateKey(dateKey: string, weekStartsOn: 0 | 1): string {
  const dow = dayOfWeek(dateKey);
  const diff = (dow - weekStartsOn + 7) % 7;
  return addDaysDateKey(dateKey, -diff);
}
function minDateKey(a: string, b: string): string {
  return a <= b ? a : b;
}
export function computeCurrentStreakDays(input: {
  todayKey: string; // timezone-correct "today"
  asOfKey: string; // selected day, clamped for freeze
  startDateKey: string; // habit start dateKey
  scheduledDays: DayOfWeek[];
  completedDateKeys: ReadonlySet<string>;
}): number {
  let streak = 0;
  let cursor = input.asOfKey;

  while (cursor >= input.startDateKey) {
    const isScheduled = shouldHabitAppearOnDate({
      scheduledDays: input.scheduledDays,
      startDate: input.startDateKey,
      dateKey: cursor,
    });

    if (!isScheduled) {
      cursor = previousDateKey(cursor);
      continue;
    }

    // today not done yet should not break the streak
    if (cursor === input.todayKey && !input.completedDateKeys.has(cursor)) {
      cursor = previousDateKey(cursor);
      continue;
    }

    if (input.completedDateKeys.has(cursor)) {
      streak += 1;
      cursor = previousDateKey(cursor);
      continue;
    }

    // first missed scheduled day breaks
    break;
  }

  return streak;
}

export function computeCurrentStreakWeeks(input: {
  todayKey: string; // timezone-correct "today"
  asOfKey: string; // selected day, clamped for freeze
  startDateKey: string;
  scheduledDays: DayOfWeek[];
  weeklyTarget: number;
  completedDateKeys: ReadonlySet<string>;
  weekStartsOn?: 0 | 1; // default monday
}): number {
  const weekStartsOn = input.weekStartsOn ?? 1;
  let streak = 0;
  let weekStart = startOfWeekDateKey(input.asOfKey, weekStartsOn);
  let firstWeek = true;
  while (true) {
    const weekEnd = addDaysDateKey(weekStart, 6);

    //no overlap with habit lifetime
    if (weekEnd < input.startDateKey) break;

    //current week is partial only consider upto asOfKey
    const rangeEnd = firstWeek ? minDateKey(weekEnd, input.asOfKey) : weekEnd;
    let eligibleDays = 0;
    let completed = 0;

    //iterating day by day from weekStart to rangeEnd
    let cursor = weekStart;
    while (cursor <= rangeEnd) {
      const isScheduled = shouldHabitAppearOnDate({
        scheduledDays: input.scheduledDays,
        startDate: input.startDateKey,
        dateKey: cursor,
      });
      if (isScheduled) {
        eligibleDays += 1;
        if (input.completedDateKeys.has(cursor)) completed += 1;
      }
      cursor = addDaysDateKey(cursor, 1);
    }
    //if habit only existed for part of this week dont require the full weekly target
    const planned = Math.min(input.weeklyTarget, eligibleDays);

    // Nothing eligible in this slice (rare, but safe): skip current week, otherwise stop
    if (planned === 0) {
      if (firstWeek) {
        firstWeek = false;
        weekStart = addDaysDateKey(weekStart, -7);
        continue;
      }
      break;
    }
    const met = completed >= planned;

    // if the current week has not been met yet, dont break streak just start counting from the last completed weeks
    if (firstWeek && !met) {
      firstWeek = false;
      weekStart = addDaysDateKey(weekStart, -7);
      continue;
    }
    if (met) {
      streak += 1;
      firstWeek = false;
      weekStart = addDaysDateKey(weekStart, -7);
      continue;
    }
    break;
  }
  return streak;
}
