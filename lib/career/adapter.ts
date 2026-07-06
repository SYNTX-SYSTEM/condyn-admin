/**
 * CONDYN CAREER ANALYSIS PROTOCOL v1.0
 * LLM OUTPUT ADAPTER & PROMPT BUILDER (`lib/career/adapter.ts`)
 * 
 * Status: TDD Step 4.1 Implemented (Prompt Builder)
 * Scope: Constructs canonical system prompt (8 Invariance Rules) and user prompt (document corpus & JSON constraints).
 */

export interface PromptBuilderOutput {
  systemPrompt: string;
  userPrompt: string;
}

export interface DocumentInput {
  docId: string;
  title?: string;
  content: string;
}

/**
 * Builds the canonical system and user prompts for the career analysis LLM execution.
 */
export function buildCareerAnalysisPrompt(documents: DocumentInput[]): PromptBuilderOutput {
  const systemPrompt = `CONDYN CAREER ANALYSIS PROTOCOL v1.0 - SYSTEM INSTRUCTIONS

You are a deterministic, enterprise-grade AI analysis engine for career and capability mapping.
You MUST adhere strictly to the following 8 canonical Invariance Rules:

1. Invariance Rule 1: No external assumptions / hallucination. Only derive entities, relationships, and evidence directly from the provided document corpus. Everything must be grounded in verbatim evidence.
2. Invariance Rule 2: Strict root bifurcation between structured_data and report_markdown. The report_markdown must contain a comprehensive human-readable analysis, while structured_data contains the exact computational representation.
3. Invariance Rule 3: Universal Entity Grammar enforcement across all domain entities. Every entity MUST implement the 7 cardinal properties: Identity -> Properties -> Relationships -> Evidence -> Confidence -> Validation.
4. Invariance Rule 4: Mandatory 12 analysis sections. The structured_data.analysis object MUST contain exactly 3 top-level objects (metadata, pipeline, consistency) and 9 top-level domain arrays (documents, capabilities, domains, organization_classes, organizations, roles, opportunities, strategies, search_queries).
5. Invariance Rule 5: Normalized score bounds exactly within closed interval [0.0, 1.0]. Never use integer percentages (e.g. use 0.94 instead of 94).
6. Invariance Rule 6: Canonical ID naming prefixes. All entity IDs must strictly follow canonical prefix conventions: DOC_, CLU_, CAP_, DOM_, CLS_, ORG_, ROL_, OPP_, STR_, QRY_.
7. Invariance Rule 7: Decoupled presentation topology. The presentation branch must contain read-only projection hints (semantic_graph vs ui_layout with concentric rings and priority groups) without inferring new business logic.
8. Invariance Rule 8: Strict JSON syntax & Universal Entity Grammar compliance. Output MUST be valid parseable JSON strictly adhering to the CanonicalCareerAnalysisSchema.`;

  const documentSections = documents.map(doc => {
    return `--- DOCUMENT METADATA (ID: ${doc.docId}, Title: ${doc.title || "Untitled Document"}) ---\n${doc.content}`;
  }).join("\n\n");

  const userPrompt = `PROMPT CONTRACT: PC-CONDYN-CAP-v1.0
Protocol Version: v1.0
Schema Version: v1.0
Prompt Contract Version: PC-CONDYN-CAP-v1.0
Document Count: ${documents.length}

=== INPUT CORPUS ===
${documentSections}
====================

EXECUTION INSTRUCTIONS:
Analyze the input corpus above and generate the canonical Career Analysis Report according to PC-CONDYN-CAP-v1.0.
WICHTIG: Bitte ausschließlich valides JSON als Ausgabe liefern. Kein Markdown Code-Wrapper!
DO NOT wrap the output in \`\`\`json or any markdown block. Return ONLY the raw JSON object string starting with { and ending with }.`;

  return {
    systemPrompt,
    userPrompt
  };
}

// ============================================================================
// STEP 4.2: INFERENCE PROVIDER ABSTRACTION CONTRACT
// ============================================================================

/**
 * Abstract inference provider contract ensuring model-agnostic execution.
 * Allows seamless substitution of Gemini, OpenAI, Claude, or local models.
 */
export interface InferenceProvider {
  /**
   * Executes the prompt bundle against the underlying LLM/Inference model.
   * Returns the raw unparsed string output from the model.
   */
  execute(prompt: PromptBuilderOutput): Promise<string>;
}

/**
 * A deterministic Mock Inference Provider for TDD and pipeline testing.
 * Returns a pre-configured raw string response without making external network calls.
 */
export class MockInferenceProvider implements InferenceProvider {
  constructor(private mockResponse: string) {}

  async execute(prompt: PromptBuilderOutput): Promise<string> {
    if (!prompt.systemPrompt || !prompt.systemPrompt.trim() || !prompt.userPrompt || !prompt.userPrompt.trim()) {
      throw new Error("ERR_INVALID_PROMPT_BUNDLE: Both systemPrompt and userPrompt must be provided and non-empty.");
    }
    return this.mockResponse;
  }
}

