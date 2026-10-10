import { asc, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { careerJobPoolCanonicalMappings, careerJobPoolUploads } from "./persistence-schema";
import type { JobPoolCanonicalMapping } from "./types";
import { stableJson } from "./upload";

export type JobPoolUploadRecord = typeof careerJobPoolUploads.$inferSelect;

/** Exact reads and immutable, idempotent writes. It never selects a current or latest pool. */
export class PostgresJobPoolRepository {
  constructor(private readonly database: PostgresJsDatabase) {}

  async getUpload(jobPoolUploadId: string): Promise<JobPoolUploadRecord | null> {
    const rows = await this.database.select().from(careerJobPoolUploads).where(eq(careerJobPoolUploads.jobPoolUploadId, jobPoolUploadId)).limit(1);
    return rows[0] ?? null;
  }

  /** Ordered by declared pool id, version and upload id; never by time. */
  async listUploads(): Promise<JobPoolUploadRecord[]> {
    return this.database.select().from(careerJobPoolUploads)
      .orderBy(asc(careerJobPoolUploads.poolId), asc(careerJobPoolUploads.poolVersion), asc(careerJobPoolUploads.jobPoolUploadId));
  }

  /** Returns the stored record; `created` is false when an identical canonical upload already existed. */
  async saveUpload(record: JobPoolUploadRecord): Promise<{ created: boolean; record: JobPoolUploadRecord }> {
    const inserted = await this.database.insert(careerJobPoolUploads).values(record).onConflictDoNothing().returning({ id: careerJobPoolUploads.jobPoolUploadId });
    const stored = await this.getUpload(record.jobPoolUploadId);
    if (stored === null) throw new Error("ERR_JOB_POOL_PERSISTENCE_INVALID");
    if (stored.canonicalJson !== record.canonicalJson || stored.canonicalSha256 !== record.canonicalSha256) throw new Error("ERR_JOB_POOL_IMMUTABLE_CONFLICT");
    return { created: inserted.length === 1, record: stored };
  }

  async getMapping(jobPoolUploadId: string): Promise<JobPoolCanonicalMapping | null> {
    const rows = await this.database.select().from(careerJobPoolCanonicalMappings).where(eq(careerJobPoolCanonicalMappings.jobPoolUploadId, jobPoolUploadId)).limit(1);
    return rows[0] ? (JSON.parse(rows[0].mappingJson) as JobPoolCanonicalMapping) : null;
  }

  async saveMapping(jobPoolUploadId: string, mapping: JobPoolCanonicalMapping, createdAt: string): Promise<JobPoolCanonicalMapping> {
    const mappingJson = stableJson(mapping);
    await this.database.insert(careerJobPoolCanonicalMappings).values({ jobPoolUploadId, mappingJson, createdAt }).onConflictDoNothing();
    const rows = await this.database.select().from(careerJobPoolCanonicalMappings).where(eq(careerJobPoolCanonicalMappings.jobPoolUploadId, jobPoolUploadId)).limit(1);
    if (!rows[0]) throw new Error("ERR_JOB_POOL_PERSISTENCE_INVALID");
    if (rows[0].mappingJson !== mappingJson) throw new Error("ERR_JOB_POOL_MAPPING_IMMUTABLE_CONFLICT");
    return JSON.parse(rows[0].mappingJson) as JobPoolCanonicalMapping;
  }
}
