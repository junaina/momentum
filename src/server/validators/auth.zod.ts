import { z } from "zod";

export const signupBodySchema = z
  .object({
    email: z.string().trim().email("Enter a valid email."),
    username: z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters.")
      .max(20, "Username must be at most 20 characters.")
      .regex(/^[a-zA-Z0-9_]+$/, "Use only letters, numbers, and underscores.")
      .transform((v) => v.toLowerCase()),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(72, "Password must be at most 72 characters."),
    confirmPassword: z.string(),
    name: z.string().trim().min(1, "Name is required.").optional(),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });

export type SignupBody = z.infer<typeof signupBodySchema>;

//login schema

export const loginBodySchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, "Enter your username or email.")
    .transform((v) => v.toLowerCase()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72),
});

export type LoginBody = z.infer<typeof loginBodySchema>;
