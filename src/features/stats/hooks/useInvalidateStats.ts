"use client";

import { useQueryClient } from "@tanstack/react-query";

export function useInvalidateStats() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["stats"] });
}
