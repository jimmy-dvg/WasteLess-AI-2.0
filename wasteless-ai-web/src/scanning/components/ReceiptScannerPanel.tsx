"use client";

import { useRef, useState } from "react";
import { Camera, FileText, ImageUp, Loader2, Sparkles, Upload } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { preprocessReceiptImage } from "@/image-processing/browser";
import ImportConfirmationModal from "@/scanning/components/ImportConfirmationModal";
import { createSampleReceiptResult } from "@/scanning/sample-data";
import type { OCRResult, ParsedReceipt } from "@/scanning/types";
import type { InventoryCategory } from "@/types/inventory";

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; data?: T };

type ReceiptOCRPayload = {
  receiptId: string | null;
  imageUrl: string | null;
  ocr: OCRResult;
  parsedReceipt: ParsedReceipt;
};

type ReceiptParsePayload = {
  receiptId: string | null;
  parsedReceipt: ParsedReceipt;
};

type ReceiptScannerPanelProps = {
  categories: InventoryCategory[];
  onHistoryChanged: () => void;
};

export default function ReceiptScannerPanel({ categories, onHistoryChanged }: ReceiptScannerPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rawText, setRawText] = useState("");
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [parsedReceipt, setParsedReceipt] = useState<ParsedReceipt | null>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { addToast } = useToast();

  const processFile = async (file: File | undefined) => {
    if (!file) return;
    setIsProcessingImage(true);
    setParsedReceipt(null);
    setReceiptId(null);

    try {
      const processed = await preprocessReceiptImage(file);
      setPreviewUrl(processed.previewUrl);
      processed.warnings.forEach((warning) => addToast(warning, "info"));

      const formData = new FormData();
      formData.set("image", processed.file);

      const response = await fetch("/api/scanning/receipt/ocr", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as ApiResponse<ReceiptOCRPayload>;

      if (!payload.success) {
        addToast(payload.error || "Receipt OCR failed", "error");
        if (payload.data?.ocr) {
          setOcrResult(payload.data.ocr);
          setRawText(payload.data.ocr.rawText);
        }
        return;
      }

      setOcrResult(payload.data.ocr);
      setRawText(payload.data.ocr.rawText);
      setParsedReceipt(payload.data.parsedReceipt);
      setReceiptId(payload.data.receiptId);
      setImageUrl(payload.data.imageUrl);
      onHistoryChanged();

      payload.data.ocr.warnings.forEach((warning) => addToast(warning, "info"));

      if (payload.data.parsedReceipt.items.length > 0) {
        addToast(`${payload.data.parsedReceipt.items.length} receipt items detected`, "success");
        setConfirmOpen(true);
      } else {
        addToast("No receipt items were detected. Edit OCR text and parse again.", "info");
      }
    } catch {
      addToast("Unable to process receipt image", "error");
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  };

  const parseEditedText = async () => {
    setIsParsing(true);

    try {
      const response = await fetch("/api/scanning/receipt/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText, imageUrl }),
      });
      const payload = (await response.json()) as ApiResponse<ReceiptParsePayload>;

      if (!payload.success) {
        addToast(payload.error || "Unable to parse receipt text", "error");
        return;
      }

      setParsedReceipt(payload.data.parsedReceipt);
      setReceiptId(payload.data.receiptId);
      onHistoryChanged();

      if (payload.data.parsedReceipt.items.length > 0) {
        addToast(`${payload.data.parsedReceipt.items.length} items ready for review`, "success");
        setConfirmOpen(true);
      } else {
        addToast("No importable items were found", "info");
      }
    } catch {
      addToast("Unable to parse receipt text", "error");
    } finally {
      setIsParsing(false);
    }
  };

  const loadSampleReceipt = () => {
    const sample = createSampleReceiptResult();
    setPreviewUrl(null);
    setOcrResult({
      rawText: sample.rawText,
      confidence: 0.99,
      lines: sample.rawText.split("\n").map((text) => ({ text, confidence: 0.99 })),
      engine: "tesseract.js",
      processedAt: new Date().toISOString(),
      warnings: [],
    });
    setRawText(sample.rawText);
    setParsedReceipt(sample);
    setReceiptId(null);
    setImageUrl(null);
    setConfirmOpen(true);
    addToast("Sample receipt loaded", "info");
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <h2 className="text-base font-semibold text-slate-950">Receipt OCR</h2>
        <p className="mt-1 text-sm text-slate-500">
          Upload or capture a receipt, review OCR text, then import confirmed items.
        </p>
      </div>

      <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="space-y-4">
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="" className="max-h-[420px] w-full rounded-lg object-contain" />
            ) : (
              <div className="grid min-h-64 place-items-center text-center">
                <div>
                  <ImageUp className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold text-slate-700">No receipt selected</p>
                  <p className="mt-1 text-sm text-slate-500">Use a bright, flat photo for better OCR.</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingImage}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              Upload receipt
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isProcessingImage}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Camera className="h-4 w-4" aria-hidden="true" />
              Use camera
            </button>
          </div>
          <button
            type="button"
            onClick={loadSampleReceipt}
            disabled={isProcessingImage}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Load sample receipt
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(event) => void processFile(event.target.files?.[0])}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => void processFile(event.target.files?.[0])}
          />

          {isProcessingImage ? (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Compressing image, running OCR, and parsing receipt...
            </div>
          ) : null}

          {ocrResult ? (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-slate-200 p-3">
                <dt className="text-xs font-semibold text-slate-500">OCR confidence</dt>
                <dd className="mt-1 text-slate-950">{Math.round(ocrResult.confidence * 100)}%</dd>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <dt className="text-xs font-semibold text-slate-500">Lines detected</dt>
                <dd className="mt-1 text-slate-950">{ocrResult.lines.length}</dd>
              </div>
            </dl>
          ) : null}
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <FileText className="h-4 w-4" aria-hidden="true" />
              OCR preview editor
            </span>
            <textarea
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              placeholder="OCR text will appear here after scanning."
              className="mt-2 min-h-80 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={parseEditedText}
              disabled={isParsing || rawText.trim().length < 5}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {isParsing ? "Parsing..." : "Parse edited text"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={!parsedReceipt || parsedReceipt.items.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Review import
            </button>
          </div>

          {parsedReceipt ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-950">
                    {parsedReceipt.storeName ?? "Parsed receipt"}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {parsedReceipt.purchaseDate ?? "Unknown date"} - {parsedReceipt.items.length} items -{" "}
                    {parsedReceipt.total != null ? `$${parsedReceipt.total.toFixed(2)}` : "Total unknown"}
                  </p>
                </div>
              </div>
              {parsedReceipt.warnings.length ? (
                <ul className="mt-3 space-y-1 text-xs text-amber-700">
                  {parsedReceipt.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-4 grid gap-2">
                {parsedReceipt.items.slice(0, 8).map((item) => (
                  <div
                    key={`${item.name}-${item.price ?? ""}`}
                    className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-slate-800">{item.normalizedName || item.name}</span>
                    <span className="shrink-0 text-xs text-slate-500">
                      {item.quantity} {item.unit ?? ""} {item.price != null ? `- $${item.price.toFixed(2)}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <ImportConfirmationModal
        open={confirmOpen}
        receiptId={receiptId}
        receipt={parsedReceipt}
        categories={categories}
        onClose={() => setConfirmOpen(false)}
        onImported={onHistoryChanged}
      />
    </section>
  );
}
