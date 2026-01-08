"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { PanelLeft } from "lucide-react";

import { AppSidebar } from "@/components/shell/AppSidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type AppMode = "demo" | "auth";

export function AppShell({
  children,
  mode,
}: {
  children: React.ReactNode;
  mode: AppMode;
}) {
  const pathname = usePathname();

  const [collapsed, setCollapsed] = React.useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = React.useState<boolean>(false);

  // Close the mobile drawer after navigation (feels “app-like”).
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Outer padding gives the “margin” between sidebar and content */}
      <div className="flex min-h-dvh gap-3 p-3">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <AppSidebar
            mode={mode}
            collapsed={collapsed}
            onToggleCollapsed={() => setCollapsed((v) => !v)}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Mobile top bar + drawer */}
          <div className="mb-3 flex items-center gap-2 md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open sidebar"
                  className="shrink-0"
                >
                  <PanelLeft className="h-5 w-5" />
                </Button>
              </SheetTrigger>

              <SheetContent
                side="left"
                className="w-[18rem] p-0 bg-transparent text-sidebar-foreground border-0"
              >
                <AppSidebar
                  mode={mode}
                  collapsed={false}
                  onToggleCollapsed={() => {}}
                  mobile
                />
              </SheetContent>
            </Sheet>

            {/* You can replace this with a logo later */}
            <div className="text-sm font-medium truncate">Momentum</div>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
