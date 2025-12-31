import { z } from "zod";
export const themeSchema = z.enum(["system", "light", "dark"]);
export type Theme = z.infer<typeof themeSchema>;

export const weekStartDaySchema = z.union([z.literal(0), z.literal(1)]); //0 for sunday, 1 for monday

//.nullable.optional for patch request
export const safeUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable().optional(),
  username: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  weekStartDay: weekStartDaySchema.optional(),
  theme: themeSchema.optional(),
});

export type SafeUser = z.infer<typeof safeUserSchema>;

//some routes return {user} while other might return user directly, this is to keep the ui resilient

export const meResponseSchema = z.union([
  safeUserSchema,
  z.object({ user: safeUserSchema }),
]);
export type MeResponse = z.infer<typeof meResponseSchema>;
