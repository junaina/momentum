import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";

function dateKeyToUtcDate(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map((x) => Number(x));
  return new Date(Date.UTC(y, m - 1, d));
}

export async function assertHabitOwnedByUser(input: {
  userId: string;
  habitId: string;
}) {
  const habit = await prisma.habit.findFirst({
    where: { id: input.habitId, userId: input.userId },
    select: { id: true },
  });
  if (!habit) throw new Error("Habit not found");
}

export async function upsertDoneLog(input: {
  userId: string;
  habitId: string;
  dateKey: string;
}) {
  const logDate = dateKeyToUtcDate(input.dateKey);

  await prisma.habitLog.upsert({
    where: {
      habitId_logDate: { habitId: input.habitId, logDate },
    },
    update: {
      userId: input.userId,
      completedAt: new Date(),
      source: "manual",
    },
    create: {
      userId: input.userId,
      habitId: input.habitId,
      logDate,
      completedAt: new Date(),
      source: "manual",
    },
  });
}

export async function deleteLogIfExists(input: {
  habitId: string;
  dateKey: string;
}) {
  const logDate = dateKeyToUtcDate(input.dateKey);

  try {
    await prisma.habitLog.delete({
      where: { habitId_logDate: { habitId: input.habitId, logDate } },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return; // already deleted, jus return
    }
    throw e;
  }
}

export async function createManyDoneLogs(input: {
  userId: string;
  habitIds: string[];
  dateKey: string;
}) {
  const logDate = dateKeyToUtcDate(input.dateKey);

  await prisma.habitLog.createMany({
    data: input.habitIds.map((habitId) => ({
      userId: input.userId,
      habitId,
      logDate,
      completedAt: new Date(),
      source: "manual" as const,
    })),
    skipDuplicates: true,
  });
}
