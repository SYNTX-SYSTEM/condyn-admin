import { GoogleGenAI } from "@google/genai";
import { sha256Utf8 } from "../hashing";
import { CapabilityKernelOutputSchema } from "../schema";
import { getGeminiCapabilityKernelResponseJsonSchema } from "./gemini-schema-projector";
import { CapabilityProviderResponseError, type CapabilityDiscoveryProvider, type CapabilityDiscoveryProviderRequest, type CapabilityDiscoveryProviderResult, type CapabilityProviderResponseRecord } from "./types";

export interface GeminiCapabilityDiscoveryProviderOptions { apiKey?: string; model: string; client?: { models: { generateContent(request: unknown): Promise<unknown> } }; now?: () => string; }
const GENERATION_PROFILE = { responseMimeType: "application/json", temperature: 0.1, maxOutputTokens: 32768 };
const copyUsage = (value: unknown): Record<string, unknown> | null => { try { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) as Record<string, unknown> : null; } catch { return null; } };

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
      let rawText: unknown; let extractionFailed = false;
      try { rawText = typeof (response as { text?: unknown }).text === "function" ? await ((response as { text: () => Promise<unknown> }).text()) : (response as { text?: unknown }).text; } catch { extractionFailed = true; }
      // Result Inspector: keep the received text unchanged (never the parsed object) plus the envelope as delivered,
      // also when the response is refused below (CapabilityProviderResponseError carries it, the code stays the same).
      const envelope = response as { modelVersion?: unknown; responseId?: unknown; usageMetadata?: unknown };
      const text = typeof rawText === "string" ? rawText : null;
      const providerResponse: CapabilityProviderResponseRecord = {
        text, textSha256: text === null ? null : sha256Utf8(text), finishReason: typeof finishReason === "string" ? finishReason : null,
        modelVersion: typeof envelope.modelVersion === "string" ? envelope.modelVersion : null,
        responseId: typeof envelope.responseId === "string" ? envelope.responseId : null,
        usageMetadata: copyUsage(envelope.usageMetadata),
        receivedAt: this.now()
      };
      const refuse = (): never => { throw new CapabilityProviderResponseError("ERR_CAPABILITY_DISCOVERY_STRUCTURED_OUTPUT_INVALID", providerResponse); };
      if (finishReason !== undefined && finishReason !== "STOP") refuse();
      // Unchanged semantics: a text accessor that throws is a provider failure, not a refused response.
      if (extractionFailed) throw new Error("text accessor failed");
      if (!text) refuse();
      let parsed: unknown; try { parsed = JSON.parse(text!); } catch { refuse(); }
      let kernelOutput; try { kernelOutput = CapabilityKernelOutputSchema.parse(parsed); } catch { return refuse(); }
      return { kernelOutput, providerResponse };
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("ERR_CAPABILITY_DISCOVERY_")) throw error;
      throw new Error("ERR_CAPABILITY_DISCOVERY_PROVIDER_FAILURE");
    }
  }
}
