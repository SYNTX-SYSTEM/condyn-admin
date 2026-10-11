/**
 * Job Pool workflow proof world: one disposable database (same identity rule as every other
 * proof), the unified persistence registration, and ONE verified canonical analysis row seeded
 * directly through the sealed PostgresCareerAnalysisRepository, so the proofs need no model call.
 *
 * The analysis is GELB's fixture analysis (six capabilities with verbatim evidence quotes), so the
 * proofs follow documented bases: TypeScript EXACT, React via ALIAS, Node.js by TOKEN_CONTAINMENT
 * (weak evidence), Automated Testing missing. The module-level client in lib/career/db/client is
 * never imported here.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import type { Sql } from "postgres";
import { PostgresCareerAnalysisRepository } from "../../../../lib/career/repositories/postgres";
import { registerUnifiedPersistenceSchema } from "../../../../lib/persistence/unified-schema-registration";
import { dropDisposableTestDatabase } from "../../../../lib/database-isolation/verification";
import type { VerifiedCareerAnalysis } from "../../../../lib/career/types";
import { provisionDatabase } from "../../hr-decision-loop/fixtures/hr-loop-postgres-world";
import { fixtureCapabilities, samplePoolText, verifiedAnalysis } from "../fixtures";

export const JOB_POOL_E2E_ANALYSIS_ID = "ANL_JOB_POOL_E2E_0001";
export const JOB_POOL_E2E_UPLOADER = "JOB_POOL_E2E_UPLOADER";
/** The seeded capability the proofs follow end to end: EXACT match of req_001 (TypeScript) in role_fullstack. */
export const JOB_POOL_E2E_TARGET = Object.freeze({
  roleId: "role_fullstack",
  requirementId: "req_001",
  capabilityEntityId: "CAP_TS",
  docId: "DOC_001",
  quote: "Built the billing service in TypeScript with strict typing."
});

export interface SamplePoolShape {
  pool: { id: string; name: string; version: number; status: string };
  organizations: Array<{ id: string; name: string }>;
  roles: Array<{ id: string; organization_id: string; title: string }>;
  requirements: Array<{ id: string; role_id: string; capability_name: string; required_level: string; weight: number }>;
}

export function readSamplePool(): { text: string; pool: SamplePoolShape } {
  const text = samplePoolText();
  return { text, pool: JSON.parse(text) as SamplePoolShape };
}

/** GELB's fixture analysis (test/career/job-pool/fixtures.ts) under the e2e id: six capabilities, documented bases per requirement. */
/** The one source document of the seeded analysis: its title is what the SYNTX aperture may show for DOC_001 (exact join, binding §2.3). */
export const JOB_POOL_E2E_SOURCE = Object.freeze({ docId: "DOC_001", title: "cv.synthetic.pdf" });

export function buildSeededAnalysis(): VerifiedCareerAnalysis {
  const analysis = verifiedAnalysis(JOB_POOL_E2E_ANALYSIS_ID, fixtureCapabilities()) as unknown as VerifiedCareerAnalysis & { structured_data: { analysis: { documents: unknown[] }; presentation: unknown } };
  // The legacy analysis read route runs the perception chain over `presentation`; the adapter's empty assembly shape (adapter.ts) is what a real analysis carries at minimum.
  analysis.structured_data.presentation = { semantic_graph: { nodes: [], edges: [] }, ui_layout: { center_node_id: "CAP_TS", concentric_rings: [], color_tokens: {} } };
  analysis.structured_data.analysis.documents = [{
    entity_id: JOB_POOL_E2E_SOURCE.docId,
    identity: { type: "DOCUMENT", name: JOB_POOL_E2E_SOURCE.title },
    properties: { category: "Source" },
    relationships: [],
    evidence: [{ doc_id: JOB_POOL_E2E_SOURCE.docId, location: "page 1", context_quote: JOB_POOL_E2E_TARGET.quote, evidence_score: 1 }],
    confidence: 1,
    validation: { status: "PASSED" }
  }];
  return analysis;
}

export interface JobPoolWorld {
  databaseName: string;
  databaseUrl: string;
  sql: Sql;
  analysisId: string;
  samplePoolText: string;
  samplePool: SamplePoolShape;
  destroy(): Promise<void>;
}

export async function createJobPoolPostgresWorld(): Promise<JobPoolWorld> {
  const { databaseName, databaseUrl, sql, admin } = await provisionDatabase();
  const destroy = async () => {
    await sql.end({ timeout: 5 });
    await dropDisposableTestDatabase(databaseUrl);
    await admin.end({ timeout: 5 });
  };
  try {
    await registerUnifiedPersistenceSchema(sql);
    const { text, pool } = readSamplePool();
    await new PostgresCareerAnalysisRepository(drizzle(sql)).save(buildSeededAnalysis());
    return { databaseName, databaseUrl, sql, analysisId: JOB_POOL_E2E_ANALYSIS_ID, samplePoolText: text, samplePool: pool, destroy };
  } catch (error) {
    await destroy().catch(() => undefined);
    throw error;
  }
}
