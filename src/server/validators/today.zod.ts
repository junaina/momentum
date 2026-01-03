import { z } from "zod";
export const todayQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "use yyyy-mm-dd")
    .optional(),
  status: z.enum(["active", "paused", "archived", "all"]).optional(),
});

export type TodayQuery = z.infer<typeof todayQuerySchema>;
