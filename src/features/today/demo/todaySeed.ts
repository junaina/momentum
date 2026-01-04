import type { DayOfWeek, HabitColorToken } from "@/features/today/schema";
import type { TodayHabit } from "@/features/today/types";
import { toDateKey } from "@/features/today/utils/dateKey";
type DemoLogMap = Record<string, Record<string, true>>; // dateKey -> habitId -> true
const STORAGE_KEY = "momentum_demo_logs_v1";
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
function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readDemoLogs(): DemoLogMap {
  if (typeof window === "undefined") return {};
  const parsed = safeParse<DemoLogMap>(
    window.localStorage.getItem(STORAGE_KEY)
  );
  return parsed && typeof parsed === "object" ? parsed : {};
}

function writeDemoLogs(map: DemoLogMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function setDemoHabitDone(
  dateKey: string,
  habitId: string,
  done: boolean
) {
  const map = readDemoLogs();
  const day = map[dateKey] ?? {};
  if (done) day[habitId] = true;
  else delete day[habitId];

  map[dateKey] = day;
  writeDemoLogs(map);
}

export function markAllDemoHabitsDone(dateKey: string, habitIds: string[]) {
  const map = readDemoLogs();
  const day = map[dateKey] ?? {};
  for (const id of habitIds) day[id] = true;
  map[dateKey] = day;
  writeDemoLogs(map);
}
const SEED: TodayHabit[] = [
  {
    id: "demo-1",
    name: "Workout",
    description: "Quick 20–30 min session",
    emoji: "💪",
    colorToken: "mint",
    frequency: "weekly",
    weeklyTarget: 3,
    scheduledDays: ["mon", "wed", "fri"],
    reminderEnabled: false,
    reminderTime: "",
    startDate: "",
    status: "active",
    visibility: "private",
    completedToday: false,
    stats: { totalCompletions: 42, currentStreakDays: 3 },
  },
  {
    id: "demo-2",
    name: "Read",
    description: "10 pages",
    emoji: "📚",
    colorToken: "sky",
    frequency: "daily",
    weeklyTarget: 0,
    scheduledDays: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
    reminderEnabled: false,
    reminderTime: "",
    startDate: "",
    status: "active",
    visibility: "private",
    completedToday: false,
    stats: { totalCompletions: 120, currentStreakDays: 7 },
  },
  {
    id: "demo-3",
    name: "Meditate",
    description: "5 minutes",
    emoji: "🧘",
    colorToken: "violet",
    frequency: "daily",
    weeklyTarget: 0,
    scheduledDays: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
    reminderEnabled: false,
    reminderTime: "",
    startDate: "",
    status: "active",
    visibility: "friends",
    completedToday: false,
    stats: { totalCompletions: 60, currentStreakDays: 2 },
  },
];

export function getDemoHabitsForDate(date: Date): TodayHabit[] {
  const dow = weekdayToDayOfWeek(date);
  const dateKey = toDateKey(date);
  const logs = readDemoLogs()[dateKey] ?? {};

  return SEED.filter((h) => h.scheduledDays.includes(dow)).map((h, idx) => ({
    ...h,
    completedToday: Boolean(logs[h.id]),
    colorToken: h.colorToken ?? COLORS[idx % COLORS.length]!,
  }));
}
