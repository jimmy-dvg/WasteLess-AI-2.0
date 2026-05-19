import type { AITextResponse } from "@/ai/types";

export type SemanticCacheEntry = {
  key: string;
  prompt: string;
  response: AITextResponse;
  expiresAt: number;
};

export class SemanticCache {
  private entries: SemanticCacheEntry[] = [];
  private maxEntries: number;
  private threshold: number;
  private ttlMs: number;

  constructor(options: { maxEntries?: number; threshold?: number; ttlMs?: number }) {
    this.maxEntries = options.maxEntries ?? 200;
    this.threshold = options.threshold ?? 0.88;
    this.ttlMs = options.ttlMs ?? 10 * 60 * 1000;
  }

  get(prompt: string) {
    const normalized = normalize(prompt);
    const now = Date.now();
    this.entries = this.entries.filter((entry) => entry.expiresAt > now);

    let best: { score: number; entry: SemanticCacheEntry } | null = null;
    for (const entry of this.entries) {
      const score = similarity(normalized, entry.prompt);
      if (score >= this.threshold && (!best || score > best.score)) {
        best = { score, entry };
      }
    }

    return best?.entry.response ?? null;
  }

  set(prompt: string, response: AITextResponse) {
    const normalized = normalize(prompt);
    const entry: SemanticCacheEntry = {
      key: `${Date.now()}:${Math.random().toString(36).slice(2)}`,
      prompt: normalized,
      response,
      expiresAt: Date.now() + this.ttlMs,
    };

    this.entries.unshift(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.pop();
    }
  }
}

function normalize(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function similarity(a: string, b: string) {
  const tokensA = new Set(a.split(" ").filter(Boolean));
  const tokensB = new Set(b.split(" ").filter(Boolean));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) intersection += 1;
  }
  const union = new Set([...tokensA, ...tokensB]).size;
  return union === 0 ? 0 : intersection / union;
}
