"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import type { InventoryCategory } from "@/types/inventory";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
  type InventoryActionState,
} from "@/features/inventory/actions";
import { useFormStatus } from "react-dom";

const initialState: InventoryActionState = { success: false, message: null, error: null };

function CreateButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
    >
      {pending ? "Adding..." : "Add category"}
    </button>
  );
}

function CategoryRow({ category }: { category: InventoryCategory }) {
  const [state, formAction] = useActionState(updateCategoryAction, initialState);
  const { addToast } = useToast();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (state.success && state.message) {
      addToast(state.message, "success");
    }
    if (state.error) {
      addToast(state.error, "error");
    }
  }, [state, addToast]);

  const handleDelete = () => {
    setOpen(false);
    startTransition(async () => {
      const result = await deleteCategoryAction(category.id);
      if (!result.success) {
        addToast(result.error ?? "Unable to delete category", "error");
        return;
      }
      if (result.message) addToast(result.message, "success");
    });
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <form action={formAction} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto_auto]">
        <input type="hidden" name="id" value={category.id} />
        <label>
          <span className="text-xs font-semibold text-slate-600">Category</span>
          <input
            name="name"
            defaultValue={category.name}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <label>
          <span className="text-xs font-semibold text-slate-600">Color</span>
          <input
            name="color"
            defaultValue={category.color ?? ""}
            placeholder="#22c55e"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Save
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setOpen(true)}
            className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
          >
            Delete
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={open}
        title="Delete category?"
        description="Products in this category will be uncategorized."
        confirmLabel="Delete"
        onCancel={() => setOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default function CategoryManager({ categories }: { categories: InventoryCategory[] }) {
  const [state, formAction] = useActionState(createCategoryAction, initialState);
  const { addToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success && state.message) {
      addToast(state.message, "success");
      formRef.current?.reset();
    }
    if (state.error) {
      addToast(state.error, "error");
    }
  }, [state, addToast]);

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-4">
        <h2 className="text-base font-semibold text-slate-950">Add a category</h2>
        <form
          ref={formRef}
          action={formAction}
          className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]"
        >
          <label>
            <span className="text-xs font-semibold text-slate-600">Name</span>
            <input
              name="name"
              placeholder="Dairy"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <label>
            <span className="text-xs font-semibold text-slate-600">Color</span>
            <input
              name="color"
              placeholder="#22c55e"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <div className="flex items-end">
            <CreateButton />
          </div>
        </form>
      </section>

      <section className="space-y-3">
        {categories.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            No categories yet. Add one to start organizing your inventory.
          </div>
        ) : (
          categories.map((category) => <CategoryRow key={category.id} category={category} />)
        )}
      </section>
    </div>
  );
}
