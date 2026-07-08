import { EmbeddingProvider } from "./types";

/**
 * Deterministic Embedding Provider for CONDYN Career Intelligence System.
 * Generates stable, L2-normalized 768-dimensional semantic vectors using
 * token and character n-gram hash projections.
 * SOVEREIGNTY GUARANTEES:
 * 1. 100% deterministic: Identical text always yields identical vector.
 * 2. Semantically coherent: Texts with overlapping terms/n-grams have higher cosine similarity.
 * 3. Zero network/API dependency: Fast execution for unit tests and local/offline environments.
 */
export class DeterministicEmbeddingProvider implements EmbeddingProvider {
  readonly dimensions = 768;

  async generateEmbedding(text: string): Promise<number[]> {
    const vec = new Array<number>(this.dimensions).fill(0);
    const cleanText = (text || "").trim().toLowerCase();

    if (!cleanText) {
      return vec;
    }

    // 1. Word tokens
    const words = cleanText.split(/[\s,_.-]+/).filter(Boolean);
    for (const word of words) {
      const idx = this.hashString(word) % this.dimensions;
      vec[idx] += 1.5;
    }

    // 2. Character 3-grams for substring/semantic overlap
    for (let i = 0; i <= cleanText.length - 3; i++) {
      const trigram = cleanText.substring(i, i + 3);
      const idx = this.hashString(trigram) % this.dimensions;
      vec[idx] += 0.5;
    }

    // 3. L2 Normalization
    const sumSq = vec.reduce((acc, val) => acc + val * val, 0);
    const norm = Math.sqrt(sumSq);

    if (norm > 0) {
      for (let i = 0; i < this.dimensions; i++) {
        vec[i] /= norm;
      }
    }

    return vec;
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((t) => this.generateEmbedding(t)));
  }

  private hashString(str: string): number {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return Math.abs(hash);
  }
}
