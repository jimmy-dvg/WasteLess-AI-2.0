"use client";

import { useRef, useState } from "react";
import { Camera, ImageUp, Loader2, Sparkles, Upload } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { preprocessScanImage } from "@/image-processing/browser";
import ImportConfirmationModal from "@/scanning/components/ImportConfirmationModal";
import type { ParsedReceipt, PhotoRecognitionResult } from "@/scanning/types";
import type { InventoryCategory } from "@/types/inventory";

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; data?: T };

type PhotoRecognitionPanelProps = {
  categories: InventoryCategory[];
  onHistoryChanged: () => void;
};

const FOOD_PHOTO_MODE = "food_photo";

export default function PhotoRecognitionPanel({ categories, onHistoryChanged }: PhotoRecognitionPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [parsedReceipt, setParsedReceipt] = useState<ParsedReceipt | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { addToast } = useToast();

  const analyzeFile = async (file: File | undefined) => {
    if (!file) return;
    setIsAnalyzing(true);
    setParsedReceipt(null);

    try {
      const processed = await preprocessScanImage(file);
      setPreviewUrl(processed.previewUrl);
      processed.warnings.forEach((warning) => addToast(warning, "info"));

      const formData = new FormData();
      formData.set("image", processed.file);
      formData.set("mode", FOOD_PHOTO_MODE);

      const response = await fetch("/api/scanning/photo/analyze", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as ApiResponse<PhotoRecognitionResult>;

      if (!payload.success) {
        addToast(payload.error || "Unable to analyze photo", "error");
        return;
      }

      setParsedReceipt(payload.data.parsedReceipt);
      onHistoryChanged();

      payload.data.warnings.forEach((warning) => addToast(warning, "info"));

      if (payload.data.parsedReceipt.items.length > 0) {
        addToast(`${payload.data.parsedReceipt.items.length} visible items detected`, "success");
        setConfirmOpen(true);
      } else {
        addToast("No food items were detected. Try a closer, brighter photo.", "info");
      }
    } catch {
      addToast("Unable to analyze photo", "error");
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <h2 className="text-base font-semibold text-slate-950">Food photo recognition</h2>
        <p className="mt-1 text-sm text-slate-500">
          Upload or capture any food photo and let AI detect visible ingredients or products for review.
        </p>
      </div>

      <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-4">
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="" className="max-h-[420px] w-full rounded-lg object-contain" />
            ) : (
              <div className="grid min-h-64 place-items-center text-center">
                <div>
                  <ImageUp className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold text-slate-700">No food photo selected</p>
                  <p className="mt-1 text-sm text-slate-500">Keep food visible and avoid heavy glare.</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              Upload photo
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isAnalyzing}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Camera className="h-4 w-4" aria-hidden="true" />
              Use camera
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(event) => void analyzeFile(event.target.files?.[0])}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => void analyzeFile(event.target.files?.[0])}
          />

          {isAnalyzing ? (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Preparing image and detecting visible products...
            </div>
          ) : null}
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-700" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-slate-950">Detected items</h3>
          </div>

          {!parsedReceipt ? (
            <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
              Photo recognition results will appear here before import.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {parsedReceipt.warnings.length ? (
                <ul className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  {parsedReceipt.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              ) : null}

              {parsedReceipt.items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
                  No items were detected in this image.
                </div>
              ) : (
                parsedReceipt.items.slice(0, 12).map((item) => (
                  <article key={`${item.name}-${item.confidence}`} className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-950">{item.normalizedName || item.name}</h4>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.quantity} {item.unit ?? "item"} - {item.category ?? "Grocery"} -{" "}
                          {Math.round(item.confidence * 100)}%
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                        {item.storageLocation ?? "pantry"}
                      </span>
                    </div>
                  </article>
                ))
              )}

              {parsedReceipt.items.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Review and import
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <ImportConfirmationModal
        open={confirmOpen}
        receiptId={null}
        receipt={parsedReceipt}
        categories={categories}
        onClose={() => setConfirmOpen(false)}
        onImported={onHistoryChanged}
        source={FOOD_PHOTO_MODE}
      />
    </section>
  );
}
