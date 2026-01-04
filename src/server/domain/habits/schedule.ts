import type { DayOfWeek } from "@/features/today/schema";

//convert the yyyy-mm-dd date key into the DayOfWeek type using UTC so its predictable

export function dayOfWeekFromDateKey(dateKey: string): DayOfWeek {
  const [y, m, d] = dateKey.split("-").map((x) => Number(x));
  const utc = new Date(Date.UTC(y, m - 1, d));
  const dow = utc.getUTCDay();

  if (dow === 0) return "sun";
  if (dow === 1) return "mon";
  if (dow === 2) return "tue";
  if (dow === 3) return "wed";
  if (dow === 4) return "thu";
  if (dow === 5) return "fri";
  return "sat";
}

//habit appears if the date  is on/after startDate.
//scheduled days includes the weekday

export function shouldHabitAppearOnDate(input: {
  scheduledDays: DayOfWeek[];
  startDate?: string;
  dateKey: string;
}): boolean {
  if (input.startDate && input.dateKey < input.startDate) return false;
  const dow = dayOfWeekFromDateKey(input.dateKey);
  return input.scheduledDays.includes(dow);
}
