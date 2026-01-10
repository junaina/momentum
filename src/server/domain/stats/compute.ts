import { shouldHabitAppearOnDate } from "@/server/domain/habits/schedule";
import {
  iterateDateKeys,
  minDateKey,
  startOfWeekDateKey,
  addDaysDateKey,
  type WeekStartsOn,
} from "@/server/domain/stats/dateKey";
import {
  clampFreezeToRangeEnd,
  computeEffectiveFreezeKey,
  getFreezeKeyRaw,
  getHabitStartKey,
  type HabitForStats,
} from "@/server/domain/stats/lifecycle";
import type { DayOfWeek } from "@/server/domain/dayOfWeek";
import { Range } from "@/server/domain/stats/period";

export type Counts = {
  planned: number;
  completed: number;
  missed: number;
  adherence: number | null;
  metTarget: boolean;
};

function isEligibleScheduledDay(input: {
  habit: HabitForStats;
  habitStartKey: string;
  effectiveFreezeKeyClamped: string;
  dateKey: string;
}): boolean {
  if (input.dateKey > input.effectiveFreezeKeyClamped) return false;
  return shouldHabitAppearOnDate({
    scheduledDays: input.habit.scheduledDays,
    startDate: input.habitStartKey,
    dateKey: input.dateKey,
  });
}

function countCompletedEligible(input: {
  completed: ReadonlySet<string>;
  habit: HabitForStats;
  habitStartKey: string;
  effectiveFreezeKeyClamped: string;
  startKey: string;
  endKey: string;
}): number {
  let c = 0;
  for (const k of input.completed) {
    if (k < input.startKey || k > input.endKey) continue;
    if (
      !isEligibleScheduledDay({
        habit: input.habit,
        habitStartKey: input.habitStartKey,
        effectiveFreezeKeyClamped: input.effectiveFreezeKeyClamped,
        dateKey: k,
      })
    )
      continue;
    c += 1;
  }
  return c;
}

export function computeCountsForRange(input: {
  habit: HabitForStats;
  range: Range;
  asOfKey: string; //end of eval clamped
  todayKey: string;
  weekStartsOn: WeekStartsOn;
  completed: ReadonlySet<string>;
}): Counts {
  const habitStartKey = getHabitStartKey(input.habit);
  const freezeKeyRaw = getFreezeKeyRaw(input.habit);
  const effectiveFreezeKey = computeEffectiveFreezeKey({
    freezeKeyRaw,
    todayKey: input.todayKey,
    completedDateKeys: input.completed,
  });
  // evaluation end is min(range.end, asOfKey), also respect lifecycle freeze if present
  const evalEnd = minDateKey(input.range.endKey, input.asOfKey);
  const freezeClamped = clampFreezeToRangeEnd(effectiveFreezeKey, evalEnd);

  // planned differs by mode
  let planned = 0;

  if (input.habit.weeklyTarget == null) {
    // Schedule mode: rule 4.2
    for (const k of iterateDateKeys(input.range.startKey, evalEnd)) {
      if (
        isEligibleScheduledDay({
          habit: input.habit,
          habitStartKey,
          effectiveFreezeKeyClamped: freezeClamped,
          dateKey: k,
        })
      ) {
        planned += 1;
      }
    }
  } else {
    // Quota mode: rule 4.3 (computed per week)
    const target = input.habit.weeklyTarget;
    let weekStart = startOfWeekDateKey(
      input.range.startKey,
      input.weekStartsOn
    );

    while (weekStart <= evalEnd) {
      const weekEnd = addDaysDateKey(weekStart, 6);

      // week slice within the evaluation window
      const sliceStart =
        weekStart < input.range.startKey ? input.range.startKey : weekStart;
      const sliceEnd = weekEnd > evalEnd ? evalEnd : weekEnd;

      let eligibleDays = 0;
      for (const k of iterateDateKeys(sliceStart, sliceEnd)) {
        if (
          isEligibleScheduledDay({
            habit: input.habit,
            habitStartKey,
            effectiveFreezeKeyClamped: freezeClamped,
            dateKey: k,
          })
        ) {
          eligibleDays += 1;
        }
      }
      planned += Math.min(target, eligibleDays);
      weekStart = addDaysDateKey(weekStart, 7);
    }
  }

  const completed = countCompletedEligible({
    completed: input.completed,
    habit: input.habit,
    habitStartKey,
    effectiveFreezeKeyClamped: freezeClamped,
    startKey: input.range.startKey,
    endKey: evalEnd,
  });

  const missed = Math.max(0, planned - completed);

  const adherence = planned === 0 ? null : Math.min(1, completed / planned);
  const metTarget = planned > 0 && completed >= planned;

  return { planned, completed, missed, adherence, metTarget };
}
