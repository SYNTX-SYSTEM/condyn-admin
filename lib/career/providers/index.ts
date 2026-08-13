import { InferenceProvider, MockInferenceProvider } from "../adapter";
import { GeminiProvider } from "./gemini";
import { OpenAIProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";

export * from "./gemini";
export * from "./openai";
export * from "./anthropic";

/**
 * Server-Side Provider Factory/Resolver.
 * Dynamically resolves the configured inference provider based on environment variables.
 * Priority:
 * 1. OpenAI (if USE_OPENAI_PROVIDER="true" or OPENAI_API_KEY is present)
 * 2. Anthropic (if USE_ANTHROPIC_PROVIDER="true" or ANTHROPIC_API_KEY is present)
 * 3. Gemini (if USE_GEMINI_PROVIDER="true" or GEMINI_API_KEY is present)
 * 4. Deterministic Mock Provider fallback for offline testing
 */
export function getCareerInferenceProvider(): InferenceProvider {
  if (process.env.USE_OPENAI_PROVIDER === "true" || (process.env.OPENAI_API_KEY && process.env.USE_GEMINI_PROVIDER !== "true")) {
    return new OpenAIProvider();
  }
  if (process.env.USE_ANTHROPIC_PROVIDER === "true" || process.env.ANTHROPIC_API_KEY) {
    return new AnthropicProvider();
  }
  if (process.env.USE_GEMINI_PROVIDER === "true" || process.env.GEMINI_API_KEY) {
    return new GeminiProvider();
  }
  return new MockInferenceProvider();
}
