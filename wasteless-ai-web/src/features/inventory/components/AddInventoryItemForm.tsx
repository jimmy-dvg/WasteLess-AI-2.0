"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { addInventoryItem, type InventoryActionState } from "../actions";

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
      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
    >
      {pending ? "Adding..." : "Add item"}
    </button>
  );
}

export default function AddInventoryItemForm() {
  const [state, formAction] = useActionState(addInventoryItem, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <section className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-4">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-950">Add inventory item</h2>
        <p className="mt-1 text-sm text-slate-600">Track quantity, location, and expiration date in one pass.</p>
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
          <input
            name="category"
            placeholder="Dairy"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <label>
          <span className="text-xs font-semibold text-slate-600">Location</span>
          <select
            name="location"
            defaultValue="fridge"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="pantry">Pantry</option>
            <option value="fridge">Fridge</option>
            <option value="freezer">Freezer</option>
          </select>
        </label>
        <label className="md:col-span-2">
          <span className="text-xs font-semibold text-slate-600">Expiration date</span>
          <input
            name="expiration_date"
            type="date"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <div className="flex items-end gap-3 md:col-span-4">
          <SubmitButton />
          {state.error ? <p className="text-sm font-medium text-rose-700">{state.error}</p> : null}
          {state.message ? <p className="text-sm font-medium text-emerald-700">{state.message}</p> : null}
        </div>
      </form>
    </section>
  );
}
