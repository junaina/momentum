import { NextRequest, NextResponse } from "next/server";
import { loginBodySchema } from "@/server/validators/auth.zod";
import * as authService from "@/server/services/auth.service";
import { getRequestIp, setSessionCookie } from "@/server/auth/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginBodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const ip = getRequestIp(req);
    const result = await authService.login({ ...parsed.data, ip });

    const res = NextResponse.json({ user: result.user }, { status: 200 });
    res.headers.set("Cache-Control", "no-store");

    setSessionCookie(res, result.sessionToken, result.expires);
    return res;
  } catch (err) {
    if (err instanceof authService.AuthRateLimitedError) {
      const res = NextResponse.json(
        { error: err.message, retryAfterSeconds: err.retryAfterSeconds },
        { status: 429 }
      );
      res.headers.set("Retry-After", String(err.retryAfterSeconds));
      res.headers.set("Cache-Control", "no-store");
      return res;
    }

    if (err instanceof authService.AuthInvalidCredentialsError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }

    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
