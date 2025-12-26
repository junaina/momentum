import { signupBodySchema } from "@/server/validators/auth.zod";
import { signup, SignupConflictError } from "@/server/services/auth.service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const parsed = signupBodySchema.safeParse(body);
  if (!parsed.success) {
    const flattened = parsed.error.flatten();
    return Response.json(
      {
        ok: false,
        type: "validation",
        message: "Please fix the highlighted fields.",
        fieldErrors: flattened.fieldErrors,
      },
      { status: 400 }
    );
  }

  try {
    const user = await signup(parsed.data);
    return Response.json({ ok: true, user }, { status: 201 });
  } catch (err) {
    if (err instanceof SignupConflictError) {
      return Response.json(
        {
          ok: false,
          type: "conflict",
          message: err.message,
          field: err.field,
        },
        { status: 409 }
      );
    }

    return Response.json(
      {
        ok: false,
        type: "unknown",
        message: "Something went wrong. Try again.",
      },
      { status: 500 }
    );
  }
}
