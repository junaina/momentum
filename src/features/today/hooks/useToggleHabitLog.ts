"use client";

import { useMutation } from "@tanstack/react-query";
import type { Mode } from "@/features/today/types";
import { setDemoHabitDone } from "@/features/today/demo/todaySeed";

type Input = {
  habitId: string;
  dateKey: string;
  nextCompleted: boolean;
};

type Result = {
  habitId: string;
  completedToday: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function toggleApi(mode: Mode, input: Input): Promise<Result> {
  if (mode === "demo") {
    setDemoHabitDone(input.dateKey, input.habitId, input.nextCompleted);
    return { habitId: input.habitId, completedToday: input.nextCompleted };
  }

  const qs = new URLSearchParams();
  qs.set("date", input.dateKey);

  const res = await fetch(
    `/api/habits/${encodeURIComponent(input.habitId)}/logs?${qs.toString()}`,
    {
      method: input.nextCompleted ? "POST" : "DELETE",
      credentials: "include",
      headers: { Accept: "application/json" },
    }
  );

  const json: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      isRecord(json) && typeof json.error === "string"
        ? json.error
        : "Failed to update completion";
    throw new Error(message);
  }

  return { habitId: input.habitId, completedToday: input.nextCompleted };
}

export function useToggleHabitLog(mode: Mode) {
  return useMutation<Result, Error, Input>({
    mutationFn: (input) => toggleApi(mode, input),
  });
}
