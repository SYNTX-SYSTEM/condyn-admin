/**
 * Builds a VERIFIED `CanonicalCareerAnalysis` in the exact shape the Gemini pipeline stores
 * (`lib/career/schema.ts`: capabilities are Universal Entities whose name lives at
 * `identity.name`, with verbatim `evidence[].context_quote`). Derived from the gold case
 * `test/gold/case_001_minimal_valid` so that `validateCareerAnalysis` stamps it VERIFIED.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateCareerAnalysis } from "../../../lib/career/validator";
import type { VerifiedCareerAnalysis } from "../../../lib/career/types";

export interface CapabilitySpec {
  entityId: string;
  name: string;
  confidence: number;
  quote: string;
}

/** The capability set used against `validationPool`: EXACT, ALIAS, weak, token-containment, unrelated. */
export const validationCapabilities: CapabilitySpec[] = [
  { entityId: "CAP_PINK_EXACT", name: "Distributed Systems Architecture", confidence: 0.95, quote: "Architected distributed IIoT Edge Computing system for resilient operation" },
  { entityId: "CAP_PINK_ALIAS", name: "k8s", confidence: 0.9, quote: "Operated k8s clusters across three regions with GitOps" },
  { entityId: "CAP_PINK_WEAK", name: "Edge Computing", confidence: 0.45, quote: "Supported an edge computing pilot for two months" },
  { entityId: "CAP_PINK_UNRELATED", name: "Watercolour Painting", confidence: 0.8, quote: "Exhibited watercolour paintings at a local gallery" }
];

const goldPath = resolve(__dirname, "../../gold/case_001_minimal_valid/expected/canonical-expected.json");

export function buildVerifiedAnalysis(analysisId: string, capabilities: CapabilitySpec[] = validationCapabilities): VerifiedCareerAnalysis {
  const gold = JSON.parse(readFileSync(goldPath, "utf8"));
  const template = gold.structured_data.analysis.capabilities[0];
  const docId = template.evidence[0].doc_id;
  const analysis = structuredClone(gold);
  analysis.structured_data.analysis.metadata.analysis_id = analysisId;
  analysis.structured_data.analysis.capabilities = capabilities.map((spec) => ({
    ...structuredClone(template),
    entity_id: spec.entityId,
    identity: { ...template.identity, name: spec.name },
    relationships: [],
    confidence: spec.confidence,
    evidence: [{ ...structuredClone(template.evidence[0]), doc_id: docId, context_quote: spec.quote, evidence_score: spec.confidence }]
  }));
  // Entities elsewhere in the gold case reference CAP_001; relationships to a removed capability
  // must not survive, otherwise the validator rejects the DAG.
  const sections = ["domains", "organization_classes", "organizations", "roles", "opportunities", "strategies"];
  for (const section of sections) {
    for (const entity of analysis.structured_data.analysis[section] ?? []) {
      entity.relationships = (entity.relationships ?? []).filter((relation: { target_id: string }) => relation.target_id !== "CAP_001");
    }
  }
  const validation = validateCareerAnalysis(analysis);
  if (!validation.success) {
    throw new Error(`PINK analysis fixture is not VERIFIED: ${JSON.stringify((validation as { issues?: unknown }).issues ?? validation).slice(0, 800)}`);
  }
  return validation.data as VerifiedCareerAnalysis;
}
