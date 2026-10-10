import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { CompanyPoolData } from "../matching/pool";
import type { CareerAnalysisRepository } from "../repository";
import { mapJobPoolToCanonicalTargets } from "./canonical-mapping";
import { JobPoolError } from "./errors";
import { matchAnalysisAgainstJobPool, type CapabilitySweepInput } from "./presentation-matching";
import { PostgresJobPoolRepository, type JobPoolUploadRecord } from "./repository";
import type { JobPoolMatchPresentation, JobPoolUploadSummary, JobPoolUploadView } from "./types";
import { parseJobPoolUpload } from "./upload";

export const UNDECLARED_UPLOADER = "LOCAL_OPERATOR_UNDECLARED";
const ACTOR_PATTERN = /^[A-Za-z0-9_.:@-]{1,128}$/;

export function uploaderActorRef(declared: string | null | undefined): string {
  if (declared === null || declared === undefined || declared.trim() === "") return `JOB_POOL_UPLOADER:${UNDECLARED_UPLOADER}`;
  if (!ACTOR_PATTERN.test(declared)) throw new JobPoolError("ERR_JOB_POOL_ACTOR_INVALID", 400, "x-condyn-principal-actor-id must match [A-Za-z0-9_.:@-]{1,128}.");
  return `JOB_POOL_UPLOADER:${declared}`;
}

const summaryOf = (record: JobPoolUploadRecord): JobPoolUploadSummary => ({
  jobPoolUploadId: record.jobPoolUploadId,
  poolId: record.poolId,
  poolVersion: record.poolVersion,
  poolName: record.poolName,
  poolStatus: record.poolStatus as JobPoolUploadSummary["poolStatus"],
  organizationCount: record.organizationCount,
  roleCount: record.roleCount,
  requirementCount: record.requirementCount,
  uploadedByActorRef: record.uploadedByActorRef,
  uploadedAt: record.uploadedAt
});

export interface JobPoolApplicationDependencies {
  database: PostgresJsDatabase;
  /** The same analysis read path as GET /api/career/analyses/[id] (getCareerAnalysisRepository). */
  analyses: Pick<CareerAnalysisRepository, "load">;
  /** The F11 capability proposal projection of the analysis job (same reader as the analyses route). */
  capabilitySweep?: { read(analysisId: string): Promise<{ capabilities: Array<{ id: string; name: string; evidence: Array<{ sourceDocumentId: string; exactQuote: string }> }> } | null> };
  now?: () => string;
}

export function createJobPoolApplication(deps: JobPoolApplicationDependencies) {
  const repository = new PostgresJobPoolRepository(deps.database);
  const analyses = deps.analyses;
  const now = deps.now ?? (() => new Date().toISOString());

  async function viewOf(record: JobPoolUploadRecord): Promise<JobPoolUploadView> {
    const mapping = await repository.getMapping(record.jobPoolUploadId);
    if (mapping === null) throw new JobPoolError("ERR_JOB_POOL_MAPPING_MISSING", 500, `No canonical mapping is stored for ${record.jobPoolUploadId}.`);
    return { ...summaryOf(record), canonicalSha256: record.canonicalSha256, rawSha256: record.rawSha256, pool: JSON.parse(record.canonicalJson), canonicalMapping: mapping };
  }

  return {
    /** 201 for a new canonical upload, 200 when the identical canonical pool is already stored and mapped. */
    async upload(rawText: string, declaredActor: string | null): Promise<{ status: 200 | 201; view: JobPoolUploadView }> {
      const actorRef = uploaderActorRef(declaredActor);
      const parsed = parseJobPoolUpload(rawText);
      const { created, record } = await repository.saveUpload({
        jobPoolUploadId: parsed.jobPoolUploadId,
        poolId: parsed.pool.pool.id,
        poolVersion: parsed.pool.pool.version,
        poolStatus: parsed.pool.pool.status,
        poolName: parsed.pool.pool.name,
        organizationCount: parsed.pool.organizations.length,
        roleCount: parsed.pool.roles.length,
        requirementCount: parsed.pool.requirements.length,
        canonicalSha256: parsed.canonicalSha256,
        rawSha256: parsed.rawSha256,
        canonicalJson: parsed.canonicalJson,
        uploadedByActorRef: actorRef,
        uploadedAt: now()
      });
      const existingMapping = await repository.getMapping(record.jobPoolUploadId);
      if (existingMapping === null) {
        // The stored record supplies actor and timestamp, so a retry after a partial failure is byte-identical.
        const mapping = await mapJobPoolToCanonicalTargets({
          jobPoolUploadId: record.jobPoolUploadId,
          pool: JSON.parse(record.canonicalJson) as CompanyPoolData,
          canonicalSha256: record.canonicalSha256,
          uploadedByActorRef: record.uploadedByActorRef,
          createdAt: record.uploadedAt
        }, deps.database);
        await repository.saveMapping(record.jobPoolUploadId, mapping, record.uploadedAt);
      }
      return { status: created || existingMapping === null ? 201 : 200, view: await viewOf(record) };
    },

    async list(): Promise<JobPoolUploadSummary[]> {
      return (await repository.listUploads()).map(summaryOf);
    },

    async get(jobPoolUploadId: string): Promise<JobPoolUploadView> {
      const record = await repository.getUpload(jobPoolUploadId);
      if (record === null) throw new JobPoolError("ERR_JOB_POOL_NOT_FOUND", 404, `Unknown job pool upload ${jobPoolUploadId}.`);
      return viewOf(record);
    },

    async matches(jobPoolUploadId: string, analysisId: string | null): Promise<JobPoolMatchPresentation> {
      if (!analysisId) throw new JobPoolError("ERR_ANALYSIS_ID_REQUIRED", 400, "The query parameter analysisId is required.");
      const view = await this.get(jobPoolUploadId);
      const analysis = await analyses.load(analysisId);
      if (analysis === null) throw new JobPoolError("ERR_ANALYSIS_NOT_FOUND", 404, `Unknown analysis ${analysisId}.`);
      let capabilitySweep: CapabilitySweepInput = { state: "NOT_PRODUCED" };
      if (deps.capabilitySweep) {
        try {
          const projection = await deps.capabilitySweep.read(analysisId);
          if (projection !== null) {
            capabilitySweep = { state: "AVAILABLE", proposals: projection.capabilities.map(item => ({ id: item.id, name: item.name, evidence: item.evidence.map(e => ({ sourceDocumentId: e.sourceDocumentId, exactQuote: e.exactQuote })) })) };
          }
        } catch {
          // A sidecar lineage violation never hides or alters the analysis matching; it is reported as FAILED.
          capabilitySweep = { state: "FAILED" };
        }
      }
      return matchAnalysisAgainstJobPool({
        capabilitySweep,
        analysis,
        analysisId,
        jobPoolUploadId,
        pool: view.pool as CompanyPoolData,
        canonicalMapping: view.canonicalMapping
      });
    }
  };
}

export type JobPoolApplication = ReturnType<typeof createJobPoolApplication>;
