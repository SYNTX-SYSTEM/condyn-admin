import { UniversalEntity, CanonicalId } from "../schema";

export type ConvergenceDecision = 
  | "SAME_CAPABILITY"
  | "RELATED_CAPABILITY"
  | "DISTINCT_CAPABILITY"
  | "UNRESOLVED";

export interface ConvergenceResult {
  decision: ConvergenceDecision;
  reason: string;
}

/**
 * Deterministically evaluates two capability observations to determine 
 * if they are the exact same semantic identity.
 * 
 * Similarity is evidence of relation.
 * Similarity is not evidence of identity.
 */
export function evaluateCapabilityConvergence(
  capA: UniversalEntity,
  capB: UniversalEntity
): ConvergenceResult {
  const nameA = capA.identity.name.trim().toLowerCase();
  const nameB = capB.identity.name.trim().toLowerCase();

  if (nameA === nameB) {
    return { decision: "SAME_CAPABILITY", reason: "Exact semantic identity match" };
  }

  // Very basic heuristic for DISTINCT_CAPABILITY (Architecture vs Operations)
  if (
    (nameA.includes("architecture") && nameB.includes("operations")) ||
    (nameA.includes("operations") && nameB.includes("architecture"))
  ) {
    return { decision: "DISTINCT_CAPABILITY", reason: "Fundamentally distinct operational domains" };
  }

  return {
    decision: "UNRESOLVED",
    reason: "Lexical variation requires explicit taxonomy or LLM proposal validation"
  };
}

export function mergeConvergedCapabilities(
  primary: UniversalEntity,
  secondary: UniversalEntity
): UniversalEntity {
  const mergedEvidence = [...primary.evidence];

  for (const ev of secondary.evidence) {
    // Exact duplicate evidence rule: doc_id + location + context_quote
    const isDuplicate = mergedEvidence.some(
      existing => 
        existing.doc_id === ev.doc_id &&
        existing.location === ev.location &&
        existing.context_quote === ev.context_quote
    );

    if (!isDuplicate) {
      mergedEvidence.push(ev);
    }
  }

  return {
    ...primary,
    evidence: mergedEvidence,
    relationships: [...primary.relationships, ...secondary.relationships].filter(
      (v, i, a) => a.findIndex(t => t.target_id === v.target_id && t.relation_type === v.relation_type) === i
    )
  };
}
