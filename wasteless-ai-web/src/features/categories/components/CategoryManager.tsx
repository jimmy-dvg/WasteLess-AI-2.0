"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Layers3, Plus, Save, Sparkles, Trash2, Warehouse } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import type { InventoryCategory } from "@/types/inventory";
import {
  RECOMMENDED_CATEGORIES,
  STORAGE_ORGANIZER_EXAMPLES,
  STORAGE_ZONES,
  normalizeTaxonomyName,
} from "@/features/categories/constants";
import StorageSuggestionTool from "@/features/categories/components/StorageSuggestionTool";
import {
  createCategoryAction,
  createRecommendedCategoriesAction,
  deleteCategoryAction,
  organizeExistingInventoryAction,
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
      <span className="inline-flex items-center gap-2">
        <Plus className="h-4 w-4" aria-hidden="true" />
        {pending ? "Adding..." : "Add category"}
      </span>
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
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            Save
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
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

function TaxonomyOverview({
  categories,
  missingRecommendedCount,
  isCreatingRecommended,
  isOrganizingExisting,
  onCreateRecommended,
  onOrganizeExisting,
}: {
  categories: InventoryCategory[];
  missingRecommendedCount: number;
  isCreatingRecommended: boolean;
  isOrganizingExisting: boolean;
  onCreateRecommended: () => void;
  onOrganizeExisting: () => void;
}) {
  const categoryByName = useMemo(() => {
    return new Map(categories.map((category) => [normalizeTaxonomyName(category.name), category]));
  }, [categories]);

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Layers3 className="h-4 w-4 text-emerald-700" aria-hidden="true" />
              <h2 className="text-base font-semibold text-slate-950">Recommended categories</h2>
            </div>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              A compact category set for household food and product inventory.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onOrganizeExisting}
              disabled={isOrganizingExisting}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {isOrganizingExisting ? "Organizing..." : "Organize items"}
            </button>
            <button
              type="button"
              onClick={onCreateRecommended}
              disabled={isCreatingRecommended || missingRecommendedCount === 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {missingRecommendedCount === 0 ? (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Plus className="h-4 w-4" aria-hidden="true" />
              )}
              {missingRecommendedCount === 0
                ? "Set ready"
                : isCreatingRecommended
                  ? "Adding..."
                  : `Add ${missingRecommendedCount}`}
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {RECOMMENDED_CATEGORIES.map((category) => {
            const existingCategory = categoryByName.get(normalizeTaxonomyName(category.name));
            const content = (
              <>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-full ${category.swatchClass}`} aria-hidden="true" />
                    <h3 className="text-sm font-semibold text-slate-950">{category.name}</h3>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-700" aria-hidden="true" />
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-600">{category.description}</p>
              </>
            );

            if (!existingCategory) {
              return (
                <button
                  key={category.name}
                  type="button"
                  onClick={onCreateRecommended}
                  disabled={isCreatingRecommended}
                  className="group rounded-lg border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-emerald-200 hover:bg-white hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {content}
                  <span className="mt-3 inline-flex rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-100">
                    Add category first
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={category.name}
                href={`/dashboard/inventory?categoryId=${encodeURIComponent(existingCategory.id)}`}
                aria-label={`Open inventory filtered by ${category.name}`}
                className="group rounded-lg border border-slate-200 bg-slate-50 p-3 transition hover:border-emerald-200 hover:bg-white hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-100"
              >
                {content}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Warehouse className="h-4 w-4 text-emerald-700" aria-hidden="true" />
          <h2 className="text-base font-semibold text-slate-950">Storage zones</h2>
        </div>
        <div className="mt-4 space-y-2">
          {STORAGE_ZONES.map((zone) => (
            <Link
              key={zone.name}
              href={`/dashboard/inventory?location=${encodeURIComponent(zone.name)}`}
              aria-label={`Open inventory filtered by ${zone.name}`}
              className="group block rounded-lg border border-slate-200 bg-slate-50 p-3 transition hover:border-emerald-200 hover:bg-white hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-100"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-950">{zone.name}</h3>
                <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-700" aria-hidden="true" />
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-600">{zone.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function AllocationExamples() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-emerald-700" aria-hidden="true" />
        <h2 className="text-base font-semibold text-slate-950">AI allocation examples</h2>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-3">
        {STORAGE_ORGANIZER_EXAMPLES.map((example) => (
          <div key={example.product} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
            <span className="font-semibold text-slate-950">{example.product}</span>{" "}
            <span className="text-slate-400">-&gt;</span> <span className="text-slate-700">{example.category}</span>{" "}
            <span className="text-slate-400">-&gt;</span>{" "}
            <span className="font-semibold text-emerald-700">{example.storageZone}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function CategoryManager({ categories }: { categories: InventoryCategory[] }) {
  const [state, formAction] = useActionState(createCategoryAction, initialState);
  const { addToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [isCreatingRecommended, startCreatingRecommended] = useTransition();
  const [isOrganizingExisting, startOrganizingExisting] = useTransition();

  const missingRecommendedCount = useMemo(() => {
    const existingNames = new Set(categories.map((category) => normalizeTaxonomyName(category.name)));
    return RECOMMENDED_CATEGORIES.filter((category) => !existingNames.has(normalizeTaxonomyName(category.name))).length;
  }, [categories]);

  useEffect(() => {
    if (state.success && state.message) {
      addToast(state.message, "success");
      formRef.current?.reset();
    }
    if (state.error) {
      addToast(state.error, "error");
    }
  }, [state, addToast]);

  const handleCreateRecommended = () => {
    startCreatingRecommended(async () => {
      const result = await createRecommendedCategoriesAction();
      if (!result.success) {
        addToast(result.error ?? "Unable to add recommended categories", "error");
        return;
      }
      if (result.message) addToast(result.message, "success");
    });
  };

  const handleOrganizeExisting = () => {
    startOrganizingExisting(async () => {
      const result = await organizeExistingInventoryAction();
      if (!result.success) {
        addToast(result.error ?? "Unable to organize existing items", "error");
        return;
      }
      if (result.message) addToast(result.message, "success");
    });
  };

  return (
    <div className="space-y-5">
      <TaxonomyOverview
        categories={categories}
        missingRecommendedCount={missingRecommendedCount}
        isCreatingRecommended={isCreatingRecommended}
        isOrganizingExisting={isOrganizingExisting}
        onCreateRecommended={handleCreateRecommended}
        onOrganizeExisting={handleOrganizeExisting}
      />

      <StorageSuggestionTool />

      <AllocationExamples />

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
              placeholder="млечни"
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
            No categories yet. Add the recommended set or create a custom category.
          </div>
        ) : (
          categories.map((category) => <CategoryRow key={category.id} category={category} />)
        )}
      </section>
    </div>
  );
}
