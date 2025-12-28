import { prisma } from "@/server/db/prisma";

export type CreateUserInput = {
  email: string;
  username: string;
  name?: string;
  passwordHash: string;
};

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserByUsername(username: string) {
  return prisma.user.findUnique({ where: { username } });
}

export async function createUser(input: CreateUserInput) {
  return prisma.user.create({
    data: {
      email: input.email,
      username: input.username,
      name: input.name,
      passwordHash: input.passwordHash,
    },
    select: { id: true, email: true, username: true, name: true },
  });
}

//skeleton for whats gonna be fetched during login
export type UserForLogin = {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  passwordHash: string | null;
};

export async function findUserForLogin(
  identifier: string
): Promise<UserForLogin | null> {
  return prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { username: identifier }],
    },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      passwordHash: true,
    },
  });
}

//skeleton for what /me will return
export type SafeUser = {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  image: string | null;
  timezone: string | null;
  weekStartDay: number | null;
  theme: "system" | "light" | "dark";
};

// me
export async function findUserByIdSafe(
  userId: string
): Promise<SafeUser | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      image: true,
      timezone: true,
      weekStartDay: true,
      theme: true,
    },
  });
}
