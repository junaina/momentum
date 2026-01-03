"use client";
import { useQuery } from "@tanstack/react-query";
import type { Mode, TodayHabit } from "@/features/today/types";
import { toDateKey } from "@/features/today/utils/dateKey";
import { getDemoHabitsForDate } from "@/features/today/demo/todaySeed";

export type TodayHabitsResult = {
  items: TodayHabit[];
};

export function todayHabitsQueryKey(mode: Mode, dateKey: string) {
  return ["todayHabits", mode, dateKey] as const;
}
async function fetchTodayHabitsApp(
  _dateKey: string
): Promise<TodayHabitsResult> {
  // Later wiring point:
  // const res = await fetch(`/api/today?date=${dateKey}`);
  // validate response + return
  return { items: [] };
}

function fetchTodayHabitsDemo(date: Date): TodayHabitsResult {
  return { items: getDemoHabitsForDate(date) };
}

export function useTodayHabits(mode: Mode, date: Date) {
  const key = toDateKey(date);
  return useQuery<TodayHabitsResult>({
    queryKey: todayHabitsQueryKey(mode, key),
    queryFn: async () => {
      if (mode === "demo") return fetchTodayHabitsDemo(date);
      return fetchTodayHabitsApp(key);
    },
    staleTime: 10_000,
  });
}
