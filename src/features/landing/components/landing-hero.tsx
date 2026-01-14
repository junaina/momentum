import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarDays,
  Check,
  History,
  Lock,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

function BrandMark() {
  return (
    <Link href="/" className="inline-flex items-center gap-3">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-card ring-1 ring-border shadow-momentum">
        <Image
          src="/logo/momentum_logo.png"
          alt="Momentum"
          width={28}
          height={28}
          priority
          className="h-7 w-7 object-contain"
        />
      </span>
      <span className="text-sm font-semibold tracking-tight">Momentum</span>
    </Link>
  );
}

function Point({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm text-muted-foreground">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <span>{children}</span>
    </div>
  );
}

function PreviewCard() {
  return (
    <div className="rounded-[2rem] border border-border/60 bg-card/60 p-6 shadow-momentum backdrop-blur sm:p-7">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">Today</div>
          <div className="mt-1 text-sm font-semibold tracking-tight">
            Quick check-in
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-background/40 px-3 py-1 text-xs text-muted-foreground">
          3 habits
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {[
          { label: "Hydrate", done: true },
          { label: "Walk", done: true },
          { label: "Read", done: false },
        ].map((h) => (
          <div
            key={h.label}
            className="flex items-center justify-between rounded-3xl border border-border/60 bg-background/30 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span
                className={[
                  "inline-flex h-9 w-9 items-center justify-center rounded-2xl ring-1 ring-border/60",
                  h.done ? "bg-primary/15" : "bg-card/40",
                ].join(" ")}
                aria-hidden
              >
                <span className="text-base">{h.done ? "✓" : "•"}</span>
              </span>
              <div className="text-sm font-medium tracking-tight">
                {h.label}
              </div>
            </div>

            <span
              className={[
                "text-xs",
                h.done ? "text-primary" : "text-muted-foreground",
              ].join(" ")}
            >
              {h.done ? "Done" : "Not yet"}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-3xl border border-border/60 bg-background/30 p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>This week</span>
          <span className="text-foreground">Simple view</span>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className={[
                "h-9 rounded-2xl border border-border/60",
                i === 1 || i === 2 || i === 3 ? "bg-primary/15" : "bg-card/30",
              ].join(" ")}
            />
          ))}
        </div>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Keep it simple. Keep it moving.
      </p>
    </div>
  );
}

type Feature = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const FEATURES: Feature[] = [
  {
    title: "Fast check-ins",
    description: "Open Today, tap done, and get on with your day.",
    icon: Zap,
  },
  {
    title: "Daily or weekly habits",
    description: "Pick what fits. Not everything needs to be “every day.”",
    icon: CalendarDays,
  },
  {
    title: "A clear week view",
    description: "See how the week went without digging through screens.",
    icon: BarChart3,
  },
  {
    title: "Edit past days",
    description: "Missed a log? Fix it later so your history stays true.",
    icon: History,
  },
  {
    title: "Streaks that make sense",
    description: "You’ll see your current streak and your best streak.",
    icon: Check,
  },
  {
    title: "Private by default",
    description: "No feed. No public stuff. Just you and your habits.",
    icon: Lock,
  },
];

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  return (
    <div className="rounded-3xl border border-border/60 bg-card/50 p-6 shadow-momentum backdrop-blur">
      <div className="flex items-start gap-4">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-background/50 ring-1 ring-border/60">
          <Icon className="h-5 w-5 text-primary" aria-hidden />
        </span>
        <div>
          <div className="text-sm font-semibold tracking-tight">
            {feature.title}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {feature.description}
          </p>
        </div>
      </div>
    </div>
  );
}

export function LandingHero() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-background text-foreground">
      {/* subtle glow (your existing utility classes) */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-140px] h-[560px] w-[560px] -translate-x-1/2 rounded-full blur-3xl opacity-30 momentum-glow-1" />
        <div className="absolute left-1/2 top-[120px] h-[520px] w-[760px] -translate-x-1/2 rounded-full blur-3xl opacity-20 momentum-glow-2" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-4">
        {/* Top bar */}
        <header className="flex items-center justify-between py-8">
          <BrandMark />
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/login">Log in</Link>
            </Button>
            <ThemeToggle />
          </div>
        </header>

        {/* Hero */}
        <section className="pb-10 pt-8 sm:pb-14 sm:pt-12">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <h1 className="text-pretty text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
                Keep your habits steady.
                <span className="text-primary"> No fuss.</span>
              </h1>

              <p className="mt-5 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
                Momentum is for days when you’re busy. You check in fast, you
                see how your week is going, and you move on.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/signup">Get started</Link>
                </Button>
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link href="/demo/today">Try Demo</Link>
                </Button>
                <Button asChild variant="outline" className="w-full sm:hidden">
                  <Link href="/login">Log in</Link>
                </Button>
              </div>

              {/* small, human points */}
              <div className="mt-8 max-w-xl space-y-3">
                <Point>Made to be quick, not “perfect.”</Point>
                <Point>Works for daily stuff and weekly stuff.</Point>
                <Point>
                  Shows your week in a way you can read in 2 seconds.
                </Point>
              </div>
            </div>

            <PreviewCard />
          </div>
        </section>

        {/* Features section (kept, but calmer) */}
        <section className="pb-16 pt-6 sm:pt-10" id="features">
          <div className="max-w-2xl">
            <h2 className="text-pretty text-2xl font-semibold tracking-tight sm:text-3xl">
              What you get in V1
            </h2>
            <p className="mt-3 text-pretty text-sm text-muted-foreground sm:text-base">
              Just the essentials. Everything here is meant to help you show up
              more often — without turning your life into a spreadsheet.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} feature={f} />
            ))}
          </div>

          {/* One extra CTA, but not loud */}
          <div className="mt-10 rounded-[2rem] border border-border/60 bg-card/50 p-6 shadow-momentum backdrop-blur sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold tracking-tight">
                  Want to see it in action?
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Try the demo first. If it clicks, make an account.
                </div>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/demo/today">Try Demo</Link>
                </Button>
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link href="/signup">Get started</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <footer className="py-10 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Momentum
        </footer>
      </div>
    </main>
  );
}
