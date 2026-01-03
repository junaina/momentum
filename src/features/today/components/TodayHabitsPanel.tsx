"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Mode, TodayHabit } from "@/features/today/types";
import type { UpdateHabitInput } from "@/features/today/schema";
import { HabitCard } from "@/features/today/components/HabitCard";
import { HabitDetailSheet } from "@/features/today/components/HabitDetailSheet";
import {
  useTodayHabits,
  todayHabitsQueryKey,
} from "@/features/today/hooks/useTodayHabits";
import { useUpdateHabit } from "@/features/today/hooks/useUpdateHabit";
import { toDateKey } from "@/features/today/utils/dateKey";

type TodayHabitsPanelProps = {
  mode: Mode;
  date: Date;
  onCreateHabit: () => void;
};

function sortForToday(items: TodayHabit[]): TodayHabit[] {
  return [...items].sort(
    (a, b) => Number(a.completedToday) - Number(b.completedToday)
  );
}

export function TodayHabitsPanel({
  mode,
  date,
  onCreateHabit,
}: TodayHabitsPanelProps) {
  const dateKey = toDateKey(date);
  const queryClient = useQueryClient();

  const { data, isLoading } = useTodayHabits(mode, date);
  const updateMutation = useUpdateHabit(mode);

  const [detailOpen, setDetailOpen] = useState<boolean>(false);
  const [activeHabitId, setActiveHabitId] = useState<string>("");

  const items = useMemo(() => sortForToday(data?.items ?? []), [data?.items]);

  const activeHabit = useMemo(() => {
    return items.find((h) => h.id === activeHabitId) ?? null;
  }, [activeHabitId, items]);

  const summary = useMemo(() => {
    const total = items.length;
    const done = items.filter((h) => h.completedToday).length;
    return { total, done };
  }, [items]);

  function setCachedItems(nextItems: TodayHabit[]) {
    queryClient.setQueryData(todayHabitsQueryKey(mode, dateKey), {
      items: nextItems,
    });
  }

  function toggleToday(id: string) {
    const current = data?.items ?? [];
    const next = current.map((h) =>
      h.id === id ? { ...h, completedToday: !h.completedToday } : h
    );
    setCachedItems(next);

    // Later wiring point:
    // mutation -> POST /api/habits/:id/logs (for dateKey) with optimistic rollback
  }

  function openDetail(id: string) {
    setActiveHabitId(id);
    setDetailOpen(true);
  }

  async function saveDetail(input: UpdateHabitInput) {
    // Optimistically merge editable fields into cached list (keep completedToday + stats intact)
    const current = data?.items ?? [];
    const target = current.find((h) => h.id === input.id);
    if (!target) return;

    const optimistic: TodayHabit = {
      ...target,
      name: input.name,
      description: input.description || "",
      frequency: input.frequency,
      emoji: input.emoji ?? target.emoji,
      weeklyTarget: input.weeklyTarget,
      scheduledDays: input.scheduledDays,
      reminderEnabled: input.reminderEnabled,
      reminderTime: input.reminderTime || "",
      colorToken: input.colorToken,
      startDate: input.startDate || "",
      status: input.status,
      visibility: input.visibility,
    };

    setCachedItems(current.map((h) => (h.id === input.id ? optimistic : h)));

    // Then "save" (stubbed for now) — if it fails, we rollback.
    try {
      const saved = await updateMutation.mutateAsync(input);
      // Merge backend response if needed (currently stub)
      setCachedItems(
        (
          queryClient.getQueryData(todayHabitsQueryKey(mode, dateKey)) as
            | { items: TodayHabit[] }
            | undefined
        )?.items.map((h) => (h.id === input.id ? { ...h, ...saved } : h)) ??
          current
      );
    } catch (e) {
      // rollback on error
      setCachedItems(current);
      throw e;
    }
  }

  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-foreground">
          {summary.done}/{summary.total} done
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={String(i)}
              className="h-(--momentum-habit-skel-h) w-full animate-pulse rounded-3xl border border-border bg-card shadow-(--shadow-momentum)"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-5 text-card-foreground shadow-(--shadow-momentum)">
          <div className="text-sm font-semibold text-foreground">
            Nothing scheduled
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((h) => (
            <HabitCard
              key={h.id}
              habit={h}
              onToggleToday={toggleToday}
              onOpenDetail={openDetail}
            />
          ))}
        </div>
      )}

      {activeHabit ? (
        <HabitDetailSheet
          open={detailOpen}
          onOpenChange={setDetailOpen}
          habit={activeHabit}
          onSave={saveDetail}
        />
      ) : null}
    </section>
  );
}
