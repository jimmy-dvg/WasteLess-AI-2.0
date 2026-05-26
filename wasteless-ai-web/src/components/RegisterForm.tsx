"use client";

import React, { useActionState } from "react";
import { registerUser, type AuthActionState } from "@/actions/auth.actions";

export default function RegisterForm() {
  const [state, formAction, isPending] = useActionState<AuthActionState, FormData>(registerUser, {
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
        <label htmlFor="register-full-name" className="block text-sm font-medium text-slate-700">
          Full name
        </label>
        <input
          id="register-full-name"
          name="full_name"
          type="text"
          autoComplete="name"
          required
          className="mt-1 block w-full rounded-md border p-2"
        />
      </div>
      <div>
        <label htmlFor="register-email" className="block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1 block w-full rounded-md border p-2"
        />
      </div>
      <div>
        <label htmlFor="register-password" className="block text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className="mt-1 block w-full rounded-md border p-2"
        />
      </div>
      <div>
        <label htmlFor="register-confirm-password" className="block text-sm font-medium text-slate-700">
          Confirm password
        </label>
        <input
          id="register-confirm-password"
          name="confirm_password"
          type="password"
          autoComplete="new-password"
          required
          className="mt-1 block w-full rounded-md border p-2"
        />
      </div>
      <div>
        <button
          type="submit"
          className="px-4 py-2 rounded bg-emerald-600 text-white disabled:opacity-60"
          disabled={isPending}
        >
          {isPending ? "Creating..." : "Create account"}
        </button>
      </div>
    </form>
  );
}
