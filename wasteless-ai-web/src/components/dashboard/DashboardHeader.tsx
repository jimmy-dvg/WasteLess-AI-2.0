"use client";

import { useState } from "react";
import MobileSidebar from "./MobileSidebar";
import NotificationBellDropdown, {
  type NotificationDropdownData,
} from "./NotificationBellDropdown";
import UserDropdown from "./UserDropdown";
import {
  DASHBOARD_MODE_BADGES,
  DASHBOARD_MODE_DESCRIPTIONS,
  DASHBOARD_MODE_THEMES,
  type DashboardMode,
} from "@/features/dashboard-mode/constants";
import type { NotificationSettings } from "@/features/notifications/constants";

type DashboardHeaderProps = {
  user: {
    id: string;
    name: string;
    email: string;
  };
  notifications: NotificationDropdownData;
  notificationSettings: NotificationSettings;
  dashboardMode: DashboardMode;
};

export default function DashboardHeader({
  user,
  notifications,
  notificationSettings,
  dashboardMode,
}: DashboardHeaderProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const theme = DASHBOARD_MODE_THEMES[dashboardMode];

  return (
    <>
      <header className={`sticky top-0 z-30 border-b backdrop-blur transition-colors ${theme.headerClass}`}>
        <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            aria-label="Open dashboard navigation"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 lg:hidden"
            onClick={() => setMobileNavOpen(true)}
          >
            <span className="flex flex-col gap-1" aria-hidden="true">
              <span className="h-0.5 w-4 rounded bg-current" />
              <span className="h-0.5 w-4 rounded bg-current" />
              <span className="h-0.5 w-4 rounded bg-current" />
            </span>
          </button>

          <form action="/dashboard/inventory" className="hidden flex-1 sm:block">
            <label className="sr-only" htmlFor="dashboard-search">
              Search inventory
            </label>
            <input
              id="dashboard-search"
              name="query"
              type="search"
              placeholder="Search pantry, fridge, freezer..."
              className={`w-full max-w-xl rounded-lg px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 ${theme.searchInputClass}`}
            />
          </form>

          <div className="ml-auto flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${theme.headerBadgeClass}`}
              aria-label={`Current focus mode: ${DASHBOARD_MODE_BADGES[dashboardMode]}`}
              title={DASHBOARD_MODE_DESCRIPTIONS[dashboardMode]}
            >
              {DASHBOARD_MODE_BADGES[dashboardMode]}
            </span>
            <NotificationBellDropdown data={notifications} settings={notificationSettings} />
            <UserDropdown user={user} />
          </div>
        </div>
      </header>
      <MobileSidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} dashboardMode={dashboardMode} />
    </>
  );
}
