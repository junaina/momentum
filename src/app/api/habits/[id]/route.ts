import { NextRequest, NextResponse } from "next/server";
import * as authService from "@/server/services/auth.service";
import { clearSessionCookie, getSessionToken } from "@/server/auth/session";
import { patchHabitBodySchema } from "@/server/validators/habits.zod";
import * as habitsService from "@/server/services/habits.service";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
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

  const { id: habitId } = await ctx.params;

  const raw = await req.json().catch(() => null);
  const parsed = patchHabitBodySchema.safeParse(raw);

  if (!parsed.success) {
    const res = NextResponse.json(
      { error: "Invalid body", issues: parsed.error.flatten() },
      { status: 400 }
    );
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  // Safety: UI sends id; enforce it matches URL
  if (parsed.data.id !== habitId) {
    const res = NextResponse.json(
      { error: "Body id does not match URL id" },
      { status: 400 }
    );
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  const date = req.nextUrl.searchParams.get("date") ?? undefined;

  try {
    const habit = await habitsService.updateHabit({
      userId: user.id,
      userTimezone: user.timezone ?? "UTC",
      habitId,
      body: parsed.data,
      date,
    });

    // IMPORTANT: your hook expects TodayHabit directly (not wrapped)
    const res = NextResponse.json(habit, { status: 200 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e) {
    if (e instanceof habitsService.HabitNotFoundError) {
      const res = NextResponse.json({ error: e.message }, { status: 404 });
      res.headers.set("Cache-Control", "no-store");
      return res;
    }

    const message = e instanceof Error ? e.message : "Something went wrong";
    const res = NextResponse.json({ error: message }, { status: 500 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  }
}
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
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

  const { id: habitId } = await ctx.params;

  try {
    const result = await habitsService.deleteHabit(user.id, habitId);
    const res = NextResponse.json(result, { status: 200 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e) {
    if (e instanceof habitsService.HabitNotFoundError) {
      const res = NextResponse.json({ error: e.message }, { status: 404 });
      res.headers.set("Cache-Control", "no-store");
      return res;
    }

    const res = NextResponse.json(
      { error: "Failed to delete habit" },
      { status: 500 }
    );
    res.headers.set("Cache-Control", "no-store");
    return res;
  }
}
