"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PanelsTopLeft,
  Users,
  FileBarChart,
  Settings,
  CircleHelp,
  Map,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";

const PRIMARY = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/my-boards", label: "Billboards", icon: PanelsTopLeft },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/reports", label: "Reports", icon: FileBarChart },
] as const;

const SECONDARY = [
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/help", label: "Help", icon: CircleHelp },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/my-boards") {
    return pathname.startsWith("/my-boards") || pathname.startsWith("/billboards");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type AppSidebarProps = {
  collapsed: boolean;
  onToggleCollapse: () => void;
};

export function AppSidebar({ collapsed, onToggleCollapse }: AppSidebarProps) {
  const pathname = usePathname() ?? "";

  const linkClass = (href: string) =>
    `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      isActive(pathname, href)
        ? "bg-neutral-900 text-white"
        : "text-neutral-700 hover:bg-neutral-100"
    }`;

  return (
    <aside
      className={`flex flex-col border-r border-neutral-200 bg-white shrink-0 transition-[width] duration-200 ease-out ${
        collapsed ? "w-[4.25rem]" : "w-56"
      }`}
    >
      <div className="flex h-12 items-center justify-between gap-1 border-b border-neutral-200 px-2">
        {!collapsed && (
          <Link
            href="/dashboard"
            className="truncate pl-1 text-sm font-semibold text-neutral-900"
          >
            MarketTrace
          </Link>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="rounded-md p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-2">
        <div className="space-y-0.5">
          {PRIMARY.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={linkClass(href)} title={label}>
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          ))}
        </div>

        <div className="mt-auto space-y-0.5 border-t border-neutral-100 pt-3">
          {SECONDARY.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={linkClass(href)} title={label}>
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          ))}
          <Link
            href="/inventory"
            className={`${linkClass("/inventory")} ${!isActive(pathname, "/inventory") ? "text-neutral-600" : ""}`}
            title="Inventory"
          >
            <Map className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Inventory</span>}
          </Link>
        </div>
      </nav>
    </aside>
  );
}
