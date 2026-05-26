"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import type { InventoryCategory } from "@/types/inventory";
import { createProductAction, type InventoryActionState } from "../actions";
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
      className="inline-flex w-full justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300 sm:w-auto"
    >
      {pending ? "Adding..." : "Add product"}
    </button>
  );
}

const locationOptions = STORAGE_LOCATION_OPTIONS;

export default function AddProductForm({
  categories,
  defaultStorageLocation = "pantry",
}: {
  categories: InventoryCategory[];
  defaultStorageLocation?: string;
}) {
  const [state, formAction] = useActionState(createProductAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      if (state.message) addToast(state.message, "success");
    }

    if (state.error) {
      addToast(state.error, "error");
    }
  }, [state, addToast]);

  return (
    <section className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-4">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-950">Add product</h2>
        <p className="mt-1 text-sm text-slate-600">Track quantity, storage, and expiration in one pass.</p>
      </div>
      <form ref={formRef} action={formAction} className="grid gap-3 md:grid-cols-6">
        <label className="md:col-span-2">
          <span className="text-xs font-semibold text-slate-600">Product</span>
          <input
            name="name"
            required
            placeholder="Greek yogurt"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <label>
          <span className="text-xs font-semibold text-slate-600">Quantity</span>
          <input
            name="quantity"
            type="number"
            min="0.01"
            step="0.01"
            required
            placeholder="2"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <label>
          <span className="text-xs font-semibold text-slate-600">Unit</span>
          <input
            name="unit"
            placeholder="cups"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <label>
          <span className="text-xs font-semibold text-slate-600">Category</span>
          <select
            name="category_id"
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
        <label>
          <span className="text-xs font-semibold text-slate-600">Storage</span>
          <input
            name="storage_location"
            list="storage-options"
            defaultValue={defaultStorageLocation}
            placeholder="fridge"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm capitalize outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <label>
          <span className="text-xs font-semibold text-slate-600">Purchase date</span>
          <input
            name="purchase_date"
            type="date"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <label>
          <span className="text-xs font-semibold text-slate-600">Expiration date</span>
          <input
            name="expiration_date"
            type="date"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <label className="md:col-span-4">
          <span className="text-xs font-semibold text-slate-600">Notes</span>
          <input
            name="notes"
            placeholder="Keep sealed after opening"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <div className="flex flex-col items-start gap-3 md:col-span-2 md:flex-row md:items-end">
          <SubmitButton />
          {state.error ? (
            <p className="text-sm font-medium text-rose-700" role="alert">
              {state.error}
            </p>
          ) : null}
        </div>
      </form>
      <datalist id="storage-options">
        {locationOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </section>
  );
}
