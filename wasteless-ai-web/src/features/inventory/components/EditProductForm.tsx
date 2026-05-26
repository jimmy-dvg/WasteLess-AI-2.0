"use client";

import { useActionState, useEffect } from "react";
import { format } from "date-fns";
import { useFormStatus } from "react-dom";
import type { InventoryCategory, InventoryProduct } from "@/types/inventory";
import { updateProductAction, type InventoryActionState } from "../actions";
import { useToast } from "@/components/ui/Toast";
import { STORAGE_LOCATION_OPTIONS } from "@/features/categories/constants";

const initialState: InventoryActionState = {
  success: false,
  message: null,
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
    >
      {pending ? "Saving..." : "Save changes"}
    </button>
  );
}

export default function EditProductForm({
  product,
  categories,
}: {
  product: InventoryProduct;
  categories: InventoryCategory[];
}) {
  const [state, formAction] = useActionState(updateProductAction, initialState);
  const { addToast } = useToast();

  useEffect(() => {
    if (state.success && state.message) {
      addToast(state.message, "success");
    }
    if (state.error) {
      addToast(state.error, "error");
    }
  }, [state, addToast]);

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="id" value={product.id} />
      <label>
        <span className="text-xs font-semibold text-slate-600">Product name</span>
        <input
          name="name"
          defaultValue={product.name}
          required
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </label>
      <div className="grid gap-3 md:grid-cols-3">
        <label>
          <span className="text-xs font-semibold text-slate-600">Quantity</span>
          <input
            name="quantity"
            type="number"
            min="0.01"
            step="0.01"
            defaultValue={product.quantity}
            required
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <label>
          <span className="text-xs font-semibold text-slate-600">Unit</span>
          <input
            name="unit"
            defaultValue={product.unit ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <label>
          <span className="text-xs font-semibold text-slate-600">Category</span>
          <select
            name="category_id"
            defaultValue={product.categoryId ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">Uncategorized</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <label>
          <span className="text-xs font-semibold text-slate-600">Storage location</span>
          <input
            name="storage_location"
            list="edit-storage-options"
            defaultValue={product.storageLocation ?? ""}
            placeholder="fridge"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm capitalize outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <label>
          <span className="text-xs font-semibold text-slate-600">Purchase date</span>
          <input
            name="purchase_date"
            type="date"
            defaultValue={product.purchaseDate ? format(product.purchaseDate, "yyyy-MM-dd") : ""}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <label>
          <span className="text-xs font-semibold text-slate-600">Expiration date</span>
          <input
            name="expiration_date"
            type="date"
            defaultValue={product.expirationDate ? format(product.expirationDate, "yyyy-MM-dd") : ""}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
      </div>
      <label>
        <span className="text-xs font-semibold text-slate-600">Notes</span>
        <textarea
          name="notes"
          defaultValue={product.notes ?? ""}
          rows={4}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </label>
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <SubmitButton />
        {state.error ? (
          <p className="text-sm font-medium text-rose-700" role="alert">
            {state.error}
          </p>
        ) : null}
      </div>
      <datalist id="edit-storage-options">
        {STORAGE_LOCATION_OPTIONS.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </form>
  );
}
