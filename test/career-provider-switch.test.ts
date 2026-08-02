import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getCareerInferenceProvider } from "../lib/career/providers";
import { MockInferenceProvider } from "../lib/career/adapter";
import { GeminiProvider } from "../lib/career/providers/gemini";
import { OpenAIProvider } from "../lib/career/providers/openai";
import { AnthropicProvider } from "../lib/career/providers/anthropic";
import { POST } from "../app/api/career/analyze/route";

describe("CONDYN Career Analysis Protocol v1.0 - Step 9.4: Server-Side Provider Switch", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.USE_GEMINI_PROVIDER;
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("should return MockInferenceProvider by default when no API keys are present", () => {
    delete process.env.GEMINI_API_KEY;
    const provider = getCareerInferenceProvider();
    expect(provider).toBeInstanceOf(MockInferenceProvider);
  });

  it("should return GeminiProvider when USE_GEMINI_PROVIDER is 'true'", () => {
    process.env.USE_GEMINI_PROVIDER = "true";
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    const provider = getCareerInferenceProvider();
    expect(provider).toBeInstanceOf(GeminiProvider);
  });

  it("should return OpenAIProvider when OPENAI_API_KEY is present and USE_GEMINI_PROVIDER is not set", () => {
    delete process.env.USE_GEMINI_PROVIDER;
    process.env.OPENAI_API_KEY = "test-sk-key";
    const provider = getCareerInferenceProvider();
    expect(provider).toBeInstanceOf(OpenAIProvider);
  });

  it("should return AnthropicProvider when ANTHROPIC_API_KEY is present and USE_GEMINI_PROVIDER is not set", () => {
    delete process.env.USE_GEMINI_PROVIDER;
    delete process.env.OPENAI_API_KEY;
    process.env.ANTHROPIC_API_KEY = "test-sk-ant-key";
    const provider = getCareerInferenceProvider();
    expect(provider).toBeInstanceOf(AnthropicProvider);
  });

  it("should return structured error response with ERR_PROVIDER_FAILURE when GEMINI_API_KEY is missing during live provider execution", async () => {
    process.env.USE_GEMINI_PROVIDER = "true";
    delete process.env.GEMINI_API_KEY;

    const req = new Request("http://localhost:3000/api/career/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documents: [{ title: "Test Resume", content: "Valid resume text for failure testing." }]
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(503);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.status).toBe("FAILED");
    expect(body.issues).toBeDefined();
    expect(body.issues[0].code).toBe("ERR_PROVIDER_FAILURE");
    expect(body.issues[0].message).toContain("Missing GEMINI_API_KEY");
  });
});
