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
  emoji: z.string().trim().min(1, "Emo"),
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
export type CreateHabitInput = z.infer<typeof createHabitInputSchema>;
export type DayOfWeek = z.infer<typeof dayOfWeekSchema>;
export type HabitFrequency = z.infer<typeof habitFrequencySchema>;
