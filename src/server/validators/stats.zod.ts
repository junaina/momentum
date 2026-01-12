//stats request validator
import { z } from "zod";
import { statsPeriodSchema, dateKeySchema } from "@/features/stats/statsSchema";

export const statsQuerySchema = z.object({
  period: statsPeriodSchema, //helps decide points: 7 for week, 4-6 for month
  date: dateKeySchema.optional(), //start date of the period
  status: z.enum(["active", "activePaused", "all"]).optional(),
});
export type StatsQuery = z.infer<typeof statsQuerySchema>;
