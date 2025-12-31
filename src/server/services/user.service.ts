import { UpdateUserInput } from "./../repos/users.repo";
import * as userRepo from "@/server/repos/users.repo";
import type { PatchMeBody } from "../validators/me.zod";

export class UsernameTakenError extends Error {
  constructor() {
    super("That username is already taken");
  }
}

export async function updateMe(userId: string, input: PatchMeBody) {
  const data: UpdateUserInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.image !== undefined) data.image = input.image;

  if (input.timezone !== undefined) data.timezone = input.timezone;
  if (input.weekStartDay !== undefined) data.weekStartDay = input.weekStartDay;
  if (input.theme !== undefined) data.theme = input.theme;

  if (input.username !== undefined) {
    if (typeof input.username === "string") {
      const existing = await userRepo.findUserIdByusername(input.username);
      if (existing && existing.id !== userId) throw new UsernameTakenError();
      data.username = input.username;
    } else {
      data.username = null;
    }
  }
  return userRepo.updateUserByIdSafe(userId, data);
}
