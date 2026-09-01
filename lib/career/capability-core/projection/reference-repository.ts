import { isDeepStrictEqual } from "util";
import { and, eq, or } from "drizzle-orm";
import { careerCapabilityProposalProjectionReferences } from "../../db/schema";

export interface CapabilityProposalProjectionReference {
  analysisId: string;
  jobId: string;
  discoveryRunId: string;
  convergenceRunId: string;
  sourceBundleHash: string;
  createdAt: string;
}

export interface CapabilityProposalProjectionReferenceRepository {
  save(reference: CapabilityProposalProjectionReference): Promise<void>;
  getByAnalysisId(analysisId: string): Promise<CapabilityProposalProjectionReference | null>;
}

const conflict = (): never => {
  throw new Error("ERR_IMMUTABLE_CAPABILITY_PROPOSAL_PROJECTION_REFERENCE_CONFLICT");
};

export class InMemoryCapabilityProposalProjectionReferenceRepository
  implements CapabilityProposalProjectionReferenceRepository {
  private readonly byAnalysisId = new Map<string, CapabilityProposalProjectionReference>();
  private readonly analysisIdByJobId = new Map<string, string>();

  async save(reference: CapabilityProposalProjectionReference): Promise<void> {
    const existingByAnalysis = this.byAnalysisId.get(reference.analysisId);
    const existingAnalysisIdForJob = this.analysisIdByJobId.get(reference.jobId);
    const existingByJob = existingAnalysisIdForJob
      ? this.byAnalysisId.get(existingAnalysisIdForJob)
      : undefined;
    if (existingByAnalysis && !isDeepStrictEqual(existingByAnalysis, reference)) conflict();
    if (existingByJob && !isDeepStrictEqual(existingByJob, reference)) conflict();
    if (existingByAnalysis || existingByJob) return;
    this.byAnalysisId.set(reference.analysisId, structuredClone(reference));
    this.analysisIdByJobId.set(reference.jobId, reference.analysisId);
  }

  async getByAnalysisId(analysisId: string): Promise<CapabilityProposalProjectionReference | null> {
    const reference = this.byAnalysisId.get(analysisId);
    return reference ? structuredClone(reference) : null;
  }
}

export class PostgresCapabilityProposalProjectionReferenceRepository
  implements CapabilityProposalProjectionReferenceRepository {
  constructor(private readonly database: any) {}

  async save(reference: CapabilityProposalProjectionReference): Promise<void> {
    const existing = await this.database
      .select()
      .from(careerCapabilityProposalProjectionReferences)
      .where(or(
        eq(careerCapabilityProposalProjectionReferences.analysisId, reference.analysisId),
        eq(careerCapabilityProposalProjectionReferences.jobId, reference.jobId)
      ));
    if (existing.length > 0) {
      if (existing.length !== 1 || !isDeepStrictEqual(existing[0], reference)) conflict();
      return;
    }
    try {
      await this.database
        .insert(careerCapabilityProposalProjectionReferences)
        .values(reference)
        .onConflictDoNothing();
    } catch (error) {
      throw error;
    }
    const persisted = await this.database
      .select()
      .from(careerCapabilityProposalProjectionReferences)
      .where(and(
        eq(careerCapabilityProposalProjectionReferences.analysisId, reference.analysisId),
        eq(careerCapabilityProposalProjectionReferences.jobId, reference.jobId)
      ));
    if (persisted.length !== 1 || !isDeepStrictEqual(persisted[0], reference)) conflict();
  }

  async getByAnalysisId(analysisId: string): Promise<CapabilityProposalProjectionReference | null> {
    const rows = await this.database
      .select()
      .from(careerCapabilityProposalProjectionReferences)
      .where(eq(careerCapabilityProposalProjectionReferences.analysisId, analysisId))
      .limit(1);
    return rows[0] ?? null;
  }
}

export const createInMemoryCapabilityProposalProjectionReferenceRepository = () =>
  new InMemoryCapabilityProposalProjectionReferenceRepository();
