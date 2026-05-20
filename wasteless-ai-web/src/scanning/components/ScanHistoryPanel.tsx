"use client";

import { Clock, Images, ReceiptText, ScanBarcode } from "lucide-react";
import type { ScanHistoryItem } from "@/scanning/types";

type ScanHistoryPanelProps = {
  history: ScanHistoryItem[];
};

function formatHistoryDate(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function ScanHistoryPanel({ history }: ScanHistoryPanelProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-emerald-700" aria-hidden="true" />
        <h2 className="text-base font-semibold text-slate-950">Scan history</h2>
      </div>

      {history.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          Recent barcodes and receipt scans will appear here.
        </div>
      ) : (
        <div className="mt-4 divide-y divide-slate-100">
          {history.map((item) => {
            const isBarcode = item.type === "barcode";
            const isPhoto = item.type === "food_photo" || item.type === "shelf_photo" || item.type === "fridge_photo";
            const metadata = item.metadata ?? {};
            const product = metadata.product as { name?: string } | undefined;
            const itemCount = typeof metadata.itemCount === "number" ? metadata.itemCount : null;

            return (
              <article key={item.id} className="flex gap-3 py-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                  {isBarcode ? (
                    <ScanBarcode className="h-4 w-4" aria-hidden="true" />
                  ) : isPhoto ? (
                    <Images className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <ReceiptText className="h-4 w-4" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-slate-950">
                      {isBarcode
                        ? product?.name ?? item.barcode ?? "Barcode scan"
                        : isPhoto
                          ? "Food photo"
                          : "Receipt scan"}
                    </p>
                    <span className="shrink-0 text-xs text-slate-500">{formatHistoryDate(item.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {isBarcode
                      ? [item.symbology, item.barcode, item.status].filter(Boolean).join(" - ")
                      : [itemCount != null ? `${itemCount} items` : null, item.status].filter(Boolean).join(" - ")}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
