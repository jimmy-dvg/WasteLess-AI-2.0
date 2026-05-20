"use client";

import { Check, SkipForward } from "lucide-react";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "@/components/ui/Toast";
import {
  markMealPlanItemCookedAction,
  skipMealPlanItemAction,
  type MealPlanActionState,
} from "@/features/meal-planning/actions";

const initialState: MealPlanActionState = {
  success: false,
  message: null,
  error: null,
};

function CookButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
    >
      <Check className="h-4 w-4" aria-hidden="true" />
      {pending ? "Updating..." : "Cooked"}
    </button>
  );
}

function SkipButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <SkipForward className="h-4 w-4" aria-hidden="true" />
      {pending ? "Skipping..." : "Skip"}
    </button>
  );
}

export default function MealPlanItemActions({
  itemId,
  status,
}: {
  itemId: string;
  status: "planned" | "cooked" | "skipped";
}) {
  const [cookState, cookAction] = useActionState(markMealPlanItemCookedAction, initialState);
  const [skipState, skipAction] = useActionState(skipMealPlanItemAction, initialState);
  const { addToast } = useToast();
  const isDone = status === "cooked" || status === "skipped";

  useEffect(() => {
    if (cookState.error) addToast(cookState.error, "error");
    if (cookState.message) addToast(cookState.message, cookState.success ? "success" : "info");
  }, [cookState, addToast]);

  useEffect(() => {
    if (skipState.error) addToast(skipState.error, "error");
    if (skipState.message) addToast(skipState.message, skipState.success ? "success" : "info");
  }, [skipState, addToast]);

  return (
    <div className="flex flex-wrap gap-2">
      <form action={cookAction}>
        <input type="hidden" name="itemId" value={itemId} />
        <CookButton disabled={isDone} />
      </form>
      <form action={skipAction}>
        <input type="hidden" name="itemId" value={itemId} />
        <SkipButton disabled={isDone} />
      </form>
    </div>
  );
}
