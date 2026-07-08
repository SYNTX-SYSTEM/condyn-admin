import { InferenceProvider, MockInferenceProvider } from "../adapter";
import { GeminiProvider } from "./gemini";

export * from "./gemini";

/**
 * Server-Side Provider Factory/Resolver.
 * Dynamically resolves the configured inference provider based on environment variables.
 * When USE_GEMINI_PROVIDER="true", returns GeminiProvider (requiring GEMINI_API_KEY).
 * Otherwise defaults to MockInferenceProvider for deterministic offline verification and fallback.
 */
export function getCareerInferenceProvider(): InferenceProvider {
  if (process.env.USE_GEMINI_PROVIDER === "true") {
    return new GeminiProvider();
  }
  return new MockInferenceProvider();
}
