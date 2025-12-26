import { hashPassword } from "@/server/auth/password";
import * as usersRepo from "@/server/repos/users.repo";
import type { SignupBody } from "@/server/validators/auth.zod";

export class SignupConflictError extends Error {
  constructor(public field: "email" | "username", message: string) {
    super(message);
  }
}

export async function signup(input: SignupBody) {
  const existingEmail = await usersRepo.findUserByEmail(input.email);
  if (existingEmail) {
    throw new SignupConflictError("email", "That email is already in use.");
  }

  const existingUsername = await usersRepo.findUserByUsername(input.username);
  if (existingUsername) {
    throw new SignupConflictError("username", "That username is taken.");
  }

  const passwordHash = await hashPassword(input.password);

  return usersRepo.createUser({
    email: input.email,
    username: input.username,
    name: input.name,
    passwordHash,
  });
}
