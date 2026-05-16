"use client";

import EmptyState from "@/components/dashboard/EmptyState";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import {
  addShoppingItem,
  removeShoppingItem,
  updateShoppingItemStatus,
  type ShoppingActionState,
} from "../actions";

type ShoppingListItem = {
  id: string;
  name: string;
  quantity: string;
  checked: boolean;
};

type ShoppingListProps = {
  list: {
    id: string;
    name: string;
  } | null;
  items: ShoppingListItem[];
};

const initialState: ShoppingActionState = {
  success: false,
  message: null,
  error: null,
};

function AddButton() {
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

export default function ShoppingList({ list, items }: ShoppingListProps) {
  const [state, formAction] = useActionState(addShoppingItem, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  const completedCount = items.filter((item) => item.checked).length;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">{list?.name ?? "Weekly groceries"}</h2>
              <p className="text-sm text-slate-500">
                {items.length} item{items.length === 1 ? "" : "s"} tracked, {completedCount} complete
              </p>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="Your shopping list is empty"
              description="Add the ingredients you need, then check them off as your household shops."
            />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 p-4 transition hover:bg-slate-50">
                <form action={updateShoppingItemStatus} className="flex items-center">
                  <input type="hidden" name="itemId" value={item.id} />
                  <input
                    type="checkbox"
                    name="checked"
                    defaultChecked={item.checked}
                    aria-label={`Mark ${item.name} complete`}
                    onChange={(event) => event.currentTarget.form?.requestSubmit()}
                    className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </form>
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm font-semibold ${
                      item.checked ? "text-slate-400 line-through" : "text-slate-950"
                    }`}
                  >
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-500">{item.quantity}</p>
                </div>
                <form action={removeShoppingItem}>
                  <input type="hidden" name="itemId" value={item.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Add item</h2>
        <form ref={formRef} action={formAction} className="mt-4 space-y-3">
          <input type="hidden" name="listId" value={list?.id ?? ""} />
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Item</span>
            <input
              name="name"
              required
              placeholder="Oats"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Quantity</span>
              <input
                name="quantity"
                placeholder="1"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Unit</span>
              <input
                name="unit"
                placeholder="bag"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
          </div>
          <AddButton />
          {state.error ? <p className="text-sm font-medium text-rose-700">{state.error}</p> : null}
          {state.message ? <p className="text-sm font-medium text-emerald-700">{state.message}</p> : null}
        </form>
      </aside>
    </div>
  );
}
