import { NextRequest, NextResponse } from "next/server";
import * as authService from "@/server/services/auth.service";
import { clearSessionCookie, getSessionToken } from "@/server/auth/session";
import {
  habitLogQuerySchema,
  markAllTodayBodySchema,
} from "@/server/validators/habit-logs.zod";
import * as habitLogsService from "@/server/services/habit-logs.service";

export const runtime = "nodejs";

function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function POST(req: NextRequest) {
  const token = getSessionToken(req);
  if (!token)
    return noStore(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );

  const user = await authService.getUserFromSessionToken(token);
  if (!user) {
    const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    clearSessionCookie(res);
    return noStore(res);
  }

  const dateParsed = habitLogQuerySchema.safeParse({
    date: new URL(req.url).searchParams.get("date"),
  });
  if (!dateParsed.success) {
    return noStore(
      NextResponse.json({ error: "Invalid date" }, { status: 400 })
    );
  }

  const bodyJson: unknown = await req.json().catch(() => null);
  const bodyParsed = markAllTodayBodySchema.safeParse(bodyJson);
  if (!bodyParsed.success) {
    return noStore(
      NextResponse.json({ error: "Invalid body" }, { status: 400 })
    );
  }

  const updatedHabitIds = await habitLogsService.markManyHabitsDoneForDate({
    userId: user.id,
    dateKey: dateParsed.data.date,
    habitIds: bodyParsed.data.habitIds,
  });

  return noStore(NextResponse.json({ updatedHabitIds }, { status: 200 }));
}
