"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import type { AIProviderStatus, AIProviderId, AiSettings } from "@/ai/types";
import { updateAiSettingsAction, type AiActionState } from "@/features/ai/actions";
import { DEFAULT_MODELS } from "@/ai/utils/models";
import { selectBestModel } from "@/ai/utils/selection";

const initialState: AiActionState = { success: false };

function getModelOptions(provider: AIProviderId, providers: AIProviderStatus[]) {
  const providerEntry = providers.find((entry) => entry.provider === provider);
  if (providerEntry?.models && providerEntry.models.length > 0) return providerEntry.models;
  return DEFAULT_MODELS.filter((model) => model.provider === provider);
}

export default function AiProviderSettings({ initialSettings }: { initialSettings: AiSettings }) {
  const { addToast } = useToast();
  const [state, formAction, isPending] = useActionState(updateAiSettingsAction, initialState);
  const [providers, setProviders] = useState<AIProviderStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AIProviderId>(initialSettings.provider);
  const [selectedModel, setSelectedModel] = useState<string>(initialSettings.model);
  const [enableStreaming, setEnableStreaming] = useState<boolean>(initialSettings.enableStreaming);

  const modelOptions = useMemo(
    () => getModelOptions(selectedProvider, providers),
    [selectedProvider, providers]
  );
  const selectedModelExists = modelOptions.some((model) => model.id === selectedModel);
  const effectiveSelectedModel = selectedModelExists ? selectedModel : modelOptions[0]?.id ?? selectedModel;

  useEffect(() => {
    if (state.error) addToast(state.error, "error");
    if (state.message) addToast(state.message, "success");
  }, [state, addToast]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/ai/status?models=1");
        const payload = (await response.json()) as { success: boolean; data?: { providers: AIProviderStatus[] } };
        if (payload.success && payload.data?.providers) {
          setProviders(payload.data.providers);
        }
      } catch {
        addToast("Unable to load AI provider status", "error");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [addToast]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/ai/status?models=1&refresh=1");
      const payload = (await response.json()) as { success: boolean; data?: { providers: AIProviderStatus[] } };
      if (payload.success && payload.data?.providers) {
        setProviders(payload.data.providers);
        addToast("Provider status refreshed", "success");
      }
    } catch {
      addToast("Unable to refresh provider status", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderChange = (provider: AIProviderId) => {
    const nextModels = getModelOptions(provider, providers);
    setSelectedProvider(provider);
    setSelectedModel((currentModel) =>
      nextModels.some((model) => model.id === currentModel) ? currentModel : nextModels[0]?.id ?? ""
    );
  };

  const handleTestLocal = async () => {
    const providerToTest: AIProviderId =
      selectedProvider === "ollama" || selectedProvider === "lmstudio" ? selectedProvider : "ollama";

    try {
      const response = await fetch("/api/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: providerToTest }),
      });
      const payload = (await response.json()) as {
        success: boolean;
        data?: { status?: AIProviderStatus };
        error?: string;
      };

      if (!payload.success) {
        addToast(payload.error ?? "Local AI test failed", "error");
        return;
      }

      const status = payload.data?.status;
      if (status?.available) {
        addToast(`${status.name} is online`, "success");
      } else {
        addToast(`${status?.name ?? "Local AI"} is unavailable`, "error");
      }
    } catch {
      addToast("Local AI test failed", "error");
    }
  };

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">AI provider</h2>
          <p className="mt-1 text-xs text-slate-500">
            Choose the AI engine for recipe generation. Local providers are prioritized for cost savings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTestLocal}
            className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300"
          >
            Test local connection
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300"
          >
            {isLoading ? "Refreshing..." : "Refresh status"}
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-slate-600">Provider</span>
          <select
            name="provider"
            value={selectedProvider}
            onChange={(event) => handleProviderChange(event.target.value as AIProviderId)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            {providers.length > 0
              ? providers.map((provider) => (
                  <option key={provider.provider} value={provider.provider}>
                    {provider.name}
                  </option>
                ))
              : [
                  "ollama",
                  "groq",
                  "openrouter",
                  "openai",
                  "huggingface",
                  "gemini",
                  "lmstudio",
                  "together",
                ].map((provider) => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-600">Model</span>
          <select
            name="model"
            value={effectiveSelectedModel}
            onChange={(event) => setSelectedModel(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            {modelOptions.length > 0 ? (
              modelOptions.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.label}
                </option>
              ))
            ) : (
              <option value="">No models found</option>
            )}
          </select>
          <button
            type="button"
            onClick={() => {
              const best = selectBestModel(modelOptions);
              if (best) setSelectedModel(best);
            }}
            className="mt-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            Auto-select best model
          </button>
        </label>
      </div>

      <label className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-4">
        <span>
          <span className="block text-sm font-semibold text-slate-950">Enable streaming</span>
          <span className="block text-sm text-slate-500">Stream partial results during recipe generation.</span>
        </span>
        <input
          name="enableStreaming"
          type="checkbox"
          checked={enableStreaming}
          onChange={(event) => setEnableStreaming(event.target.checked)}
          className="h-5 w-5 rounded border-slate-300 text-emerald-600"
        />
      </label>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Current selection</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {selectedProvider} / {effectiveSelectedModel}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Status</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {providers.length > 0 ? (
              providers.map((provider) => (
                <span
                  key={provider.provider}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    provider.available
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {provider.name}: {provider.available ? "online" : "offline"}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500">Status unavailable</span>
            )}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Saving..." : "Save AI settings"}
      </button>
    </form>
  );
}
