import { NextRequest, NextResponse } from "next/server";
import * as authService from "@/server/services/auth.service";
import { clearSessionCookie, getSessionToken } from "@/server/auth/session";
import { patchMeBodySchema } from "@/server/validators/me.zod";
import * as usersService from "@/server/services/user.service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = getSessionToken(req);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await authService.getUserFromSessionToken(token);

  // If session is invalid/expired, clear cookie too
  if (!user) {
    const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    res.headers.set("Cache-Control", "no-store");
    clearSessionCookie(res);
    return res;
  }

  const res = NextResponse.json({ user }, { status: 200 });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function PATCH(req: NextRequest) {
  const token = getSessionToken(req);
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const sessionUser = await authService.getUserFromSessionToken(token);
  if (!sessionUser) {
    const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    res.headers.set("Cache-Control", "no-store");
    clearSessionCookie(res);
    return res;
  }
  const raw: unknown = await req.json().catch(() => null);
  const parsed = patchMeBodySchema.safeParse(raw);
  if (!parsed.success) {
    const res = NextResponse.json(
      { error: "Invalid request body", issues: parsed.error.flatten() },
      { status: 400 }
    );
    res.headers.set("Cache-Control", "no-store");
    return res;
  }
  try {
    const user = await usersService.updateMe(sessionUser.id, parsed.data);
    const res = NextResponse.json({ user }, { status: 200 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    if (err instanceof usersService.UsernameTakenError) {
      const res = NextResponse.json({ error: err.message }, { status: 409 });
      res.headers.set("Cache-Control", "no-store");
      return res;
    }
    const res = NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
    res.headers.set("Cache-Control", "no-store");
    return res;
  }
}
