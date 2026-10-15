import { GoogleGenAI } from "@google/genai";
import { sha256Utf8 } from "../hashing";
import { CapabilityKernelOutputSchema } from "../schema";
import { getGeminiCapabilityKernelResponseJsonSchema } from "./gemini-schema-projector";
import type { CapabilityDiscoveryProvider, CapabilityDiscoveryProviderRequest, CapabilityDiscoveryProviderResult, CapabilityProviderResponseRecord } from "./types";

export interface GeminiCapabilityDiscoveryProviderOptions { apiKey?: string; model: string; client?: { models: { generateContent(request: unknown): Promise<unknown> } }; now?: () => string; }
const GENERATION_PROFILE = { responseMimeType: "application/json", temperature: 0.1, maxOutputTokens: 32768 };

export class GeminiCapabilityDiscoveryProvider implements CapabilityDiscoveryProvider {
  readonly providerName = "gemini";
  readonly model: string;
  private readonly apiKey?: string;
  private readonly client?: GeminiCapabilityDiscoveryProviderOptions["client"];
  private readonly now: () => string;
  constructor(options: GeminiCapabilityDiscoveryProviderOptions) {
    if (!options.model?.trim()) throw new Error("ERR_CAPABILITY_DISCOVERY_MODEL_NOT_CONFIGURED");
    this.model = options.model; this.apiKey = options.apiKey ?? process.env.GEMINI_API_KEY; this.client = options.client; this.now = options.now ?? (() => new Date().toISOString());
  }
  async execute(request: CapabilityDiscoveryProviderRequest): Promise<CapabilityDiscoveryProviderResult> {
    if (!this.apiKey && !this.client) throw new Error("ERR_CAPABILITY_DISCOVERY_GEMINI_KEY_MISSING");
    try {
      const client = this.client ?? new GoogleGenAI({ apiKey: this.apiKey! });
      const response = await client.models.generateContent({ model: this.model, contents: `${request.systemPrompt}\n\n${request.userPrompt}`, config: { ...GENERATION_PROFILE, responseJsonSchema: getGeminiCapabilityKernelResponseJsonSchema() } });
      const finishReason = (response as { candidates?: Array<{ finishReason?: unknown }> }).candidates?.[0]?.finishReason;
      if (finishReason !== undefined && finishReason !== "STOP") throw new Error("ERR_CAPABILITY_DISCOVERY_STRUCTURED_OUTPUT_INVALID");
      const rawText = typeof (response as { text?: unknown }).text === "function" ? await ((response as { text: () => Promise<unknown> }).text()) : (response as { text?: unknown }).text;
      if (!rawText || typeof rawText !== "string") throw new Error("ERR_CAPABILITY_DISCOVERY_STRUCTURED_OUTPUT_INVALID");
      let parsed: unknown; try { parsed = JSON.parse(rawText); } catch { throw new Error("ERR_CAPABILITY_DISCOVERY_STRUCTURED_OUTPUT_INVALID"); }
      let kernelOutput; try { kernelOutput = CapabilityKernelOutputSchema.parse(parsed); } catch { throw new Error("ERR_CAPABILITY_DISCOVERY_STRUCTURED_OUTPUT_INVALID"); }
      // Result Inspector: keep the received text unchanged (never the parsed object) plus the envelope as delivered.
      const envelope = response as { modelVersion?: unknown; responseId?: unknown; usageMetadata?: unknown };
      const providerResponse: CapabilityProviderResponseRecord = {
        text: rawText, textSha256: sha256Utf8(rawText), finishReason: typeof finishReason === "string" ? finishReason : null,
        modelVersion: typeof envelope.modelVersion === "string" ? envelope.modelVersion : null,
        responseId: typeof envelope.responseId === "string" ? envelope.responseId : null,
        usageMetadata: envelope.usageMetadata && typeof envelope.usageMetadata === "object" ? JSON.parse(JSON.stringify(envelope.usageMetadata)) as Record<string, unknown> : null,
        receivedAt: this.now()
      };
      return { kernelOutput, providerResponse };
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("ERR_CAPABILITY_DISCOVERY_")) throw error;
      throw new Error("ERR_CAPABILITY_DISCOVERY_PROVIDER_FAILURE");
    }
  }
}
