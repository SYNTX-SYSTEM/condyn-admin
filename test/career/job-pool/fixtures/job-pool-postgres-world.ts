/**
 * Job Pool workflow proof world: one disposable database (same identity rule as every other
 * proof), the unified persistence registration, and ONE verified canonical analysis row seeded
 * directly through the sealed PostgresCareerAnalysisRepository, so the proofs need no model call.
 *
 * The analysis is derived from the sample pool so the proofs are relative to its content: the
 * first requirement whose capability name is unique across the pool becomes an EXACT capability
 * with one verbatim evidence quote; every other requirement of that role stays absent. The module
 * level client in lib/career/db/client is never imported here.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import type { Sql } from "postgres";
import { PostgresCareerAnalysisRepository } from "../../../../lib/career/repositories/postgres";
import { registerUnifiedPersistenceSchema } from "../../../../lib/persistence/unified-schema-registration";
import { dropDisposableTestDatabase } from "../../../../lib/database-isolation/verification";
import type { VerifiedCareerAnalysis } from "../../../../lib/career/types";
import { provisionDatabase } from "../../hr-decision-loop/fixtures/hr-loop-postgres-world";

export const SAMPLE_POOL_PATH = resolve(process.cwd(), "docs/examples/job-pool.sample.json");
export const JOB_POOL_E2E_ANALYSIS_ID = "ANL_JOB_POOL_E2E_0001";
export const JOB_POOL_E2E_DOC_ID = "DOC_JOB_POOL_E2E_CV";
export const JOB_POOL_E2E_UPLOADER = "JOB_POOL_E2E_UPLOADER";

export interface SamplePoolShape {
  pool: { id: string; name: string; version: number; status: string };
  organizations: Array<{ id: string; name: string }>;
  roles: Array<{ id: string; organization_id: string; title: string }>;
  requirements: Array<{ id: string; role_id: string; capability_name: string; required_level: string; weight: number }>;
}

export function readSamplePool(): { text: string; pool: SamplePoolShape } {
  const text = readFileSync(SAMPLE_POOL_PATH, "utf8");
  return { text, pool: JSON.parse(text) as SamplePoolShape };
}

/** The requirement the seeded analysis satisfies exactly, and the role it belongs to. */
export function chooseTargetRequirement(pool: SamplePoolShape): { requirement: SamplePoolShape["requirements"][number]; role: SamplePoolShape["roles"][number] } {
  const counts = new Map<string, number>();
  for (const requirement of pool.requirements) {
    const key = requirement.capability_name.trim().toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const requirement = pool.requirements.find(candidate => counts.get(candidate.capability_name.trim().toLowerCase()) === 1);
  if (requirement === undefined) throw new Error("ERR_JOB_POOL_E2E_NO_UNIQUE_REQUIREMENT: the sample pool has no requirement with a unique capability name");
  const role = pool.roles.find(candidate => candidate.id === requirement.role_id);
  if (role === undefined) throw new Error(`ERR_JOB_POOL_E2E_ROLE_MISSING: ${requirement.role_id}`);
  return { requirement, role };
}

export const EVIDENCE_QUOTE_FOR = (capabilityName: string): string => `Led the ${capabilityName} work for the platform team over four years.`;

export function buildSeededAnalysis(pool: SamplePoolShape): VerifiedCareerAnalysis {
  const { requirement } = chooseTargetRequirement(pool);
  const capability = (entityId: string, name: string, quote: string, confidence: number) => ({
    entity_id: entityId,
    identity: { type: "capability", name },
    properties: { domain: "ENGINEERING", level: "L4" },
    relationships: [],
    evidence: [{ doc_id: JOB_POOL_E2E_DOC_ID, location: "page 1", context_quote: quote, evidence_score: confidence }],
    confidence,
    validation: { status: "PASSED" }
  });
  return {
    structured_data: {
      analysis: {
        metadata: {
          analysis_id: JOB_POOL_E2E_ANALYSIS_ID,
          protocol_version: "1.0",
          schema_version: "1.0",
          prompt_contract_version: "e2e",
          analysis_timestamp: "2026-10-10T18:00:00.000Z",
          document_count: 1,
          overall_confidence: 0.9,
          validation_state: "VERIFIED"
        },
        documents: [{ entity_id: JOB_POOL_E2E_DOC_ID, identity: { type: "document", name: "cv.pdf" }, properties: {}, relationships: [], evidence: [], confidence: 1, validation: { status: "PASSED" } }],
        capabilities: [
          capability("CAP_JOB_POOL_E2E_TARGET", requirement.capability_name, EVIDENCE_QUOTE_FOR(requirement.capability_name), 0.92),
          capability("CAP_JOB_POOL_E2E_UNRELATED", "Underwater Basket Weaving", "Weekend underwater basket weaving instructor.", 0.8)
        ],
        requirements: [],
        role_alignments: [],
        measurements: []
      }
    }
  } as unknown as VerifiedCareerAnalysis;
}

export interface JobPoolWorld {
  databaseName: string;
  databaseUrl: string;
  sql: Sql;
  analysisId: string;
  samplePoolText: string;
  samplePool: SamplePoolShape;
  target: ReturnType<typeof chooseTargetRequirement>;
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
    const analysis = buildSeededAnalysis(pool);
    await new PostgresCareerAnalysisRepository(drizzle(sql)).save(analysis);
    return { databaseName, databaseUrl, sql, analysisId: JOB_POOL_E2E_ANALYSIS_ID, samplePoolText: text, samplePool: pool, target: chooseTargetRequirement(pool), destroy };
  } catch (error) {
    await destroy().catch(() => undefined);
    throw error;
  }
}
