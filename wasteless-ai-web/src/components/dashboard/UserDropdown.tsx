"use client";

import { logoutUser } from "@/actions/auth.actions";
import { getInitials } from "@/lib/dashboard-utils";

type UserDropdownProps = {
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export default function UserDropdown({ user }: UserDropdownProps) {
  return (
    <details className="relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 transition hover:bg-slate-50">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-800">
          {getInitials(user.name)}
        </span>
        <span className="hidden min-w-0 text-left md:block">
          <span className="block truncate text-sm font-semibold text-slate-900">{user.name}</span>
          <span className="block truncate text-xs text-slate-500">{user.email}</span>
        </span>
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
        <div className="border-b border-slate-100 px-3 py-2">
          <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
          <p className="truncate text-xs text-slate-500">{user.email}</p>
        </div>
        <form action={logoutUser} className="pt-2">
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Logout
          </button>
        </form>
      </div>
    </details>
  );
}
