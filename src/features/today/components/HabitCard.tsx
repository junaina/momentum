"use client";

import type { TodayHabit } from "@/features/today/types";
import { Check } from "lucide-react";
import type { CSSProperties } from "react";

type HabitCardProps = {
  habit: TodayHabit;
  onToggleToday: (id: string) => void;
  onOpenDetail: (id: string) => void;
};

function colorVar(token: string): string {
  return `var(--momentum-habit-color-${token})`;
}
export function HabitCard({
  habit,
  onToggleToday,
  onOpenDetail,
}: HabitCardProps) {
  const done = habit.completedToday;

  const total = habit.stats?.totalCompletions;
  const streak = habit.stats?.currentStreakDays;
  const accentStyle = {
    "--habit-accent": colorVar(habit.colorToken),
  } as CSSProperties;
  return (
    <button
      type="button"
      onClick={() => onOpenDetail(habit.id)}
      style={accentStyle}
      className="momentum-habit-card w-full rounded-3xl p-4 text-left"
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: colorVar(habit.colorToken) }}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div
                  className="grid h-(--momentum-habit-emoji) w-(--momentum-habit-emoji) place-items-center rounded-2xl border border-border bg-background text-lg"
                  aria-hidden="true"
                >
                  {habit.emoji}
                </div>

                <div className="min-w-0">
                  <div
                    className={[
                      "truncate text-sm font-semibold text-foreground",
                      done ? "line-through decoration-muted-foreground/60" : "",
                    ].join(" ")}
                  >
                    {habit.name}
                  </div>

                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {typeof total === "number"
                      ? `${total} days completed`
                      : "— days completed"}
                    {typeof streak === "number" ? ` · ${streak}d streak` : ""}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleToday(habit.id);
              }}
              className={[
                "inline-flex h-(--momentum-habit-check) w-(--momentum-habit-check) items-center justify-center",
                "rounded-2xl border border-border bg-background text-foreground hover:bg-muted",
                done ? "border-ring" : "",
              ].join(" ")}
              aria-pressed={done}
              aria-label={
                done ? "Undo completion for today" : "Mark done for today"
              }
            >
              {done ? <Check className="h-5 w-5" aria-hidden="true" /> : null}
            </button>
          </div>
        </div>
      </div>
    </button>
  );
}
