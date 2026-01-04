import { z } from "zod";
export const dayOfWeekSchema = z.enum([
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
]);
export const habitFrequencySchema = z.enum(["daily", "weekly"]);
// Tokenized colors (so UI never hardcodes colors)
export const habitColorTokenSchema = z.enum([
  "mint",
  "sky",
  "violet",
  "amber",
  "rose",
  "lime",
  "slate",
  "cyan",
]);
export const habitStatusSchema = z.enum(["active", "paused", "archived"]);
export const habitVisibilitySchema = z.enum(["private", "friends", "public"]);
export const createHabitInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "habit name is required")
    .max(64, "keep it under 64 characters"),
  description: z
    .string()
    .trim()
    .max(280, "keep it under 280 characters")
    .optional()
    .or(z.literal("")),
  frequency: habitFrequencySchema,
  emoji: z
    .string()
    .trim()
    .max(8, "emoji is too long")
    .optional()
    .or(z.literal(""))
    .transform((v) => {
      const s = (v ?? "").trim();
      return s.length > 0 ? s : undefined;
    }),
  weeklyTarget: z
    .number()
    .int()
    .min(1, "minimum 1 day")
    .max(7, "max seven days"),
  scheduledDays: z
    .array(dayOfWeekSchema)
    .min(1, "pick atleast one day to perform this habit"),
  reminderTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Use HH:MM")
    .optional()
    .or(z.literal("")),
});
export const updateHabitInputSchema = z.object({
  id: z.string().min(1, "habit id is required"),
  name: createHabitInputSchema.shape.name,
  description: createHabitInputSchema.shape.description,
  frequency: createHabitInputSchema.shape.frequency,
  emoji: createHabitInputSchema.shape.emoji,
  weeklyTarget: createHabitInputSchema.shape.weeklyTarget,
  scheduledDays: createHabitInputSchema.shape.scheduledDays,
  reminderEnabled: z.boolean(),
  reminderTime: createHabitInputSchema.shape.reminderTime,
  colorToken: habitColorTokenSchema,
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .optional()
    .or(z.literal("")),
  status: habitStatusSchema,
  visibility: habitVisibilitySchema,
});
export type CreateHabitInput = z.infer<typeof createHabitInputSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitInputSchema>;
export type DayOfWeek = z.infer<typeof dayOfWeekSchema>;
export type HabitFrequency = z.infer<typeof habitFrequencySchema>;
export type HabitColorToken = z.infer<typeof habitColorTokenSchema>;
export type HabitStatus = z.infer<typeof habitStatusSchema>;
export type HabitVisibility = z.infer<typeof habitVisibilitySchema>;
