"use client";

import { useQuery } from "@tanstack/react-query";
import type { Mode } from "@/features/today/types";
import type { StatsPeriod, StatsResponse } from "@/features/stats/statsSchema";
import { statsResponseSchema } from "@/features/stats/statsSchema";
import type { StatsQuery } from "@/server/validators/stats.zod";
import { computeDemoStats } from "@/features/stats/demo/computeDemoStats";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export type StatsStatus = NonNullable<StatsQuery["status"]>; // "active" | "activePaused" | "all"

export function statsQueryKey(input: {
  mode: Mode;
  period: StatsPeriod;
  date?: string;
  status: StatsStatus;
}) {
  return [
    "stats",
    input.mode,
    input.period,
    input.date ?? null,
    input.status,
  ] as const;
}

async function fetchStatsApp(input: {
  period: StatsPeriod;
  date?: string;
  status: StatsStatus;
}): Promise<StatsResponse> {
  const qs = new URLSearchParams();
  qs.set("period", input.period);
  if (input.date) qs.set("date", input.date);
  qs.set("status", input.status);

  const res = await fetch(`/api/stats?${qs.toString()}`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  const json: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      isRecord(json) && typeof json.error === "string"
        ? json.error
        : "Failed to load stats";
    throw new Error(message);
  }

  return statsResponseSchema.parse(json);
}

async function fetchStatsDemo(input: {
  period: StatsPeriod;
  date?: string;
  status: StatsStatus;
}): Promise<StatsResponse> {
  // demo compute uses todaySeed + localStorage logs
  const computed = computeDemoStats({
    period: input.period,
    anchorKey: input.date,
    status: input.status,
  });

  return statsResponseSchema.parse(computed);
}

export function useStats(
  mode: Mode,
  period: StatsPeriod,
  date?: string,
  status: StatsStatus = "active"
) {
  return useQuery<StatsResponse>({
    queryKey: statsQueryKey({ mode, period, date, status }),
    queryFn: async () => {
      if (mode === "demo") return fetchStatsDemo({ period, date, status });
      return fetchStatsApp({ period, date, status });
    },
    staleTime: 10_000,
  });
}
