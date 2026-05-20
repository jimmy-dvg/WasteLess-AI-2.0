"use client";

import { useState, useTransition } from "react";
import { RotateCcw, Undo2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import type { ScanImportBatch } from "@/scanning/types";

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; data?: T };

type ImportBatchesPanelProps = {
  batches: ScanImportBatch[];
  onChanged: () => void;
};

function formatDate(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function sourceLabel(source: string) {
  if (source === "food_photo" || source === "shelf_photo" || source === "fridge_photo") return "Food photo";
  if (source === "receipt") return "Receipt";
  if (source === "barcode") return "Barcode";
  return source;
}

export default function ImportBatchesPanel({ batches, onChanged }: ImportBatchesPanelProps) {
  const [pendingBatchId, setPendingBatchId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  const undoBatch = (batchId: string) => {
    setPendingBatchId(batchId);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/scanning/import-batches/${batchId}/undo`, { method: "POST" });
        const payload = (await response.json()) as ApiResponse<{ revertedCount: number }>;

        if (!payload.success) {
          addToast(payload.error || "Unable to undo import", "error");
          return;
        }

        addToast(`${payload.data.revertedCount} imported items removed`, "success");
        onChanged();
      } catch {
        addToast("Unable to undo import", "error");
      } finally {
        setPendingBatchId(null);
      }
    });
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Undo2 className="h-4 w-4 text-emerald-700" aria-hidden="true" />
        <h2 className="text-base font-semibold text-slate-950">Recent imports</h2>
      </div>

      {batches.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          Imported scanner batches will appear here with undo controls.
        </div>
      ) : (
        <div className="mt-4 divide-y divide-slate-100">
          {batches.map((batch) => {
            const canUndo = batch.status === "active" && batch.productIds.length > 0;
            return (
              <article key={batch.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{sourceLabel(batch.source)}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {batch.importedCount} items - {formatDate(batch.createdAt)}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                    {batch.status}
                  </span>
                </div>
                {canUndo ? (
                  <button
                    type="button"
                    disabled={isPending && pendingBatchId === batch.id}
                    onClick={() => undoBatch(batch.id)}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    {isPending && pendingBatchId === batch.id ? "Undoing..." : "Undo import"}
                  </button>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
