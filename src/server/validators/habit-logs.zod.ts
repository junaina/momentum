import { z } from "zod";
export const habitLogQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "use yyyy-mm-dd"),
});

export const markAllTodayBodySchema = z.object({
  habitIds: z.array(z.string().uuid()).min(1),
});
export type HabitLogQuery = z.infer<typeof habitLogQuerySchema>;
export type MarkAllTodayBody = z.infer<typeof markAllTodayBodySchema>;
