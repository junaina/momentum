//used by useDeleteAccount hook

import { z } from "zod";

export const apiErrorSchema = z
  .object({
    error: z.string(),
  })
  .passthrough();

export type ApiErrorBody = z.infer<typeof apiErrorSchema>;

export class ApiError extends Error {
  readonly status: number;
  readonly body?: ApiErrorBody;

  constructor(status: number, message: string, body?: ApiErrorBody) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

/**
 * Safely parse an error body from a Response.
 * - Never uses `any`
 * - Accepts that the body may be empty/non-JSON
 */
export async function readApiError(res: Response): Promise<ApiError> {
  let raw: unknown = null;

  try {
    raw = await res.json();
  } catch {
    // ignore (not JSON)
  }

  const parsed = apiErrorSchema.safeParse(raw);
  const message = parsed.success
    ? parsed.data.error
    : `Request failed (${res.status})`;

  return new ApiError(
    res.status,
    message,
    parsed.success ? parsed.data : undefined
  );
}
