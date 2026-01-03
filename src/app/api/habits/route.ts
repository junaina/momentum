import { NextRequest, NextResponse } from "next/server";
import * as authService from "@/server/services/auth.service";
import { clearSessionCookie, getSessionToken } from "@/server/auth/session";
import { createHabitBodySchema } from "@/server/validators/habits.zod";
import * as habitsService from "@/server/services/habits.service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
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

  const json = await req.json().catch(() => null);
  const parsed = createHabitBodySchema.safeParse(json);

  if (!parsed.success) {
    const res = NextResponse.json(
      { error: "Invalid body", issues: parsed.error.flatten() },
      { status: 400 }
    );
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  try {
    const { id } = await habitsService.createHabit(user.id, parsed.data);
    const res = NextResponse.json({ id }, { status: 201 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e) {
    const res = NextResponse.json(
      { error: "Failed to create habit" },
      { status: 500 }
    );
    res.headers.set("Cache-Control", "no-store");
    return res;
  }
}
