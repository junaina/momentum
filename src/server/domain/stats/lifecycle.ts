import { addDaysDateKey, minDateKey } from "@/server/domain/stats/dateKey";
import { DayOfWeek } from "@/server/domain/dayOfWeek";
export type HabitStatus = "active" | "paused" | "archived";
export type HabitFrequency = "daily" | "weekly";

//domain inpu shape. the service maps database types to this

export type HabitForStats = {
  id: string;
  name: string;
  emoji: string | null;
  color: string | null;

  frequency: HabitFrequency;
  scheduledDays: DayOfWeek;
  weeklyTarget: number | null;

  startDateKey: string | null;
  createdAtKey: string;

  status: HabitStatus;
  pausedKeyRaw: string | null;
  archivedKeyRaw: string | null;
};

export function getHabitStartKey(h: HabitForStats): string {
  return h.startDateKey ?? h.createdAtKey;
}
export function getFreezeKeyRaw(h: HabitForStats): string | null {
  if (h.status === "paused") return h.pausedKeyRaw;
  if (h.status === "archived") return h.archivedKeyRaw;
  return null;
}

//rule 3.3 effective freeze key
//if freezeKeyRaw is todayKey-> effective= todayKey
//else if freeze day was completed-> effective= freezeKeyraw
//else effective= previous day

export function computeEffectiveFreezeKey(input: {
  freezeKeyRaw: string | null;
  todayKey: string;
  completedDateKeys: ReadonlySet<string>;
}): string | null {
  const k = input.freezeKeyRaw;
  if (!k) return null;

  if (k === input.todayKey) return k;
  if (input.completedDateKeys.has(k)) return k;
  return addDaysDateKey(k, -1);
}
//
//  * Clamp a lifecycle freeze key to the end of the evaluation range.
//  * (If habit is active, freezeKey will be null and this does nothing.)
//
export function clampFreezeToRangeEnd(
  freezeKey: string | null,
  rangeEndKey: string
): string {
  if (!freezeKey) return rangeEndKey;
  return minDateKey(freezeKey, rangeEndKey);
}
