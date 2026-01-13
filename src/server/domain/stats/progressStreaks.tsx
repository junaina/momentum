// progressStreaks.ts
import type { DayOfWeek } from "@/server/domain/dayOfWeek";
import type { HabitForStats } from "./lifecycle";
import {
  getHabitStartKey,
  getFreezeKeyRaw,
  computeEffectiveFreezeKey,
  clampFreezeToRangeEnd,
} from "./lifecycle";
import {
  computeCurrentStreakDays,
  computeCurrentStreakWeeks,
} from "@/server/domain/streaks/currentStreak";
import {
  computeLongestStreakDays,
  computeLongestStreakWeeks,
} from "@/server/domain/streaks/currentStreak"; // new file or re-export from currentStreak if you prefer

export type ProgressStreaks = {
  // only one unit will be populated depending on habit type
  currentStreakDays?: number;
  longestStreakDays?: number;
  currentStreakWeeks?: number;
  longestStreakWeeks?: number;
};

export function computeProgressStreaksForHabit(input: {
  habit: HabitForStats;
  completedDateKeys: ReadonlySet<string>;
  todayKey: string;
  asOfKey: string;
  weekStartsOn: 0 | 1;
}): ProgressStreaks {
  const {
    habit: h,
    completedDateKeys,
    todayKey,
    asOfKey,
    weekStartsOn,
  } = input;

  const habitStartKey = getHabitStartKey(h);

  // respect freeze lifecycle
  const freezeKeyRaw = getFreezeKeyRaw(h);
  const effectiveFreezeKey = computeEffectiveFreezeKey({
    freezeKeyRaw,
    todayKey,
    completedDateKeys,
  });
  const streakAsOf = clampFreezeToRangeEnd(effectiveFreezeKey, asOfKey);

  const scheduledDays = h.scheduledDays as unknown as DayOfWeek[];

  if (h.weeklyTarget == null) {
    return {
      currentStreakDays: computeCurrentStreakDays({
        todayKey,
        asOfKey: streakAsOf,
        startDateKey: habitStartKey,
        scheduledDays,
        completedDateKeys,
      }),
      longestStreakDays: computeLongestStreakDays({
        todayKey,
        asOfKey: streakAsOf,
        startDateKey: habitStartKey,
        scheduledDays,
        completedDateKeys,
      }),
    };
  }

  return {
    currentStreakWeeks: computeCurrentStreakWeeks({
      todayKey,
      asOfKey: streakAsOf,
      startDateKey: habitStartKey,
      scheduledDays,
      weeklyTarget: h.weeklyTarget,
      completedDateKeys,
      weekStartsOn,
    }),
    longestStreakWeeks: computeLongestStreakWeeks({
      todayKey,
      asOfKey: streakAsOf,
      startDateKey: habitStartKey,
      scheduledDays,
      weeklyTarget: h.weeklyTarget,
      completedDateKeys,
      weekStartsOn,
    }),
  };
}
