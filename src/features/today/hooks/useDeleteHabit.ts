"use client";

import { useMutation } from "@tanstack/react-query";
import type { Mode } from "@/features/today/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function deleteHabitApi(mode: Mode, habitId: string): Promise<void> {
  if (mode === "demo") return;

  const res = await fetch(`/api/habits/${encodeURIComponent(habitId)}`, {
    method: "DELETE",
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  const json: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      isRecord(json) && typeof json.error === "string"
        ? json.error
        : "Failed to delete habit";
    throw new Error(message);
  }
}

export function useDeleteHabit(mode: Mode) {
  return useMutation<void, Error, string>({
    mutationFn: (habitId) => deleteHabitApi(mode, habitId),
  });
}
