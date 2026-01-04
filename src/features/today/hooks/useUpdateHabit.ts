"use client";

import { useMutation } from "@tanstack/react-query";
import type { UpdateHabitInput } from "@/features/today/schema";
import type { Mode, TodayHabit } from "@/features/today/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function updateHabitStub(input: UpdateHabitInput): Promise<TodayHabit> {
  return {
    id: input.id,
    name: input.name,
    description: input.description || "",
    emoji: input.emoji ?? "✅",
    colorToken: input.colorToken,
    frequency: input.frequency,
    weeklyTarget: input.weeklyTarget,
    scheduledDays: input.scheduledDays,
    reminderEnabled: input.reminderEnabled,
    reminderTime: input.reminderTime || "",
    startDate: input.startDate || "",
    status: input.status,
    visibility: input.visibility,
    completedToday: false,
    stats: undefined,
  };
}

async function updateHabitApi(
  mode: Mode,
  input: UpdateHabitInput,
  dateKey: string
): Promise<TodayHabit> {
  if (mode === "demo") return updateHabitStub(input);

  const qs = new URLSearchParams();
  qs.set("date", dateKey);

  const res = await fetch(`/api/habits/${encodeURIComponent(input.id)}?${qs}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  });

  const json: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      isRecord(json) && typeof json.error === "string"
        ? json.error
        : "Failed to update habit";
    throw new Error(message);
  }

  return json as TodayHabit;
}

export function useUpdateHabit(mode: Mode, dateKey: string) {
  return useMutation<TodayHabit, Error, UpdateHabitInput>({
    mutationFn: (input) => updateHabitApi(mode, input, dateKey),
  });
}
