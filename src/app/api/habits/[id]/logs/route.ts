import { NextRequest, NextResponse } from "next/server";
import * as authService from "@/server/services/auth.service";
import { clearSessionCookie, getSessionToken } from "@/server/auth/session";
import { habitLogQuerySchema } from "@/server/validators/habit-logs.zod";
import * as habitLogsService from "@/server/services/habit-logs.service";

export const runtime = "nodejs";

function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store");
  return res;
}

type SessionUser = NonNullable<
  Awaited<ReturnType<typeof authService.getUserFromSessionToken>>
>;

type RequireUserResult =
  | { ok: true; user: SessionUser }
  | { ok: false; res: NextResponse };

async function requireUser(req: NextRequest): Promise<RequireUserResult> {
  const token = getSessionToken(req);
  if (!token) {
    return {
      ok: false,
      res: noStore(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      ),
    };
  }

  const user = await authService.getUserFromSessionToken(token);
  if (!user) {
    const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    clearSessionCookie(res);
    return { ok: false, res: noStore(res) };
  }

  return { ok: true, user };
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const auth = await requireUser(req);
  if (!auth.ok) return auth.res;

  const parsed = habitLogQuerySchema.safeParse({
    date: new URL(req.url).searchParams.get("date"),
  });
  if (!parsed.success) {
    return noStore(
      NextResponse.json({ error: "Invalid date" }, { status: 400 })
    );
  }

  await habitLogsService.setHabitDoneForDate({
    userId: auth.user.id,
    habitId: id,
    dateKey: parsed.data.date,
    done: true,
  });

  return noStore(
    NextResponse.json({ habitId: id, completedToday: true }, { status: 200 })
  );
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const auth = await requireUser(req);
  if (!auth.ok) return auth.res;

  const parsed = habitLogQuerySchema.safeParse({
    date: new URL(req.url).searchParams.get("date"),
  });
  if (!parsed.success) {
    return noStore(
      NextResponse.json({ error: "Invalid date" }, { status: 400 })
    );
  }

  await habitLogsService.setHabitDoneForDate({
    userId: auth.user.id,
    habitId: id,
    dateKey: parsed.data.date,
    done: false,
  });

  return noStore(
    NextResponse.json({ habitId: id, completedToday: false }, { status: 200 })
  );
}
