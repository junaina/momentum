"use client";

import { useMutation } from "@tanstack/react-query";
import type { Mode } from "@/features/today/types";
import { markAllDemoHabitsDone } from "@/features/today/demo/todaySeed";

type Input = {
  dateKey: string;
  habitIds: string[];
};

type Result = {
  updatedHabitIds: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function markAllApi(mode: Mode, input: Input): Promise<Result> {
  if (mode === "demo") {
    markAllDemoHabitsDone(input.dateKey, input.habitIds);
    return { updatedHabitIds: input.habitIds };
  }

  const qs = new URLSearchParams();
  qs.set("date", input.dateKey);

  const res = await fetch(`/api/today/mark-all?${qs.toString()}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ habitIds: input.habitIds }),
  });

  const json: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      isRecord(json) && typeof json.error === "string"
        ? json.error
        : "Failed to mark all done";
    throw new Error(message);
  }

  return { updatedHabitIds: input.habitIds };
}

export function useMarkAllTodayDone(mode: Mode) {
  return useMutation<Result, Error, Input>({
    mutationFn: (input) => markAllApi(mode, input),
  });
}
