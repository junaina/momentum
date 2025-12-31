import { NextRequest, NextResponse } from "next/server";
import * as authService from "@/server/services/auth.service";
import * as usersService from "@/server/services/user.service";
import { clearSessionCookie, getSessionToken } from "@/server/auth/session";
import { deleteAccountBodySchema } from "@/server/validators/delete-account.zod";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const token = getSessionToken(req);
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await authService.getUserFromSessionToken(token);
  if (!user) {
    const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    res.headers.set("Cache-Control", "no-store");
    clearSessionCookie(res);
    return res;
  }

  const raw: unknown = await req.json().catch(() => null);
  const parsed = deleteAccountBodySchema.safeParse(raw);
  if (!parsed.success) {
    const res = NextResponse.json(
      { error: "Invalid request body", issues: parsed.error.flatten() },
      { status: 400 }
    );
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  try {
    await usersService.deleteMyAccount(
      { id: user.id, email: user.email, username: user.username ?? null },
      parsed.data.confirm
    );

    const res = NextResponse.json({ ok: true }, { status: 200 });
    res.headers.set("Cache-Control", "no-store");
    clearSessionCookie(res); // ensure cookie is gone even if client keeps it
    return res;
  } catch (err) {
    if (err instanceof usersService.DeleteConfirmMismatchError) {
      const res = NextResponse.json({ error: err.message }, { status: 400 });
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
