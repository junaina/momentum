"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { readApiError } from "@/lib/api-error";

async function deleteAccount(confirm: string): Promise<void> {
  const res = await fetch("/api/auth/delete-account", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    cache: "no-store",
    body: JSON.stringify({ confirm }),
  });

  if (!res.ok) {
    throw await readApiError(res);
  }
}

export function useDeleteAccount() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      qc.removeQueries({ queryKey: ["me"] });
    },
  });
}
