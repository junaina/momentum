"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

export function SidebarNavItem({
  href,
  label,
  icon: Icon,
  collapsed,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  collapsed: boolean;
}) {
  const pathname = usePathname();

  // active if exact match OR a nested route under it (e.g. /today/whatever)
  const isActive =
    pathname === href || (pathname?.startsWith(href + "/") ?? false);

  return (
    <Link
      href={href}
      className={[
        "flex items-center gap-3 rounded-xl px-3 py-2",
        "transition-colors",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground",
        collapsed ? "justify-center px-2" : "",
      ].join(" ")}
      aria-current={isActive ? "page" : undefined}
      title={collapsed ? label : undefined} // simple tooltip when collapsed
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span className="text-sm font-medium">{label}</span>}
    </Link>
  );
}
