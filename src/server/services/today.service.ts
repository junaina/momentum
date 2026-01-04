import type { TodayHabit } from "@/features/today/types";
import * as habitsRepo from "@/server/repos/habits.repo";
import { dbHabitToTodayHabit } from "@/server/mappers/habits.mapper";
import { shouldHabitAppearOnDate } from "@/server/domain/habits/schedule";

function dateKeyToUtcDate(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map((x) => Number(x));
  return new Date(Date.UTC(y, m - 1, d));
}

function todayDateKeyInTimeZone(timezone: string, now: Date): string {
  // build YYYY-MM-DD using Intl parts (stable + no external libs)
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(now);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  //fallback
  if (!year || !month || !day) {
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, "0");
    const d = String(now.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  return `${year}-${month}-${day}`;
}
type StatusFilter = "active" | "paused" | "archived" | "all";

function statusesFromFilter(filter?: StatusFilter) {
  if (!filter || filter === "active") return ["active"] as const;
  if (filter === "paused") return ["paused"] as const;
  if (filter === "archived") return ["archived"] as const;
  return ["active", "paused", "archived"] as const;
}
export async function getTodayHabits(input: {
  userId: string;
  userTimezone: string | null;
  date?: string;
  status?: StatusFilter;
}): Promise<TodayHabit[]> {
  const timezone = input.userTimezone ?? "UTC";
  const dateKey = input.date ?? todayDateKeyInTimeZone(timezone, new Date());

  const logDate = dateKeyToUtcDate(dateKey);
  const statuses = statusesFromFilter(input.status);

  const dbHabits = await habitsRepo.findHabitsForToday(
    input.userId,
    logDate,
    statuses
  );

  const mapped = dbHabits.map(dbHabitToTodayHabit);

  // Apply the pure scheduling rule (same as your CreateHabitSheet logic)
  return mapped.filter((h) =>
    shouldHabitAppearOnDate({
      scheduledDays: h.scheduledDays,
      startDate: h.startDate,
      dateKey,
    })
  );
}
