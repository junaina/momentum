import { prisma } from "@/server/db/prisma";

export type DbHabitForToday = {
  id: string;
  name: string;
  description: string | null;
  emoji: string | null;
  color: string | null;

  frequency: "daily" | "weekly";
  weeklyTarget: number | null;
  scheduledDays: number[];

  reminderEnabled: boolean;
  reminderTime: Date | null;

  startDate: Date | null;
  status: "active" | "paused" | "archived";
  visibility: "private" | "friends" | "public";

  createdAt: Date;

  logs: Array<{ completedAt: Date | null }>;
};
export type DbHabitWithLogForDate = {
  id: string;
  name: string;
  description: string | null;
  emoji: string | null;
  color: string | null;

  frequency: "daily" | "weekly";
  weeklyTarget: number | null;
  scheduledDays: number[];

  reminderEnabled: boolean;
  reminderTime: Date | null;

  startDate: Date | null;
  status: "active" | "paused" | "archived";
  visibility: "private" | "friends" | "public";

  logs: Array<{ completedAt: Date | null }>;
};
export async function findHabitMetaForUser(userId: string, habitId: string) {
  return prisma.habit.findFirst({
    where: { id: habitId, userId },
    select: {
      id: true,
      status: true,
      pausedAt: true,
      archivedAt: true,
    },
  });
}

export async function findHabitsForToday(
  userId: string,
  logDate: Date,
  statuses: readonly ("active" | "paused" | "archived")[]
): Promise<DbHabitForToday[]> {
  return prisma.habit.findMany({
    where: { userId, status: { in: [...statuses] } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      emoji: true,
      color: true,
      frequency: true,
      weeklyTarget: true,
      scheduledDays: true,

      reminderEnabled: true,
      reminderTime: true,

      startDate: true,
      status: true,
      visibility: true,

      createdAt: true,

      logs: {
        where: { logDate },
        select: { completedAt: true },
      },
    },
  });
}
export async function createHabit(input: {
  userId: string;
  name: string;
  description: string | null;
  frequency: "daily" | "weekly";
  scheduledDays: number[];
  weeklyTarget: number;
  emoji: string | null;
  reminderEnabled: boolean;
  reminderTime: Date | null;
  //optional fields
  color?: string | null;
  startDate?: Date | null;
  visibility?: "private" | "public" | "friends";
}) {
  const habit = await prisma.habit.create({
    data: {
      userId: input.userId,
      name: input.name,
      description: input.description,
      frequency: input.frequency,
      scheduledDays: input.scheduledDays,
      weeklyTarget: input.weeklyTarget,
      emoji: input.emoji,
      reminderEnabled: input.reminderEnabled,
      reminderTime: input.reminderTime,
      color: input.color ?? null,
      startDate: input.startDate ?? null,
      visibility: input.visibility ?? "private",
      status: "active",
    },
    select: { id: true },
  });

  return habit;
}

export async function updateHabitForUser(input: {
  userId: string;
  habitId: string;
  data: {
    name: string;
    description: string | null;
    frequency: "daily" | "weekly";
    weeklyTarget: number;
    scheduledDays: number[];
    emoji: string | null;
    reminderEnabled: boolean;
    reminderTime: Date | null;
    color: string;
    startDate: Date | null;
    status: "active" | "paused" | "archived";
    pausedAt: Date | null;
    archivedAt: Date | null;
    visibility: "private" | "friends" | "public";
  };
  logDate: Date;
}): Promise<DbHabitWithLogForDate | null> {
  // Update only if this habit belongs to this user
  const updated = await prisma.habit.updateMany({
    where: { id: input.habitId, userId: input.userId },
    data: input.data,
  });

  if (updated.count === 0) return null;

  // Fetch the updated habit + completion state for the requested date
  return prisma.habit.findFirst({
    where: { id: input.habitId, userId: input.userId },
    select: {
      id: true,
      name: true,
      description: true,
      emoji: true,
      color: true,
      frequency: true,
      weeklyTarget: true,
      scheduledDays: true,
      reminderEnabled: true,
      reminderTime: true,
      startDate: true,
      status: true,
      visibility: true,
      logs: {
        where: { logDate: input.logDate },
        select: { completedAt: true },
      },
    },
  });
}
export async function deleteHabitForUser(userId: string, habitId: string) {
  // deleteMany lets us scope by userId safely (no throw if not found)
  const result = await prisma.habit.deleteMany({
    where: { id: habitId, userId },
  });

  return result.count; // 0 = not found, 1 = deleted
}
