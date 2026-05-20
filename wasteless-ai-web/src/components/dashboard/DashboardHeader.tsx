"use client";

import { useState } from "react";
import MobileSidebar from "./MobileSidebar";
import NotificationBellDropdown, {
  type NotificationDropdownData,
} from "./NotificationBellDropdown";
import UserDropdown from "./UserDropdown";
import type { NotificationSettings } from "@/features/notifications/constants";

type DashboardHeaderProps = {
  user: {
    id: string;
    name: string;
    email: string;
  };
  notifications: NotificationDropdownData;
  notificationSettings: NotificationSettings;
};

export default function DashboardHeader({
  user,
  notifications,
  notificationSettings,
}: DashboardHeaderProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
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
              className="w-full max-w-xl rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
          </form>

          <div className="ml-auto flex items-center gap-2">
            <NotificationBellDropdown data={notifications} settings={notificationSettings} />
            <UserDropdown user={user} />
          </div>
        </div>
      </header>
      <MobileSidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </>
  );
}
