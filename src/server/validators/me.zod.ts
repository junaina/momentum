import { z } from "zod";
import { themeSchema, weekStartDaySchema } from "@/server/validators/schema";

//allows "" from the UI and converts it into null
const emptyToNull = <T extends z.ZodTypeAny>(schema: T) =>
  z.union([z.literal(""), schema]).transform((v) => (v === "" ? null : v));

const usernameSchema = z
  .string()
  .trim()
  .min(3, "username must be atleast 3 characters")
  .max(20, "username must be at most 20 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Use only letters, numbers and underscores")
  .transform((v) => v.toLowerCase());
export const patchMeBodySchema = z
  .object({
    name: emptyToNull(z.string().trim().min(1).max(80)).optional(),
    username: emptyToNull(usernameSchema).optional(),
    image: emptyToNull(
      z.string().trim().url("Enter a valid URL.").max(2048)
    ).optional(),
    timezone: z.string().trim().min(1).max(64).optional(),
    weekStartDay: weekStartDaySchema.optional(), // 0 or 1
    theme: themeSchema.optional(), // system/light/dark
  })
  .strict();

export type PatchMeBody = z.infer<typeof patchMeBodySchema>;
