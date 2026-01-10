# Momentum Stats Module Business Rules (V1)

## 0) Vocabulary and data assumptions

### Entities

- **Habit**

  - `frequency`: `"daily" | "weekly"` (currently in DB)
  - `scheduledDays`: array of day-of-week values (required)
  - `weeklyTarget`: integer or null (optional)
  - `startDate`: date or null (optional; if null use `createdAt` for calculations)
  - `status`: `"active" | "paused" | "archived"`
  - `pausedAt`, `archivedAt`: timestamps (nullable)

- **HabitLog**

  - One log per habit per date (enforced by DB uniqueness)
  - A log counts as “completed” for its habit/date if it exists (or `completedAt != null`)

### Date keys and timezone

- Stats computations operate on **date keys** (`YYYY-MM-DD`) in the **user’s timezone**.
- Internally you may convert to UTC dates, but boundaries and labels are timezone-correct.

### Week start day

- Week boundaries depend on the user’s `weekStartDay` (0=Sunday, 1=Monday).

---

## 1) Goal types and validation rules (no inconsistencies)

### Rule 1.1 — Every habit must have scheduledDays

- `scheduledDays.length >= 1` is required.

### Rule 1.2 — Goal mode is defined by weeklyTarget presence

- **Schedule Mode**: `weeklyTarget == null`

  - The “definition of success” is completing on scheduled days.

- **Quota Mode**: `weeklyTarget != null`

  - The “definition of success” is completing **weeklyTarget times per week**.
  - scheduledDays defines **eligible days** that can count toward the weekly quota.

### Rule 1.3 — WeeklyTarget validity (to avoid impossible goals)

Because you allow **at most one completion per day**, quota mode must satisfy:

- `weeklyTarget` must be an integer
- `1 <= weeklyTarget <= scheduledDays.length`

If user tries `weeklyTarget > scheduledDays.length`:

- Reject on create/update with a validation error:

  - “Target can’t exceed the number of scheduled days. Add more days or lower target.”

### Rule 1.4 — frequency field behavior

To prevent weird “daily + weeklyTarget” hybrids:

- If `frequency === "daily"` → `weeklyTarget` **must be null**
- If `frequency === "weekly"` → `weeklyTarget` **must be present** and valid

(If you want to eventually remove `frequency` and infer from weeklyTarget presence, you can later—but V1 keeps it consistent.)

---

## 2) Period definitions

### Rule 2.1 — Week period

Given an anchor dateKey:

- WeekStart = start of week containing anchor (based on `weekStartDay`)
- WeekEnd = WeekStart + 6 days
- Week label: `Week of <Month Day>` or similar

### Rule 2.2 — Month period

Given an anchor dateKey:

- MonthStart = first day of that month
- MonthEnd = last day of that month
- Month label: `<Month YYYY>`

### Rule 2.3 — Previous period

- Previous week = the week immediately before current week
- Previous month = the month immediately before current month

---

## 3) Eligibility and lifecycle rules (start date, pause, archive)

### Rule 3.1 — Habit effective start date

- `habitStartKey = startDateKey ?? createdAtKey`
- Stats never count planned/completed before `habitStartKey`

### Rule 3.2 — Paused and archived “freeze” expectations

When a habit is paused/archived:

- It **stops generating planned instances** after the effective freeze point.
- It can still show historical data up to freeze point.
- Streaks are **frozen**, not broken by a missed pause/archived day.

### Rule 3.3 — Effective freeze dateKey

Let `freezeKeyRaw` be the dateKey of pausedAt/archivedAt in user timezone.

- If `freezeKeyRaw` is **today**: it never breaks anything (today special-case)
- If `freezeKeyRaw` is **not completed** for that habit: effective freeze is **previous day**
- If `freezeKeyRaw` **is completed**: effective freeze is `freezeKeyRaw`

This matches your fix: “pausing on a missed day shouldn’t break a streak.”

---

## 4) Planned, completed, missed, adherence (per habit)

### Rule 4.1 — Scheduled day test

A dateKey is “scheduled” for a habit if:

- dayOfWeek(dateKey) ∈ `scheduledDays`
- dateKey >= habitStartKey
- dateKey <= effectiveFreezeKey (if paused/archived)
- (and any other schedule rules you already encode in `shouldHabitAppearOnDate`)

### Rule 4.2 — Planned instances for Schedule Mode (weeklyTarget null)

For a period range:

- `planned = count of scheduled dateKeys within range`

### Rule 4.3 — Planned instances for Quota Mode (weeklyTarget present)

Quota is computed **per week**, even if the viewing period is a month.

