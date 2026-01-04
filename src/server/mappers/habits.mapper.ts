import type { TodayHabit } from "@/features/today/types";
import type { DayOfWeek, HabitColorToken } from "@/features/today/schema";
import type {
  DbHabitForToday,
  DbHabitWithLogForDate,
} from "@/server/repos/habits.repo";
const COLOR_TOKENS: readonly HabitColorToken[] = [
  "mint",
  "sky",
  "violet",
  "amber",
  "rose",
  "lime",
  "slate",
  "cyan",
] as const;
function isHabitColorToken(value: string): value is HabitColorToken {
  return (COLOR_TOKENS as readonly string[]).includes(value);
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

function dateToDateKeyUtc(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function timeToHHMMUtc(time: Date): string {
  const hh = String(time.getUTCHours()).padStart(2, "0");
  const mm = String(time.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function dbHabitToTodayHabit(
  db: DbHabitForToday | DbHabitWithLogForDate
): TodayHabit {
  const scheduledDays = (db.scheduledDays ?? []).map(intToDayOfWeek);

  const colorToken: HabitColorToken =
    db.color && isHabitColorToken(db.color) ? db.color : "mint";
  const completedToday = db.logs.some((l) => l.completedAt !== null);
  return {
    id: db.id,
    name: db.name,
    description: db.description ?? undefined,
    emoji: db.emoji ?? "✅",
    colorToken,

    frequency: db.frequency,
    weeklyTarget: db.weeklyTarget ?? 1,
    scheduledDays,

    reminderEnabled: db.reminderEnabled,
    reminderTime:
      db.reminderEnabled && db.reminderTime
        ? timeToHHMMUtc(db.reminderTime)
        : undefined,

    startDate: db.startDate ? dateToDateKeyUtc(db.startDate) : undefined,
    status: db.status,
    visibility: db.visibility,

    completedToday,
    // stats intentionally omitted for now
  };
}
