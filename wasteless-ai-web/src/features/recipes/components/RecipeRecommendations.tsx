"use client";

import { useState } from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import EmptyState from "@/components/dashboard/EmptyState";
import { useToast } from "@/components/ui/Toast";
import RecipeCard from "@/features/recipes/components/RecipeCard";
import RecipeCardSkeleton from "@/features/recipes/components/RecipeCardSkeleton";
import RecipePreferencesForm from "@/features/recipes/components/RecipePreferencesForm";
import type { RecipeListItem, RecipePreferences } from "@/types/recipes";
import type { AiSettings } from "@/ai/types";

type RecipeRecommendationsProps = {
  initialRecipes: RecipeListItem[];
  preferences: RecipePreferences;
  aiSettings: AiSettings;
};

type RecipeGenerationResponse = {
  recipes: RecipeListItem[];
  summary?: string | null;
  pantryStaples?: string[];
  cached?: boolean;
};

function parseSseEvent(chunk: string) {
  let event = "message";
  let data = "";
  chunk
    .split("\n")
    .map((line) => line.trim())
    .forEach((line) => {
      if (line.startsWith("event:")) {
        event = line.replace("event:", "").trim();
      }
      if (line.startsWith("data:")) {
        data += line.replace("data:", "").trim();
      }
    });

  if (!data) return null;

  try {
    return { event, data: JSON.parse(data) as Record<string, unknown> };
  } catch {
    return null;
  }
}

export default function RecipeRecommendations({ initialRecipes, preferences, aiSettings }: RecipeRecommendationsProps) {
  const [recipes, setRecipes] = useState<RecipeListItem[]>(initialRecipes);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [includeExpired, setIncludeExpired] = useState(false);
  const [inventoryOnly, setInventoryOnly] = useState(false);
  const [regeneratingRecipeId, setRegeneratingRecipeId] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [pantryStaples, setPantryStaples] = useState<string[]>([]);
  const [streamPreview, setStreamPreview] = useState<string>("");
  const { addToast } = useToast();

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStatusMessage(inventoryOnly ? "Finding recipes from current inventory..." : "Starting recommendations...");
    setSummary(null);
    setPantryStaples([]);
    setStreamPreview("");

    try {
      const response = await fetch(`/api/recipes/generate?stream=${aiSettings.enableStreaming ? "1" : "0"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxRecipes: 3, includeExpired, inventoryOnly }),
      });

      if (response.headers.get("content-type")?.includes("text/event-stream")) {
        const reader = response.body?.getReader();
        if (!reader) throw new Error("Streaming not supported");
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";

          parts.forEach((part) => {
            const parsed = parseSseEvent(part);
            if (!parsed) return;
            if (parsed.event === "status") {
              setStatusMessage(String(parsed.data.message ?? "Working..."));
            }
            if (parsed.event === "token") {
              const token = String(parsed.data.token ?? "");
              setStreamPreview((prev) => `${prev}${token}`.slice(-2000));
            }
            if (parsed.event === "error") {
              setStatusMessage(null);
              setIsGenerating(false);
              addToast(String(parsed.data.message ?? "Unable to generate recipes"), "error");
            }
            if (parsed.event === "rate_limit") {
              const retryAfter = parsed.data.retryAfter ? Number(parsed.data.retryAfter) : null;
              setStatusMessage(null);
              setIsGenerating(false);
              addToast(
                retryAfter
                  ? `Rate limit reached. Try again in ${retryAfter}s.`
                  : "Rate limit reached. Try again soon.",
                "error"
              );
            }
            if (parsed.event === "result") {
              const result = parsed.data as RecipeGenerationResponse;
              setRecipes(result.recipes || []);
              setSummary(result.summary ?? null);
              setPantryStaples(result.pantryStaples ?? []);
              setStatusMessage(null);
              setIsGenerating(false);
              addToast(result.cached ? "Loaded cached recipes." : "New recipes ready!", "success");
            }
          });
        }

        return;
      }

      const payload = (await response.json()) as RecipeGenerationResponse & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to generate recipes");
      }

      setRecipes(payload.recipes || []);
      setSummary(payload.summary ?? null);
      setPantryStaples(payload.pantryStaples ?? []);
      addToast(payload.cached ? "Loaded cached recipes." : "New recipes ready!", "success");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Unable to generate recipes", "error");
    } finally {
      setIsGenerating(false);
      setStatusMessage(null);
    }
  };

  const handleRegenerateRecipe = async (recipe: Pick<RecipeListItem, "id" | "title">) => {
    setRegeneratingRecipeId(recipe.id);
    setStatusMessage(`Trying another option instead of ${recipe.title}...`);

    try {
      const excludedRecipeTitles = Array.from(new Set([recipe.title, ...recipes.map((item) => item.title)]));
      const response = await fetch("/api/recipes/generate?stream=0", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maxRecipes: 1,
          includeExpired,
          inventoryOnly,
          excludedRecipeTitles,
        }),
      });

      const payload = (await response.json()) as RecipeGenerationResponse & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to generate another recipe");
      }

      const replacement = payload.recipes?.[0];
      if (!replacement) {
        throw new Error("No replacement recipe was generated");
      }

      setRecipes((current) => current.map((item) => (item.id === recipe.id ? replacement : item)));
      setSummary(payload.summary ?? null);
      setPantryStaples(payload.pantryStaples ?? []);
      addToast(payload.cached ? "Loaded a cached alternative." : "New alternative ready.", "success");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Unable to generate another recipe", "error");
    } finally {
      setRegeneratingRecipeId(null);
      setStatusMessage(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI recipes"
        description="Recipe recommendations built around expiring ingredients and pantry staples."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {aiSettings.provider} / {aiSettings.model}
            </span>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={includeExpired}
                onChange={(event) => setIncludeExpired(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200"
              />
              Include expired items
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={inventoryOnly}
                onChange={(event) => setInventoryOnly(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200"
              />
              Only current inventory
            </label>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isGenerating ? "Generating..." : "Generate recipes"}
            </button>
          </div>
        }
      />

      {statusMessage ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {statusMessage}
        </div>
      ) : null}

      {isGenerating && streamPreview ? (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
          <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">Live output</p>
          <p className="mt-2 whitespace-pre-wrap text-xs text-slate-600">{streamPreview}</p>
        </div>
      ) : null}

      {summary ? (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-800">
          {summary}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
        <div className="space-y-4">
          {pantryStaples.length > 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-600 shadow-sm">
              <p className="text-xs uppercase tracking-normal text-slate-500">Pantry staples used</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {pantryStaples.map((item) => (
                  <span key={item} className="rounded-full bg-slate-100 px-2.5 py-1">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {recipes.length === 0 && !isGenerating ? (
            <EmptyState
              title="No recipe recommendations yet"
              description="Add inventory items so WasteLessAI can recommend recipes that use what is already in your kitchen."
            />
          ) : null}

          {isGenerating ? (
            <section className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <RecipeCardSkeleton key={index} />
              ))}
            </section>
          ) : null}

          {recipes.length > 0 ? (
            <section className="grid gap-4 md:grid-cols-2">
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  isRegenerating={regeneratingRecipeId === recipe.id}
                  onRegenerate={handleRegenerateRecipe}
                />
              ))}
            </section>
          ) : null}
        </div>

        <RecipePreferencesForm initialPreferences={preferences} />
      </div>
    </div>
  );
}
