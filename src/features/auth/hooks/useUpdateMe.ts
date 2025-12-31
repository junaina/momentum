"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { meResponseSchema, SafeUser } from "@/server/validators/schema";

export type PatchMeInput = {
  name?: string; // send "" to clear
  username?: string; // send "" to clear
  image?: string; // send "" to clear
  timezone?: string;
  weekStartDay?: 0 | 1;
  theme?: "system" | "light" | "dark";
};

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function patchMe(body: PatchMeInput): Promise<SafeUser> {
  const res = await fetch("/api/auth/me", {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify(body),
  });

  const raw: unknown = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      typeof raw === "object" && raw && "error" in raw
        ? String((raw as { error?: unknown }).error ?? "Failed to save")
        : "Failed to save";

    throw new ApiError(res.status, msg);
  }

  const parsed = meResponseSchema.parse(raw);
  return "user" in parsed ? parsed.user : parsed;
}

export function useUpdateMe() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: patchMe,
    onSuccess: (user) => {
      // keep /me instantly up to date
      qc.setQueryData(["me"], user);
    },
  });
}

export type { ApiError };
