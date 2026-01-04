import * as habitLogsRepo from "@/server/repos/habit-logs.repo";

export async function setHabitDoneForDate(input: {
  userId: string;
  habitId: string;
  dateKey: string;
  done: boolean;
}) {
  await habitLogsRepo.assertHabitOwnedByUser({
    userId: input.userId,
    habitId: input.habitId,
  });
  if (input.done) {
    await habitLogsRepo.upsertDoneLog({
      userId: input.userId,
      habitId: input.habitId,
      dateKey: input.dateKey,
    });
    return;
  }
  await habitLogsRepo.deleteLogIfExists({
    habitId: input.habitId,
    dateKey: input.dateKey,
  });
}
export async function markManyHabitsDoneForDate(input: {
  userId: string;
  dateKey: string;
  habitIds: string[];
}): Promise<string[]> {
  await Promise.all(
    input.habitIds.map((habitId) =>
      habitLogsRepo.assertHabitOwnedByUser({ userId: input.userId, habitId })
    )
  );

  await habitLogsRepo.createManyDoneLogs({
    userId: input.userId,
    habitIds: input.habitIds,
    dateKey: input.dateKey,
  });

  return input.habitIds;
}
