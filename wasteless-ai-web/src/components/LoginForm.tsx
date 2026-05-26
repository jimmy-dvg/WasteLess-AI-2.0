"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle, LogIn } from "lucide-react";
import { loginUser, type AuthActionState } from "@/actions/auth.actions";

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState<AuthActionState, FormData>(loginUser, {
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
        <label htmlFor="login-email" className="block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>
      <div>
        <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="Enter your password"
          className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>
      <div>
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
          disabled={isPending}
        >
          <LogIn className="h-4 w-4" aria-hidden="true" />
          {isPending ? "Signing in..." : "Sign in"}
        </button>
      </div>
      <p className="text-center text-sm text-slate-600">
        New to WasteLessAI?{" "}
        <Link href="/register" className="font-semibold text-emerald-700 hover:text-emerald-800">
          Create an account
        </Link>
      </p>
    </form>
  );
}
