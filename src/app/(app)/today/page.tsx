"use client";
import { useEffect } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMe } from "@/features/auth/hooks/useMe";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

function initials(nameOrEmail: string) {
  const parts = nameOrEmail.trim().split(/\s+/).slice(0, 2);
  const letters = parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
  return letters || "U";
}

export default function TodayPage() {
  const router = useRouter();
  const me = useMe();
  useEffect(() => {
    if (me.error && "status" in me.error && me.error.status === 401) {
      router.replace("/login");
    }
  }, [me.error, router]);
  const user = me.data;
  const displayName =
    user?.name?.trim() ||
    user?.username?.trim() ||
    user?.email?.trim() ||
    "there";
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="w-full max-w-none md:mt-[1.5in] md:mx-[1.5in] md:w-[calc(100%-3in)]">
        <div className="w-full max-w-5xl">
          <h1 className="text-2xl font-bold tracking-tight">Today</h1>
          <Link href="/settings" className="mt-6 block">
            <Card className="rounded-2xl border-border bg-card p-4 shadow-(--shadow-momentum)">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={
                      typeof user?.image === "string" ? user.image : undefined
                    }
                    alt="ur avatar >_<"
                  ></AvatarImage>
                  <AvatarFallback>
                    {initials(
                      user?.name || user?.username || user?.email || "U"
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    Welcome, {displayName}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    Tap to open account settings
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </main>
  );
}
