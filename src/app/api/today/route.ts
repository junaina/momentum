import { NextRequest, NextResponse } from "next/server";
import * as authService from "@/server/services/auth.service";
import { clearSessionCookie, getSessionToken } from "@/server/auth/session";
import { todayQuerySchema } from "@/server/validators/today.zod";
import * as todayService from "@/server/services/today.service";

export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  const token = getSessionToken(req);
  if (!token) {
    const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  }
  const user = await authService.getUserFromSessionToken(token);
  if (!user) {
    const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    res.headers.set("Cache-Control", "no-store");
    clearSessionCookie(res);
    return res;
  }
  const raw = {
    date: req.nextUrl.searchParams.get("date") ?? undefined,
    status: req.nextUrl.searchParams.get("status") ?? undefined,
  };
  const parsed = todayQuerySchema.safeParse(raw);
  if (!parsed.success) {
    const res = NextResponse.json(
      { error: "Invalid query params", issues: parsed.error.flatten() },
      { status: 400 }
    );
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  const items = await todayService.getTodayHabits({
    userId: user.id,
    userTimezone: user.timezone ?? "UTC",
    date: parsed.data.date,
    status: parsed.data.status,
  });

  const res = NextResponse.json({ items }, { status: 200 });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
