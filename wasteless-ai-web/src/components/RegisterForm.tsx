"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import { AlertCircle, UserPlus } from "lucide-react";
import { registerUser, type AuthActionState } from "@/actions/auth.actions";

export default function RegisterForm() {
  const [state, formAction, isPending] = useActionState<AuthActionState, FormData>(registerUser, {
    success: true,
  });

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      suppressHydrationWarning
    >
      {state.error ? (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{state.error}</p>
        </div>
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
          placeholder="Alex Green"
          className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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
          placeholder="you@example.com"
          className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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
          placeholder="At least 8 characters"
          className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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
          placeholder="Re-enter your password"
          className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>
      <div>
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
          disabled={isPending}
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          {isPending ? "Creating..." : "Create account"}
        </button>
      </div>
      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-emerald-700 hover:text-emerald-800">
          Sign in
        </Link>
      </p>
    </form>
  );
}
