"use client";

import ErrorState from "@/components/dashboard/ErrorState";

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <div className="space-y-4">
      <ErrorState />
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Try again
      </button>
    </div>
  );
}
