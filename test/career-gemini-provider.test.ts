import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GeminiProvider } from "../lib/career/providers/gemini";
import { PromptBuilderOutput } from "../lib/career/adapter";

// Mock @google/genai SDK completely
const mockGenerateContent = vi.fn();
const mockCountTokens = vi.fn().mockResolvedValue({ totalTokens: 12345 });
const mockGet = vi.fn().mockResolvedValue({ inputTokenLimit: 2000000, outputTokenLimit: 8192 });
vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: class MockGoogleGenAI {
      models = {
        generateContent: mockGenerateContent,
        countTokens: mockCountTokens,
        get: mockGet
      };
      constructor(options: any) {
        if (!options?.apiKey && !process.env.GEMINI_API_KEY) {
          // Emulate constructor behavior if desired or check in execute
        }
      }
    }
  };
});

describe("CONDYN Career Analysis Protocol v1.0 - Step 9: Gemini Inference Provider TDD", () => {
  const samplePrompt: PromptBuilderOutput = {
    systemPrompt: "CONDYN SYSTEM INSTRUCTIONS v1.0",
    userPrompt: "PROMPT CONTRACT: PC-CONDYN-CAP-v1.0\nAnalyze resume..."
  };

  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = "test-mock-api-key";
    delete process.env.GEMINI_MODEL;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("should implement InferenceProvider contract and resolve raw JSON string from generateContent", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: () => JSON.stringify({ structured_data: { analysis: {} } })
    });

    const provider = new GeminiProvider();
    const result = await provider.execute(samplePrompt);

    expect(typeof result).toBe("string");
    expect(result).toContain("structured_data");
  });

  it("should build correct Gemini request folding systemPrompt into initial contents and omit systemInstruction from config", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: () => "{}"
    });

    const provider = new GeminiProvider();
    await provider.execute(samplePrompt);

    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    const callArgs = mockGenerateContent.mock.calls[0][0];

    // Assert that the semantic system prompt is folded into contents
    expect(callArgs.contents).toContain(samplePrompt.systemPrompt);
    expect(callArgs.contents).toContain(samplePrompt.userPrompt);
    
    // Assert that the config no longer contains systemInstruction boundary
    expect(callArgs.config.systemInstruction).toBeUndefined();
  });

  it("should enforce structured JSON mode by setting responseMimeType to application/json", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: () => "{}"
    });

    const provider = new GeminiProvider();
    await provider.execute(samplePrompt);

    const callArgs = mockGenerateContent.mock.calls[0][0];
    expect(callArgs.config.responseMimeType).toBe("application/json");
  });

  it("should resolve model name from options, environment variable GEMINI_MODEL, or fallback default", async () => {
    mockGenerateContent.mockResolvedValue({
      text: () => "{}"
    });

    // 1. Default fallback
    const defaultProvider = new GeminiProvider();
    await defaultProvider.execute(samplePrompt);
    expect(mockGenerateContent.mock.calls[0][0].model).toBe("gemini-2.0-flash");

    // 2. Env variable override
    process.env.GEMINI_MODEL = "gemini-1.5-flash";
    const envProvider = new GeminiProvider();
    await envProvider.execute(samplePrompt);
    expect(mockGenerateContent.mock.calls[1][0].model).toBe("gemini-1.5-flash");

    // 3. Constructor option override
    const optProvider = new GeminiProvider({ model: "gemini-1.5-pro" });
    await optProvider.execute(samplePrompt);
    expect(mockGenerateContent.mock.calls[2][0].model).toBe("gemini-1.5-pro");
  });

  it("should cleanly encapsulate SDK and API errors into ERR_PROVIDER_FAILURE across cascade", async () => {
    mockGenerateContent.mockRejectedValue(new Error("HTTP 429 Too Many Requests - Quota exceeded"));

    const provider = new GeminiProvider();

    await expect(provider.execute(samplePrompt)).rejects.toThrow(/ERR_PROVIDER_FAILURE.*Quota exceeded/);
  });

  it("should throw ERR_PROVIDER_FAILURE if no API key is present in options or process.env", async () => {
    delete process.env.GEMINI_API_KEY;
    const provider = new GeminiProvider();

    await expect(provider.execute(samplePrompt)).rejects.toThrow(/ERR_PROVIDER_FAILURE.*Missing GEMINI_API_KEY/);
  });

  it("should automatically continue when finishReason is MAX_TOKENS and track telemetry", async () => {
    process.env.GEMINI_API_KEY = "test-mock-api-key";
    mockGenerateContent
      .mockResolvedValueOnce({
        text: () => '{"part1": "chunk1"',
        candidates: [{ finishReason: "MAX_TOKENS" }],
        usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 500 }
      })
      .mockResolvedValueOnce({
        text: ' "part2": "chunk2"}',
        candidates: [{ finishReason: "STOP" }],
        usageMetadata: { promptTokenCount: 120, candidatesTokenCount: 300 }
      });

    const provider = new GeminiProvider();
    const result = await provider.execute(samplePrompt);

    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    expect(result).toBe('{"part1": "chunk1"\n "part2": "chunk2"}');
    expect(provider.lastTelemetry).toBeDefined();
    expect(provider.lastTelemetry?.finishReason).toBe("STOP");
    expect(provider.lastTelemetry?.continuations).toBe(1);
  });

  it("clamps maxOutputTokens to 8192 for gemini-3.5-flash and diagnostic correctly reports it (BUG010E)", async () => {
    process.env.GEMINI_MAX_OUTPUT_TOKENS = "65536";
    
    // Reject to trigger the diagnostic formatter in the catch block
    mockGenerateContent.mockRejectedValueOnce({
      status: 400,
      code: "INVALID_ARGUMENT",
      message: "Simulated rejection."
    });

    const provider = new GeminiProvider({ model: "gemini-3.5-flash" });
    
    let caughtError: any = null;
    try {
      await provider.execute(samplePrompt);
    } catch (e) {
      caughtError = e;
    }

    // 1. Assert SDK actually received clamped value
    const callArgs = mockGenerateContent.mock.calls[0][0];
    expect(callArgs.config.maxOutputTokens).toBe(8192);

    // 2. Assert diagnostic formatter accurately reflects the clamped value
    const errorString = caughtError?.message || String(caughtError);
    expect(errorString).toContain("maxOutputTokens: 8192");
  });
});
