import type { DayOfWeek, HabitColorToken } from "@/features/today/schema";
import type { TodayHabit } from "@/features/today/types";

function weekdayToDayOfWeek(date: Date): DayOfWeek {
  // JS: 0=Sun..6=Sat
  const d = date.getDay();
  if (d === 0) return "sun";
  if (d === 1) return "mon";
  if (d === 2) return "tue";
  if (d === 3) return "wed";
  if (d === 4) return "thu";
  if (d === 5) return "fri";
  return "sat";
}

const COLORS: HabitColorToken[] = [
  "mint",
  "sky",
  "violet",
  "amber",
  "rose",
  "lime",
  "slate",
  "cyan",
];

const SEED: Omit<TodayHabit, "completedToday">[] = [
  {
    id: "h1",
    name: "Drink water",
    description: "2L total",
    emoji: "💧",
    colorToken: "mint",
    frequency: "daily",
    weeklyTarget: 7,
    scheduledDays: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
    reminderEnabled: true,
    reminderTime: "09:00",
    startDate: "2026-01-01",
    status: "active",
    visibility: "private",
    stats: { totalCompletions: 34, currentStreakDays: 6 },
  },
  {
    id: "h2",
    name: "Workout",
    description: "Lift or run",
    emoji: "🏋️",
    colorToken: "sky",
    frequency: "weekly",
    weeklyTarget: 3,
    scheduledDays: ["mon", "wed", "fri"],
    reminderEnabled: false,
    reminderTime: "",
    startDate: "2026-01-01",
    status: "active",
    visibility: "private",
    stats: { totalCompletions: 18, currentStreakDays: 2 },
  },
  {
    id: "h3",
    name: "Read 10 pages",
    description: "No phone while reading",
    emoji: "📚",
    colorToken: "violet",
    frequency: "daily",
    weeklyTarget: 7,
    scheduledDays: ["mon", "tue", "wed", "thu", "fri"],
    reminderEnabled: true,
    reminderTime: "20:30",
    startDate: "2026-01-01",
    status: "active",
    visibility: "private",
    stats: { totalCompletions: 52, currentStreakDays: 9 },
  },
];

export function getDemoHabitsForDate(date: Date): TodayHabit[] {
  const dow = weekdayToDayOfWeek(date);

  // deterministic-ish completion for now; later you’ll drive this from logs
  return SEED.filter((h) => h.scheduledDays.includes(dow)).map((h, idx) => ({
    ...h,
    completedToday: idx === 0,
    // if a seed somehow lacks a color, assign one (safe)
    colorToken: h.colorToken ?? COLORS[idx % COLORS.length]!,
  }));
}
