//haha use me
"use client";
import { useQuery } from "@tanstack/react-query";
import { meResponseSchema, SafeUser } from "@/server/validators/schema";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function fetchMe(): Promise<SafeUser> {
  const res = await fetch("/api/auth/me", {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const message = res.status === 401 ? "Unauthorized" : "Failed to load user";
    throw new ApiError(res.status, message);
  }
  const raw: unknown = await res.json();
  const parsed = meResponseSchema.parse(raw);
  return "user" in parsed ? parsed.user : parsed;
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    staleTime: 30_000,
    retry: (failureCount, err) => {
      if (err instanceof ApiError && err.status === 401) return false;
      return failureCount < 2;
      //try twice if authorized
    },
  });
}

export type { ApiError };
