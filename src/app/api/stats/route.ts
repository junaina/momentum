import { NextRequest, NextResponse } from "next/server";
import * as authService from "@/server/services/auth.service";
import { clearSessionCookie, getSessionToken } from "@/server/auth/session";
import { statsQuerySchema } from "@/server/validators/stats.zod";
import * as statsService from "@/server/services/stats.service";
import type { WeekStartsOn } from "@/server/domain/stats/dateKey";

export const runtime = "nodejs";

function toWeekStartsOn(value: number | null | undefined): WeekStartsOn {
  return value === 0 ? 0 : 1;
}

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
    period: req.nextUrl.searchParams.get("period") ?? undefined,
    date: req.nextUrl.searchParams.get("date") ?? undefined,
    status: req.nextUrl.searchParams.get("status") ?? undefined,
  };

  const parsed = statsQuerySchema.safeParse(raw);
  if (!parsed.success) {
    const res = NextResponse.json(
      { error: "Invalid query params", issues: parsed.error.flatten() },
      { status: 400 }
    );
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  try {
    const data = await statsService.getStatsResponse({
      userId: user.id,
      userTimezone: user.timezone ?? "UTC",
      userWeekStartDay: toWeekStartsOn(user.weekStartDay),
      period: parsed.data.period,
      date: parsed.data.date,
      status: parsed.data.status,
    });

    const res = NextResponse.json(data, { status: 200 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e) {
    const res = NextResponse.json(
      { error: "Failed to load stats" },
      { status: 500 }
    );
    res.headers.set("Cache-Control", "no-store");
    console.error("stats route failed", e);
    return res;
  }
}
