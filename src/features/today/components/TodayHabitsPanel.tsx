"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCheck, Filter } from "lucide-react";

import type { Mode, TodayHabit } from "@/features/today/types";
import type { UpdateHabitInput } from "@/features/today/schema";

import { HabitCard } from "@/features/today/components/HabitCard";
import { HabitDetailSheet } from "@/features/today/components/HabitDetailSheet";

import {
  useTodayHabits,
  todayHabitsQueryKey,
  type TodayHabitsStatus,
} from "@/features/today/hooks/useTodayHabits";
import { useUpdateHabit } from "@/features/today/hooks/useUpdateHabit";
import { useDeleteHabit } from "@/features/today/hooks/useDeleteHabit";

import { useToggleHabitLog } from "@/features/today/hooks/useToggleHabitLog";
import { useMarkAllTodayDone } from "@/features/today/hooks/useMarkAllTodayDone";

import { toDateKey } from "@/features/today/utils/dateKey";

type TodayHabitsPanelProps = {
  mode: Mode;
  date: Date;
  onCreateHabit: () => void;
};

type DoneFilter = "all" | "done" | "not_done";
type VisibilityFilter = "all" | "private" | "friends" | "public";

function sortForToday(items: TodayHabit[]): TodayHabit[] {
  return [...items].sort(
    (a, b) => Number(a.completedToday) - Number(b.completedToday)
  );
}

function matchesStatusFilter(
  h: TodayHabit,
  status: TodayHabitsStatus
): boolean {
  if (status === "all") return true;
  return h.status === status;
}

function pill(active: boolean): string {
  return [
    "inline-flex h-10 items-center justify-center rounded-2xl border px-3 text-sm font-medium",
    active
      ? "border-ring bg-muted text-foreground"
      : "border-border bg-background text-foreground hover:bg-muted",
  ].join(" ");
}

export function TodayHabitsPanel({
  mode,
  date,
  onCreateHabit,
}: TodayHabitsPanelProps) {
  const dateKey = toDateKey(date);

  const [status, setStatus] = useState<TodayHabitsStatus>("active");
  const [doneFilter, setDoneFilter] = useState<DoneFilter>("all");
  const [visibilityFilter, setVisibilityFilter] =
    useState<VisibilityFilter>("all");
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);

  const queryClient = useQueryClient();

  const { data, isLoading } = useTodayHabits(mode, date, status);
  const updateMutation = useUpdateHabit(mode, dateKey);
  const deleteMutation = useDeleteHabit(mode);

  const toggleLogMutation = useToggleHabitLog(mode);
  const markAllMutation = useMarkAllTodayDone(mode);

  const [detailOpen, setDetailOpen] = useState<boolean>(false);
  const [activeHabitId, setActiveHabitId] = useState<string>("");

  const baseItems = useMemo(
    () => sortForToday(data?.items ?? []),
    [data?.items]
  );

  const items = useMemo(() => {
    let out = baseItems;

    if (visibilityFilter !== "all") {
      out = out.filter((h) => h.visibility === visibilityFilter);
    }

    if (doneFilter === "done") out = out.filter((h) => h.completedToday);
    if (doneFilter === "not_done") out = out.filter((h) => !h.completedToday);

    return out;
  }, [baseItems, visibilityFilter, doneFilter]);

  const activeHabit = useMemo(() => {
    return baseItems.find((h) => h.id === activeHabitId) ?? null;
  }, [activeHabitId, baseItems]);

  const summary = useMemo(() => {
    const total = baseItems.length;
    const done = baseItems.filter((h) => h.completedToday).length;
    return { total, done };
  }, [baseItems]);

  function setCachedItems(nextItems: TodayHabit[]) {
    queryClient.setQueryData(todayHabitsQueryKey(mode, dateKey, status), {
      items: nextItems,
    });
  }

  function toggleToday(id: string) {
    const current = data?.items ?? [];
    const target = current.find((h) => h.id === id);
    if (!target) return;

    const nextCompleted = !target.completedToday;

    // optimistic flip
    setCachedItems(
      current.map((h) =>
        h.id === id ? { ...h, completedToday: nextCompleted } : h
      )
    );

    toggleLogMutation.mutate(
      { habitId: id, dateKey, nextCompleted },
      {
        onError: () => setCachedItems(current),
        onSettled: () => {
          void queryClient.invalidateQueries({
            queryKey: todayHabitsQueryKey(mode, dateKey, status),
          });
        },
      }
    );
  }

  function markAllDone() {
    const toMark = items.filter((h) => !h.completedToday).map((h) => h.id);
    if (toMark.length === 0) return;

    const current = data?.items ?? [];

    // optimistic: mark only currently shown items
    setCachedItems(
      current.map((h) =>
        toMark.includes(h.id) ? { ...h, completedToday: true } : h
      )
    );

    markAllMutation.mutate(
      { dateKey, habitIds: toMark },
      {
        onError: () => setCachedItems(current),
        onSettled: () => {
          void queryClient.invalidateQueries({
            queryKey: todayHabitsQueryKey(mode, dateKey, status),
          });
        },
      }
    );
  }

  function openDetail(id: string) {
    setActiveHabitId(id);
    setDetailOpen(true);
  }

  async function saveDetail(input: UpdateHabitInput) {
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

    const optimisticNext = current
      .map((h) => (h.id === input.id ? optimistic : h))
      .filter((h) => matchesStatusFilter(h, status));

    setCachedItems(optimisticNext);

    try {
      const saved = await updateMutation.mutateAsync(input);

      const after = (
        queryClient.getQueryData(todayHabitsQueryKey(mode, dateKey, status)) as
          | { items: TodayHabit[] }
          | undefined
      )?.items;

      const merged =
        (after ?? optimisticNext)
          .map((h) => (h.id === input.id ? { ...h, ...saved } : h))
          .filter((h) => matchesStatusFilter(h, status)) ?? optimisticNext;

      setCachedItems(merged);
    } catch (e) {
      setCachedItems(current);
      throw e;
    }
  }

  async function deleteHabit(habitId: string) {
    const current = data?.items ?? [];
    setCachedItems(current.filter((h) => h.id !== habitId));

    try {
      await deleteMutation.mutateAsync(habitId);
      setDetailOpen(false);
      setActiveHabitId("");
    } catch (e) {
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-background text-foreground hover:bg-muted"
            aria-label="Toggle filters"
            aria-pressed={filtersOpen}
          >
            <Filter className="h-5 w-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={markAllDone}
            disabled={
              items.filter((h) => !h.completedToday).length === 0 ||
              markAllMutation.isPending
            }
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-background text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Mark all shown habits done"
          >
            <CheckCheck className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {filtersOpen ? (
        <div className="mb-3 rounded-3xl border border-border bg-card p-4 text-card-foreground shadow-(--shadow-momentum)">
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-muted-foreground">
                Status
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["active", "paused", "archived", "all"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={pill(status === v)}
                    onClick={() => setStatus(v)}
                  >
                    {v === "all" ? "All" : v[0].toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-muted-foreground">
                Done
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  [
                    ["all", "All"],
                    ["done", "Done"],
                    ["not_done", "Not done"],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    className={pill(doneFilter === v)}
                    onClick={() => setDoneFilter(v)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-muted-foreground">
                Visibility
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["all", "private", "friends", "public"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={pill(visibilityFilter === v)}
                    onClick={() => setVisibilityFilter(v)}
                  >
                    {v === "all" ? "All" : v[0].toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

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
          onDelete={deleteHabit}
        />
      ) : null}
    </section>
  );
}
