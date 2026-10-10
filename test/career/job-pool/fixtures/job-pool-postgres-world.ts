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
export function buildSeededAnalysis(): VerifiedCareerAnalysis {
  return verifiedAnalysis(JOB_POOL_E2E_ANALYSIS_ID, fixtureCapabilities()) as unknown as VerifiedCareerAnalysis;
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
