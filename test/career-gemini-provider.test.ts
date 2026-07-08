import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GeminiProvider } from "../lib/career/providers/gemini";
import { PromptBuilderOutput } from "../lib/career/adapter";

// Mock @google/genai SDK completely
const mockGenerateContent = vi.fn();
vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: class MockGoogleGenAI {
      models = {
        generateContent: mockGenerateContent
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

  it("should build correct Gemini request passing systemPrompt to systemInstruction and userPrompt to contents", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: () => "{}"
    });

    const provider = new GeminiProvider();
    await provider.execute(samplePrompt);

    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    const callArgs = mockGenerateContent.mock.calls[0][0];

    expect(callArgs.contents).toBe(samplePrompt.userPrompt);
    expect(callArgs.config.systemInstruction).toBe(samplePrompt.systemPrompt);
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

  it("should cleanly encapsulate SDK and API errors into ERR_PROVIDER_FAILURE", async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error("HTTP 429 Too Many Requests - Quota exceeded"));

    const provider = new GeminiProvider();

    await expect(provider.execute(samplePrompt)).rejects.toThrow(/ERR_PROVIDER_FAILURE.*Quota exceeded/);
  });

  it("should throw ERR_PROVIDER_FAILURE if no API key is present in options or process.env", async () => {
    delete process.env.GEMINI_API_KEY;
    const provider = new GeminiProvider();

    await expect(provider.execute(samplePrompt)).rejects.toThrow(/ERR_PROVIDER_FAILURE.*Missing GEMINI_API_KEY/);
  });
});
