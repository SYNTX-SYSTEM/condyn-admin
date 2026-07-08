import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GeminiEmbeddingProvider } from "../lib/career/embeddings/gemini";

const mockEmbedContent = vi.fn();
vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: class MockGoogleGenAI {
      models = {
        embedContent: mockEmbedContent
      };
      constructor(options: any) {}
    }
  };
});

describe("CONDYN Career Analysis Protocol v1.0 — Step 21b: Server-Side GeminiEmbeddingProvider (`test/career-gemini-embedding-provider.test.ts`)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = "test-mock-embedding-key";
    delete process.env.GEMINI_EMBEDDING_MODEL;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("should implement EmbeddingProvider contract and return number[] vector", async () => {
    const mockVector = new Array(768).fill(0.1);
    mockEmbedContent.mockResolvedValueOnce({
      embedding: { values: mockVector }
    });

    const provider = new GeminiEmbeddingProvider();
    const vec = await provider.generateEmbedding("Senior Systems Architect");

    expect(Array.isArray(vec)).toBe(true);
    expect(vec).toHaveLength(768);
    expect(provider.dimensions).toBe(768);
  });

  it("should build correct Gemini request using default model text-embedding-004", async () => {
    const mockVector = new Array(768).fill(0.1);
    mockEmbedContent.mockResolvedValueOnce({
      embedding: { values: mockVector }
    });

    const provider = new GeminiEmbeddingProvider();
    await provider.generateEmbedding("Distributed Cloud");

    expect(mockEmbedContent).toHaveBeenCalledTimes(1);
    expect(mockEmbedContent.mock.calls[0][0].model).toBe("text-embedding-004");
    expect(mockEmbedContent.mock.calls[0][0].contents).toBe("Distributed Cloud");
  });

  it("should use env/constructor model override", async () => {
    const mockVector = new Array(1536).fill(0.05);
    mockEmbedContent.mockResolvedValue({
      embedding: { values: mockVector }
    });

    // 1. env override
    process.env.GEMINI_EMBEDDING_MODEL = "custom-embedding-model";
    const envProvider = new GeminiEmbeddingProvider();
    await envProvider.generateEmbedding("Test text");
    expect(mockEmbedContent.mock.calls[0][0].model).toBe("custom-embedding-model");

    // 2. constructor override
    const optProvider = new GeminiEmbeddingProvider({ model: "constructor-embedding-model" });
    await optProvider.generateEmbedding("Test text");
    expect(mockEmbedContent.mock.calls[1][0].model).toBe("constructor-embedding-model");
  });

  it("should support generateBatchEmbeddings preserving order", async () => {
    mockEmbedContent
      .mockResolvedValueOnce({ embedding: { values: [1, 0, 0] } })
      .mockResolvedValueOnce({ embedding: { values: [0, 1, 0] } });

    const provider = new GeminiEmbeddingProvider();
    const batch = await provider.generateBatchEmbeddings(["first text", "second text"]);

    expect(batch).toHaveLength(2);
    expect(batch[0]).toEqual([1, 0, 0]);
    expect(batch[1]).toEqual([0, 1, 0]);
  });

  it("should reject empty text input with ERR_EMBEDDING_PROVIDER_FAILURE", async () => {
    const provider = new GeminiEmbeddingProvider();
    await expect(provider.generateEmbedding("   ")).rejects.toThrow(/ERR_EMBEDDING_PROVIDER_FAILURE.*empty text/i);
  });

  it("should throw ERR_EMBEDDING_PROVIDER_FAILURE if missing API key", async () => {
    delete process.env.GEMINI_API_KEY;
    const provider = new GeminiEmbeddingProvider();

    await expect(provider.generateEmbedding("Valid text")).rejects.toThrow(
      /ERR_EMBEDDING_PROVIDER_FAILURE.*Missing GEMINI_API_KEY/
    );
  });

  it("should encapsulate SDK errors into ERR_EMBEDDING_PROVIDER_FAILURE", async () => {
    mockEmbedContent.mockRejectedValueOnce(new Error("API rate limit exceeded"));

    const provider = new GeminiEmbeddingProvider();
    await expect(provider.generateEmbedding("Rate limited text")).rejects.toThrow(
      /ERR_EMBEDDING_PROVIDER_FAILURE.*rate limit exceeded/
    );
  });
});
