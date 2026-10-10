import type { ExtractedCapabilityItem } from "./scoring";

/**
 * Candidate capability as the deterministic matchers consume it.
 *
 * A `CanonicalCareerAnalysis` capability is a UniversalEntity whose name lives at `identity.name`
 * and whose domain lives at `properties.category` (lib/career/schema.ts). Earlier matcher inputs used a
 * flat `{ name, domain, confidence }` shape; both shapes are accepted so existing callers keep working.
 */
export interface AnalysisCapabilityItem extends ExtractedCapabilityItem {
  entityId: string;
  evidence: Array<{ docId: string; quote: string }>;
}

export const DEFAULT_EXTRACTED_CONFIDENCE = 0.85;

const text = (value: unknown): string => (typeof value === "string" ? value : "");

export function extractCapabilityItem(raw: unknown, index = 0): AnalysisCapabilityItem {
  const cap = (raw && typeof raw === "object" ? raw : {}) as Record<string, any>;
  const identity = cap.identity && typeof cap.identity === "object" ? cap.identity : {};
  const properties = cap.properties && typeof cap.properties === "object" ? cap.properties : {};
  const name = text(identity.name) || text(cap.name) || text(cap.capability_name);
  const domain = text(properties.category) || text(properties.domain) || text(cap.domain);
  const evidence = Array.isArray(cap.evidence)
    ? cap.evidence
        .filter((item: any) => item && typeof item.context_quote === "string" && item.context_quote.length > 0)
        .map((item: any) => ({ docId: text(item.doc_id), quote: item.context_quote as string }))
    : [];
  return {
    entityId: text(cap.entity_id) || `CAPABILITY_INDEX_${index}`,
    name,
    domain,
    confidence: typeof cap.confidence === "number" ? cap.confidence : DEFAULT_EXTRACTED_CONFIDENCE,
    evidence
  };
}

/** Capabilities of one analysis payload, in payload order. Unnamed capabilities are dropped. */
export function extractAnalysisCapabilities(analysis: unknown): AnalysisCapabilityItem[] {
  const raw = (analysis as any)?.structured_data?.analysis?.capabilities;
  if (!Array.isArray(raw)) return [];
  return raw.map((cap, index) => extractCapabilityItem(cap, index)).filter(cap => cap.name.trim().length > 0);
}
