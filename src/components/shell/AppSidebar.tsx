"use client";
import * as React from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { SidebarProfile } from "@/components/shell/SidebarProfile";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";
import { SidebarNavItem } from "@/components/shell/SidebarNavItem";
import { appHref } from "@/components/shell/nav";
type AppMode = "demo" | "auth";

export function AppSidebar({
  mode,
  collapsed,
  onToggleCollapsed,
  mobile = false,
}: {
  mode: AppMode;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobile?: boolean;
}) {
  //on mobile always render expanded inside a sheet
  const isCollapsed = mobile ? false : collapsed;
  return (
    <aside
      className={[
        "flex h-full md:h-[calc(100dvh-1.5rem)] flex-col",
        "rounded-2xl border border-sidebar-border",
        "bg-sidebar text-sidebar-foreground",
        "transition-[width] duration-200",
        isCollapsed ? "w-16" : "w-64",
      ].join(" ")}
    >
      {/* Header row: profile + collapse toggle */}
      <div
        className={[
          "flex items-center gap-2 p-2",
          isCollapsed ? "justify-center" : "justify-between",
        ].join(" ")}
      >
        <SidebarProfile mode={mode} collapsed={isCollapsed} />

        {!mobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapsed}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={isCollapsed ? "hidden" : ""}
          >
            <PanelLeftClose className="h-5 w-5" />
          </Button>
        )}

        {/* When collapsed, show the expand button as a separate row (cleaner layout) */}
      </div>

      {!mobile && collapsed && (
        <div className="px-2 pb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapsed}
            aria-label="Expand sidebar"
            className="w-full"
          >
            <PanelLeftOpen className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Future nav goes here */}
      <div className="flex-1 px-2 pb-2">
        {/*/today*/}
        <div className="flex-1 px-2 pb-2">
          <nav className="mt-2 space-y-1">
            <SidebarNavItem
              href={appHref(mode, "/today")}
              label="Today"
              icon={CalendarDays}
              collapsed={isCollapsed}
            />
          </nav>
        </div>
      </div>
    </aside>
  );
}
