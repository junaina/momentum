import { NextRequest, NextResponse } from "next/server";
import * as authService from "@/server/services/auth.service";

export const SESSION_COOKIE_NAME = "mom_session";

// Read cookie from the incoming request
export function getSessionToken(req: NextRequest): string | null {
  return req.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
}

// Set cookie on the outgoing response
export function setSessionCookie(
  res: NextResponse,
  sessionToken: string,
  expires: Date
) {
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: sessionToken,
    httpOnly: true, // JS can't read it (safer)
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

export function getRequestIp(req: NextRequest): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;

  const realIp = req.headers.get("x-real-ip");
  return realIp ?? null;
}

export async function getSessionUser(req: NextRequest) {
  const token = getSessionToken(req);
  if (!token) return null;
  return authService.getUserFromSessionToken(token);
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
  }
}

export async function requireSessionUser(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) throw new UnauthorizedError();
  return user;
}
