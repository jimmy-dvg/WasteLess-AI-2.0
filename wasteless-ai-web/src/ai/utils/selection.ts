export function selectBestModel(models: Array<{ id: string; tags?: string[]; contextWindow?: number }>) {
  if (models.length === 0) return null;
  const withContext = models.filter((model) => model.contextWindow != null);
  if (withContext.length > 0) {
    return withContext.sort((a, b) => (b.contextWindow ?? 0) - (a.contextWindow ?? 0))[0].id;
  }

  const freeModels = models.filter((model) => model.tags?.includes("free"));
  if (freeModels.length > 0) return freeModels[0].id;

  return models[0].id;
}
