export interface EmbeddingProvider {
  /**
   * Generates a normalized floating-point vector embedding for a single text string.
   */
  generateEmbedding(text: string): Promise<number[]>;

  /**
   * Generates normalized floating-point vector embeddings for an array of text strings.
   */
  generateBatchEmbeddings(texts: string[]): Promise<number[][]>;

  /**
   * Vector dimension size produced by this provider (e.g., 768 or 1536).
   */
  readonly dimensions: number;
}
