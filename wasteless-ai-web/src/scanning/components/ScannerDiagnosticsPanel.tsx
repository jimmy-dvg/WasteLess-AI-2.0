"use client";

import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { ScannerDiagnosticItem, ScannerDiagnostics } from "@/scanning/types";

type ScannerDiagnosticsPanelProps = {
  diagnostics: ScannerDiagnostics;
};

function getStatusIcon(item: ScannerDiagnosticItem) {
  if (item.status === "ready") return <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />;
  if (item.status === "warning") return <Info className="h-4 w-4 text-amber-600" aria-hidden="true" />;
  return <AlertTriangle className="h-4 w-4 text-rose-600" aria-hidden="true" />;
}

function getStatusStyles(status: ScannerDiagnosticItem["status"]) {
  if (status === "ready") return "border-emerald-100 bg-emerald-50 text-emerald-800";
  if (status === "warning") return "border-amber-100 bg-amber-50 text-amber-800";
  return "border-rose-100 bg-rose-50 text-rose-800";
}

export default function ScannerDiagnosticsPanel({ diagnostics }: ScannerDiagnosticsPanelProps) {
  const importantItems = diagnostics.items.filter((item) => item.status !== "ready").slice(0, 4);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Scanner diagnostics</h2>
          <p className="mt-1 text-xs text-slate-500">
            Photo provider: {diagnostics.photoRecognitionProvider}
          </p>
        </div>
        <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${getStatusStyles(diagnostics.overallStatus)}`}>
          {diagnostics.overallStatus}
        </span>
      </div>

      <div className="mt-4 grid gap-2">
        {(importantItems.length ? importantItems : diagnostics.items.slice(0, 4)).map((item) => (
          <div key={item.id} className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3">
            {getStatusIcon(item)}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">{item.label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">{item.message}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
