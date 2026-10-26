import { GeminiProvider } from "../providers/gemini";
import type { RelationEngineIdentity, SemanticRelationProvider } from "./relation-cache";
import { SEMANTIC_RELATION_STATES } from "./relation-cache";

/** Gemini adapter for the existing immutable relation-cache contract. It never emits authority or a decision. */
export class GeminiSemanticRelationProvider implements SemanticRelationProvider {
  private readonly provider: GeminiProvider;
  constructor(options?: { apiKey?: string; model?: string }) { this.provider = new GeminiProvider({ apiKey: options?.apiKey, model: options?.model }); }
  async execute(input: { engine: RelationEngineIdentity; proposals: Array<{ name: string; scope: "ATOMIC" | "COMPOSITE"; structuralDefinition: string; evidence: Array<{ exactQuote: string; sourceDocumentId: string }> }>; requirements: Array<{ capability_name: string; aliases?: string[]; required_level: string; requirement_type?: string; domain?: string | null; necessity?: string | null }> }) {
    const raw = await this.provider.execute({
      systemPrompt: "Evaluate capability proposal to job requirement relations. Return JSON only. Never infer competence, authority, ranking, hiring, or a decision.",
      userPrompt: JSON.stringify({ contractVersion: input.engine.contractVersion, proposals: input.proposals, requirements: input.requirements, output: "array of {proposalName, requirementText, state, relationExplanation, evidenceLimitation, sourceEvidence:[{sourceDocumentId,exactQuote}], rawOutput}" })
    });
    let parsed: unknown; try { parsed = JSON.parse(raw); } catch { throw new Error("ERR_RELATION_PROVIDER_OUTPUT_INVALID"); }
    const items = Array.isArray(parsed) ? parsed : parsed && typeof parsed === "object" && Array.isArray((parsed as { relations?: unknown }).relations) ? (parsed as { relations: unknown[] }).relations : null;
    if (!items) throw new Error("ERR_RELATION_PROVIDER_OUTPUT_INVALID");
    return items.map(item => {
      if (!item || typeof item !== "object") throw new Error("ERR_RELATION_PROVIDER_OUTPUT_INVALID");
      const value = item as Record<string, unknown>;
      if (typeof value.proposalName !== "string" || typeof value.requirementText !== "string" || !SEMANTIC_RELATION_STATES.includes(value.state as never) || typeof value.relationExplanation !== "string" || typeof value.evidenceLimitation !== "string" || !Array.isArray(value.sourceEvidence)) throw new Error("ERR_RELATION_PROVIDER_OUTPUT_INVALID");
      return { proposalName: value.proposalName, requirementText: value.requirementText, state: value.state as (typeof SEMANTIC_RELATION_STATES)[number], relationExplanation: value.relationExplanation, evidenceLimitation: value.evidenceLimitation, sourceEvidence: value.sourceEvidence as Array<{ sourceDocumentId: string; exactQuote: string }>, rawOutput: raw };
    });
  }
}
