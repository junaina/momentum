import { z } from "zod";

export const deleteAccountBodySchema = z
  .object({
    confirm: z.string().trim().min(1, "Type the confirmation text."),
  })
  .strict();

export type DeleteAccountBody = z.infer<typeof deleteAccountBodySchema>;
