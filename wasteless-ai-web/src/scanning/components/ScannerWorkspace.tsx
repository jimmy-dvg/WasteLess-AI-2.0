"use client";

import { useCallback, useState } from "react";
import { Images, ReceiptText, ScanBarcode } from "lucide-react";
import BarcodeScannerPanel from "@/scanning/components/BarcodeScannerPanel";
import PhotoRecognitionPanel from "@/scanning/components/PhotoRecognitionPanel";
import ReceiptScannerPanel from "@/scanning/components/ReceiptScannerPanel";
import ScanHistoryPanel from "@/scanning/components/ScanHistoryPanel";
import type { ScanHistoryItem } from "@/scanning/types";
import type { InventoryCategory } from "@/types/inventory";

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; data?: T };

type ScannerWorkspaceProps = {
  categories: InventoryCategory[];
  initialHistory: ScanHistoryItem[];
};

export default function ScannerWorkspace({ categories, initialHistory }: ScannerWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"barcode" | "receipt" | "photo">("barcode");
  const [history, setHistory] = useState(initialHistory);

  const refreshHistory = useCallback(async () => {
    try {
      const response = await fetch("/api/scanning/history", { cache: "no-store" });
      const payload = (await response.json()) as ApiResponse<ScanHistoryItem[]>;
      if (payload.success) setHistory(payload.data);
    } catch {
      return;
    }
  }, []);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          <div className="grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("barcode")}
              aria-pressed={activeTab === "barcode"}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeTab === "barcode"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              <ScanBarcode className="h-4 w-4" aria-hidden="true" />
              Barcode
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("receipt")}
              aria-pressed={activeTab === "receipt"}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeTab === "receipt"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              <ReceiptText className="h-4 w-4" aria-hidden="true" />
              Receipt
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("photo")}
              aria-pressed={activeTab === "photo"}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeTab === "photo"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              <Images className="h-4 w-4" aria-hidden="true" />
              Photo
            </button>
          </div>
        </div>

        {activeTab === "barcode" ? (
          <BarcodeScannerPanel categories={categories} onHistoryChanged={refreshHistory} />
        ) : activeTab === "receipt" ? (
          <ReceiptScannerPanel categories={categories} onHistoryChanged={refreshHistory} />
        ) : (
          <PhotoRecognitionPanel categories={categories} onHistoryChanged={refreshHistory} />
        )}
      </div>

      <ScanHistoryPanel history={history} />
    </div>
  );
}
