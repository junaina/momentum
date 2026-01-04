import type { CreateHabitBody } from "@/server/validators/habits.zod";

import * as habitsRepo from "@/server/repos/habits.repo";
import type { PatchHabitBody } from "@/server/validators/habits.zod";
import { dbHabitToTodayHabit } from "@/server/mappers/habits.mapper";

type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

function dayToInt(d: DayOfWeek): number {
  // Match JS getDay(): 0=Sun..6=Sat
  if (d === "sun") return 0;
  if (d === "mon") return 1;
  if (d === "tue") return 2;
  if (d === "wed") return 3;
  if (d === "thu") return 4;
  if (d === "fri") return 5;
  return 6;
}
function dateKeyToUtcDate(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map((x) => Number(x));
  return new Date(Date.UTC(y, m - 1, d));
}

function todayDateKeyInTimeZone(timezone: string, now: Date): string {
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
  if (!year || !month || !day) {
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, "0");
    const d = String(now.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return `${year}-${month}-${day}`;
}

function hhmmToUtcTimeDate(hhmm: string): Date {
  const [hh, mm] = hhmm.split(":").map((x) => Number(x));
  return new Date(Date.UTC(1970, 0, 1, hh, mm, 0, 0));
}

export class HabitNotFoundError extends Error {
  constructor() {
    super("Habit not found");
  }
}

export async function createHabit(userId: string, body: CreateHabitBody) {
  const name = body.name.trim();
  const description =
    body.description && body.description.trim().length > 0
      ? body.description.trim()
      : null;
  const scheduledDays = body.scheduledDays.map(dayToInt);
  // - daily: weeklyTarget = 1 (or ignore if provided)
  // - weekly: weeklyTarget defaults to scheduledDays.length if not provided
  let weeklyTarget: number;
  if (body.frequency === "daily") {
    weeklyTarget = 1;
  } else {
    weeklyTarget = body.weeklyTarget ?? scheduledDays.length;
    if (weeklyTarget < 1 || weeklyTarget > 7) {
      throw new Error("Invalid weeklyTarget");
    }
  }
  const reminderEnabled = Boolean(
    body.reminderTime && body.reminderTime !== ""
  );
  const reminderTime =
    reminderEnabled && body.reminderTime
      ? hhmmToUtcTimeDate(body.reminderTime)
      : null;

  const emoji =
    body.emoji && body.emoji.trim().length > 0 ? body.emoji.trim() : null;

  const created = await habitsRepo.createHabit({
    userId,
    name,
    description,
    frequency: body.frequency,
    scheduledDays,
    weeklyTarget,
    emoji,
    reminderEnabled,
    reminderTime,
  });

  return created; // { id }
}

export async function updateHabit(input: {
  userId: string;
  userTimezone: string | null;
  habitId: string;
  body: PatchHabitBody;
  date?: string; // optional ?date=YYYY-MM-DD for correct completedToday
}) {
  const timezone = input.userTimezone ?? "UTC";
  const dateKey = input.date ?? todayDateKeyInTimeZone(timezone, new Date());
  const logDate = dateKeyToUtcDate(dateKey);

  // 1) Fetch existing meta (for pausedAt/archivedAt stability)
  const meta = await habitsRepo.findHabitMetaForUser(
    input.userId,
    input.habitId
  );
  if (!meta) throw new HabitNotFoundError();

  const b = input.body;

  // 2) Normalize strings -> nullable fields
  const description =
    b.description && b.description.trim().length > 0
      ? b.description.trim()
      : null;

  const emoji = b.emoji && b.emoji.trim().length > 0 ? b.emoji.trim() : null;

  const startDate =
    b.startDate && b.startDate.trim().length > 0
      ? dateKeyToUtcDate(b.startDate)
      : null;

  const reminderTime =
    b.reminderEnabled && b.reminderTime && b.reminderTime !== ""
      ? hhmmToUtcTimeDate(b.reminderTime)
      : null;

  const reminderEnabled = reminderTime !== null;

  // 3) Weekly target rule (match your create behavior)
  const scheduledDays = b.scheduledDays.map(dayToInt);
  let weeklyTarget: number;
  if (b.frequency === "daily") {
    weeklyTarget = 1;
  } else {
    weeklyTarget = b.weeklyTarget ?? scheduledDays.length;
    if (weeklyTarget < 1 || weeklyTarget > 7)
      throw new Error("Invalid weeklyTarget");
  }

  // 4) Status timestamps (only set once per transition)
  const now = new Date();

  const pausedAt = b.status === "paused" ? meta.pausedAt ?? now : null;

  const archivedAt = b.status === "archived" ? meta.archivedAt ?? now : null;

  // If active, clear both
  const finalPausedAt = b.status === "active" ? null : pausedAt;
  const finalArchivedAt = b.status === "active" ? null : archivedAt;

  // 5) Update + fetch updated habit with log state for `dateKey`
  const updated = await habitsRepo.updateHabitForUser({
    userId: input.userId,
    habitId: input.habitId,
    logDate,
    data: {
      name: b.name.trim(),
      description,
      frequency: b.frequency,
      weeklyTarget,
      scheduledDays,
      emoji,
      reminderEnabled,
      reminderTime,
      color: b.colorToken,
      startDate,
      status: b.status,
      pausedAt: finalPausedAt,
      archivedAt: finalArchivedAt,
      visibility: b.visibility,
    },
  });

  if (!updated) throw new HabitNotFoundError();

  return dbHabitToTodayHabit(updated);
}
export async function deleteHabit(userId: string, habitId: string) {
  const count = await habitsRepo.deleteHabitForUser(userId, habitId);
  if (count === 0) throw new HabitNotFoundError();
  return { ok: true as const };
}
