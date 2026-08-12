/**
 * CONDYN CAREER ANALYSIS PROTOCOL v1.0
 * LLM OUTPUT ADAPTER & PROMPT BUILDER (`lib/career/adapter.ts`)
 * 
 * Status: TDD Step 4.1 & 4.2 Implemented, 4.3 Skeleton
 * Scope: Constructs canonical system prompt (8 Invariance Rules), inference provider contract, and output processor.
 */

import * as fs from "fs";
import * as path from "path";
import { validateCareerAnalysis, ValidationResult } from "./validator";
import { CanonicalCareerAnalysis } from "./schema";
import { ActivePromptResolver } from "./prompts/resolver";
import { SourceMetadata } from "./loaders/source";

export interface PromptMetadata {
  slug: string;
  templateId: string;
  versionId: string;
  checksum: string;
}

export interface PromptBuilderOutput {
  systemPrompt: string;
  userPrompt: string;
  promptMetadata?: PromptMetadata;
}

export interface DocumentInput {
  docId: string;
  title?: string;
  content: string;
  metadata?: SourceMetadata;
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
8. Invariance Rule 8: Strict JSON syntax & Universal Entity Grammar compliance. Output MUST be valid parseable JSON strictly adhering to the CanonicalCareerAnalysisSchema.
9. Invariance Rule 9: High-Density 12-Section Markdown Completeness. In report_markdown, cover all 12 analytical sections (Executive Summary, Consistency, Capabilities, Target Ecosystem, Opportunities, Strategies, etc.) with dense, analytical Markdown (2-4 paragraphs/bullet points per section). Keep prose concise and impactful so that all 12 sections and structured_data complete cleanly without token truncation.

=== CANONICAL JSON SCHEMA SKELETON & UNIVERSAL ENTITY GRAMMAR ===
Your output MUST exactly follow this structural schema without missing required fields:
{
  "$schema": "https://schema.condyn.eu/v1.0/career-analysis.json",
  "structured_data": {
    "analysis": {
      "metadata": {
        "analysis_id": "ANL_20260707_000001",
        "protocol_version": "1.0.0",
        "schema_version": "1.0.0",
        "prompt_contract_version": "PC-CONDYN-CAP-v1.0",
        "analysis_timestamp": "2026-07-07T00:00:00Z",
        "execution_duration_ms": 1000,
        "document_count": 1,
        "total_word_count": 100,
        "dominant_cluster_name": "Primary Domain Cluster",
        "overall_confidence": 0.95,
        "validation_state": "UNVERIFIED"
      },
      "pipeline": {
        "steps": [
          {
            "step_id": "STEP_1",
            "name": "documents_loaded",
            "started_at": "2026-07-07T00:00:00.000Z",
            "finished_at": "2026-07-07T00:00:01.000Z",
            "duration_ms": 1000,
            "status": "COMPLETED",
            "warnings": [],
            "errors": []
          }
        ]
      },
      "consistency": {
        "overall_cohesion_score": 0.95,
        "summary": "Cohesive document analysis.",
        "clusters": [
          {
            "cluster_id": "CLU_001",
            "name": "Primary Domain Cluster",
            "cohesion_score": 0.95,
            "doc_ids": ["DOC_001"]
          }
        ],
        "outlier_doc_ids": [],
        "contradictions": []
      },
      "documents": [
        {
          "entity_id": "DOC_001",
          "identity": { "type": "DOCUMENT", "name": "Document Title" },
          "properties": {
            "title": "Document Title",
            "author": "Author Name",
            "publication_date": "2026-01-01",
            "word_count": 100,
            "hash_sha256": "abcdef1234567890",
            "cluster_id": "CLU_001"
          },
          "relationships": [],
          "evidence": [
            {
              "doc_id": "DOC_001",
              "location": "Section 1",
              "context_quote": "Exact verbatim quote from text exceeding ten characters",
              "evidence_score": 0.95
            }
          ],
          "confidence": 0.95,
          "validation": { "status": "UNVERIFIED" }
        }
      ],
      "capabilities": [
        {
          "entity_id": "CAP_001",
          "identity": { "type": "CAPABILITY", "name": "Capability Name" },
          "properties": {
            "name": "Capability Name",
            "category": "TECHNICAL",
            "proficiency_level": 0.9,
            "years_experience": 5,
            "market_demand_index": 0.85
          },
          "relationships": [
            { "target_id": "DOC_001", "relation_type": "DERIVED_FROM", "weight": 0.95 }
          ],
          "evidence": [
            {
              "doc_id": "DOC_001",
              "location": "Section 1",
              "context_quote": "Exact verbatim quote supporting capability exceeding ten characters",
              "evidence_score": 0.95
            }
          ],
          "confidence": 0.95,
          "validation": { "status": "UNVERIFIED" }
        }
      ],
      "domains": [],
      "organization_classes": [],
      "organizations": [
        {
          "entity_id": "ORG_001",
          "identity": { "type": "ORGANIZATION", "name": "Example Org" },
          "properties": {
            "country_iso": "DE",
            "industry_enum": "TECHNOLOGY",
            "resonance_score": 0.95
          },
          "relationships": [],
          "evidence": [
            {
              "doc_id": "DOC_001",
              "location": "Section 1",
              "context_quote": "Verbatim evidence quote regarding organization exceeding ten characters",
              "evidence_score": 0.95
            }
          ],
          "confidence": 0.95,
          "validation": { "status": "UNVERIFIED" }
        }
      ],
      "roles": [
        {
          "entity_id": "ROL_001",
          "identity": { "type": "ROLE", "name": "Senior Architect" },
          "properties": {
            "seniority": "SENIOR",
            "domain_focus": "Cloud Architecture"
          },
          "relationships": [],
          "evidence": [
            {
              "doc_id": "DOC_001",
              "location": "Section 1",
              "context_quote": "Verbatim quote regarding role exceeding ten characters",
              "evidence_score": 0.95
            }
          ],
          "confidence": 0.95,
          "validation": { "status": "UNVERIFIED" }
        }
      ],
      "opportunities": [],
      "strategies": [],
      "search_queries": [
        {
          "entity_id": "QRY_001",
          "identity": { "type": "SEARCH_QUERY", "name": "Target Query" },
          "properties": {
            "title": "Query Title",
            "query": "exact search query string",
            "purpose": "Market Discovery",
            "target": "Enterprise Tier",
            "priority": "HIGH"
          },
          "relationships": [],
          "evidence": [
            {
              "doc_id": "DOC_001",
              "location": "Section 1",
              "context_quote": "Verbatim quote justifying query exceeding ten characters",
              "evidence_score": 0.95
            }
          ],
          "confidence": 0.95,
          "validation": { "status": "UNVERIFIED" }
        }
      ]
    },
    "presentation": {
      "semantic_graph": {
        "nodes": [
          { "node_id": "DOC_001", "entity_type": "DOCUMENT", "weight": 1.0 }
        ],
        "edges": [
          { "source_id": "DOC_001", "target_id": "CAP_001", "interaction_force": 0.85 }
        ]
      },
      "ui_layout": {
        "center_node_id": "DOC_001",
        "concentric_rings": [
          { "ring_index": 0, "name": "Core Identity", "node_ids": ["DOC_001"] },
          { "ring_index": 1, "name": "Domain Ecosystem", "node_ids": ["CAP_001"] }
        ],
        "color_tokens": { "primary": "#3B82F6", "secondary": "#10B981" }
      }
    }
  },
  "report_markdown": "# Career Analysis Report..."
}
CRITICAL RULES FOR ALL 9 DOMAIN ARRAYS:
1. Every entity in documents, capabilities, domains, organization_classes, organizations, roles, opportunities, strategies, and search_queries MUST provide all 7 cardinal properties:
   - entity_id: (e.g. DOC_001, CAP_001, ORG_001, ROL_001, QRY_001)
   - identity: MUST be an object with "type" and "name" (e.g. { "type": "CAPABILITY", "name": "Node.js" })
   - properties: domain specific properties (NOTE: organizations MUST have country_iso as 2-letter uppercase ISO like "DE", industry_enum, resonance_score. roles MUST have seniority, domain_focus. search_queries MUST have title, query, purpose, target, priority)
   - relationships: array of objects with target_id, relation_type, weight. IMPORTANT: relation_type MUST strictly be chosen from: "SUPPORTS", "REQUIRES", "RESONATES_WITH", "CONFLICTS_WITH", "DERIVED_FROM", "BELONGS_TO_CLASS", "ROLE_IN_ORGANIZATION". Never invent custom relation types!
   - evidence: array of objects with doc_id, location, context_quote, evidence_score. IMPORTANT: context_quote must be an exact verbatim sentence from the text exceeding 10 characters!
   - confidence: a decimal number between 0.0 and 1.0 (e.g. 0.95), NEVER an object!
   - validation: MUST be an object with status strictly set to "UNVERIFIED" (e.g. { "status": "UNVERIFIED" }).
2. Top-level structured_data MUST contain both "analysis" and "presentation". Do not omit "presentation".
   - In presentation.semantic_graph.edges, every edge MUST have source_id, target_id, and interaction_force (a decimal number between 0.0 and 1.0, e.g. 0.85).
   - In presentation.ui_layout.concentric_rings, every ring MUST have ring_index, name (a non-empty string e.g. "Core Identity" or "Strategic Horizon"), and node_ids (array of canonical IDs).
3. ROLE EXTRACTION RULE: A Role may only be emitted when the source contains sufficient evidence for both the Role itself AND the Organization context in which that Role exists.
   - If a Role is emitted, the referenced Organization MUST exist in the "organizations" array.
   - The Role MUST contain a "ROLE_IN_ORGANIZATION" relationship where "target_id" references that existing Organization entity.
   - Both Role and relationship MUST be grounded in source evidence.
   - If the source establishes a professional capability/title but DOES NOT establish an Organization: DO NOT invent or create a placeholder Organization, DO NOT emit an orphan Role, but DO retain any independently grounded capabilities normally.`;

  const documentSections = documents.map(doc => {
    const title = doc.title || "Untitled Document";
    return "--- DOCUMENT METADATA (ID: " + doc.docId + ", Title: " + title + ") ---\n" + doc.content;
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

/**
 * Builds the canonical prompt bundle optionally using an ActivePromptResolver to load
 * the active encrypted capability-deep-sweep prompt from the Prompt Registry.
 */
export async function buildCareerAnalysisPromptWithResolver(
  documents: DocumentInput[],
  resolver?: ActivePromptResolver,
  explicitKeyBase64?: string
): Promise<PromptBuilderOutput> {
  const baseBundle = buildCareerAnalysisPrompt(documents);

  if (!resolver) {
    return baseBundle;
  }

  const resolved = await resolver.resolveActivePrompt("capability-deep-sweep", explicitKeyBase64);

  return {
    systemPrompt: `${resolved.plainTextContent}\n\n${baseBundle.systemPrompt}`,
    userPrompt: baseBundle.userPrompt,
    promptMetadata: {
      slug: resolved.slug,
      templateId: resolved.templateId,
      versionId: resolved.versionId,
      checksum: resolved.checksum
    }
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
  constructor(private mockResponse?: string) {}

  async execute(prompt: PromptBuilderOutput): Promise<string> {
    if (!prompt.systemPrompt || !prompt.systemPrompt.trim() || !prompt.userPrompt || !prompt.userPrompt.trim()) {
      throw new Error("ERR_INVALID_PROMPT_BUNDLE: Both systemPrompt and userPrompt must be provided and non-empty.");
    }
    if (this.mockResponse) {
      return this.mockResponse;
    }
    // Read canonical gold case JSON string from disk as default fallback when omitted
    const goldPath = path.resolve(process.cwd(), "test/gold/case_001_minimal_valid/expected/expected.json");
    if (fs.existsSync(goldPath)) {
      return fs.readFileSync(goldPath, "utf-8");
    }
    throw new Error("ERR_MOCK_FALLBACK: Could not load gold case expected.json from " + goldPath);
  }
}

// ============================================================================
// STEP 4.3: LLM OUTPUT PROCESSOR & VALIDATOR PIPELINE
// ============================================================================

export function repairTruncatedJson(input: string): string {
  let str = input.trim();
  if (!str.startsWith("{")) {
    const firstBrace = str.indexOf("{");
    if (firstBrace !== -1) {
      str = str.substring(firstBrace);
    }
  }

  let inString = false;
  let isEscaped = false;
  const stack: ("{" | "[")[] = [];

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (isEscaped) {
      isEscaped = false;
      continue;
    }
    if (char === "\\") {
      isEscaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === "{") {
        stack.push("{");
      } else if (char === "[") {
        stack.push("[");
      } else if (char === "}") {
        if (stack.length > 0 && stack[stack.length - 1] === "{") {
          stack.pop();
        }
      } else if (char === "]") {
        if (stack.length > 0 && stack[stack.length - 1] === "[") {
          stack.pop();
        }
      }
    }
  }

  if (inString) {
    str += '"';
  }

  str = str.replace(/[,:]\s*$/g, "");

  while (stack.length > 0) {
    const container = stack.pop();
    if (container === "{") {
      str += "}";
    } else if (container === "[") {
      str += "]";
    }
  }

  return str;
}

export function processLlmOutput(rawOutput: string | unknown): ValidationResult<CanonicalCareerAnalysis> {
  const startTime = Date.now();
  let payload: unknown = rawOutput;

  if (typeof rawOutput === "string") {
    let cleanString = rawOutput.trim();

    // Try to extract JSON from markdown code block if wrapped (e.g. ```json ... ``` or ``` ... ```)
    const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
    const match = cleanString.match(codeBlockRegex);
    if (match && match[1]) {
      cleanString = match[1].trim();
    } else {
      // Extract between first { and end of text
      const firstBrace = cleanString.indexOf("{");
      if (firstBrace !== -1) {
        cleanString = cleanString.substring(firstBrace);
      }
    }

    try {
      payload = JSON.parse(cleanString);
    } catch (e) {
      // Attempt truncated JSON repair
      try {
        const repaired = repairTruncatedJson(cleanString);
        payload = JSON.parse(repaired);
      } catch (repairErr) {
        // [DIAGNOSTIC OBSERVABILITY] Capture bounded raw output for BUG 010 trace
        console.error("==================================================");
        console.error("BUG 010 DIAGNOSTIC: processLlmOutput JSON parse failed");
        console.error(`RAW OUTPUT LENGTH: ${rawOutput.length}`);
        console.error(`RAW PREFIX (800):\n${rawOutput.substring(0, 800)}`);
        console.error(`RAW SUFFIX (400):\n${rawOutput.substring(Math.max(0, rawOutput.length - 400))}`);
        console.error("==================================================");

        return {
          success: false,
          issues: [{
            code: "ERR_JSON_SYNTAX_INVALID",
            severity: "ERROR",
            message: `Failed to parse LLM JSON output: ${e instanceof Error ? e.message : String(e)}`
          }],
          metrics: {
            durationMs: Date.now() - startTime,
            errorCount: 1,
            warningCount: 0
          }
        };
      }
    }
  }

  if (typeof payload === "object" && payload !== null) {
    const p = payload as any;
    
    // Inject missing scopes that were omitted in GeminiInferenceSchema to satisfy Canonical schema
    if (p.structured_data?.analysis) {
      if (!p.structured_data.analysis.metadata) {
        p.structured_data.analysis.metadata = {
          analysis_id: `ANL_${new Date().toISOString().replace(/[-:TZs.]/g, '').substring(0, 14)}_${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
          protocol_version: "1.0",
          schema_version: "1.0",
          prompt_contract_version: "1.0"
        };
      }
      if (!p.structured_data.pipeline) {
        p.structured_data.pipeline = { steps: [] };
      }
    }
    if (p.structured_data && !p.structured_data.presentation) {
      p.structured_data.presentation = {
        semantic_graph: { nodes: [], edges: [] },
        ui_layout: {
          center_node_id: "ANL_UNKNOWN",
          concentric_rings: [],
          color_tokens: {}
        }
      };
    }
    
    // Fill validation properties on entities
    const domainArrays = [
      p.structured_data?.analysis?.documents,
      p.structured_data?.analysis?.capabilities,
      p.structured_data?.analysis?.domains,
      p.structured_data?.analysis?.organization_classes,
      p.structured_data?.analysis?.organizations,
      p.structured_data?.analysis?.roles,
      p.structured_data?.analysis?.opportunities,
      p.structured_data?.analysis?.strategies,
      p.structured_data?.analysis?.search_queries
    ];
    for (const arr of domainArrays) {
      if (Array.isArray(arr)) {
        arr.forEach(ent => {
          if (typeof ent === "object" && ent !== null && !ent.validation) {
            ent.validation = { status: "UNVERIFIED" };
          }
        });
      }
    }

    if (p.structured_data?.analysis?.metadata) {
      const currentId = p.structured_data.analysis.metadata.analysis_id;
      if (!currentId || currentId === "ANL_20260706_000001" || currentId.includes("000001")) {
        const uniqueId = `ANL_${new Date().toISOString().replace(/[-:TZs.]/g, '').substring(0, 14)}_${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        p.structured_data.analysis.metadata.analysis_id = uniqueId;
      }
    }
  }

  return validateCareerAnalysis(payload);
}


