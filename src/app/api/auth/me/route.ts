import { NextRequest, NextResponse } from "next/server";
import * as authService from "@/server/services/auth.service";
import { clearSessionCookie, getSessionToken } from "@/server/auth/session";

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
