export type WeekStartsOn = 0 | 1;
export function dateKeyToUtcDate(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
export function utcDateToDateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDaysDateKey(dateKey: string, days: number): string {
  const dt = dateKeyToUtcDate(dateKey);
  dt.setUTCDate(dt.getUTCDate() + days);
  return utcDateToDateKey(dt);
}

export function minDateKey(a: string, b: string): string {
  return a <= b ? a : b;
}
export function maxDateKey(a: string, b: string): string {
  return a >= b ? a : b;
}
//when did this week begin
export function startOfWeekDateKey(
  dateKey: string,
  weekStartsOn: WeekStartsOn
): string {
  const dt = dateKeyToUtcDate(dateKey);
  const dow = dt.getUTCDay(); //0..6
  const offset = (dow - weekStartsOn + 7) % 7; //pls rmr dmas for the luv of God
  dt.setUTCDate(dt.getUTCDate() - offset);
  return utcDateToDateKey(dt);
}
//when does this week end
export function endOfWeekDateKey(
  dateKey: string,
  weekStartsOn: WeekStartsOn
): string {
  const start = startOfWeekDateKey(dateKey, weekStartsOn);
  return addDaysDateKey(start, 6);
}

//when did this month begin
export function startOfMonthDateKey(dateKey: string): string {
  const dt = dateKeyToUtcDate(dateKey);
  dt.setUTCDate(1);
  return utcDateToDateKey(dt);
}

//when does this week end
export function endOfMonthDateKey(dateKey: string): string {
  const dt = dateKeyToUtcDate(dateKey);
  //go to the first of the next month and subtract one day

  dt.setUTCMonth(dt.getUTCMonth() + 1, 1);
  dt.setUTCDate(dt.getUTCDate() - 1);
  return utcDateToDateKey(dt);
}
export function* iterateDateKeys(
  startKey: string,
  endKey: string
): Generator<string> {
  let k = startKey;
  while (k <= endKey) {
    yield k;
    k = addDaysDateKey(k, 1); // fancy date++
  }
}
