"use client";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMe } from "@/features/auth/hooks/useMe";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
type AppMode = "demo" | "auth";

export function SidebarProfile({
  mode,
  collapsed,
}: {
  mode: AppMode;
  collapsed: boolean;
}) {
  return mode === "demo" ? (
    <SidebarProfileDemo collapsed={collapsed} />
  ) : (
    <SidebarProfileAuth collapsed={collapsed} />
  );
}

function SidebarProfileDemo({ collapsed }: { collapsed: boolean }) {
  const loginHref = "/login";
  const signupHref = "/signup";
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={[
            "flex items-center gap-2 rounded-xl p-2 text-left",
            "hover:bg-sidebar-accent",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
            collapsed ? "justify-center" : "w-full",
          ].join(" ")}
          aria-label="Demo profile"
        >
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback>
              <UserRound className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>

          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">Demo User</div>
              <div className="text-xs text-muted-foreground truncate">
                Demo mode
              </div>
            </div>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-64 bg-popover text-popover-foreground border-border"
      >
        <div className="space-y-2">
          <div className="text-sm font-medium">Demo mode</div>
          <p className="text-xs text-muted-foreground">
            Settings are available after you sign in.
          </p>

          <div className="flex gap-2 pt-2">
            <Button asChild size="sm" className="flex-1">
              <Link href={loginHref}>Log in</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="flex-1">
              <Link href={signupHref}>Sign up</Link>
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
function SidebarProfileAuth({ collapsed }: { collapsed: boolean }) {
  const me = useMe(); //tanstack hook

  const user = me.data;
  const displayName =
    user?.name ??
    user?.username ??
    user?.email ??
    (me.isLoading ? "Loading…" : "Account");

  return (
    <Link
      href="/settings"
      className={[
        "flex items-center gap-2 rounded-xl p-2",
        "hover:bg-sidebar-accent",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        collapsed ? "justify-center" : "w-full",
      ].join(" ")}
      aria-label="Open settings"
    >
      <Avatar className="h-9 w-9 shrink-0">
        {user?.image ? (
          <AvatarImage src={user.image} alt={displayName} />
        ) : null}
        <AvatarFallback>
          {(displayName?.[0] ?? "U").toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {!collapsed && (
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{displayName}</div>
          <div className="text-xs text-muted-foreground truncate">
            {me.isError ? "Offline / signed out" : "Settings"}
          </div>
        </div>
      )}
    </Link>
  );
}
