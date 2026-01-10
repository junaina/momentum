//stats response validator
import { z } from "zod";

export const statsPeriodSchema = z.enum(["week", "month"]);
export type StatsPeriod = z.infer<typeof statsPeriodSchema>;

export const dateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "use yyyy-mm-dd");

//planned, completed or missed count should never negative or fractional
const int0 = z.number().int().nonnegative();

export const statsTrendLabelSchema = z.enum(["new", "na"]);
export type StatsTrendLabel = z.infer<typeof statsTrendLabelSchema>;

//charts: week -> daily buckets, month-> weekly buckets
export const statsSeriesUnitSchema = z.enum(["day", "week"]);
export type StatsSeriesUnit = z.infer<typeof statsSeriesUnitSchema>;

export const statsSeriesPointSchema = z.object({
  key: dateKeySchema, //week: dayKey, for month: weekStartDate
  planned: int0,
  completed: int0,
});
export type StatsSeriesPointSchema = z.infer<typeof statsSeriesPointSchema>;

//individual habit's stats
export const statsHabitRowSchema = z.object({
  habitId: z.string().uuid(),
  name: z.string(),

  emoji: z.string().nullable().optional(),
  color: z.string().nullable().optional(),

  planned: int0,
  completed: int0,
  missed: int0,

  //business rule 4.6: adherence is null when planned ==0
  adhernce: z.number().min(0).max(1).nullable(),

  //business rule 8.1: PP delta is null if either of the aderences is null
  deltaAdherencePP: z.number().nullable(),

  //rule 8.2: count deltas
  deltaCompleted: z.number().int().nullable().optional(),
  deltaMissed: z.number().int().nullable().optional(),

  //rule 8.3: avoids bogus comparisons when prevplanned=0
  trendLabel: statsTrendLabelSchema.nullable().optional(),

  //rule 5.1: metTarget
  metTarget: z.boolean(),

  //streaks
  currentStreakDays: int0.optional(),
  currentStreakWeeks: int0.optional(),
  longestStreakDays: int0.optional(),
  longestStreakWeeks: int0.optional(),
});
export type StatsHabitRow = z.infer<typeof statsHabitRowSchema>;

//overall stats for all habits
export const statsResponseSchema = z
  .object({
    meta: z.object({
      period: statsPeriodSchema,
      seriesUnit: statsSeriesUnitSchema,

      //full period range
      startKey: dateKeySchema,
      endKey: dateKeySchema,

      //streak doesnt break if today not done yet
      asOfKey: dateKeySchema,
      // comparisons
      prevStartKey: dateKeySchema,
      prevEndKey: dateKeySchema,

      label: z.string(),
    }),
    overall: z.object({
      planned: int0,
      compleetd: int0,
      missed: int0,
      adherence: z.number().min(0).max(1).nullable(),
      deltaAdherencePP: z.number().nullable(),

      deltaCompleted: z.number().int().nullable().optional(),
      deltaMissed: z.number().int().nullable().optional(),

      trendLabel: statsTrendLabelSchema.nullable().optional(),
      metTarget: z.boolean(),
    }),
    series: z.array(statsSeriesPointSchema),
    habits: z.array(statsHabitRowSchema),
  })
  .superRefine((val, ctx) => {
    //rule9: enforce series size by period
    if (val.meta.period === "week") {
      if (val.meta.seriesUnit !== "day") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["meta", "seriesUnit"],
          message: "week period must use seriesUnit=day",
        });
      }
      if (val.series.length !== 7) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["series"],
          message: "week series must have exactly 7 points",
        });
      }
    }
    if (val.meta.period === "month") {
      if (val.meta.seriesUnit !== "week") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["meta", "seriesUnit"],
          message: "month period must use seriesUnit=week",
        });
      }
      if (val.series.length < 4 || val.series.length > 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["series"],
          message: "month series must have 4–6 points",
        });
      }
    }
  });
export type StatsResponse = z.infer<typeof statsResponseSchema>;