For each week W overlapping the period:

- `eligibleDays(W) = count of scheduled dateKeys in W that are also within habit lifecycle (start/freeze)`
- `plannedWeek(W) = min(weeklyTarget, eligibleDays(W))`
- `planned = sum(plannedWeek(W)) across all weeks`

This prevents punishing:

- habits that started mid-week
- weeks with reduced eligibility due to pause/archive

### Rule 4.4 — Completed instances

For a period range:

- `completed = number of HabitLogs within range for this habit`
- A completion only counts if its dateKey is within lifecycle and within eligible days (scheduled).

  - (If your system already prevents logging on non-scheduled days, great; otherwise clamp at stats time.)

### Rule 4.5 — Missed instances

- `missed = max(0, planned - completed)`

### Rule 4.6 — Adherence (primary performance metric)

- If `planned == 0` → `adherence = null` (not 0)
- Else `adherence = completed / planned` (0..1)

---

## 5) “Success” / “met target” rules (encouragement)

### Rule 5.1 — Met target

- `metTarget = planned > 0 && completed >= planned`

### Rule 5.2 — Avoid shaming when planned is zero

If planned==0 (habit not applicable in that period):

- Show “N/A” rather than “0%”.

---

## 6) Streak rules (per habit)

### Rule 6.1 — Schedule mode streak (day streak)

For schedule-mode habits:

- Count consecutive **scheduled** days completed, looking backward from asOfKey.
- A **non-scheduled** day is ignored and does not break streak.
- A scheduled day without completion breaks streak.
- Special case: “today scheduled but not done yet” does not break.

(Your current `computeCurrentStreakDays` implements this.)

### Rule 6.2 — Quota mode streak (week streak)

For quota-mode habits:

- A “streak” is consecutive **weeks** where the user meets the weekly plan.
- In a week W:

  - Determine `plannedWeek(W)` using Rule 4.3
  - Determine `completedWeek(W)` as number of completed scheduled days within that week
  - Week counts as “met” if `completedWeek(W) >= plannedWeek(W)`

**Current week handling**

- If the current week is in progress and not met yet, it does **not** break streak; streak is counted from previous fully-met weeks.

(Your new `computeCurrentStreakWeeks` should follow this.)

### Rule 6.3 — Longest streaks (optional for V1 stats)

- Longest day streak (schedule mode) and longest week streak (quota mode) can be computed later.
- If included, they must follow the same definitions above.

---

## 7) Aggregate “overall” stats (all habits)

### Rule 7.1 — Overall planned/completed/missed

- `overallPlanned = sum(habit.planned)`
- `overallCompleted = sum(habit.completed)`
- `overallMissed = sum(habit.missed)`

### Rule 7.2 — Overall adherence

- If overallPlanned == 0 → null
- Else overallCompleted / overallPlanned

### Rule 7.3 — Do not overweight quota habits unfairly

This spec uses “instances” (planned and completed) so quota habits can carry more planned load if they have higher targets. That’s intended.

(If you later want “habit-level average adherence”, that’s a separate metric, not V1.)

---

## 8) Comparisons: this vs last week/month

### Rule 8.1 — Compare adherence as percentage points

For habit and overall:

- If either period’s adherence is null → `deltaAdherencePP = null`
- Else `deltaAdherencePP = (currAdh - prevAdh) * 100`

### Rule 8.2 — Compare counts as raw deltas

Optionally provide:

- `deltaCompleted = currCompleted - prevCompleted`
- `deltaMissed = currMissed - prevMissed`

### Rule 8.3 — Don’t report bogus comparisons when planned was 0

If `prevPlanned == 0` and `currPlanned > 0`:

- show trend label “New” (or null delta), not “+100%”.

---

## 9) Series data (charts) rules

### Rule 9.1 — Week series

Return 7 points (one per dateKey):

- each point includes planned and completed counts across all habits that apply that day.

### Rule 9.2 — Month series

Return 4–6 points (one per week in the month):

- keys are weekStart dateKeys
- planned/completed summed for that week

---

## 10) Demo mode rules (must match auth mode)

### Rule 10.1 — Same domain logic

Demo stats must use **the exact same domain rules** as auth mode.
Only data source changes:

- habits + logs come from localStorage/demo seed instead of DB.

### Rule 10.2 — Demo data must be internally consistent

- Demo habits must respect validation rules:

  - weeklyTarget null for daily habits
  - weeklyTarget <= scheduledDays.length for weekly habits

### Rule 10.3 — Demo UI must not lie about streak units

- Weekly habit shows `currentStreakWeeks`
- Daily habit shows `currentStreakDays`
