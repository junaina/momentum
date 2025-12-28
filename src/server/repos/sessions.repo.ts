import { prisma } from "@/server/db/prisma";

export type DbSession = {
  sessionToken: string;
  userId: string;
  expires: Date;
};

export async function createSession(
  session: DbSession
): Promise<DbSession | null> {
  return prisma.session.create({
    data: {
      sessionToken: session.sessionToken,
      userId: session.userId,
      expires: session.expires,
    },
    select: {
      sessionToken: true,
      userId: true,
      expires: true,
    },
  });
}

//get sesh
export async function findSessionByToken(
  sessionToken: string
): Promise<DbSession | null> {
  return prisma.session.findUnique({
    where: { sessionToken },
    select: {
      sessionToken: true,
      userId: true,
      expires: true,
    },
  });
}

//delete sesh

export async function deleteSessionByToken(sessionToken: string) {
  //delete many so log out is always safe even if token doesnt exist
  return prisma.session.deleteMany({
    where: { sessionToken },
  });
}
