"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    cancelButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onCancel, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby={description ? "confirm-dialog-description" : undefined}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-rose-50 text-rose-700 ring-1 ring-rose-100">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="confirm-dialog-title" className="text-base font-semibold text-slate-950">
                {title}
              </h2>
              {description ? (
                <p id="confirm-dialog-description" className="mt-2 text-sm leading-6 text-slate-600">
                  {description}
                </p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close confirmation dialog"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
