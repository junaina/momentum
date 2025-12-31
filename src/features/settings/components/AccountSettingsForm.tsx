"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useLogout } from "@/features/auth/hooks/useLogout";
import type { SafeUser } from "@/server/validators/schema";
import { useDeleteAccount } from "@/features/auth/hooks/useDeleteAccount";
import { AvatarUploadDialog } from "@/features/settings/components/AvatarUploadDialog";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, LogOut, Pencil } from "lucide-react";
import { useUpdateMe } from "@/features/auth/hooks/useUpdateMe";

type ThemeChoice = "system" | "light" | "dark";
type WeekStartDay = 0 | 1;

function isThemeChoice(v: string): v is ThemeChoice {
  return v === "system" || v === "light" || v === "dark";
}

function toWeekStartDay(v: string): WeekStartDay {
  return v === "0" ? 0 : 1;
}

function initials(text: string): string {
  const parts = text.trim().split(/\s+/).slice(0, 2);
  const letters = parts.map((p) => (p[0] ? p[0].toUpperCase() : "")).join("");
  return letters || "U";
}

function getTimezones(): readonly string[] {
  // TS-safe access without `any`
  const intl = Intl as unknown as {
    supportedValuesOf?: (key: "timeZone") => string[];
  };
  const list =
    typeof intl.supportedValuesOf === "function"
      ? intl.supportedValuesOf("timeZone")
      : null;

  if (Array.isArray(list) && list.length > 0) return list;

  // Small fallback list (keeps UI usable even if supportedValuesOf is missing)
  return [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Asia/Dubai",
    "Asia/Karachi",
    "Asia/Kolkata",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Australia/Sydney",
  ] as const;
}

function coerceTheme(input: unknown): ThemeChoice {
  return input === "light" || input === "dark" || input === "system"
    ? input
    : "system";
}

function coerceWeekStartDay(input: unknown): WeekStartDay {
  return input === 0 || input === 1 ? input : 1;
}

function coerceTimezone(input: unknown): string {
  return typeof input === "string" && input.trim().length > 0 ? input : "UTC";
}

