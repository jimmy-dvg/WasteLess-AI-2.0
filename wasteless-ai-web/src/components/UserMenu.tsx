"use client";

import React from "react";
import { logoutUser } from "@/actions/auth.actions";

export default function UserMenu({ user }: { user: { id: string; name: string; email: string } }) {
  return (
    <div className="flex items-center gap-2">
      <span className="hidden sm:inline text-sm text-slate-700 dark:text-slate-300">Hello, {user.name}</span>
      <form action={logoutUser}>
        <button
          type="submit"
          className="px-3 py-2 text-sm rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800"
        >
          Logout
        </button>
      </form>
    </div>
  );
}
