//implementing rate limiting here
import { prisma } from "@/server/db/prisma";

//what the input to record authattempt is gonna be
export type AuthAttempt = {
  email?: string;
  ipHash?: string;
  success?: boolean;
  failureReason?: string;
};

export async function recordAuthAttempt(attempt: AuthAttempt) {
  return prisma.authAttempt.create({
    data: {
      email: attempt.email,
      ipHash: attempt.ipHash,
      success: attempt.success ?? false, // is the success flag isnt provided mark as false by default
      failureReason: attempt.failureReason,
    },
  });
}

export type ChecksRecentFailures = {
  ipHash?: string;
  since?: Date;
};

export async function countRecentFailures(checks: ChecksRecentFailures) {
  return prisma.authAttempt.count({
    where: {
      ipHash: checks.ipHash,
      success: false,
      createdAt: { gte: checks.since },
    },
  });
}
