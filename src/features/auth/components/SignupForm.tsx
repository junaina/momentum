"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signupBodySchema } from "@/server/validators/auth.zod"; // safe: pure zod
import { z } from "zod";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type FieldErrors = Partial<
  Record<keyof z.infer<typeof signupBodySchema>, string>
>;

export function SignupForm() {
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
      email: String(form.get("email") ?? ""),
      username: String(form.get("username") ?? ""),
      password: String(form.get("password") ?? ""),
      confirmPassword: String(form.get("confirmPassword") ?? ""),
      name: String(form.get("name") ?? "") || undefined,
    };

    const parsed = signupBodySchema.safeParse(payload);
    if (!parsed.success) {
      const f = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        email: f.email?.[0],
        username: f.username?.[0],
        password: f.password?.[0],
        confirmPassword: f.confirmPassword?.[0],
        name: f.name?.[0],
      });
      setFormError("Please fix the highlighted fields.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data?.type === "validation" && data?.fieldErrors) {
          setFieldErrors({
            email: data.fieldErrors.email?.[0],
            username: data.fieldErrors.username?.[0],
            password: data.fieldErrors.password?.[0],
            confirmPassword: data.fieldErrors.confirmPassword?.[0],
            name: data.fieldErrors.name?.[0],
          });
          setFormError(data.message ?? "Fix the fields and try again.");
          return;
        }

        if (data?.type === "conflict" && data?.field) {
          setFieldErrors((prev) => ({ ...prev, [data.field]: data.message }));
          setFormError(data.message);
          return;
        }

        setFormError(data?.message ?? "Signup failed. Try again.");
        return;
      }

      // success → send to login (or auto-login later)
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {formError ? (
            <p className="text-sm text-destructive">{formError}</p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" />
            {fieldErrors.email ? (
              <p className="text-sm text-destructive">{fieldErrors.email}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" name="username" autoComplete="username" />
            {fieldErrors.username ? (
              <p className="text-sm text-destructive">{fieldErrors.username}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Letters, numbers, underscores. 3–20 chars.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name (optional)</Label>
            <Input id="name" name="name" autoComplete="name" />
            {fieldErrors.name ? (
              <p className="text-sm text-destructive">{fieldErrors.name}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
            />
            {fieldErrors.password ? (
              <p className="text-sm text-destructive">{fieldErrors.password}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
            />
            {fieldErrors.confirmPassword ? (
              <p className="text-sm text-destructive">
                {fieldErrors.confirmPassword}
              </p>
            ) : null}
          </div>

          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Sign up"}
          </Button>

          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <a className="underline" href="/login">
              Log in
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
