"use client";

import { useQuery } from "@tanstack/react-query";
import type { Mode, TodayHabit } from "@/features/today/types";
import { toDateKey } from "@/features/today/utils/dateKey";
import { getDemoHabitsForDate } from "@/features/today/demo/todaySeed";

export type TodayHabitsStatus = "active" | "paused" | "archived" | "all";

export type TodayHabitsResult = {
  items: TodayHabit[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function todayHabitsQueryKey(
  mode: Mode,
  dateKey: string,
  status: TodayHabitsStatus
) {
  return ["todayHabits", mode, dateKey, status] as const;
}

async function fetchTodayHabitsApp(
  dateKey: string,
  status: TodayHabitsStatus
): Promise<TodayHabitsResult> {
  const qs = new URLSearchParams();
  qs.set("date", dateKey);
  qs.set("status", status);

  const res = await fetch(`/api/today?${qs.toString()}`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  const json: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      isRecord(json) && typeof json.error === "string"
        ? json.error
        : "Failed to load today habits";
    throw new Error(message);
  }

  if (Array.isArray(json)) return { items: json as TodayHabit[] };
  if (isRecord(json) && Array.isArray(json.items))
    return { items: json.items as TodayHabit[] };

  throw new Error("Invalid response shape from /api/today");
}

function fetchTodayHabitsDemo(
  date: Date,
  status: TodayHabitsStatus
): TodayHabitsResult {
  const all = getDemoHabitsForDate(date);

  if (status === "all") return { items: all };
  return { items: all.filter((h) => h.status === status) };
}

export function useTodayHabits(
  mode: Mode,
  date: Date,
  status: TodayHabitsStatus = "active"
) {
  const dateKey = toDateKey(date);

  return useQuery<TodayHabitsResult>({
    queryKey: todayHabitsQueryKey(mode, dateKey, status),
    queryFn: async () => {
      if (mode === "demo") return fetchTodayHabitsDemo(date, status);
      return fetchTodayHabitsApp(dateKey, status);
    },
    staleTime: 10_000,
  });
}
