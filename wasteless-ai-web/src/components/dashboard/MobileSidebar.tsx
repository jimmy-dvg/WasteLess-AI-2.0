"use client";

import Link from "next/link";
import type { DashboardMode } from "@/features/dashboard-mode/constants";
import DashboardModeSwitcher from "./DashboardModeSwitcher";
import DashboardSidebar from "./DashboardSidebar";

type MobileSidebarProps = {
  open: boolean;
  onClose: () => void;
  dashboardMode: DashboardMode;
};

export default function MobileSidebar({ open, onClose, dashboardMode }: MobileSidebarProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close dashboard navigation"
        className="absolute inset-0 bg-slate-950/40"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-80 max-w-[86vw] flex-col border-r border-slate-200 bg-white p-4 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/" className="text-sm font-semibold text-emerald-700">
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
        <DashboardSidebar onNavigate={onClose} />
        <div className="mt-4">
          <DashboardModeSwitcher key={dashboardMode} currentMode={dashboardMode} />
        </div>
      </aside>
    </div>
  );
}
