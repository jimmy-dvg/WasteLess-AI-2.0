"use client";

import React from "react";
import { logoutUser } from "@/actions/auth.actions";
import { getInitials } from "@/lib/dashboard-utils";

export default function UserMenu({ user }: { user: { id: string; name: string; email: string } }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-2 py-1.5">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-800">
        {getInitials(user.name)}
      </span>
      <span className="hidden min-w-0 text-left lg:block">
        <span className="block max-w-32 truncate text-sm font-semibold text-slate-900">{user.name}</span>
        <span className="block max-w-32 truncate text-xs text-slate-500">{user.email}</span>
      </span>
      <form action={logoutUser}>
        <button
          type="submit"
          className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        >
          Logout
        </button>
      </form>
    </div>
  );
}
