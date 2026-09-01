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
  allowedDocIds?: string[];
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
2. Invariance Rule 2: Evidence Constraints. EVERY emitted semantic entity MUST contain at least one grounded evidence item from the supplied source documents. context_quote MUST be verbatim source text exceeding 10 characters. If no grounded evidence exists, OMIT THE ENTITY. Never emit an unsupported semantic entity.
3. Invariance Rule 3: Normalized score bounds exactly within closed interval [0.0, 1.0].
4. Invariance Rule 4: Universal Entity Grammar enforcement across all domain entities. Use only canonical relationship semantics ("SUPPORTS", "REQUIRES", "RESONATES_WITH", "CONFLICTS_WITH", "DERIVED_FROM", "BELONGS_TO_CLASS", "ROLE_IN_ORGANIZATION").
5. Invariance Rule 5: ROLE EXTRACTION RULE: A Role may only be emitted when the source contains sufficient evidence for both the Role itself AND the Organization context in which that Role exists.
   - If a Role is emitted, the referenced Organization MUST exist in the "entities" array.
   - The Role MUST contain a "ROLE_IN_ORGANIZATION" relationship where "target_id" references that existing Organization entity.
   - Both Role and relationship MUST be grounded in source evidence.
   - DO NOT invent or create a placeholder Organization.
   - DO NOT emit an orphan Role.
   - DO retain any independently grounded capabilities normally.
6. Invariance Rule 6: Schema Compliance. Return only the exact JSON inference data required by the schema. Do not generate pipeline stats, topological mappings, or timestamps.
7. Invariance Rule 7: Produce a concise analytical report_markdown based only on the evidence.
8. Invariance Rule 8: Strict JSON syntax & Universal Entity Grammar compliance. Output MUST be valid parseable JSON strictly adhering to the schema.
   - ALL entities must be emitted in the single "entities" array, discriminated by "entity_kind".
   - Inject required specialized canonical properties directly into the generic "properties" object of that entity.
   - If values cannot be grounded from evidence, DO NOT fabricate them. Omit the entity instead.
   - ORGANIZATION: properties MUST contain "country_iso", "industry_enum", and "resonance_score".
   - ORGANIZATION.country_iso MUST be ISO-3166-1 alpha-2: exactly 2 uppercase ASCII letters (examples: DE, US, CH). Country names are forbidden; alpha-3 codes are forbidden; lowercase is forbidden. If the country cannot be grounded from evidence, do not fabricate it; omit the ORGANIZATION entity.
   - ROLE: properties MUST contain "seniority" and "domain_focus".
   - SEARCH_QUERY: properties MUST contain "title", "query", "purpose", "target", and "priority".
   - Other entity kinds may use arbitrary grounded key/value properties through the generic catchall.`;

  const availableSources = documents.map(doc => `- ${doc.docId}: ${doc.title || "Untitled Document"}`).join("\n");
  const documentSections = documents.map(doc => {
    const title = doc.title || "Untitled Document";
    return "--- DOCUMENT METADATA (ID: " + doc.docId + ", Title: " + title + ") ---\n" + doc.content;
  }).join("\n\n");

  const userPrompt = `PROMPT CONTRACT: PC-CONDYN-CAP-v1.0
Protocol Version: v1.0
Schema Version: v1.0
Prompt Contract Version: PC-CONDYN-CAP-v1.0
Document Count: ${documents.length}

AVAILABLE SOURCE DOCUMENTS:
${availableSources}
Evidence must reference ONLY these exact IDs.

=== INPUT CORPUS ===
${documentSections}
====================

EXECUTION INSTRUCTIONS:
Analyze the input corpus above and generate the canonical Career Analysis Report according to PC-CONDYN-CAP-v1.0.
WICHTIG: Bitte ausschließlich valides JSON als Ausgabe liefern. Kein Markdown Code-Wrapper!
DO NOT wrap the output in \`\`\`json or any markdown block. Return ONLY the raw JSON object string starting with { and ending with }.`;

  return {
    systemPrompt,
    userPrompt,
    allowedDocIds: documents.map(d => d.docId)
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
    },
    allowedDocIds: baseBundle.allowedDocIds
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

