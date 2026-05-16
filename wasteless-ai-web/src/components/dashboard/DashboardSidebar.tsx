"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { dashboardNavItems } from "./nav-items";

type DashboardSidebarProps = {
  onNavigate?: () => void;
};

export default function DashboardSidebar({ onNavigate }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Dashboard navigation" className="flex flex-1 flex-col gap-2">
      {dashboardNavItems.map((item) => {
        const isActive =
          item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              isActive
                ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            }`}
          >
            <span
              aria-hidden="true"
              className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-bold ${
                isActive
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-slate-500 ring-1 ring-slate-200 group-hover:text-emerald-700"
              }`}
            >
              {item.marker}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
