"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { AlertCircle, Camera, PackageCheck, Plus, RotateCcw, ScanLine, Square } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { STORAGE_LOCATION_OPTIONS } from "@/features/categories/constants";
import { createSampleBarcodeResult } from "@/scanning/sample-data";
import { addDaysToDate, toDateInputValue } from "@/scanning/shelf-life";
import type { BarcodeLookupResult, BarcodeProductMetadata } from "@/scanning/types";
import type { InventoryCategory } from "@/types/inventory";

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; data?: T };

type BarcodeScannerPanelProps = {
  categories: InventoryCategory[];
  onHistoryChanged: () => void;
};

const SUPPORTED_FORMATS = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.QR_CODE,
  BarcodeFormat.CODE_128,
];

function formatName(format: BarcodeFormat | null) {
  if (format == null) return null;
  return BarcodeFormat[format] ?? String(format);
}

function defaultExpiration(product: BarcodeProductMetadata | null) {
  if (!product?.shelfLifeDays) return "";
  return toDateInputValue(addDaysToDate(new Date(), product.shelfLifeDays));
}

export default function BarcodeScannerPanel({ categories, onHistoryChanged }: BarcodeScannerPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const lastScanRef = useRef<{ value: string; at: number }>({ value: "", at: 0 });
  const [isScanning, setIsScanning] = useState(false);
  const [multiScan, setMultiScan] = useState(true);
  const [manualBarcode, setManualBarcode] = useState("");
  const [lookupResult, setLookupResult] = useState<BarcodeLookupResult | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detectedFormat, setDetectedFormat] = useState<string | null>(null);
  const { addToast } = useToast();

  const reader = useMemo(() => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, SUPPORTED_FORMATS);
    hints.set(DecodeHintType.TRY_HARDER, true);
    return new BrowserMultiFormatReader(hints, {
      delayBetweenScanAttempts: 350,
      delayBetweenScanSuccess: 800,
    });
  }, []);

  const stopScanner = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setIsScanning(false);
  }, []);

  useEffect(() => () => stopScanner(), [stopScanner]);

  const lookupBarcode = useCallback(
    async (barcode: string, format?: string | null) => {
      const cleaned = barcode.trim();
      if (!cleaned) return;

      setIsLookingUp(true);
      setDetectedFormat(format ?? null);

      try {
        const response = await fetch("/api/scanning/barcode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ barcode: cleaned, format }),
        });
        const payload = (await response.json()) as ApiResponse<BarcodeLookupResult>;

        if (!payload.success) {
          addToast(payload.error || "Barcode lookup failed", "error");
          return;
        }

        setLookupResult(payload.data);
        onHistoryChanged();

        if (payload.data.found) {
          addToast(`${payload.data.product?.name ?? "Product"} found`, "success");
        } else {
          addToast("Barcode scanned, but no product metadata was found", "info");
        }

        if (!multiScan) stopScanner();
      } catch {
        addToast("Barcode lookup failed", "error");
      } finally {
        setIsLookingUp(false);
      }
    },
    [addToast, multiScan, onHistoryChanged, stopScanner]
  );

  const handleDetected = useCallback(
    (barcode: string, format: string | null) => {
      const now = Date.now();
      if (lastScanRef.current.value === barcode && now - lastScanRef.current.at < 2200) return;
      lastScanRef.current = { value: barcode, at: now };
      void lookupBarcode(barcode, format);
    },
    [lookupBarcode]
  );

  const startScanner = async () => {
    setCameraError(null);
    setLookupResult(null);

    if (!videoRef.current) return;

    try {
      const controls = await reader.decodeFromConstraints(
        {
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        videoRef.current,
        (result) => {
          if (!result) return;
          handleDetected(result.getText(), formatName(result.getBarcodeFormat()));
        }
      );

      controlsRef.current = controls;
      setIsScanning(true);
    } catch {
      setCameraError("Camera permission was denied or no camera was found.");
      setIsScanning(false);
    }
  };

  const importProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const product = lookupResult?.product;
    if (!product) return;

    const formData = new FormData(event.currentTarget);
    setIsImporting(true);

    try {
      const response = await fetch("/api/scanning/barcode/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barcode: product.barcode,
          name: product.name,
          brand: product.brand,
          category: product.category,
          categoryId: formData.get("categoryId") || null,
          quantity: formData.get("quantity") || 1,
          unit: formData.get("unit") || product.unit,
          expirationDate: formData.get("expirationDate") || null,
          storageLocation: formData.get("storageLocation") || product.storageLocation,
          notes: formData.get("notes") || null,
          metadata: product,
        }),
      });
      const payload = (await response.json()) as ApiResponse<{ productId: string }>;

      if (!payload.success) {
        addToast(payload.error || "Unable to add product", "error");
        return;
      }

      addToast(`${product.name} added to inventory`, "success");
      setLookupResult(null);
      setManualBarcode("");
      onHistoryChanged();
    } catch {
      addToast("Unable to add product", "error");
    } finally {
      setIsImporting(false);
    }
  };

  const product = lookupResult?.product ?? null;

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Barcode scanner</h2>
          <p className="mt-1 text-sm text-slate-500">Live UPC, EAN-13, QR, and Code128 detection.</p>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={multiScan}
            onChange={(event) => setMultiScan(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          Multi-item mode
        </label>
      </div>

      <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-lg bg-slate-950">
            <video ref={videoRef} className="aspect-[4/3] w-full bg-slate-950 object-cover" muted playsInline />
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="h-32 w-[78%] max-w-md rounded-lg border-2 border-emerald-300/90 shadow-[0_0_0_999px_rgba(2,6,23,0.42)]">
                <div className="mt-16 h-0.5 w-full bg-emerald-300/80" />
              </div>
            </div>
            <div className="absolute left-3 top-3 rounded-full bg-slate-950/70 px-3 py-1 text-xs font-semibold text-white">
              {isScanning ? "Scanning" : "Camera idle"}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={startScanner}
              disabled={isScanning}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              <Camera className="h-4 w-4" aria-hidden="true" />
              Start
            </button>
            <button
              type="button"
              onClick={stopScanner}
              disabled={!isScanning}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Square className="h-4 w-4" aria-hidden="true" />
              Stop
            </button>
            <button
              type="button"
              onClick={() => {
                setLookupResult(null);
                lastScanRef.current = { value: "", at: 0 };
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reset
            </button>
            <button
              type="button"
              onClick={() => {
                setLookupResult(createSampleBarcodeResult());
                setDetectedFormat("TEST_MODE");
                addToast("Sample barcode product loaded", "info");
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Sample
            </button>
          </div>

          {cameraError ? (
            <div className="flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>{cameraError}</p>
            </div>
          ) : null}

          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              void lookupBarcode(manualBarcode, "manual");
            }}
          >
            <label className="flex-1">
              <span className="text-xs font-semibold text-slate-600">Manual barcode</span>
              <input
                value={manualBarcode}
                onChange={(event) => setManualBarcode(event.target.value)}
                placeholder="012345678905"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <button
              type="submit"
              disabled={isLookingUp || !manualBarcode.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 sm:self-end"
            >
              <ScanLine className="h-4 w-4" aria-hidden="true" />
              Lookup
            </button>
          </form>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-950">Product match</h3>
              <p className="mt-1 text-xs text-slate-500">{detectedFormat ?? "Waiting for scan"}</p>
            </div>
            {isLookingUp ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Looking up
              </span>
            ) : null}
          </div>

          {!product ? (
            <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
              Scan a barcode or enter one manually. Product metadata is cached after a successful lookup.
              {lookupResult?.warnings.length ? (
                <ul className="mt-3 space-y-1 text-xs text-amber-700">
                  {lookupResult.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <article className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex gap-3">
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.imageUrl}
                      alt=""
                      className="h-16 w-16 rounded-lg border border-slate-200 object-cover"
                    />
                  ) : (
                    <div className="grid h-16 w-16 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                      <PackageCheck className="h-6 w-6" aria-hidden="true" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-slate-950">{product.name}</h4>
                    <p className="mt-1 text-xs text-slate-500">
                      {[product.brand, product.category, product.source].filter(Boolean).join(" - ")}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Shelf life estimate: {product.shelfLifeDays ?? "unknown"} days in{" "}
                      {product.storageLocation ?? "storage"}
                    </p>
                  </div>
                </div>
              </article>

              {lookupResult?.duplicates.length ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <p className="font-semibold">Possible duplicate</p>
                  <ul className="mt-2 space-y-1 text-xs">
                    {lookupResult.duplicates.map((duplicate) => (
                      <li key={duplicate.id}>
                        {duplicate.name} - {duplicate.quantity ?? "1"} {duplicate.unit ?? ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <form onSubmit={importProduct} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label>
                    <span className="text-xs font-semibold text-slate-600">Quantity</span>
                    <input
                      name="quantity"
                      type="number"
                      min="0.01"
                      step="0.01"
                      defaultValue={product.quantity ?? "1"}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </label>
                  <label>
                    <span className="text-xs font-semibold text-slate-600">Unit</span>
                    <input
                      name="unit"
                      defaultValue={product.unit ?? ""}
                      placeholder="item"
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </label>
                  <label>
                    <span className="text-xs font-semibold text-slate-600">Category</span>
                    <select
                      name="categoryId"
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="">Auto: {product.category ?? "Grocery"}</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="text-xs font-semibold text-slate-600">Storage</span>
                    <input
                      name="storageLocation"
                      list="barcode-storage-options"
                      defaultValue={product.storageLocation ?? "килер"}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </label>
                  <label>
                    <span className="text-xs font-semibold text-slate-600">Expiration</span>
                    <input
                      name="expirationDate"
                      type="date"
                      defaultValue={defaultExpiration(product)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </label>
                  <label>
                    <span className="text-xs font-semibold text-slate-600">Notes</span>
                    <input
                      name="notes"
                      placeholder="Optional"
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={isImporting}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  {isImporting ? "Adding..." : "Add to inventory"}
                </button>
                <datalist id="barcode-storage-options">
                  {STORAGE_LOCATION_OPTIONS.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
