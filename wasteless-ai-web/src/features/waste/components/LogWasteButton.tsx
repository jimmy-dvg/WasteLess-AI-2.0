"use client";

import { useRouter } from "next/navigation";
import { CircleMinus } from "lucide-react";
import { type FormEvent, useRef, useState, useTransition } from "react";
import { useToast } from "@/components/ui/Toast";
import { logProductWasteAction, type WasteActionState } from "@/features/waste/actions";
import { WASTE_REASONS } from "@/features/waste/constants";
import { formatQuantity } from "@/lib/dashboard-utils";

type LogWasteButtonProps = {
  productId: string;
  productName: string;
  quantity: string;
  unit: string | null;
  disabled?: boolean;
};

const initialState: WasteActionState = {
  success: false,
  message: null,
  error: null,
};

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
    >
      {pending ? "Logging..." : "Log waste"}
    </button>
  );
}

export default function LogWasteButton({
  productId,
  productName,
  quantity,
  unit,
  disabled = false,
}: LogWasteButtonProps) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<WasteActionState>(initialState);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const { addToast } = useToast();
  const availableQuantity = Number(quantity);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await logProductWasteAction(initialState, formData);
      setState(result);

      if (!result.success) {
        addToast(result.error ?? "Unable to log waste", "error");
        return;
      }

      if (result.message) addToast(result.message, "success");
      formRef.current?.reset();
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <CircleMinus className="h-4 w-4" aria-hidden="true" />
        Log waste
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close waste log dialog"
            className="absolute inset-0"
            onClick={() => setOpen(false)}
          />
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl"
          >
            <input type="hidden" name="productId" value={productId} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-normal text-rose-700">Waste log</p>
              <h2 className="mt-2 text-base font-semibold text-slate-950">{productName}</h2>
              <p className="mt-1 text-sm text-slate-500">Available: {formatQuantity(quantity, unit)}</p>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Quantity discarded</span>
                <input
                  name="quantity"
                  type="number"
                  min="0.01"
                  max={Number.isFinite(availableQuantity) ? quantity : undefined}
                  step="0.01"
                  defaultValue={quantity}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Reason</span>
                <select
                  name="reason"
                  defaultValue="expired"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                >
                  {WASTE_REASONS.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Notes</span>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="Optional context"
                  className="mt-1 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                />
              </label>
            </div>

            {state.error ? <p className="mt-4 text-sm font-medium text-rose-700">{state.error}</p> : null}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <SubmitButton pending={isPending} />
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