export function AccountSettingsForm({ user }: { user: SafeUser }) {
  const router = useRouter();
  const logout = useLogout();
  const updateMe = useUpdateMe();
  const deleteAccount = useDeleteAccount();
  const { setTheme } = useTheme();

  // ✅ Initialize local form state ONCE from props (no effects needed)
  const [name, setName] = React.useState<string>(() => user.name ?? "");
  const [username, setUsername] = React.useState<string>(
    () => user.username ?? ""
  ); // shows empty when null ✅
  const [avatarUrl, setAvatarUrl] = React.useState<string>(
    () => user.image ?? ""
  );
  const [theme, setThemeLocal] = React.useState<ThemeChoice>(() =>
    coerceTheme(user.theme)
  );
  const [timezone, setTimezone] = React.useState<string>(() =>
    coerceTimezone(user.timezone)
  );
  const [weekStartDay, setWeekStartDay] = React.useState<WeekStartDay>(() =>
    coerceWeekStartDay(user.weekStartDay)
  );

  const [notice, setNotice] = React.useState<string | null>(null);

  const tzList = React.useMemo(() => getTimezones(), []);

  const displayName =
    (user.name ?? "").trim() ||
    (user.username ?? "").trim() ||
    user.email.trim();

  const confirmTarget = (user.username ?? "").trim() || user.email.trim();

  const [confirmText, setConfirmText] = React.useState<string>("");
  const [avatarOpen, setAvatarOpen] = React.useState(false);

  const canDelete = confirmText.trim() === confirmTarget;

  function showNotWiredYet(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2500);
  }

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="w-full pb-24 px-4 pt-6 md:px-0 md:pt-0">
        <div className="w-full max-w-none md:mt-[1.5in] md:mx-[1.5in] md:w-[calc(100%-3in)]">
          <AvatarUploadDialog
            open={avatarOpen}
            onOpenChange={setAvatarOpen}
            currentUrl={user.image ?? null}
          />

          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-0.5 shrink-0"
                onClick={() => router.push("/today")}
                aria-label="Back to Today"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <div className="min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Account settings
                </h1>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  Manage your profile and preferences.
                </p>
              </div>
            </div>

            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.image ?? undefined} alt="Your avatar" />
                <AvatarFallback>{initials(displayName)}</AvatarFallback>
              </Avatar>

              {/* Pencil overlay (file upload will come later) */}
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full"
                onClick={() => {
                  setNotice(null);
                  setAvatarOpen(true);
                }}
                aria-label="Edit avatar"
              >
                <Pencil className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {notice ? (
            <div className="mt-4 rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
              {}
            </div>
          ) : null}

          {/* Details */}
          <section className="mt-8">
            <div className="mb-3">
              <h2 className="text-sm font-semibold">Details</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Update your name and username.
              </p>
            </div>

            <Card className="rounded-2xl border-border bg-card p-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username (optional)</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Pick a username"
                  />
                  <p className="text-xs text-muted-foreground">
                    If empty, it stays unset. If you set one, it must be unique.
                  </p>
                </div>

                <Button
                  type="button"
                  className="w-full"
                  onClick={async () => {
                    try {
                      const updated = await updateMe.mutateAsync({
                        name,
                        username,
                      });
                      setName(updated.name ?? "");
                      setUsername(updated.username ?? "");
                      setNotice("Details saved.");
                      window.setTimeout(() => setNotice(null), 2500);
                    } catch (e) {
                      const msg =
                        e instanceof Error ? e.message : "Save failed";
                      setNotice(msg);
                      window.setTimeout(() => setNotice(null), 2500);
                    }
                  }}
                  disabled={updateMe.isPending}
                >
                  Save details
                </Button>
              </div>
            </Card>
          </section>

          {/* Avatar URL (works before uploads) */}
          <section className="mt-6">
            <div className="mb-3">
              <h2 className="text-sm font-semibold">Avatar</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Paste an image URL now. File upload comes later with
                UploadThing.
              </p>
            </div>

            <Card className="rounded-2xl border-border bg-card p-4">
              <div className="space-y-2">
                <Label htmlFor="avatarUrl">Image URL</Label>
                <Input
                  id="avatarUrl"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={async () => {
                    try {
                      const updated = await updateMe.mutateAsync({
                        image: avatarUrl,
                      });
                      setAvatarUrl(updated.image ?? "");
                      setNotice("Avatar updated.");
                      window.setTimeout(() => setNotice(null), 2500);
                    } catch (e) {
                      const msg =
                        e instanceof Error ? e.message : "Save failed";
                      setNotice(null);
                      window.setTimeout(() => setNotice(null), 2500);
                    }
                  }}
                  disabled={updateMe.isPending}
                >
                  Set avatar URL
                </Button>
              </div>
            </Card>
          </section>

          {/* Preferences */}
          <section className="mt-6">
            <div className="mb-3">
              <h2 className="text-sm font-semibold">Preferences</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                These affect how Momentum behaves for you.
              </p>
            </div>

            <Card className="rounded-2xl border-border bg-card p-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select
                    value={theme}
                    onValueChange={(v) => {
                      if (!isThemeChoice(v)) return;
                      setThemeLocal(v);
                      setTheme(v);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    list="timezones"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    placeholder="UTC"
                  />
                  <datalist id="timezones">
                    {tzList.map((tz) => (
                      <option key={tz} value={tz} />
                    ))}
                  </datalist>
                  <p className="text-xs text-muted-foreground">
                    Start typing to search (example: “Asia/Karachi”).
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Week starts on</Label>
                  <Select
                    value={String(weekStartDay)}
                    onValueChange={(v) => setWeekStartDay(toWeekStartDay(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sunday</SelectItem>
                      <SelectItem value="1">Monday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="button"
                  className="w-full"
                  onClick={async () => {
                    try {
                      await updateMe.mutateAsync({
                        theme,
                        timezone,
                        weekStartDay,
                      });
                      setNotice("Preferences saved.");
                      window.setTimeout(() => setNotice(null), 2500);
                    } catch (e) {
                      const msg =
                        e instanceof Error ? e.message : "Save failed";
                      setNotice(msg);
                      window.setTimeout(() => setNotice(null), 2500);
                    }
                  }}
                  disabled={updateMe.isPending}
                >
                  Save preferences
                </Button>
              </div>
            </Card>
          </section>

          <Separator className="my-8" />

          {/* Account */}
          <section>
            <h2 className="text-sm font-semibold">Account</h2>

            <div className="mt-3 space-y-3">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                disabled={logout.isPending}
                onClick={async () => {
                  try {
                    await logout.mutateAsync();
                    router.replace("/login");
                  } catch {
                    showNotWiredYet("Logout failed. Try again.");
                  }
                }}
              >
                {logout.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging out…
                  </>
                ) : (
                  <>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </>
                )}
              </Button>

              {/* Danger Zone */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    Delete my account permanently
                  </Button>
                </AlertDialogTrigger>

                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action is permanent. To confirm, type your{" "}
                      {(user.username ?? "").trim() ? "username" : "email"}:{" "}
                      <span className="font-medium text-foreground">
                        {confirmTarget}
                      </span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <div className="space-y-2">
                    <Input
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder={`Type ${
                        (user.username ?? "").trim() ? "username" : "email"
                      }`}
                    />
                    <p className="text-xs text-muted-foreground">
                      Delete endpoint will be wired after settings save.
                    </p>
                  </div>

                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setConfirmText("")}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction asChild>
                      <Button
                        variant="destructive"
                        disabled={!canDelete || deleteAccount.isPending}
                        onClick={async () => {
                          try {
                            await deleteAccount.mutateAsync(confirmText);
                            router.replace("/login");
                          } catch (e) {
                            const msg =
                              e instanceof Error ? e.message : "Delete failed";
                            setNotice(msg);
                            window.setTimeout(() => setNotice(null), 2500);
                          }
                        }}
                      >
                        Delete permanently
                      </Button>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
