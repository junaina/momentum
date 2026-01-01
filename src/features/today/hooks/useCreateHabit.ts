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
  // Backend wiring point (later):
  // - mode="app"  -> POST /api/habits
  // - mode="demo" -> POST /api/demo/habits (seeded responses)
  // For now: demo uses stub, app uses a safe placeholder stub to avoid breaking UI work.
  if (mode === "demo") return createHabitStub(input);
  // When you’re ready, replace this with:
  // const res = await fetch("/api/habits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  // if (!res.ok) throw new Error("Failed to create habit");
  // return (await res.json()) as CreateHabitResult;

  return createHabitStub(input);
}

export function useCreateHabit(mode: Mode) {
  return useMutation<CreateHabitResult, Error, CreateHabitInput>({
    mutationFn: (input) => createHabitApi(mode, input),
  });
}