export interface PipelineOrchestrationContext {
  analysis_id: string;
  execution_duration_ms?: number;
  document_count?: number;
  total_word_count?: number;
  pipeline_steps: any[];
  documents?: DocumentInput[];
}

export function processLlmInferenceOutput(rawOutput: string | unknown): { success: boolean, data?: any, issues?: any, metrics?: any } {
  const startTime = Date.now();
  let payload: unknown = rawOutput;

  if (typeof rawOutput === "string") {
    let cleanString = rawOutput.trim();

    // Try to extract JSON from markdown code block if wrapped
    const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
    const match = cleanString.match(codeBlockRegex);
    if (match && match[1]) {
      cleanString = match[1].trim();
    } else {
      const firstBrace = cleanString.indexOf("{");
      if (firstBrace !== -1) {
        cleanString = cleanString.substring(firstBrace);
      }
    }

    try {
      payload = JSON.parse(cleanString);
    } catch (e) {
      try {
        const repaired = repairTruncatedJson(cleanString);
        payload = JSON.parse(repaired);
      } catch (repairErr) {
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

  return { success: true, data: payload, metrics: { durationMs: Date.now() - startTime } };
}

export function assembleCanonicalCareerAnalysis(payload: any, context: PipelineOrchestrationContext): any {
  if (typeof payload === "object" && payload !== null) {
    const p = payload as any;
    
    // We construct the canonical output shape from the flattened inference shape
    const canonical = {
      report_markdown: p.report_markdown || "",
      structured_data: {
        analysis: {
          metadata: {
            analysis_id: context.analysis_id,
            protocol_version: "1.0",
            schema_version: "1.0",
            prompt_contract_version: "1.0",
            execution_duration_ms: context.execution_duration_ms,
            document_count: context.document_count,
            total_word_count: context.total_word_count
          },
          pipeline: { steps: context.pipeline_steps || [] },
          consistency: p.consistency || { overall_cohesion_score: 0.0, clusters: [], outlier_doc_ids: [], contradictions: [] },
          documents: [],
          capabilities: [],
          domains: [],
          organization_classes: [],
          organizations: [],
          roles: [],
          opportunities: [],
          strategies: [],
          search_queries: []
        },
        presentation: undefined
      }
    };

    // ────────────────────────────────────────────────────────
    // DETERMINISTIC CANONICAL PARTITION & RELATION INTEGRITY
    // ────────────────────────────────────────────────────────
    if (Array.isArray(p.entities)) {
      const entities = p.entities;
      const emittedIds = new Map<string, string>(); // raw entity_id -> entity_kind

      // Phase 1: Duplicate Detection
      for (const ent of entities) {
        if (!ent || typeof ent !== "object") continue;
        if (ent.entity_id) {
          if (emittedIds.has(ent.entity_id)) {
            throw new Error(`ERR_CANONICAL_ASSEMBLY_DUPLICATE_ENTITY_ID: duplicate entity_id ${ent.entity_id}`);
          }
          emittedIds.set(ent.entity_id, ent.entity_kind);
        }
      }

      // Phase 2: Establish runtime-owned source IDs and inject missing canonical DOCUMENTs (BUG010Q)
      const reservedDocIds = new Set<string>();
      if (context.documents) {
        for (const doc of context.documents) {
          if (doc.docId) {
            reservedDocIds.add(doc.docId);
            
            const wasEmitted = emittedIds.has(doc.docId);
            emittedIds.set(doc.docId, "DOCUMENT");
            
            if (!wasEmitted) {
              // Inject the missing canonical DOCUMENT from runtime context
              const runtimeDoc = {
                entity_kind: "DOCUMENT",
                entity_id: doc.docId,
                name: doc.title || doc.docId,
                identity: {
                  type: "DOCUMENT",
                  name: doc.title || doc.docId,
                  canonical_type: "DOCUMENT"
                },
                properties: {
                  raw_word_count: doc.content ? doc.content.split(/\s+/).length : 0
                },
                relationships: [],
                evidence: [],
                confidence: 1.0,
                validation: { status: "PASSED" }
              };
              entities.push(runtimeDoc as any);
            }
          }
        }
      }

      // Phase 3: Establish entity ID map
      const idMap = new Map<string, string>();
      const typeCounters = {
        DOCUMENT: 1, CAPABILITY: 1, DOMAIN: 1, ORGANIZATION_CLASS: 1,
        ORGANIZATION: 1, ROLE: 1, OPPORTUNITY: 1, STRATEGY: 1, SEARCH_QUERY: 1
      };
      const prefixMap: Record<string, string> = {
        DOCUMENT: "DOC", CAPABILITY: "CAP", DOMAIN: "DOM", ORGANIZATION_CLASS: "CLS",
        ORGANIZATION: "ORG", ROLE: "ROL", OPPORTUNITY: "OPP", STRATEGY: "STR", SEARCH_QUERY: "QRY"
      };

      for (const ent of entities) {
        if (!ent || typeof ent !== "object" || !ent.entity_id) continue;
        const kind = ent.entity_kind;

        if (kind === "DOCUMENT" && reservedDocIds.has(ent.entity_id)) {
          idMap.set(ent.entity_id, ent.entity_id);
          continue;
        }

        if (kind in typeCounters) {
          let nextNum = typeCounters[kind as keyof typeof typeCounters];
          let proposedId = `${prefixMap[kind]}_${String(nextNum).padStart(3, '0')}`;
          
          if (kind === "DOCUMENT") {
            while (reservedDocIds.has(proposedId)) {
              nextNum++;
              proposedId = `${prefixMap[kind]}_${String(nextNum).padStart(3, '0')}`;
            }
          }
          typeCounters[kind as keyof typeof typeCounters] = nextNum + 1;
          idMap.set(ent.entity_id, proposedId);
        } else {
          idMap.set(ent.entity_id, ent.entity_id);
        }
      }

      // Phase 4: Establish cluster ID map
      const clusterIdMap = new Map<string, string>();
      if (p.consistency && Array.isArray(p.consistency.clusters)) {
        let clusterCounter = 1;
        for (const c of p.consistency.clusters) {
          if (c.cluster_id) {
            clusterIdMap.set(c.cluster_id, `CLU_${String(clusterCounter).padStart(3, '0')}`);
            clusterCounter++;
          }
        }
      }

      // Phase 5: Structural normalization and raw relationship existence checks
      for (const ent of entities) {
        if (!ent || typeof ent !== "object") continue;
        
        if (ent.relationships === undefined || ent.relationships === null) {
          ent.relationships = [];
        }

        if (Array.isArray(ent.relationships)) {
          for (const rel of ent.relationships) {
            if (!rel.target_id) continue;
            
            if (!emittedIds.has(rel.target_id)) {
              throw new Error(`ERR_CANONICAL_ASSEMBLY_RELATION_TARGET_MISSING: target_id ${rel.target_id} not found`);
            }

            const targetKind = emittedIds.get(rel.target_id);
            if (rel.relation_type === "ROLE_IN_ORGANIZATION" && targetKind !== "ORGANIZATION") {
              throw new Error(`ERR_CANONICAL_ASSEMBLY_RELATION_KIND_MISMATCH: ROLE_IN_ORGANIZATION must target an ORGANIZATION, but got ${targetKind}`);
            }
          }
        }
      }

      // Phase 6: Rewrite references
      for (const ent of entities) {
        if (!ent || typeof ent !== "object") continue;
        
        if (ent.entity_id && idMap.has(ent.entity_id)) {
          ent.entity_id = idMap.get(ent.entity_id);
        }

        if (Array.isArray(ent.relationships)) {
          for (const rel of ent.relationships) {
            if (rel.target_id && idMap.has(rel.target_id)) {
              rel.target_id = idMap.get(rel.target_id);
            }
          }
        }

        if (Array.isArray(ent.evidence)) {
          for (const ev of ent.evidence) {
            if (ev.doc_id) {
              if (emittedIds.get(ev.doc_id) !== "DOCUMENT") {
                throw new Error(`ERR_CANONICAL_ASSEMBLY_DOCUMENT_REFERENCE_MISSING: evidence.doc_id ${ev.doc_id} does not reference a DOCUMENT`);
              }
              if (idMap.has(ev.doc_id)) {
                ev.doc_id = idMap.get(ev.doc_id);
              }
            }
          }
        }
      }

      if (p.consistency) {
        if (Array.isArray(p.consistency.clusters)) {
          for (const c of p.consistency.clusters) {
            if (c.cluster_id && clusterIdMap.has(c.cluster_id)) {
              c.cluster_id = clusterIdMap.get(c.cluster_id);
            }
            if (Array.isArray(c.doc_ids)) {
              c.doc_ids = c.doc_ids.map((d: string) => {
                if (emittedIds.get(d) !== "DOCUMENT") {
                  throw new Error(`ERR_CANONICAL_ASSEMBLY_DOCUMENT_REFERENCE_MISSING: cluster.doc_ids contains ${d} which is not a DOCUMENT`);
                }
                return idMap.has(d) ? idMap.get(d) : d;
              });
            }
          }
        }
        if (Array.isArray(p.consistency.outlier_doc_ids)) {
          p.consistency.outlier_doc_ids = p.consistency.outlier_doc_ids.map((d: string) => {
            if (emittedIds.get(d) !== "DOCUMENT") {
              throw new Error(`ERR_CANONICAL_ASSEMBLY_DOCUMENT_REFERENCE_MISSING: outlier_doc_ids contains ${d} which is not a DOCUMENT`);
            }
            return idMap.has(d) ? idMap.get(d) : d;
          });
        }
      }

      // Phase 7: Deterministic Partition & Identity Construction
      for (const ent of entities) {
        if (!ent || typeof ent !== "object") continue;

        ent.identity = {
          type: ent.entity_kind,
          name: ent.name,
          canonical_type: ent.entity_kind
        };
        if (ent.code) {
          ent.identity.code = ent.code;
        }
        
        ent.validation = { status: "UNVERIFIED" };

        switch (ent.entity_kind) {
          case "DOCUMENT": canonical.structured_data.analysis.documents.push(ent as never); break;
          case "CAPABILITY": canonical.structured_data.analysis.capabilities.push(ent as never); break;
          case "DOMAIN": canonical.structured_data.analysis.domains.push(ent as never); break;
          case "ORGANIZATION_CLASS": canonical.structured_data.analysis.organization_classes.push(ent as never); break;
          case "ORGANIZATION": canonical.structured_data.analysis.organizations.push(ent as never); break;
          case "ROLE": canonical.structured_data.analysis.roles.push(ent as never); break;
          case "OPPORTUNITY": canonical.structured_data.analysis.opportunities.push(ent as never); break;
          case "STRATEGY": canonical.structured_data.analysis.strategies.push(ent as never); break;
          case "SEARCH_QUERY": canonical.structured_data.analysis.search_queries.push(ent as never); break;
        }
      }
    }

    // Graph Projection (Deterministic)
    let centerNode = "";
    const domainArrays = [
      canonical.structured_data.analysis.documents,
      canonical.structured_data.analysis.capabilities,
      canonical.structured_data.analysis.domains,
      canonical.structured_data.analysis.organization_classes,
      canonical.structured_data.analysis.organizations,
      canonical.structured_data.analysis.roles,
      canonical.structured_data.analysis.opportunities,
      canonical.structured_data.analysis.strategies,
      canonical.structured_data.analysis.search_queries
    ];

    for (const arr of domainArrays) {
      if (arr.length > 0 && (arr[0] as any).entity_id) {
        centerNode = (arr[0] as any).entity_id;
        break;
      }
    }

    if (!centerNode) {
      throw new Error("ERR_CANONICAL_ASSEMBLY_EMPTY: No entities found to project center_node_id. Fabricating IDs is not allowed.");
    }

    canonical.structured_data.presentation = {
      semantic_graph: { nodes: [], edges: [] },
      ui_layout: {
        center_node_id: centerNode,
        concentric_rings: [],
        color_tokens: {}
      }
    } as any;

    return canonical;
  }

  return payload;
}

export function processLlmOutput(rawOutput: string | unknown, context?: PipelineOrchestrationContext): ValidationResult<CanonicalCareerAnalysis> {
  const inference = processLlmInferenceOutput(rawOutput);
  if (!inference.success) return inference as any;

  const ctx = context || {
    analysis_id: "ANL_TEST_DETERMINISTIC_ID",
    pipeline_steps: []
  };

  const canonicalCandidate = assembleCanonicalCareerAnalysis(inference.data, ctx);
  
  return validateCareerAnalysis(canonicalCandidate);
}

