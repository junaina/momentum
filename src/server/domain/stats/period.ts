import {
  addDaysDateKey,
  endOfMonthDateKey,
  endOfWeekDateKey,
  startOfMonthDateKey,
  startOfWeekDateKey,
  type WeekStartsOn,
} from "@/server/domain/stats/dateKey";
export type StatsPeriod = "week" | "month";

export type Range = { startKey: string; endKey: string };

//get start to end dates for a week or month depending on which one it is
export function getRange(
  period: StatsPeriod,
  anchorKey: string,
  weekStartsOn: WeekStartsOn
): Range {
  if (period === "week") {
    const startKey = startOfWeekDateKey(anchorKey, weekStartsOn);
    const endKey = endOfWeekDateKey(anchorKey, weekStartsOn);
    return { startKey, endKey };
  }
  const startKey = startOfMonthDateKey(anchorKey);
  const endKey = endOfMonthDateKey(anchorKey);
  return { startKey, endKey };
}

export function getPrevRange(period: StatsPeriod, range: Range): Range {
  if (period === "week") {
    return {
      startKey: addDaysDateKey(range.startKey, -7),
      endKey: addDaysDateKey(range.endKey, -7),
    };
  }
  //if month
  const prevMonthAnchor = addDaysDateKey(range.startKey, -1);
  return {
    startKey: startOfMonthDateKey(prevMonthAnchor),
    endKey: endOfMonthDateKey(prevMonthAnchor),
  };
}
