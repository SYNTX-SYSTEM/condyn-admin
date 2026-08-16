export type MetricClass = 
  | "MODEL_INFERRED"
  | "DETERMINISTIC_DERIVED"
  | "OBSERVED"
  | "CONFIGURED";

export interface MetricProvenance {
  metricName: string;
  semanticDefinition: string;
  owner: string;
  classification: MetricClass;
  inputs: string[];
  derivation: string;
  value: number | null;
}

/**
 * Metric Registry enforcing explicit definitions for any number presented in CONDYN.
 */
export const CONDYN_METRICS = {
  OVERALL_COHESION: {
    metricName: "overall_cohesion_score",
    semanticDefinition: "A measure of semantic alignment and lack of contradictions across the entire canonical analysis.",
    owner: "Consistency Validator",
    classification: "MODEL_INFERRED" as MetricClass,
    inputs: ["documents"],
    derivation: "Extracted via LLM inference during consistency validation phase."
  },
  CAPABILITY_CONFIDENCE: {
    metricName: "capability_confidence",
    semanticDefinition: "The inference engine's certainty that a capability was correctly identified from the evidence.",
    owner: "Capability Extractor",
    classification: "MODEL_INFERRED" as MetricClass,
    inputs: ["evidence_quote"],
    derivation: "Extracted via LLM inference."
  },
  FIT_SCORE: {
    metricName: "fitScore",
    semanticDefinition: "A deterministic calculation of how well a candidate's capabilities satisfy a role's requirements.",
    owner: "Alignment Engine",
    classification: "DETERMINISTIC_DERIVED" as MetricClass,
    inputs: ["aligned_requirements", "missing_requirements"],
    derivation: "IMPLEMENTED"
  },
  EXPLAINABILITY_SCORE: {
    metricName: "explainabilityScore",
    semanticDefinition: "A measure of how deterministically traceable a recommendation or match is to original sources.",
    owner: "Proof Chain Engine",
    classification: "DETERMINISTIC_DERIVED" as MetricClass,
    inputs: ["proof_chain_depth", "evidence_count"],
    derivation: "IMPLEMENTED"
  }
};

/**
 * Validates a metric request.
 * If the metric is deterministic but has no derivation formula (e.g., UNSUPPORTED), it returns null.
 * Never manufacture a value merely because a consumer expects one.
 */
export function resolveMetric(metricKey: keyof typeof CONDYN_METRICS, rawValue?: number): MetricProvenance {
  const definition = CONDYN_METRICS[metricKey];
  
  if (definition.classification === "DETERMINISTIC_DERIVED" && definition.derivation === "UNSUPPORTED_PENDING_IMPLEMENTATION") {
    return { ...definition, value: null };
  }

  return { ...definition, value: rawValue ?? null };
}
