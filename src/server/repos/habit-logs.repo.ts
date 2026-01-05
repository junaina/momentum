import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";

function dateKeyToUtcDate(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map((x) => Number(x));
  return new Date(Date.UTC(y, m - 1, d));
}

function dateToDateKeyUtc(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function findCompletedLogDateKeysInRange(input: {
  userId: string;
  habitIds: readonly string[];
  fromDateKey: string;
  toDateKey: string;
}): Promise<Array<{ habitId: string; dateKey: string }>> {
  const from = dateKeyToUtcDate(input.fromDateKey);
  const to = dateKeyToUtcDate(input.toDateKey);

  const rows = await prisma.habitLog.findMany({
    where: {
      userId: input.userId,
      habitId: { in: [...input.habitIds] },
      completedAt: { not: null },
      logDate: { gte: from, lte: to },
    },
    select: { habitId: true, logDate: true },
  });

  return rows.map((r) => ({
    habitId: r.habitId,
    dateKey: dateToDateKeyUtc(r.logDate),
  }));
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
export async function countTotalCompletionByHabitids(input: {
  userId: string;
  habitIds: string[];
}): Promise<Record<string, number>> {
  if (input.habitIds.length === 0) return {};
  const rows = await prisma.habitLog.groupBy({
    by: ["habitId"],
    where: {
      userId: input.userId,
      habitId: { in: input.habitIds },
      completedAt: { not: null },
    },
    _count: { _all: true },
  });
  const out: Record<string, number> = {};
  for (const r of rows) out[r.habitId] = r._count._all;
  return out;
}
