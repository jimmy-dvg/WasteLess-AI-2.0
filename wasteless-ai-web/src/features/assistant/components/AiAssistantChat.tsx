"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Bot, Loader2, Send, ShoppingCart, Sparkles, UserRound } from "lucide-react";
import type {
  AssistantChatMessageInput,
  AssistantChatResponse,
  AssistantContextSummary,
} from "@/features/assistant/types";

type LocalChatMessage = AssistantChatMessageInput & {
  id: string;
  synthetic?: boolean;
  fallback?: boolean;
};

type AssistantApiResponse = {
  success: boolean;
  data?: AssistantChatResponse;
  error?: string;
  retryAfter?: number;
};

type AiAssistantChatProps = {
  initialContextSummary: AssistantContextSummary;
};

const QUICK_PROMPTS = [
  "Какво мога да сготвя днес?",
  "Кои продукти трябва да използвам първо?",
  "Добави мляко и яйца в списъка за пазаруване.",
  "Какво мога да направя с банани, които са презрели?",
];

function createMessage(role: LocalChatMessage["role"], content: string, extra: Partial<LocalChatMessage> = {}) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
    ...extra,
  } satisfies LocalChatMessage;
}

function getWelcomeMessage(summary: AssistantContextSummary) {
  const expiringText =
    summary.expiringCount > 0
      ? `${summary.expiringCount} expiring`
      : summary.expiredCount > 0
        ? `${summary.expiredCount} need checking`
        : "no urgent expirations";

  return createMessage(
    "assistant",
    `Ready. I see ${summary.inventoryCount} inventory items, ${expiringText}, and ${summary.shoppingItemCount} shopping items.`,
    { synthetic: true }
  );
}

export default function AiAssistantChat({ initialContextSummary }: AiAssistantChatProps) {
  const [contextSummary, setContextSummary] = useState(initialContextSummary);
  const [messages, setMessages] = useState<LocalChatMessage[]>(() => [getWelcomeMessage(initialContextSummary)]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState(QUICK_PROMPTS);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const requestMessages = useMemo(
    () =>
      messages
        .filter((message) => !message.synthetic)
        .map(({ role, content }) => ({ role, content })),
    [messages]
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  async function sendMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed || isSending) return;

    const userMessage = createMessage("user", trimmed);
    const nextMessages = [...requestMessages, { role: "user", content: trimmed } satisfies AssistantChatMessageInput].slice(-12);

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setError(null);
    setIsSending(true);

    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const payload = (await response.json()) as AssistantApiResponse;
      const data = payload.data;

      if (!response.ok || !payload.success || !data) {
        const retryMessage = payload.retryAfter ? ` Try again in ${payload.retryAfter}s.` : "";
        throw new Error(`${payload.error || "Assistant failed to respond."}${retryMessage}`);
      }

      setContextSummary(data.contextSummary);
      setSuggestions(data.suggestions.length > 0 ? data.suggestions : QUICK_PROMPTS);
      setMessages((current) => [
        ...current,
        createMessage("assistant", data.answer, { fallback: data.fallback }),
      ]);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Assistant failed to respond.");
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="flex min-h-[640px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <Bot className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-slate-950">WasteLessAI chat</h2>
              <p className="truncate text-xs text-slate-500">{contextSummary.aiProviderLabel}</p>
            </div>
          </div>
          <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {contextSummary.householdName}
          </span>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-slate-50/70 p-4 sm:p-5">
          {messages.map((message) => {
            const isUser = message.role === "user";

            return (
              <div key={message.id} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                {!isUser ? (
                  <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-600 text-white">
                    <Bot className="h-4 w-4" aria-hidden="true" />
                  </div>
                ) : null}
                <div
                  className={`max-w-[82%] rounded-lg px-4 py-3 text-sm leading-6 shadow-sm ${
                    isUser
                      ? "bg-emerald-600 text-white"
                      : "border border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  {message.fallback ? (
                    <p className="mt-2 text-xs font-semibold text-amber-700">Fallback answer</p>
                  ) : null}
                </div>
                {isUser ? (
                  <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-900 text-white">
                    <UserRound className="h-4 w-4" aria-hidden="true" />
                  </div>
                ) : null}
              </div>
            );
          })}

          {isSending ? (
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600 text-white">
                <Bot className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Thinking...
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-slate-200 bg-white p-4">
          {error ? (
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>{error}</p>
            </div>
          ) : null}

          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {suggestions.slice(0, 4).map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => void sendMessage(prompt)}
                disabled={isSending}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {prompt}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <label className="sr-only" htmlFor="assistant-message">
              Message
            </label>
            <textarea
              ref={inputRef}
              id="assistant-message"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              maxLength={2000}
              placeholder="Ask WasteLessAI..."
              className="min-h-12 flex-1 resize-none rounded-lg border border-slate-200 px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            <button
              type="submit"
              disabled={isSending || input.trim().length === 0}
              aria-label="Send message"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {isSending ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </form>
        </div>
      </section>

      <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-700">
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-950">Kitchen context</h2>
            <p className="text-xs text-slate-500">{contextSummary.householdName}</p>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-200 p-3">
            <dt className="text-xs font-semibold text-slate-500">Inventory</dt>
            <dd className="mt-1 text-2xl font-bold text-slate-950">{contextSummary.inventoryCount}</dd>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <dt className="text-xs font-semibold text-slate-500">Shopping</dt>
            <dd className="mt-1 text-2xl font-bold text-slate-950">{contextSummary.shoppingItemCount}</dd>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <dt className="text-xs font-semibold text-amber-700">Expiring</dt>
            <dd className="mt-1 text-2xl font-bold text-amber-900">{contextSummary.expiringCount}</dd>
          </div>
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
            <dt className="text-xs font-semibold text-rose-700">Expired</dt>
            <dd className="mt-1 text-2xl font-bold text-rose-900">{contextSummary.expiredCount}</dd>
          </div>
        </dl>

        <div className="mt-6 border-t border-slate-200 pt-5">
          <h3 className="text-sm font-semibold text-slate-950">Use first</h3>
          {contextSummary.priorityItems.length === 0 ? (
            <p className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">
              No urgent items right now.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {contextSummary.priorityItems.map((item) => (
                <li key={`${item.name}-${item.expirationDateLabel}`} className="rounded-lg border border-slate-200 px-3 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">{item.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.quantity}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-lg px-2 py-1 text-xs font-bold ${
                        item.status === "expired"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{item.expirationDateLabel}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
