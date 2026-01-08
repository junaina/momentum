"use client";
import * as React from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { SidebarProfile } from "@/components/shell/SidebarProfile";
import { Button } from "@/components/ui/button";

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
        {/* Placeholder for now (Slice 2 will add real nav items) */}
        <div
          className={[
            "mt-2 rounded-xl border border-sidebar-border",
            "p-3 text-xs text-muted-foreground",
            isCollapsed ? "hidden" : "block",
          ].join(" ")}
        >
          Sidebar nav items will go here next (Today, Week, Habits, etc.)
        </div>
      </div>
    </aside>
  );
}
