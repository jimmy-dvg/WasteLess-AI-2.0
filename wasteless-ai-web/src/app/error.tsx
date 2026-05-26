"use client";

import { useEffect } from "react";

type RootErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RootError({ error, reset }: RootErrorProps) {
  useEffect(() => {
    console.error("Root route error", error.digest ?? error.message);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-16 text-slate-950">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase text-emerald-700">Something went wrong</p>
        <h1 className="mt-3 text-2xl font-bold">WasteLessAI hit an unexpected error.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The page could not finish loading. Try again, or return to the dashboard from the main navigation.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
