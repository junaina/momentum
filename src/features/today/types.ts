import type {
  DayOfWeek,
  HabitColorToken,
  HabitFrequency,
  HabitStatus,
  HabitVisibility,
} from "@/features/today/schema";

export type Mode = "app" | "demo";
export type HabitStats = {
  totalCompletions: number;
  currentStreakDays: number;
};
export type TodayHabit = {
  id: string;
  name: string;
  description?: string;
  emoji: string;
  colorToken: HabitColorToken;
  frequency: HabitFrequency;
  weeklyTarget: number;
  scheduledDays: DayOfWeek[];

  reminderEnabled: boolean;
  reminderTime?: string;

  startDate?: string;
  status: HabitStatus;
  visibility: HabitVisibility;

  completedToday: boolean;
  stats?: HabitStats;
};
