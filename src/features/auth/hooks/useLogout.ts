"use client";

import { useQueryClient, useMutation } from "@tanstack/react-query";

//fetch request post
async function logoutRequest(): Promise<void> {
  const res = await fetch("/api/auth/logout", {
    method: "POST",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Logout Failed");
}

//hook for logout
export const useLogout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: logoutRequest,
    onSuccess: (): void => {
      qc.removeQueries({ queryKey: ["me"] });
    },
  });
};
