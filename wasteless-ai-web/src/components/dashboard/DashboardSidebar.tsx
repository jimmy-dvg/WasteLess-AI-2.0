"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { dashboardNavItems } from "./nav-items";
import {
  DASHBOARD_MODE_THEMES,
  DEFAULT_DASHBOARD_MODE,
  type DashboardMode,
} from "@/features/dashboard-mode/constants";

type DashboardSidebarProps = {
  onNavigate?: () => void;
  dashboardMode?: DashboardMode;
};

export default function DashboardSidebar({
  onNavigate,
  dashboardMode = DEFAULT_DASHBOARD_MODE,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const theme = DASHBOARD_MODE_THEMES[dashboardMode];

  return (
    <nav aria-label="Dashboard navigation" className="min-h-0 flex-1 overflow-y-auto pr-1">
      <div className="flex flex-col gap-2">
        {dashboardNavItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : item.href === "/dashboard"
                ? pathname === item.href
                : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive ? theme.sidebarActiveLinkClass : theme.sidebarInactiveLinkClass
              }`}
            >
              <span
                aria-hidden="true"
                className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-bold ${
                  isActive ? theme.sidebarActiveMarkerClass : theme.sidebarInactiveMarkerClass
                }`}
              >
                {item.marker}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
