"use client";

import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import type { ParsedReceipt, ReceiptItemExtraction } from "@/scanning/types";
import type { InventoryCategory } from "@/types/inventory";

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; data?: T };

type EditableItem = ReceiptItemExtraction & {
  categoryId?: string | null;
};

type ImportConfirmationModalProps = {
  open: boolean;
  receiptId: string | null;
  receipt: ParsedReceipt | null;
  categories: InventoryCategory[];
  source?: "receipt" | "food_photo" | "shelf_photo" | "fridge_photo";
  onClose: () => void;
  onImported: () => void;
};

export default function ImportConfirmationModal({
  open,
  receiptId,
  receipt,
  categories,
  source = "receipt",
  onClose,
  onImported,
}: ImportConfirmationModalProps) {
  if (!open || !receipt) return null;

  return (
    <ImportConfirmationModalBody
      key={`${receiptId ?? "draft"}-${receipt.rawText.length}-${receipt.items.length}`}
      receiptId={receiptId}
      receipt={receipt}
      categories={categories}
      source={source}
      onClose={onClose}
      onImported={onImported}
    />
  );
}

type ImportConfirmationModalBodyProps = Omit<ImportConfirmationModalProps, "open" | "receipt"> & {
  receipt: ParsedReceipt;
};

function ImportConfirmationModalBody({
  receiptId,
  receipt,
  categories,
  source = "receipt",
  onClose,
  onImported,
}: ImportConfirmationModalBodyProps) {
  const [items, setItems] = useState<EditableItem[]>(() =>
    receipt.items.map((item, index) => ({ ...item, id: item.id ?? `${index}`, selected: true }))
  );
  const [isImporting, setIsImporting] = useState(false);
  const { addToast } = useToast();

  const selectedCount = useMemo(() => items.filter((item) => item.selected !== false).length, [items]);

  const updateItem = (index: number, patch: Partial<EditableItem>) => {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  };

  const importItems = async () => {
    setIsImporting(true);

    try {
      const response = await fetch("/api/scanning/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptId,
          purchaseDate: receipt.purchaseDate,
          source,
          items,
        }),
      });
      const payload = (await response.json()) as ApiResponse<{ importedCount: number; skippedCount: number }>;

      if (!payload.success) {
        addToast(payload.error || "Unable to import receipt items", "error");
        return;
      }

      addToast(`${payload.data.importedCount} items imported`, "success");
      onImported();
      onClose();
    } catch {
      addToast("Unable to import receipt items", "error");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 p-4">
      <div className="mx-auto flex max-h-[92vh] max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Confirm inventory import</h2>
            <p className="mt-1 text-sm text-slate-500">
              {receipt.storeName ?? "Receipt"} - {receipt.purchaseDate ?? "Date unknown"} - {selectedCount} selected
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close import confirmation"
            className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-auto p-4">
          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-600">
              No importable items were detected. Close this dialog and edit the OCR text before parsing again.
            </div>
          ) : (
            <div className="min-w-[760px] overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-normal text-slate-500">
                  <tr>
                    <th className="w-12 px-3 py-3 text-left">Use</th>
                    <th className="px-3 py-3 text-left">Product</th>
                    <th className="px-3 py-3 text-left">Qty</th>
                    <th className="px-3 py-3 text-left">Unit</th>
                    <th className="px-3 py-3 text-left">Category</th>
                    <th className="px-3 py-3 text-left">Storage</th>
                    <th className="px-3 py-3 text-left">Expiration</th>
                    <th className="px-3 py-3 text-left">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {items.map((item, index) => (
                    <tr key={item.id ?? `${item.name}-${index}`}>
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={item.selected !== false}
                          onChange={(event) => updateItem(index, { selected: event.target.checked })}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          value={item.normalizedName || item.name}
                          onChange={(event) =>
                            updateItem(index, {
                              name: event.target.value,
                              normalizedName: event.target.value,
                            })
                          }
                          className="w-full min-w-48 rounded-lg border border-slate-200 px-2 py-1.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.quantity}
                          onChange={(event) => updateItem(index, { quantity: Number(event.target.value) || 1 })}
                          className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          value={item.unit ?? ""}
                          onChange={(event) => updateItem(index, { unit: event.target.value || null })}
                          className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={item.categoryId ?? ""}
                          onChange={(event) => updateItem(index, { categoryId: event.target.value || null })}
                          className="w-40 rounded-lg border border-slate-200 bg-white px-2 py-1.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        >
                          <option value="">{item.category ?? "Auto"}</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <input
                          value={item.storageLocation ?? ""}
                          onChange={(event) => updateItem(index, { storageLocation: event.target.value || null })}
                          className="w-28 rounded-lg border border-slate-200 px-2 py-1.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="date"
                          value={item.expirationDate ?? ""}
                          onChange={(event) => updateItem(index, { expirationDate: event.target.value || null })}
                          className="w-36 rounded-lg border border-slate-200 px-2 py-1.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price ?? ""}
                          onChange={(event) =>
                            updateItem(index, { price: event.target.value ? Number(event.target.value) : null })
                          }
                          className="w-24 rounded-lg border border-slate-200 px-2 py-1.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 p-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={importItems}
            disabled={isImporting || selectedCount === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            {isImporting ? "Importing..." : "Import selected"}
          </button>
        </div>
      </div>
    </div>
  );
}
