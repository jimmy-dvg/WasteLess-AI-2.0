import type { AIEmbeddingResponse } from "@/ai/types";

export type VectorMemoryEntry = {
  id: string;
  vector: number[];
  text?: string;
  metadata?: Record<string, unknown>;
};

export type VectorQueryResult = {
  entry: VectorMemoryEntry;
  score: number;
};

export class LocalVectorMemory {
  private entries: VectorMemoryEntry[] = [];

  add(entry: VectorMemoryEntry) {
    this.entries.push(entry);
  }

  addFromEmbedding(embedding: AIEmbeddingResponse, text?: string, metadata?: Record<string, unknown>) {
    this.entries.push({
      id: `${embedding.provider}:${embedding.model}:${Date.now()}`,
      vector: embedding.vector,
      text,
      metadata,
    });
  }

  query(vector: number[], topK = 5, minScore = 0.78): VectorQueryResult[] {
    const results = this.entries
      .map((entry) => ({ entry, score: cosineSimilarity(vector, entry.vector) }))
      .filter((result) => result.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return results;
  }
}

function cosineSimilarity(a: number[], b: number[]) {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
