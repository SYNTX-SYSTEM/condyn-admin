import { GoogleGenAI } from "@google/genai";
import { EmbeddingProvider } from "./types";

export interface GeminiEmbeddingProviderOptions {
  apiKey?: string;
  model?: string;
}

/**
 * Server-Side Google Gemini Embedding Provider ("Dumb Consumer" boundary).
 * Implements canonical EmbeddingProvider contract without leaking SDK or API keys to client.
 * Strictly encapsulates network/API errors into structured ERR_EMBEDDING_PROVIDER_FAILURE codes.
 */
export class GeminiEmbeddingProvider implements EmbeddingProvider {
  private apiKey?: string;
  private model: string;
  private _dimensions: number = 768; // Default for text-embedding-004

  constructor(options?: GeminiEmbeddingProviderOptions) {
    this.apiKey = options?.apiKey || process.env.GEMINI_API_KEY;
    this.model = options?.model || process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004";
  }

  get dimensions(): number {
    return this._dimensions;
  }

  /**
   * Generates a normalized floating-point vector embedding for a single text string
   * via @google/genai SDK embedContent API.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const cleanText = (text || "").trim();
    if (!cleanText) {
      throw new Error("ERR_EMBEDDING_PROVIDER_FAILURE: Cannot generate embedding for empty text.");
    }

    const resolvedKey = this.apiKey || process.env.GEMINI_API_KEY;
    if (!resolvedKey) {
      throw new Error("ERR_EMBEDDING_PROVIDER_FAILURE: Missing GEMINI_API_KEY environment variable or constructor option.");
    }

    try {
      const ai = new GoogleGenAI({ apiKey: resolvedKey });

      const response = await ai.models.embedContent({
        model: this.model,
        contents: cleanText,
        config: {
          outputDimensionality: 768
        }
      });

      const values =
        (response as any)?.embeddings?.[0]?.values ||
        (response as any)?.embedding?.values ||
        (response as any)?.values;
      if (!values || !Array.isArray(values) || values.length === 0) {
        throw new Error("Empty or invalid embedding vector returned by Gemini API.");
      }

      this._dimensions = values.length;
      return values;
    } catch (err: any) {
      const errorMsg = err.message || String(err);
      if (errorMsg.startsWith("ERR_EMBEDDING_PROVIDER_FAILURE:")) {
        throw err;
      }
      throw new Error(`ERR_EMBEDDING_PROVIDER_FAILURE: Google Gemini embedding execution failed. Details: ${errorMsg}`);
    }
  }

  /**
   * Generates normalized vector embeddings for an array of text strings preserving order.
   */
  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
      results.push(await this.generateEmbedding(text));
    }
    return results;
  }
}
