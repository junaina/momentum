import { z } from "zod";
const daysOfWeekSchema = z.enum([
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
]);
const habitFrequencySchema = z.enum(["daily", "weekly"]);
const habitColorTokenSchema = z.enum([
  "mint",
  "sky",
  "violet",
  "amber",
  "rose",
  "lime",
  "slate",
  "cyan",
]);
const habitStatusSchema = z.enum(["active", "paused", "archived"]);
const habitVisibilitySchema = z.enum(["private", "friends", "public"]);
export const createHabitBodySchema = z.object({
  name: z.string().trim().min(1).max(60),
  description: z.string().trim().max(280).optional().or(z.literal("")),
  frequency: habitFrequencySchema,

  //converting ui's day strings into ints in service
  scheduledDays: z.array(daysOfWeekSchema).min(1),
  //weekly target can be kipped for daily abits, again we enforce the rules in service
  weeklyTarget: z.number().int().min(1).max(7).optional(),
  emoji: z.string().trim().max(8).optional(),
  //ui sends "hh:mm" or "" when disabled, we normalise this in service to.
  reminderTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Use HH:MM")
    .optional()
    .or(z.literal("")),
});
export type CreateHabitBody = z.infer<typeof createHabitBodySchema>;
export const patchHabitBodySchema = z.object({
  // keep id in body because your UI sends it; we’ll enforce it matches the URL
  id: z.string().min(1, "habit id is required"),

  name: createHabitBodySchema.shape.name,
  description: createHabitBodySchema.shape.description,
  frequency: createHabitBodySchema.shape.frequency,
  emoji: createHabitBodySchema.shape.emoji,
  weeklyTarget: createHabitBodySchema.shape.weeklyTarget,
  scheduledDays: createHabitBodySchema.shape.scheduledDays,

  reminderEnabled: z.boolean(),
  reminderTime: createHabitBodySchema.shape.reminderTime,

  colorToken: habitColorTokenSchema,

  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .optional()
    .or(z.literal("")),

  status: habitStatusSchema,
  visibility: habitVisibilitySchema,
});

export type PatchHabitBody = z.infer<typeof patchHabitBodySchema>;
