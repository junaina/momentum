import { NextRequest, NextResponse } from "next/server";
import * as authService from "@/server/services/auth.service";
import { clearSessionCookie, getSessionToken } from "@/server/auth/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const token = getSessionToken(req);
  await authService.logout(token);

  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.headers.set("Cache-Control", "no-store");
  clearSessionCookie(res);
  return res;
}
