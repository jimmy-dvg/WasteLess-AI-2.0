"use client";

import Link from "next/link";
import { DASHBOARD_MODE_THEMES, type DashboardMode } from "@/features/dashboard-mode/constants";
import DashboardModeSwitcher from "./DashboardModeSwitcher";
import DashboardSidebar from "./DashboardSidebar";

type MobileSidebarProps = {
  open: boolean;
  onClose: () => void;
  dashboardMode: DashboardMode;
};

export default function MobileSidebar({ open, onClose, dashboardMode }: MobileSidebarProps) {
  if (!open) return null;

  const theme = DASHBOARD_MODE_THEMES[dashboardMode];

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close dashboard navigation"
        className="absolute inset-0 bg-slate-950/40"
        onClick={onClose}
      />
      <aside
        className={`relative flex h-full w-80 max-w-[86vw] flex-col overflow-hidden border-r p-4 shadow-xl ${theme.sidebarClass}`}
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/" className={`text-sm font-semibold ${theme.linkClass}`}>
              WasteLessAI
            </Link>
            <p className="text-xs text-slate-500">Household dashboard</p>
          </div>
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="mb-4 shrink-0">
          <DashboardModeSwitcher key={dashboardMode} currentMode={dashboardMode} />
        </div>
        <DashboardSidebar onNavigate={onClose} dashboardMode={dashboardMode} />
      </aside>
    </div>
  );
}
