import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const SAMPLE_POOL_PATH = resolve(__dirname, "../../../docs/examples/job-pool.sample.json");
export const samplePoolText = () => readFileSync(SAMPLE_POOL_PATH, "utf8");
export const samplePool = () => JSON.parse(samplePoolText());

/** One canonical-shape capability entity (UniversalEntity: name at identity.name, domain at properties.category). */
export function capabilityEntity(id: string, name: string, confidence: number, quote: string, category = "Engineering") {
  return {
    entity_id: id,
    identity: { type: "CAPABILITY", name },
    properties: { category },
    relationships: [],
    evidence: [{ doc_id: "DOC_001", location: "page 1", context_quote: quote, evidence_score: confidence }],
    confidence,
    validation: { status: "VALID" }
  };
}

/** A minimal VERIFIED analysis payload in the persisted CanonicalCareerAnalysis envelope. */
export function verifiedAnalysis(analysisId: string, capabilities: unknown[]) {
  return {
    report_markdown: "# Fixture analysis",
    structured_data: {
      analysis: {
        metadata: { analysis_id: analysisId, validation_state: "VERIFIED", analysis_timestamp: "2026-10-10T10:00:00.000Z", overall_confidence: 0.85 },
        pipeline: {},
        consistency: {},
        documents: [],
        capabilities,
        requirements: [], domains: [], organization_classes: [], organizations: [], roles: [], opportunities: [], strategies: [], search_queries: []
      },
      presentation: {}
    }
  };
}

export const FIXTURE_ANALYSIS_ID = "ANL_JOBPOOL_FIXTURE_0001";
export const fixtureCapabilities = () => [
  capabilityEntity("CAP_TS", "TypeScript", 0.92, "Built the billing service in TypeScript with strict typing."),
  capabilityEntity("CAP_REACT", "React.js", 0.88, "Implemented the React.js dashboard used by 40 customers."),
  capabilityEntity("CAP_NODE", "Node.js Backend Development", 0.8, "Designed Node.js backend services with Express."),
  capabilityEntity("CAP_PG", "PostgreSQL", 0.75, "Modelled the PostgreSQL schema for orders and invoices."),
  capabilityEntity("CAP_K8S", "Kubernetes", 0.55, "Deployed services to a Kubernetes test cluster."),
  capabilityEntity("CAP_PY", "Python", 0.9, "Wrote Python ETL jobs for monthly reports.")
];
