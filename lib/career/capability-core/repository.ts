import { isDeepStrictEqual } from "util";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { careerCapabilityRuns, careerCapabilitySnapshots } from "../db/schema";
import { assertVerifiedCapabilitySnapshot, computeSnapshotKey } from "./snapshot";
import type { CapabilityDiscoveryRun, VerifiedCapabilitySnapshot } from "./schema";
import type { CapabilityConvergenceRun } from "./convergence/types";

export interface CapabilityCoreRepository {
  saveRun(run: CapabilityDiscoveryRun): Promise<void>;
  getRunById(runId: string): Promise<CapabilityDiscoveryRun | null>;
  saveConvergenceRun(run: CapabilityConvergenceRun): Promise<void>;
  getConvergenceRunById(convergenceRunId: string): Promise<CapabilityConvergenceRun | null>;
  getSnapshotByKey(snapshotKey: string): Promise<VerifiedCapabilitySnapshot | null>;
  saveSnapshot(snapshot: VerifiedCapabilitySnapshot): Promise<void>;
}

export class InMemoryCapabilityCoreRepository implements CapabilityCoreRepository {
  private readonly runs = new Map<string, CapabilityDiscoveryRun>();
  private readonly convergenceRuns = new Map<string, CapabilityConvergenceRun>();
  private readonly snapshots = new Map<string, VerifiedCapabilitySnapshot>();
  async saveRun(run: CapabilityDiscoveryRun): Promise<void> {
    const existing = this.runs.get(run.runId);
    if (existing && !isDeepStrictEqual(existing, run)) throw new Error(`ERR_IMMUTABLE_RUN_CONFLICT: ${run.runId}`);
    this.runs.set(run.runId, structuredClone(run));
  }
  async getRunById(runId: string): Promise<CapabilityDiscoveryRun | null> { const run = this.runs.get(runId); return run ? structuredClone(run) : null; }
  async saveConvergenceRun(run: CapabilityConvergenceRun): Promise<void> { const existing = this.convergenceRuns.get(run.convergenceRunId); if (existing && !isDeepStrictEqual(existing, run)) throw new Error(`ERR_IMMUTABLE_CONVERGENCE_RUN_CONFLICT: ${run.convergenceRunId}`); this.convergenceRuns.set(run.convergenceRunId, structuredClone(run)); }
  async getConvergenceRunById(convergenceRunId: string): Promise<CapabilityConvergenceRun | null> { const run = this.convergenceRuns.get(convergenceRunId); return run ? structuredClone(run) : null; }
  async getSnapshotByKey(snapshotKey: string): Promise<VerifiedCapabilitySnapshot | null> { const snapshot = this.snapshots.get(snapshotKey); return snapshot ? structuredClone(snapshot) : null; }
  async saveSnapshot(snapshot: VerifiedCapabilitySnapshot): Promise<void> {
    assertVerifiedCapabilitySnapshot(snapshot);
    const key = computeSnapshotKey(snapshot);
    const existing = this.snapshots.get(key);
    if (existing && !isDeepStrictEqual(existing, snapshot)) throw new Error(`ERR_IMMUTABLE_SNAPSHOT_CONFLICT: ${snapshot.snapshotId}`);
    this.snapshots.set(key, structuredClone(snapshot));
  }
}

