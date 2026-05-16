"use client";

import React, { useActionState } from "react";
import { loginUser, type AuthActionState } from "@/actions/auth.actions";

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState<AuthActionState, FormData>(loginUser, {
    success: true,
  });

  return (
    <form
      action={formAction}
      className="space-y-4 max-w-md mx-auto"
      suppressHydrationWarning
    >
      {state.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
      <div>
        <label className="block text-sm font-medium text-slate-700">Email</label>
        <input name="email" type="email" required className="mt-1 block w-full rounded-md border p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Password</label>
        <input name="password" type="password" required className="mt-1 block w-full rounded-md border p-2" />
      </div>
      <div>
        <button
          type="submit"
          className="px-4 py-2 rounded bg-emerald-600 text-white disabled:opacity-60"
          disabled={isPending}
        >
          {isPending ? "Signing in..." : "Sign In"}
        </button>
      </div>
    </form>
  );
}
