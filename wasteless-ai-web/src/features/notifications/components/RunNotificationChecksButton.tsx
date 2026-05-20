"use client";

import { RefreshCw } from "lucide-react";
import { useTransition } from "react";
import { useToast } from "@/components/ui/Toast";
import { runNotificationChecksAction } from "@/features/notifications/actions";

export default function RunNotificationChecksButton() {
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  const handleClick = () => {
    startTransition(async () => {
      const result = await runNotificationChecksAction();
      if (!result.success) {
        addToast(result.error ?? "Unable to run checks", "error");
        return;
      }
      addToast(result.message ?? "Notification checks complete.", "success");
    });
  };

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleClick}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} aria-hidden="true" />
      {isPending ? "Checking..." : "Run checks"}
    </button>
  );
}
