import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
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

function TrustItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
      <Check className="h-4 w-4 text-primary" />
      <span>{children}</span>
    </div>
  );
}

export function LandingHero() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-background text-foreground">
      {/* glow layers (defined in globals.css utilities) */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-140px] h-[560px] w-[560px] -translate-x-1/2 rounded-full blur-3xl opacity-35 momentum-glow-1" />
        <div className="absolute left-1/2 top-[120px] h-[520px] w-[760px] -translate-x-1/2 rounded-full blur-3xl opacity-25 momentum-glow-2" />
      </div>

      {/* full-height column */}
      <div className="relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4">
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

        {/* Hero takes remaining space */}
        <section className="flex flex-1 items-center">
          <div className="grid w-full gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <h1 className="text-pretty text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
                Tiny daily check-ins.
                <span className="text-primary"> Real progress.</span>
              </h1>

              <p className="mt-5 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
                Build habits with simple schedules. Tap done in seconds. Review
                your week when you actually care.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/signup">Get started</Link>
                </Button>
                <Button asChild variant="outline" className="w-full sm:hidden">
                  <Link href="/login">Log in</Link>
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
                <TrustItem>Installable PWA</TrustItem>
                <TrustItem>Offline-friendly</TrustItem>
                <TrustItem>Private by default</TrustItem>
              </div>
            </div>

            {/* Right card (clean, less “blocky”) */}
            <div className="rounded-3xl border border-border/60 bg-card/60 p-6 shadow-momentum backdrop-blur sm:p-7">
              <div className="text-sm font-medium">How it works</div>

              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <div className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-primary" />
                  <p>Create habits with daily or weekly schedules.</p>
                </div>
                <div className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-primary" />
                  <p>Check in from Today. Undo anytime.</p>
                </div>
                <div className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-primary" />
                  <p>See targets, streaks, and patterns in Week.</p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-border/60 bg-background/40 p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>This week</span>
                  <span className="text-primary">3-day streak</span>
                </div>
                <div className="mt-3 grid grid-cols-7 gap-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div
                      key={i}
                      className={[
                        "h-9 rounded-2xl border border-border/60",
                        i === 1 || i === 2 || i === 3
                          ? "bg-primary/20"
                          : "bg-card/40",
                      ].join(" ")}
                    />
                  ))}
                </div>
              </div>

              <p className="mt-6 text-xs text-muted-foreground">
                Minimal by design — built for consistency, not guilt.
              </p>
            </div>
          </div>
        </section>

        {/* Footer sticks to bottom */}
        <footer className="py-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Momentum
        </footer>
      </div>
    </main>
  );
}
