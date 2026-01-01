"use client";

import { useMemo, useState } from "react";
import {
  createHabitInputSchema,
  type CreateHabitInput,
  type DayOfWeek,
} from "@/features/today/schema";
import { ModalSheet } from "@/features/today/components/ModalSheet";
import { useCreateHabit } from "@/features/today/hooks/useCreateHabit";

type Mode = "app" | "demo";

type CreateHabitSheetProps = {
  mode: Mode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const days: Array<{ key: DayOfWeek; label: string }> = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

function uniqDays(input: DayOfWeek[]): DayOfWeek[] {
  const set = new Set<DayOfWeek>(input);
  return Array.from(set);
}

export function CreateHabitSheet(props: CreateHabitSheetProps) {
  const { mode, open, onOpenChange } = props;

  const mutation = useCreateHabit(mode);

  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [frequency, setFrequency] =
    useState<CreateHabitInput["frequency"]>("daily");
  const [emoji, setEmoji] = useState<string>("✅");
  const [weeklyTarget, setWeeklyTarget] = useState<number>(5);
  const [scheduledDays, setScheduledDays] = useState<DayOfWeek[]>([
    "mon",
    "tue",
    "wed",
    "thu",
    "fri",
  ]);
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(false);
  const [reminderTime, setReminderTime] = useState<string>("09:00");

  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof CreateHabitInput, string>>
  >({});
  const [formError, setFormError] = useState<string>("");

  const computedDescription = useMemo(() => {
    return mode === "demo"
      ? "This is the demo flow (seeded later). Your UI should behave the same as the real app."
      : "Create a habit that will appear on Today based on its schedule.";
  }, [mode]);

  function close() {
    onOpenChange(false);
    setFieldErrors({});
    setFormError("");
  }

  function toggleDay(day: DayOfWeek) {
    setScheduledDays((prev) => {
      const next = prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day];
      return uniqDays(next);
    });
  }

  async function onSubmit() {
    setFormError("");
    setFieldErrors({});

    const payload: CreateHabitInput = {
      name,
      description,
      frequency,
      emoji,
      weeklyTarget,
      scheduledDays,
      reminderTime: reminderEnabled ? reminderTime : "",
    };

    const parsed = createHabitInputSchema.safeParse(payload);
    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof CreateHabitInput, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") {
          const k = key as keyof CreateHabitInput;
          if (!nextErrors[k]) nextErrors[k] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      setFormError("Please fix the highlighted fields.");
      return;
    }

    try {
      await mutation.mutateAsync(parsed.data);

      // Later: invalidate Today queries here so the new habit appears instantly.
      // Example: queryClient.invalidateQueries({ queryKey: ["today", selectedDateKey] });

      close();
      // Optional later: toast("Habit created")
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      setFormError(message);
    }
  }

  const footer = (
    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={close}
        className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={mutation.isPending}
        className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {mutation.isPending ? "Creating…" : "Create habit"}
      </button>
    </div>
  );

  return (
    <ModalSheet
      open={open}
      onClose={close}
      title="Create habit"
      description={computedDescription}
      footer={footer}
    >
      <div className="space-y-5">
        {formError ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-foreground">
            {formError}
          </div>
        ) : null}

        {/* Name */}
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="habit-name"
          >
            Name
          </label>
          <input
            id="habit-name"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            placeholder="e.g., Drink water"
            autoComplete="off"
          />
          {fieldErrors.name ? (
            <p className="text-sm text-destructive">{fieldErrors.name}</p>
          ) : null}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="habit-desc"
          >
            Description (optional)
          </label>
          <textarea
            id="habit-desc"
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            className="min-h-24 w-full resize-none rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            placeholder="Why this habit matters (kept private)"
          />
          {fieldErrors.description ? (
            <p className="text-sm text-destructive">
              {fieldErrors.description}
            </p>
          ) : null}
        </div>

        {/* Frequency */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-foreground">Frequency</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFrequency("daily")}
              className={[
                "h-11 rounded-2xl border px-3 text-sm font-medium",
                frequency === "daily"
                  ? "border-ring bg-accent text-accent-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted",
              ].join(" ")}
            >
              Daily
            </button>
            <button
              type="button"
              onClick={() => setFrequency("weekly")}
              className={[
                "h-11 rounded-2xl border px-3 text-sm font-medium",
                frequency === "weekly"
                  ? "border-ring bg-accent text-accent-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted",
              ].join(" ")}
            >
              Weekly
            </button>
          </div>
          {fieldErrors.frequency ? (
            <p className="text-sm text-destructive">{fieldErrors.frequency}</p>
          ) : null}
        </div>

        {/* Emoji + Weekly target */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="habit-emoji"
            >
              Emoji
            </label>
            <input
              id="habit-emoji"
              value={emoji}
              onChange={(e) => setEmoji(e.currentTarget.value)}
              className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              placeholder="✅"
              inputMode="text"
              autoComplete="off"
            />
            {fieldErrors.emoji ? (
              <p className="text-sm text-destructive">{fieldErrors.emoji}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="weekly-target"
            >
              Weekly target (days / week)
            </label>
            <input
              id="weekly-target"
              type="number"
              min={1}
              max={7}
              value={weeklyTarget}
              onChange={(e) => setWeeklyTarget(Number(e.currentTarget.value))}
              className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
            {fieldErrors.weeklyTarget ? (
              <p className="text-sm text-destructive">
                {fieldErrors.weeklyTarget}
              </p>
            ) : null}
          </div>
        </div>

        {/* Scheduled days */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-foreground">
              Scheduled days
            </div>
            <button
              type="button"
              onClick={() => setScheduledDays(days.map((d) => d.key))}
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Select all
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {days.map((d) => {
              const active = scheduledDays.includes(d.key);
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => toggleDay(d.key)}
                  className={[
                    "h-10 rounded-2xl border px-3 text-sm font-medium",
                    active
                      ? "border-ring bg-accent text-accent-foreground"
                      : "border-border bg-background text-foreground hover:bg-muted",
                  ].join(" ")}
                  aria-pressed={active}
                >
                  {d.label}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground">
            These are the days this habit appears on Today as a todo.
          </p>

          {fieldErrors.scheduledDays ? (
            <p className="text-sm text-destructive">
              {fieldErrors.scheduledDays}
            </p>
          ) : null}
        </div>

        {/* Reminder */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-foreground">Reminder</div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setReminderEnabled(false)}
              className={[
                "h-10 rounded-2xl border px-3 text-sm font-medium",
                !reminderEnabled
                  ? "border-ring bg-accent text-accent-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted",
              ].join(" ")}
            >
              No specific time
            </button>

            <button
              type="button"
              onClick={() => setReminderEnabled(true)}
              className={[
                "h-10 rounded-2xl border px-3 text-sm font-medium",
                reminderEnabled
                  ? "border-ring bg-accent text-accent-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted",
              ].join(" ")}
            >
              Set time
            </button>
          </div>

          {reminderEnabled ? (
            <div className="grid max-w-xs grid-cols-1 gap-2">
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.currentTarget.value)}
                className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
              {fieldErrors.reminderTime ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.reminderTime}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </ModalSheet>
  );
}
