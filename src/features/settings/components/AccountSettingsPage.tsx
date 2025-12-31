"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMe } from "@/features/auth/hooks/useMe";
import { AccountSettingsForm } from "@/features/settings/components/AccountSettingsForm";
import type { SafeUser } from "@/server/validators/schema";

function LoadingShell() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto w-full max-w-xl px-4 pt-8">
        <div className="h-6 w-44 rounded-md bg-muted" />
        <div className="mt-2 h-4 w-64 rounded-md bg-muted" />
        <div className="mt-8 space-y-4">
          <div className="h-32 rounded-2xl border border-border bg-card" />
          <div className="h-32 rounded-2xl border border-border bg-card" />
          <div className="h-52 rounded-2xl border border-border bg-card" />
        </div>
      </div>
    </main>
  );
}

export function AccountSettingsPage() {
  const router = useRouter();
  const me = useMe();

  React.useEffect(() => {
    if (me.error && "status" in me.error && me.error.status === 401) {
      router.replace("/login");
    }
  }, [me.error, router]);

  if (me.isLoading) return <LoadingShell />;

  // If unauthorized, effect will redirect. Avoid rendering to prevent flicker.
  const user: SafeUser | undefined = me.data;
  if (!user) return null;

  // Key is the clean fix for the "setState in effect" lint rule:
  // it re-initializes the form when the user changes, without syncing via effects.
  return <AccountSettingsForm key={user.id} user={user} />;
}
