import { GoogleGenAI } from "@google/genai";
import { CapabilityConvergenceOutputSchema } from "./schema";
import { getGeminiCapabilityConvergenceResponseJsonSchema } from "./gemini-schema-projector";
import type { CapabilityConvergenceProvider, CapabilityConvergenceProviderRequest, CapabilityConvergenceProviderResult } from "./types";

export interface GeminiCapabilityConvergenceProviderOptions { apiKey?: string; model: string; client?: { models: { generateContent(request: unknown): Promise<unknown> } }; }
const GENERATION_PROFILE = { responseMimeType: "application/json", temperature: 0.1, maxOutputTokens: 32768 };
export class GeminiCapabilityConvergenceProvider implements CapabilityConvergenceProvider {
  readonly providerName = "gemini"; readonly model: string; private readonly apiKey?: string; private readonly client?: GeminiCapabilityConvergenceProviderOptions["client"];
  constructor(options: GeminiCapabilityConvergenceProviderOptions) { if (!options.model?.trim()) throw new Error("ERR_CAPABILITY_CONVERGENCE_MODEL_NOT_CONFIGURED"); this.model = options.model; this.apiKey = options.apiKey ?? process.env.GEMINI_API_KEY; this.client = options.client; }
  async execute(request: CapabilityConvergenceProviderRequest): Promise<CapabilityConvergenceProviderResult> {
    if (!this.apiKey && !this.client) throw new Error("ERR_CAPABILITY_CONVERGENCE_GEMINI_KEY_MISSING");
    let response: unknown;
    try {
      const client = this.client ?? new GoogleGenAI({ apiKey: this.apiKey! });
      response = await client.models.generateContent({ model: this.model, contents: `${request.systemPrompt}\n\n${request.userPrompt}`, config: { ...GENERATION_PROFILE, responseJsonSchema: getGeminiCapabilityConvergenceResponseJsonSchema() } });
    } catch { throw new Error("ERR_CAPABILITY_CONVERGENCE_PROVIDER_FAILURE"); }
    const finishReason = (response as { candidates?: Array<{ finishReason?: unknown }> }).candidates?.[0]?.finishReason;
    if (finishReason !== undefined && finishReason !== "STOP") throw new Error("ERR_CAPABILITY_CONVERGENCE_STRUCTURED_OUTPUT_INVALID");
    let rawText: unknown;
    try { rawText = typeof (response as { text?: unknown }).text === "function" ? await ((response as { text: () => Promise<unknown> }).text()) : (response as { text?: unknown }).text; } catch { throw new Error("ERR_CAPABILITY_CONVERGENCE_PROVIDER_FAILURE"); }
    if (!rawText || typeof rawText !== "string") throw new Error("ERR_CAPABILITY_CONVERGENCE_STRUCTURED_OUTPUT_INVALID");
    let parsed: unknown; try { parsed = JSON.parse(rawText); } catch { throw new Error("ERR_CAPABILITY_CONVERGENCE_STRUCTURED_OUTPUT_INVALID"); }
    try { return { convergenceOutput: CapabilityConvergenceOutputSchema.parse(parsed) }; } catch { throw new Error("ERR_CAPABILITY_CONVERGENCE_STRUCTURED_OUTPUT_INVALID"); }
  }
}
