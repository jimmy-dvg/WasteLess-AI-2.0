"use client";

import { useState } from "react";
import { Bot, Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";
import AiAssistantChat from "@/features/assistant/components/AiAssistantChat";
import type { AssistantContextSummary } from "@/features/assistant/types";

type FloatingAssistantChatProps = {
  initialContextSummary: AssistantContextSummary | null;
};

export default function FloatingAssistantChat({ initialContextSummary }: FloatingAssistantChatProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isAssistantPage = pathname?.startsWith("/dashboard/assistant");

  if (isAssistantPage) return null;

  return (
    <>
      {initialContextSummary ? (
        <div
          className={`fixed inset-x-3 bottom-20 z-50 h-[min(680px,calc(100vh-6rem))] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl sm:inset-x-auto sm:right-5 sm:w-[420px] ${
            open ? "block" : "hidden"
          }`}
        >
          <AiAssistantChat
            initialContextSummary={initialContextSummary}
            variant="compact"
            onClose={() => setOpen(false)}
          />
        </div>
      ) : null}

      {open && !initialContextSummary ? (
        <div className="fixed inset-x-3 bottom-20 z-50 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl sm:inset-x-auto sm:right-5 sm:w-[420px]">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                <Bot className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-950">WasteLessAI chat</h2>
                <p className="text-xs text-slate-500">Kitchen context</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="grid min-h-56 place-items-center px-6 py-8 text-center">
            <div>
              <Sparkles className="mx-auto h-6 w-6 text-emerald-600" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-slate-900">AI assistant is unavailable</p>
              <p className="mt-2 max-w-xs text-sm text-slate-500">
                Refresh the page or sign in again so WasteLessAI can load your kitchen context.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        title={open ? "Close AI assistant" : "Open AI assistant"}
        className="fixed bottom-5 right-5 z-50 inline-flex h-14 items-center gap-2 rounded-full bg-emerald-600 px-4 text-white shadow-lg shadow-emerald-900/20 ring-1 ring-emerald-500/40 transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200"
      >
        {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Bot className="h-5 w-5" aria-hidden="true" />}
        <span className="text-sm font-bold">{open ? "Close" : "AI Assistant"}</span>
        {!open ? <Sparkles className="h-4 w-4" aria-hidden="true" /> : null}
      </button>
    </>
  );
}
