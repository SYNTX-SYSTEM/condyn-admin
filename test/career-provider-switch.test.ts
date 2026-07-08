import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getCareerInferenceProvider } from "../lib/career/providers";
import { MockInferenceProvider } from "../lib/career/adapter";
import { GeminiProvider } from "../lib/career/providers/gemini";
import { POST } from "../app/api/career/analyze/route";

describe("CONDYN Career Analysis Protocol v1.0 - Step 9.4: Server-Side Provider Switch", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("should return MockInferenceProvider by default when USE_GEMINI_PROVIDER is not 'true'", () => {
    delete process.env.USE_GEMINI_PROVIDER;
    const provider = getCareerInferenceProvider();
    expect(provider).toBeInstanceOf(MockInferenceProvider);
  });

  it("should return GeminiProvider when USE_GEMINI_PROVIDER is 'true'", () => {
    process.env.USE_GEMINI_PROVIDER = "true";
    const provider = getCareerInferenceProvider();
    expect(provider).toBeInstanceOf(GeminiProvider);
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
