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
