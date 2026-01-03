"use client";
import { useMutation } from "@tanstack/react-query";
import type { CreateHabitInput } from "@/features/today/schema";
type Mode = "app" | "demo";

type CreateHabitResult = {
  id: string;
};

async function createHabitStub(
  _input: CreateHabitInput
): Promise<CreateHabitResult> {
  //demo acc only: local stub so ui is shippable before sending to the backend exists
  return { id: `demo_${crypto.randomUUID()}` };
}

async function createHabitApi(
  mode: Mode,
  input: CreateHabitInput
): Promise<CreateHabitResult> {
  // - mode="app"  -> POST /api/habits
  // - mode="demo" -> POST /api/demo/habits (seeded responses)

  if (mode === "demo") return createHabitStub(input);
  const res = await fetch("/api/habits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error ?? "Failed to create habit");
  return json as { id: string };
}

export function useCreateHabit(mode: Mode) {
  return useMutation<CreateHabitResult, Error, CreateHabitInput>({
    mutationFn: (input) => createHabitApi(mode, input),
  });
}
