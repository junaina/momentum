"use client";

import { useMemo, useState } from "react";
import {
  updateHabitInputSchema,
  type DayOfWeek,
  type HabitColorToken,
  type HabitStatus,
  type HabitVisibility,
  type UpdateHabitInput,
} from "@/features/today/schema";
import type { TodayHabit } from "@/features/today/types";
import { ModalSheet } from "@/features/today/components/ModalSheet";
import { EmojiPickerPopover } from "@/features/today/components/EmojiPickerPopover";
import { TimePopover } from "@/features/today/components/TimePopover";

type HabitDetailSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit: TodayHabit;
  onSave: (input: UpdateHabitInput) => Promise<void>;
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

const colorTokens: HabitColorToken[] = [
  "mint",
  "sky",
  "violet",
  "amber",
  "rose",
  "lime",
  "slate",
  "cyan",
];

function colorVar(token: HabitColorToken): string {
  return `var(--momentum-habit-color-${token})`;
}

function uniqDays(input: DayOfWeek[]): DayOfWeek[] {
  return Array.from(new Set<DayOfWeek>(input));
}

export function HabitDetailSheet(props: HabitDetailSheetProps) {
  const { open, onOpenChange, habit, onSave } = props;

  const [name, setName] = useState<string>(habit.name);
  const [description, setDescription] = useState<string>(
    habit.description ?? ""
  );
  const [frequency, setFrequency] = useState<UpdateHabitInput["frequency"]>(
    habit.frequency
  );
  const [emoji, setEmoji] = useState<string>(habit.emoji);
  const [weeklyTarget, setWeeklyTarget] = useState<number>(habit.weeklyTarget);
  const [scheduledDays, setScheduledDays] = useState<DayOfWeek[]>(
    habit.scheduledDays
  );
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(
    habit.reminderEnabled
  );
  const [reminderTime, setReminderTime] = useState<string>(
    habit.reminderTime ?? "09:00"
  );
  const [colorToken, setColorToken] = useState<HabitColorToken>(
    habit.colorToken
  );
  const [startDate, setStartDate] = useState<string>(habit.startDate ?? "");
  const [status, setStatus] = useState<HabitStatus>(habit.status);
  const [visibility, setVisibility] = useState<HabitVisibility>(
    habit.visibility
  );

  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof UpdateHabitInput, string>>
  >({});
  const [formError, setFormError] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  const descriptionText = useMemo(() => {
    return "Edit everything about this habit here. (Backend wiring comes later.)";
  }, []);

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

  async function submit() {
    setFormError("");
    setFieldErrors({});

    const payload: UpdateHabitInput = {
      id: habit.id,
      name,
      description,
      frequency,
      emoji,
      weeklyTarget,
      scheduledDays,
      reminderEnabled,
      reminderTime: reminderEnabled ? reminderTime : "",
      colorToken,
      startDate,
      status,
      visibility,
    };

    const parsed = updateHabitInputSchema.safeParse(payload);
    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof UpdateHabitInput, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") {
          const k = key as keyof UpdateHabitInput;
          if (!nextErrors[k]) nextErrors[k] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      setFormError("Please fix the highlighted fields.");
      return;
    }

    try {
      setSaving(true);
      await onSave(parsed.data);
      close();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      setFormError(message);
    } finally {
      setSaving(false);
    }
  }

  const footer = (
    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={close}
        className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted"
      >
        Close
      </button>
      <button
        type="button"
        onClick={submit}
        disabled={saving}
        className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </div>
  );

  return (
    <ModalSheet
      open={open}
      onClose={close}
      title="Habit details"
      description={descriptionText}
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
            htmlFor="habit-name-edit"
          >
            Name
          </label>
          <input
            id="habit-name-edit"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
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
            htmlFor="habit-desc-edit"
          >
            Description (optional)
          </label>
          <textarea
            id="habit-desc-edit"
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            className="min-h-24 w-full resize-none rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
          {fieldErrors.description ? (
            <p className="text-sm text-destructive">
              {fieldErrors.description}
            </p>
          ) : null}
        </div>

        {/* Emoji + Color */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="text-sm font-medium text-foreground">Emoji</div>
            <EmojiPickerPopover value={emoji} onChange={setEmoji} />
            {fieldErrors.emoji ? (
              <p className="text-sm text-destructive">{fieldErrors.emoji}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-foreground">Color</div>
            <div className="flex flex-wrap gap-2">
              {colorTokens.map((t) => {
                const active = t === colorToken;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setColorToken(t)}
                    className={[
                      "inline-flex h-10 w-10 items-center justify-center rounded-2xl border",
                      active
                        ? "border-ring bg-accent"
                        : "border-border bg-background hover:bg-muted",
                    ].join(" ")}
                    aria-pressed={active}
                    aria-label={`Set color ${t}`}
                  >
                    <span
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: colorVar(t) }}
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>
            {fieldErrors.colorToken ? (
              <p className="text-sm text-destructive">
                {fieldErrors.colorToken}
              </p>
            ) : null}
          </div>
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

        {/* Weekly target */}
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="weekly-target-edit"
          >
            Weekly target (days / week)
          </label>
          <input
            id="weekly-target-edit"
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
              Off
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
              <TimePopover value={reminderTime} onChange={setReminderTime} />
              {fieldErrors.reminderTime ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.reminderTime}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Start date */}
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="start-date-edit"
          >
            Start date (optional)
          </label>
          <input
            id="start-date-edit"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.currentTarget.value)}
            className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
          {fieldErrors.startDate ? (
            <p className="text-sm text-destructive">{fieldErrors.startDate}</p>
          ) : null}
        </div>

        {/* Status */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-foreground">Status</div>
          <div className="grid grid-cols-3 gap-2">
            {(["active", "paused", "archived"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={[
                  "h-10 rounded-2xl border px-3 text-sm font-medium",
                  status === s
                    ? "border-ring bg-accent text-accent-foreground"
                    : "border-border bg-background text-foreground hover:bg-muted",
                ].join(" ")}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Visibility */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-foreground">Visibility</div>
          <div className="grid grid-cols-3 gap-2">
            {(["private", "friends", "public"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVisibility(v)}
                className={[
                  "h-10 rounded-2xl border px-3 text-sm font-medium",
                  visibility === v
                    ? "border-ring bg-accent text-accent-foreground"
                    : "border-border bg-background text-foreground hover:bg-muted",
                ].join(" ")}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>
    </ModalSheet>
  );
}
