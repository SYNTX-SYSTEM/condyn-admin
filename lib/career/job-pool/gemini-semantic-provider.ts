import { GoogleGenAI } from "@google/genai";
import type { RelationEngineIdentity } from "./relation-cache";
import { StandInSemanticProvider, type ProviderRequest, type SemanticProvider } from "./semantic-relation-engine";
import { GEMINI_SEMANTIC_PROMPT } from "./semantic-prompt";

export { GEMINI_SEMANTIC_PROMPT };
/** One call may not hold a role (and the run) for ever: after this the call fails with a code and the budget unit is released. */
export const GEMINI_SEMANTIC_TIMEOUT_MS = 120_000;

/**
 * The real semantic provider (stage 3), behind the unchanged `SemanticProvider` seam: one request is one generateContent call, the
 * received text goes back unchanged and is judged only by the strict admission of the engine (claim guard included). The key is
 * read at construction and never appears in an error, a log or a stored row. Every failure is a code, never a message of the SDK.
 */
export interface GeminiSemanticProviderOptions { model: string; apiKey?: string; client?: { models: { generateContent(request: unknown): Promise<unknown> } } }

export class GeminiSemanticProvider implements SemanticProvider {
  readonly identity: { provider: string; model: string };
  private readonly apiKey: string | undefined;
  private readonly client: GeminiSemanticProviderOptions["client"];
  constructor(options: GeminiSemanticProviderOptions) {
    if (!options.model?.trim()) throw new Error("ERR_SEMANTIC_PROVIDER_MODEL_NOT_CONFIGURED");
    this.identity = { provider: "gemini", model: options.model };
    this.apiKey = options.apiKey?.trim() || undefined;
    this.client = options.client;
  }
  async evaluate(request: ProviderRequest): Promise<{ rawText: string }> {
    if (!this.apiKey && !this.client) throw new Error("ERR_SEMANTIC_PROVIDER_KEY_MISSING");
    let text: unknown; let finishReason: unknown;
    try {
      const client = this.client ?? new GoogleGenAI({ apiKey: this.apiKey!, httpOptions: { timeout: GEMINI_SEMANTIC_TIMEOUT_MS } });
      const response = await client.models.generateContent({
        model: this.identity.model,
        contents: `${GEMINI_SEMANTIC_PROMPT}\n\n${JSON.stringify({ proposals: request.proposals, requirements: request.requirements })}`,
        config: { responseMimeType: "application/json", temperature: 0.1, maxOutputTokens: 32768 }
      }) as { text?: unknown; candidates?: Array<{ finishReason?: unknown }> };
      finishReason = response.candidates?.[0]?.finishReason;
      text = typeof response.text === "function" ? await (response.text as () => Promise<unknown>)() : response.text;
    } catch {
      throw new Error("ERR_SEMANTIC_PROVIDER_FAILED");
    }
    if (finishReason !== undefined && finishReason !== "STOP") throw new Error("ERR_SEMANTIC_PROVIDER_INCOMPLETE");
    if (typeof text !== "string" || text.trim() === "") throw new Error("ERR_SEMANTIC_PROVIDER_EMPTY");
    return { rawText: text };
  }
}

/** The one place that turns a configured engine into a provider (route and automatic run); an engine nobody authorised is refused. */
export function createSemanticProvider(engine: RelationEngineIdentity, environment: Record<string, string | undefined> = process.env): SemanticProvider {
  if (engine.provider === "stand-in") return new StandInSemanticProvider();
  if (engine.provider === "gemini") {
    if (!environment.GEMINI_API_KEY?.trim()) throw new Error("ERR_SEMANTIC_PROVIDER_KEY_MISSING");
    return new GeminiSemanticProvider({ model: engine.model, apiKey: environment.GEMINI_API_KEY });
  }
  throw new Error("ERR_SEMANTIC_PROVIDER_NOT_AUTHORIZED");
}
