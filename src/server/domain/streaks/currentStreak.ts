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

function previousDateKey(dateKey: string): string {
  const d = dateKeyToUtcDate(dateKey);
  d.setUTCDate(d.getUTCDate() - 1);
  return utcDateToDateKey(d);
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
