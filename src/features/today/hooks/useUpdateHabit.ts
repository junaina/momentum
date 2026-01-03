"use client";

import { useMutation } from "@tanstack/react-query";
import type { UpdateHabitInput } from "@/features/today/schema";
import type { TodayHabit } from "@/features/today/types";

type Mode = "app" | "demo";

async function updateHabitStub(input: UpdateHabitInput): Promise<TodayHabit> {
  // In demo: pretend backend saved it and return a shape the UI expects.
  // The caller will merge this into cached Today list.
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
  input: UpdateHabitInput
): Promise<TodayHabit> {
  if (mode === "demo") return updateHabitStub(input);

  // Later:
  // const res = await fetch(`/api/habits/${input.id}`, { method: "PATCH", headers: {...}, body: JSON.stringify(input) })
  // if (!res.ok) throw new Error("Failed to update habit");
  // return (await res.json()) as TodayHabit;

  return updateHabitStub(input);
}

export function useUpdateHabit(mode: Mode) {
  return useMutation<TodayHabit, Error, UpdateHabitInput>({
    mutationFn: (input) => updateHabitApi(mode, input),
  });
}