/** Postgres implementation mirrors the append-only identity semantics without touching legacy analysis persistence. */
export class PostgresCapabilityCoreRepository implements CapabilityCoreRepository {
  constructor(private readonly database = db) {}
  async saveRun(run: CapabilityDiscoveryRun): Promise<void> {
    const existing = await this.getRunById(run.runId);
    if (existing && !isDeepStrictEqual(existing, run)) throw new Error(`ERR_IMMUTABLE_RUN_CONFLICT: ${run.runId}`);
    if (existing) return;
    const inserted = await this.database.insert(careerCapabilityRuns).values({ runId: run.runId, sourceBundleHash: run.sourceBundleHash, kernelVersion: run.kernelVersion, promptChecksum: run.prompt.checksum, provider: run.inference.provider, model: run.inference.model, schemaVersion: run.schemaVersion, status: run.status, rawOutputHash: run.rawOutputHash ?? null, payload: run, createdAt: run.createdAt, completedAt: run.completedAt ?? null }).onConflictDoNothing().returning({ runId: careerCapabilityRuns.runId });
    if (!inserted.length) {
      const persisted = await this.getRunById(run.runId);
      if (!persisted || !isDeepStrictEqual(persisted, run)) throw new Error(`ERR_IMMUTABLE_RUN_CONFLICT: ${run.runId}`);
    }
  }
  async getRunById(runId: string): Promise<CapabilityDiscoveryRun | null> {
    const rows = await this.database.select({ payload: careerCapabilityRuns.payload }).from(careerCapabilityRuns).where(eq(careerCapabilityRuns.runId, runId)).limit(1);
    return rows[0]?.payload as CapabilityDiscoveryRun ?? null;
  }
  async saveConvergenceRun(run: CapabilityConvergenceRun): Promise<void> {
    const existing = await this.getConvergenceRunById(run.convergenceRunId);
    if (existing && !isDeepStrictEqual(existing, run)) throw new Error(`ERR_IMMUTABLE_CONVERGENCE_RUN_CONFLICT: ${run.convergenceRunId}`);
    if (existing) return;
    const inserted = await this.database.insert(careerCapabilityRuns).values({ runId: run.convergenceRunId, sourceBundleHash: run.sourceBundleHash, kernelVersion: run.kernelVersion, promptChecksum: run.prompt.checksum, provider: run.inference.provider, model: run.inference.model, schemaVersion: run.schemaVersion, status: run.status, rawOutputHash: run.rawOutputHash, payload: run, createdAt: run.createdAt, completedAt: run.completedAt }).onConflictDoNothing().returning({ runId: careerCapabilityRuns.runId });
    if (!inserted.length) { const persisted = await this.getConvergenceRunById(run.convergenceRunId); if (!persisted || !isDeepStrictEqual(persisted, run)) throw new Error(`ERR_IMMUTABLE_CONVERGENCE_RUN_CONFLICT: ${run.convergenceRunId}`); }
  }
  async getConvergenceRunById(convergenceRunId: string): Promise<CapabilityConvergenceRun | null> {
    const rows = await this.database.select({ payload: careerCapabilityRuns.payload }).from(careerCapabilityRuns).where(eq(careerCapabilityRuns.runId, convergenceRunId)).limit(1);
    const run = rows[0]?.payload as CapabilityConvergenceRun | undefined;
    return run?.runKind === "CAPABILITY_CONVERGENCE" ? structuredClone(run) : null;
  }
  async getSnapshotByKey(snapshotKey: string): Promise<VerifiedCapabilitySnapshot | null> {
    const rows = await this.database.select({ payload: careerCapabilitySnapshots.payload }).from(careerCapabilitySnapshots).where(eq(careerCapabilitySnapshots.snapshotKey, snapshotKey)).limit(1);
    const snapshot = rows[0]?.payload as VerifiedCapabilitySnapshot | undefined;
    if (!snapshot) return null;
    assertVerifiedCapabilitySnapshot(snapshot);
    return snapshot;
  }
  async saveSnapshot(snapshot: VerifiedCapabilitySnapshot): Promise<void> {
    assertVerifiedCapabilitySnapshot(snapshot);
    const snapshotKey = computeSnapshotKey(snapshot);
    const existing = await this.getSnapshotByKey(snapshotKey);
    if (existing && !isDeepStrictEqual(existing, snapshot)) throw new Error(`ERR_IMMUTABLE_SNAPSHOT_CONFLICT: ${snapshot.snapshotId}`);
    if (existing) return;
    const inserted = await this.database.insert(careerCapabilitySnapshots).values({ snapshotId: snapshot.snapshotId, snapshotKey, sourceBundleHash: snapshot.sourceBundleHash, kernelVersion: snapshot.kernelVersion, promptChecksum: snapshot.prompt.checksum, provider: snapshot.inference.provider, model: snapshot.inference.model, schemaVersion: snapshot.schemaVersion, status: snapshot.status, payload: snapshot, createdAt: snapshot.createdAt }).onConflictDoNothing().returning({ snapshotId: careerCapabilitySnapshots.snapshotId });
    if (!inserted.length) {
      const persisted = await this.getSnapshotByKey(snapshotKey);
      if (!persisted || !isDeepStrictEqual(persisted, snapshot)) throw new Error(`ERR_IMMUTABLE_SNAPSHOT_CONFLICT: ${snapshot.snapshotId}`);
    }
  }
}
