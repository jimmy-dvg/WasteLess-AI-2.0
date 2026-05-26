"use client";

import { type FormEvent, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { STORAGE_ORGANIZER_EXAMPLES } from "@/features/categories/constants";

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; retryAfter?: number };

type ProductStorageSuggestion = {
  productName: string;
  category: string;
  storageZone: string;
  confidence: number;
  reason: string;
  source: "ai" | "fallback";
};

export default function StorageSuggestionTool() {
  const [productName, setProductName] = useState("");
  const [suggestion, setSuggestion] = useState<ProductStorageSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  const requestSuggestion = async (name: string) => {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      addToast("Enter a product name first", "error");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/categories/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName: trimmedName }),
      });
      const payload = (await response.json()) as ApiResponse<ProductStorageSuggestion>;

      if (!payload.success) {
        addToast(payload.error || "Unable to suggest storage", "error");
        return;
      }

      setSuggestion(payload.data);
    } catch {
      addToast("Unable to suggest storage", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void requestSuggestion(productName);
  };

  const loadExample = (name: string) => {
    setProductName(name);
    void requestSuggestion(name);
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-slate-950">AI product organizer</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Suggest a practical category and storage zone before products are saved.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
        <label>
          <span className="text-xs font-semibold text-slate-600">Product</span>
          <input
            value={productName}
            onChange={(event) => setProductName(event.target.value)}
            placeholder="Greek yogurt"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300 md:w-auto"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
            Suggest
          </button>
        </div>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {STORAGE_ORGANIZER_EXAMPLES.map((example) => (
          <button
            key={example.product}
            type="button"
            onClick={() => loadExample(example.product)}
            disabled={isLoading}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {example.product}
          </button>
        ))}
      </div>

      {suggestion ? (
        <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-slate-950">
            {suggestion.productName} <span className="text-slate-400">-&gt;</span> {suggestion.category}{" "}
            <span className="text-slate-400">-&gt;</span> {suggestion.storageZone}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">{suggestion.reason}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="rounded-lg bg-white px-2 py-1 text-emerald-700 ring-1 ring-emerald-100">
              {Math.round(suggestion.confidence * 100)}% confidence
            </span>
            <span className="rounded-lg bg-white px-2 py-1 text-slate-600 ring-1 ring-slate-200">
              {suggestion.source === "ai" ? "AI suggestion" : "Rule-based fallback"}
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          AI suggestions will appear here before products are saved.
        </div>
      )}
    </section>
  );
}
