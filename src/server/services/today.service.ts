import type { TodayHabit } from "@/features/today/types";

import * as habitsRepo from "@/server/repos/habits.repo";
import { dbHabitToTodayHabit } from "@/server/mappers/habits.mapper";
import { shouldHabitAppearOnDate } from "@/server/domain/habits/schedule";
import {
  computeCurrentStreakDays,
  computeCurrentStreakWeeks,
  previousDateKey,
} from "@/server/domain/streaks/currentStreak";
import * as habitLogsRepo from "@/server/repos/habit-logs.repo";

export type TodayHabitsMeta = {
  //server computed today datekey in the user's timezone
  todayKey: string;
};

export type TodayHabitResponse = {
  items: TodayHabit[];
  meta: TodayHabitsMeta;
};
function utcDateToDateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dateKeyInTimeZone(timeZone: string, at: Date): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // en-CA yields YYYY-MM-DD reliably
  return fmt.format(at);
}

function minDateKey(a: string, b: string): string {
  return a <= b ? a : b;
}

function maxDateKey(a: string, b: string): string {
  return a >= b ? a : b;
}

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

export async function getTodayHabitsResponse(input: {
  userId: string;
  userTimezone: string | null;
  userWeekStartDay?: 0 | 1;
  date?: string;
  status?: StatusFilter;
}): Promise<TodayHabitResponse> {
  const timezone = input.userTimezone ?? "UTC";
  const todayKey = todayDateKeyInTimeZone(timezone, new Date());
  const dateKey = input.date ?? todayKey;

  const logDate = dateKeyToUtcDate(dateKey);
  const statuses = statusesFromFilter(input.status);

  // ✅ Fetch dbHabits here so we can compute freeze + startDateKey safely
  const dbHabits = await habitsRepo.findHabitsForToday(
    input.userId,
    logDate,
    statuses
  );

  // Map to TodayHabit
  const mapped = dbHabits.map(dbHabitToTodayHabit);

  // Apply schedule rule
  const items = mapped.filter((h) =>
    shouldHabitAppearOnDate({
      scheduledDays: h.scheduledDays,
      startDate: h.startDate,
      dateKey,
    })
  );

  const habitIds = items.map((h) => h.id);
  if (habitIds.length === 0) {
    return { items: [], meta: { todayKey } };
  }

  // Build lookup of DB habit by id
  const dbById = new Map<string, habitsRepo.DbHabitForToday>();
  for (const h of dbHabits) dbById.set(h.id, h);

  // Determine earliest start key among the returned items (for log scan window)
  const minStartKey = items.reduce<string>((acc, h) => {
    const db = dbById.get(h.id);
    const startKey =
      db && db.startDate
        ? utcDateToDateKey(db.startDate)
        : db && db.createdAt
        ? utcDateToDateKey(db.createdAt)
        : h.startDate ?? dateKey; // last-resort fallback

    return acc === "" ? startKey : minDateKey(acc, startKey);
  }, "");

  const completedRows = await habitLogsRepo.findCompletedLogDateKeysInRange({
    userId: input.userId,
    habitIds,
    fromDateKey: minStartKey,
    toDateKey: dateKey,
  });

  const completedByHabit = new Map<string, Set<string>>();
  for (const row of completedRows) {
    const set = completedByHabit.get(row.habitId) ?? new Set<string>();
    set.add(row.dateKey);
    completedByHabit.set(row.habitId, set);
  }

  const totals = await habitLogsRepo.countTotalCompletionByHabitids({
    userId: input.userId,
    habitIds: [...habitIds],
  });

  const enriched: TodayHabit[] = items.map((h) => {
    const db = dbById.get(h.id);

    const startDateKey =
      db && db.startDate
        ? utcDateToDateKey(db.startDate)
        : db && db.createdAt
        ? utcDateToDateKey(db.createdAt)
        : h.startDate ?? dateKey;

    const completedSet = completedByHabit.get(h.id) ?? new Set<string>();

    const freezeKeyRaw =
      db && db.status === "paused" && db.pausedAt
        ? dateKeyInTimeZone(timezone, db.pausedAt)
        : db && db.status === "archived" && db.archivedAt
        ? dateKeyInTimeZone(timezone, db.archivedAt)
        : null;

    // ✅ Fix #2: pausing/archiving on a missed (scheduled) day should NOT break streak.
    // Freeze “as of” the previous day unless that freeze day was completed or is today.
    const freezeKey =
      freezeKeyRaw &&
      freezeKeyRaw !== todayKey &&
      !completedSet.has(freezeKeyRaw)
        ? previousDateKey(freezeKeyRaw)
        : freezeKeyRaw;

    const streakBaseKey = minDateKey(dateKey, todayKey);
    const asOfKey = freezeKey
      ? minDateKey(streakBaseKey, freezeKey)
      : streakBaseKey;

    // ✅ Fix #1: weekly habits use weekly streak logic
    if (h.frequency === "weekly" && h.weeklyTarget) {
      const currentStreakWeeks = computeCurrentStreakWeeks({
        todayKey,
        asOfKey,
        startDateKey,
        scheduledDays: h.scheduledDays,
        weeklyTarget: h.weeklyTarget,
        completedDateKeys: completedSet,
        weekStartsOn: input.userWeekStartDay ?? 1,
      });

      return {
        ...h,
        stats: {
          totalCompletions: totals[h.id] ?? 0,
          currentStreakWeeks,
        },
      };
    }

    const currentStreakDays = computeCurrentStreakDays({
      todayKey,
      asOfKey,
      startDateKey,
      scheduledDays: h.scheduledDays,
      completedDateKeys: completedSet,
    });

    return {
      ...h,
      stats: {
        totalCompletions: totals[h.id] ?? 0,
        currentStreakDays,
      },
    };
  });

  return { items: enriched, meta: { todayKey } };
}
