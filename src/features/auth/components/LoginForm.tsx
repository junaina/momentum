"use client";

import * as React from "react";
import { useRouter} from "next/navigation";
import { z } from "zod";
import { loginBodySchema } from "@/server/validators/auth.zod"; // safe: pure zod

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type FieldErrors = Partial<
  Record<keyof z.infer<typeof loginBodySchema>, string>
>;

function formatRetry(retryAfterSeconds: unknown) {
  const seconds = Number(retryAfterSeconds);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  const mins = Math.ceil(seconds / 60);
  return mins <= 1 ? "about 1 minute" : `about ${mins} minutes`;
}

export function LoginForm() {
  const router = useRouter();

  const [isLoading, setIsLoading] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const form = new FormData(e.currentTarget);
    const payload = {
      identifier: String(form.get("identifier") ?? ""),
      password: String(form.get("password") ?? ""),
    };

    // 1) Client-side validation for fast feedback
    const parsed = loginBodySchema.safeParse(payload);
    if (!parsed.success) {
      const f = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        identifier: f.identifier?.[0],
        password: f.password?.[0],
      });
      setFormError("Please fix the highlighted fields.");
      return;
    }

    // 2) Call the API. On success, the server sets an HttpOnly session cookie.
    // The browser stores it automatically — no localStorage needed.
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // 400 = zod validation from the API route
        if (res.status === 400 && data?.issues?.fieldErrors) {
          setFieldErrors({
            identifier: data.issues.fieldErrors.identifier?.[0],
            password: data.issues.fieldErrors.password?.[0],
          });
          setFormError(data?.error ?? "Fix the fields and try again.");
          return;
        }

        // 429 = rate limited
        if (res.status === 429) {
          const wait = formatRetry(data?.retryAfterSeconds);
          setFormError(
            wait
              ? `${data?.error ?? "Too many attempts."} Try again in ${wait}.`
              : data?.error ?? "Too many attempts. Try again soon."
          );
          return;
        }

        // 401 = wrong credentials
        if (res.status === 401) {
          setFormError(data?.error ?? "Invalid email/username or password.");
          return;
        }

        setFormError(data?.error ?? "Login failed. Try again.");
        return;
      }

      // 3) Redirect somewhere sensible after login.
      // Supports /login?next=/today (or any path you want)
      router.push("/today");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {formError ? (
            <p className="text-sm text-destructive">{formError}</p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="identifier">Email or username</Label>
            <Input
              id="identifier"
              name="identifier"
              autoComplete="username"
              placeholder="you@example.com or your_username"
            />
            {fieldErrors.identifier ? (
              <p className="text-sm text-destructive">
                {fieldErrors.identifier}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
            />
            {fieldErrors.password ? (
              <p className="text-sm text-destructive">{fieldErrors.password}</p>
            ) : null}
          </div>

          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Log in"}
          </Button>

          <p className="text-sm text-muted-foreground">
            New here?{" "}
            <a className="underline" href="/signup">
              Create an account
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
