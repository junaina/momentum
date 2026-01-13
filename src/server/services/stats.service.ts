import * as habitsRepo from "@/server/repos/habits.repo";
import * as habitLogsRepo from "@/server/repos/habit-logs.repo";
import { buildStatsEngine } from "../domain/stats/engine";
import { getRange, getPrevRange } from "../domain/stats/period";
import { minDateKey } from "../domain/stats/dateKey";
import type { WeekStartsOn } from "../domain/stats/dateKey";
import type { HabitForStats } from "../domain/stats/lifecycle";
import type { DayOfWeek } from "../domain/dayOfWeek";
import type { StatsPeriod, StatsResponse } from "@/features/stats/statsSchema";
function utcDateToDateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function dateKeyToUtcDate(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map((x) => Number(x));
  return new Date(Date.UTC(y, m - 1, d));
}
// YYYY-MM-DD in the user's timezone using Intl (same approach as today.service.ts)
function dateKeyInTimeZone(timeZone: string, at: Date): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(at);
}

function todayDateKeyInTimeZone(timeZone: string): string {
  return dateKeyInTimeZone(timeZone, new Date());
}
function intToDayOfWeek(n: number): DayOfWeek {
  if (n === 0) return "sun";
  if (n === 1) return "mon";
  if (n === 2) return "tue";
  if (n === 3) return "wed";
  if (n === 4) return "thu";
  if (n === 5) return "fri";
  return "sat";
}

//without any filtering pattern getting habits with all statuses
type StatusFilter = "active" | "activePaused" | "all";

function statusesFromFilter(
  filter?: StatusFilter
): Array<"active" | "paused" | "archived"> {
  if (filter === "active") return ["active"];
  if (filter === "activePaused") return ["active", "paused"];
  return ["active", "paused", "archived"];
}

export async function getStatsResponse(input: {
  userId: string;
  userTimezone: string | null;
  userWeekStartDay?: WeekStartsOn;
  period: StatsPeriod;
  date?: string; //anchorkey
  status?: StatusFilter;
}): Promise<StatsResponse> {
  const timezone = input.userTimezone ?? "UTC";
  const todayKey = todayDateKeyInTimeZone(timezone);
  const anchorKey = input.date ?? todayKey;
  const weekStartsOn: WeekStartsOn = input.userWeekStartDay ?? 1;

  //fetching habits as of anchorkey, just like  Today
  const logDate = dateKeyToUtcDate(anchorKey);
  const statuses = statusesFromFilter(input.status);
  const dbHabits = await habitsRepo.findHabitsForToday(
    input.userId,
    logDate,
    statuses
  );
  const habits: HabitForStats[] = dbHabits.map((h) => ({
    id: h.id,
    name: h.name,
    emoji: h.emoji,
    color: h.color,

    frequency: h.frequency,
    weeklyTarget: h.weeklyTarget,
    scheduledDays: h.scheduledDays.map(intToDayOfWeek),

    // date-only fields in UTC are fine as keys (matches your existing approach)
    startDateKey: h.startDate ? utcDateToDateKey(h.startDate) : null,
    createdAtKey: utcDateToDateKey(h.createdAt),

    status: h.status,
    pausedKeyRaw: h.pausedAt ? dateKeyInTimeZone(timezone, h.pausedAt) : null,
    archivedKeyRaw: h.archivedAt
      ? dateKeyInTimeZone(timezone, h.archivedAt)
      : null,
  }));
  const habitIds = habits.map((h) => h.id);

  const range = getRange(input.period, anchorKey, weekStartsOn);
  const prevRange = getPrevRange(input.period, range);
  const asOfKey = minDateKey(range.endKey, minDateKey(anchorKey, todayKey));

  //if no habits, return empty
  if (habitIds.length === 0) {
    return buildStatsEngine({
      period: input.period,
      anchorKey,
      todayKey,
      weekStartsOn,
      habits: [],
      completedByHabit: new Map(),
    });
  }
  //grabbing completions for previous period as well as current period upto asOfKey
  const completedRows = await habitLogsRepo.findCompletedLogDateKeysInRange({
    userId: input.userId,
    habitIds,
    fromDateKey: prevRange.startKey,
    toDateKey: asOfKey,
  });

  const completedByHabit = new Map<string, Set<string>>();
  for (const row of completedRows) {
    const set = completedByHabit.get(row.habitId) ?? new Set<string>();
    set.add(row.dateKey);
    completedByHabit.set(row.habitId, set);
  }
  return buildStatsEngine({
    period: input.period,
    anchorKey,
    todayKey,
    weekStartsOn,
    habits,
    completedByHabit,
  });
}
