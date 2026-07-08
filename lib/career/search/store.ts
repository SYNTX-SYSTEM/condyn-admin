import {
  SemanticEntityRecord,
  SemanticSearchOptions,
  SemanticSearchResultItem
} from "./types";

/**
 * Canonical contract for semantic vector storage and similarity search.
 */
export interface SemanticSearchStore {
  upsert(record: SemanticEntityRecord): Promise<void>;
  search(
    vector: number[],
    options?: SemanticSearchOptions
  ): Promise<SemanticSearchResultItem[]>;
}

/**
 * Deterministic In-Memory Semantic Vector Store.
 * Performs exact cosine similarity calculation across stored embeddings.
 * Guaranteed fast (<10ms) execution for unit tests and offline/fallback environments.
 */
export class InMemorySemanticStore implements SemanticSearchStore {
  private records = new Map<string, SemanticEntityRecord>();

  async upsert(record: SemanticEntityRecord): Promise<void> {
    if (!record || !record.entityId) {
      throw new Error("ERR_INVALID_SEMANTIC_RECORD: entityId is required.");
    }
    this.records.set(record.entityId, {
      ...record,
      vector: [...record.vector]
    });
  }

  async search(
    queryVector: number[],
    options?: SemanticSearchOptions
  ): Promise<SemanticSearchResultItem[]> {
    const topK = options?.topK ?? 10;
    const minSim = options?.minSimilarity ?? 0.0;
    const targetType = options?.entityType;

    const queryNorm = this.l2Norm(queryVector);
    if (queryNorm === 0) {
      return [];
    }

    const results: SemanticSearchResultItem[] = [];

    for (const record of this.records.values()) {
      if (targetType && record.entityType !== targetType) {
        continue;
      }

      const recNorm = this.l2Norm(record.vector);
      if (recNorm === 0) {
        continue;
      }

      const dot = this.dotProduct(queryVector, record.vector);
      const similarityScore = dot / (queryNorm * recNorm);

      if (similarityScore >= minSim) {
        results.push({
          entityId: record.entityId,
          entityType: record.entityType,
          text: record.text,
          similarityScore,
          metadata: record.metadata
        });
      }
    }

    results.sort((a, b) => b.similarityScore - a.similarityScore);

    return results.slice(0, topK);
  }

  private dotProduct(a: number[], b: number[]): number {
    const len = Math.min(a.length, b.length);
    let sum = 0;
    for (let i = 0; i < len; i++) {
      sum += a[i] * b[i];
    }
    return sum;
  }

  private l2Norm(vec: number[]): number {
    let sumSq = 0;
    for (let i = 0; i < vec.length; i++) {
      sumSq += vec[i] * vec[i];
    }
    return Math.sqrt(sumSq);
  }
}
