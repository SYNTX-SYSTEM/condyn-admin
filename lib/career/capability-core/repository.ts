import { isDeepStrictEqual } from "util";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { careerCapabilityRuns, careerCapabilitySnapshots } from "../db/schema";
import { buildProvisionalCapabilityId } from "./identity";
import { assertVerifiedCapabilitySnapshot, buildSnapshotId, computeSnapshotKey, createVerifiedCapabilitySnapshot } from "./snapshot";
import { createCapabilityRelation, type CapabilityDiscoveryRun, type CapabilityRelation, type EvidenceClaim, type VerifiedCapability, type VerifiedCapabilitySnapshot } from "./schema";
import type { CapabilityConvergenceRun } from "./convergence/types";
import { assertPersistableCapabilityVerificationRun } from "./verification/run";
import { authenticatePersistedCapabilityVerificationRun } from "./verification/authenticator";
import type { AuthoritativeCapabilityVerificationChain, CapabilityVerificationIntegrityInput, CapabilityVerificationRun, VerifiedCapabilitySnapshotPublisher } from "./verification/types";

export interface CapabilityCoreRepository {
  saveRun(run: CapabilityDiscoveryRun): Promise<void>;
  getRunById(runId: string): Promise<CapabilityDiscoveryRun | null>;
  saveConvergenceRun(run: CapabilityConvergenceRun): Promise<void>;
  getConvergenceRunById(convergenceRunId: string): Promise<CapabilityConvergenceRun | null>;
  saveVerificationRun(run: CapabilityVerificationRun): Promise<void>;
  getVerificationRunById(verificationRunId: string): Promise<CapabilityVerificationRun | null>;
  getSnapshotByKey(snapshotKey: string): Promise<VerifiedCapabilitySnapshot | null>;
  getSnapshotById(snapshotId: string): Promise<VerifiedCapabilitySnapshot | null>;
  saveSnapshot(snapshot: VerifiedCapabilitySnapshot): Promise<void>;
  createVerifiedCapabilitySnapshotPublisher(): VerifiedCapabilitySnapshotPublisher;
}

function assertGenericSnapshotRoute(snapshot: VerifiedCapabilitySnapshot): void {
  if (snapshot.publication?.mode === "PHASE4_VERIFIED") throw new Error("ERR_PHASE4_SNAPSHOT_REQUIRES_DEDICATED_REPOSITORY");
  assertVerifiedCapabilitySnapshot(snapshot);
}

/** Infrastructure route only; the trusted publisher authenticates the persisted upstream chain before calling it. */
function assertPhase4SnapshotRoute(snapshot: VerifiedCapabilitySnapshot): void {
  if (snapshot.publication?.mode !== "PHASE4_VERIFIED") throw new Error("ERR_PHASE4_SNAPSHOT_REQUIRES_DEDICATED_REPOSITORY");
  assertVerifiedCapabilitySnapshot(snapshot);
}

const fail = (code: string): never => { throw new Error(code); };

function finalCapabilityId(draft: AuthoritativeCapabilityVerificationChain["canonicalDrafts"][number]): string {
  const provisional = buildProvisionalCapabilityId(draft.canonicalName, draft.scope);
  if (provisional !== draft.provisionalCapabilityId) return fail("ERR_PHASE4_PROVISIONAL_ID_MISMATCH");
  return provisional.replace("PCAP_", "CAP_");
}

function exactlyOne<T extends { provisionalCapabilityId: string }>(items: T[], provisionalCapabilityId: string, code: string): T {
  const matches = items.filter((item) => item.provisionalCapabilityId === provisionalCapabilityId);
  if (matches.length !== 1) return fail(code);
  return matches[0];
}

function constructCapabilities(chain: AuthoritativeCapabilityVerificationChain): VerifiedCapability[] {
  const run = chain.verificationRun;
  const capabilities = chain.canonicalDrafts.map((draft) => {
    const semantic = exactlyOne(run.payload.semanticDefinitionOutcomes, draft.provisionalCapabilityId, "ERR_PHASE4_SEMANTIC_DEFINITION_NOT_PASSED");
    if (semantic.status !== "PASSED") return fail("ERR_PHASE4_SEMANTIC_DEFINITION_NOT_PASSED");
    const level = exactlyOne(run.payload.demonstratedLevelOutcomes, draft.provisionalCapabilityId, "ERR_PHASE4_LEVEL_TRUTH_INVARIANT");
    const levelIsVerified = level.status === "VERIFIED";
    if ((levelIsVerified && level.demonstratedCapabilityLevel === null) || (!levelIsVerified && level.demonstratedCapabilityLevel !== null)) return fail("ERR_PHASE4_LEVEL_TRUTH_INVARIANT");
    return {
      capabilityId: finalCapabilityId(draft), canonicalName: draft.canonicalName, scope: draft.scope,
      structuralDefinition: draft.structuralDefinition, primaryDomain: draft.primaryDomain,
      demonstratedCapabilityLevel: level.demonstratedCapabilityLevel, levelVerificationStatus: level.status,
      evidenceIds: [...draft.evidenceIds], relationIds: [],
      provenance: { sourceCandidateIds: [...draft.provenance.sourceCandidateIds], sourceDocumentIds: [...draft.provenance.sourceDocumentIds] },
      validation: { evidenceStatus: "PASSED", semanticDefinitionStatus: "PASSED", convergenceStatus: "VERIFIED" }
    } satisfies VerifiedCapability;
  });
  if (new Set(capabilities.map((item) => item.capabilityId)).size !== capabilities.length) return fail("ERR_PHASE4_NONDETERMINISTIC_CAPABILITY_ID");
  return capabilities;
}

function constructEvidence(chain: AuthoritativeCapabilityVerificationChain): EvidenceClaim[] {
  const expectedIds: string[] = []; const seen = new Set<string>();
  for (const draft of chain.canonicalDrafts) for (const evidenceId of draft.evidenceIds) if (!seen.has(evidenceId)) { seen.add(evidenceId); expectedIds.push(evidenceId); }
  if (chain.verifiedEvidence.length !== expectedIds.length || new Set(chain.verifiedEvidence.map((item) => item.evidenceId)).size !== chain.verifiedEvidence.length) return fail("ERR_PHASE4_EVIDENCE_INVENTORY_INVALID");
  const evidenceById = new Map(chain.verifiedEvidence.map((item) => [item.evidenceId, item]));
  return expectedIds.map((evidenceId) => {
    const evidence = evidenceById.get(evidenceId);
    if (evidence === undefined || evidence.verification.status !== "VERIFIED") return fail("ERR_PHASE4_EVIDENCE_INVENTORY_INVALID");
    return structuredClone(evidence);
  });
}

function constructRelations(chain: AuthoritativeCapabilityVerificationChain, capabilities: VerifiedCapability[]): CapabilityRelation[] {
  const capabilityIdByProvisionalId = new Map(chain.canonicalDrafts.map((draft, index) => [draft.provisionalCapabilityId, capabilities[index].capabilityId]));
  const relations: CapabilityRelation[] = [];
  for (const proposal of chain.proposedRelations) {
    const disposition = chain.verificationRun.payload.relationDispositions.filter((item) => item.relationId === proposal.relationId);
    if (disposition.length !== 1) return fail("ERR_PHASE4_RELATION_DISPOSITION_MISSING");
    if (disposition[0].status === "UNRESOLVED") return fail("ERR_PHASE4_PUBLICATION_BLOCKED");
    if (disposition[0].status === "REJECTED") continue;
    if (proposal.status !== "PROPOSED" || !["PARENT_CHILD", "RELATED_CAPABILITY", "DISTINCT_CAPABILITY"].includes(proposal.relationType)) return fail("ERR_PHASE4_RELATION_NOT_VERIFIED");
    const sourceCapabilityRef = capabilityIdByProvisionalId.get(proposal.sourceCapabilityRef);
    const targetCapabilityRef = capabilityIdByProvisionalId.get(proposal.targetCapabilityRef);
    if (sourceCapabilityRef === undefined || targetCapabilityRef === undefined) return fail("ERR_PHASE4_RELATION_DISPOSITION_MISSING");
    relations.push(createCapabilityRelation({ sourceCapabilityRef, targetCapabilityRef, relationType: proposal.relationType, status: "VERIFIED", reason: proposal.reason, createdBy: proposal.createdBy, createdAt: chain.verificationRun.completedAt }));
  }
  if (new Set(relations.map((item) => item.relationId)).size !== relations.length) return fail("ERR_PHASE4_RELATION_NOT_VERIFIED");
  return relations;
}

function constructPhase4Snapshot(chain: AuthoritativeCapabilityVerificationChain): VerifiedCapabilitySnapshot {
  const run = chain.verificationRun;
  if (run.payload.publicationEligibility !== "ELIGIBLE") return fail("ERR_PHASE4_PUBLICATION_BLOCKED");
  const capabilities = constructCapabilities(chain); const evidence = constructEvidence(chain); const relations = constructRelations(chain, capabilities);
  const indexedCapabilities = capabilities.map((capability) => ({ ...capability, relationIds: relations.filter((relation) => relation.sourceCapabilityRef === capability.capabilityId || relation.targetCapabilityRef === capability.capabilityId).map((relation) => relation.relationId) }));
  const generic = createVerifiedCapabilitySnapshot({ sourceBundleHash: chain.sourceBundleHash, kernelVersion: run.kernelVersion, prompt: { checksum: run.promptChecksum }, inference: run.inference, schemaVersion: run.snapshotSchemaVersion, candidateCount: chain.candidateCount, rejectedCandidateCount: chain.rejectedCandidateCount, createdAt: run.completedAt, status: "VERIFIED" }, indexedCapabilities, evidence, relations);
  const publication = { mode: "PHASE4_VERIFIED" as const, verificationRunId: run.verificationRunId, verificationRawOutputHash: run.rawOutputHash };
  const snapshot = { ...generic, publication, snapshotId: buildSnapshotId({ ...generic, publication }) };
  assertVerifiedCapabilitySnapshot(snapshot);
  return snapshot;
}

/** The private persistence closure is captured only by this publisher; callers receive no write capability. */
function createBoundVerifiedCapabilitySnapshotPublisher(
  repository: Pick<CapabilityCoreRepository, "getRunById" | "getConvergenceRunById" | "getVerificationRunById" | "getSnapshotByKey">,
  persistPhase4Snapshot: (snapshot: VerifiedCapabilitySnapshot) => Promise<void>
): VerifiedCapabilitySnapshotPublisher {
  return {
    async publish(input: CapabilityVerificationIntegrityInput) {
      const chain = await authenticatePersistedCapabilityVerificationRun(input, repository);
      const expected = constructPhase4Snapshot(chain);
      await persistPhase4Snapshot(expected);
      const persisted = await repository.getSnapshotByKey(computeSnapshotKey(expected));
      if (persisted === null || !isDeepStrictEqual(persisted, expected)) return fail("ERR_PHASE4_SNAPSHOT_PERSISTENCE_INVALID");
      return structuredClone(persisted);
    }
  };
}

export class InMemoryCapabilityCoreRepository implements CapabilityCoreRepository {
  private readonly runs = new Map<string, CapabilityDiscoveryRun>();
  private readonly convergenceRuns = new Map<string, CapabilityConvergenceRun>();
  private readonly verificationRuns = new Map<string, CapabilityVerificationRun>();
  private readonly snapshots = new Map<string, VerifiedCapabilitySnapshot>();
  async saveRun(run: CapabilityDiscoveryRun): Promise<void> {
    const existing = this.runs.get(run.runId);
    if (existing && !isDeepStrictEqual(existing, run)) throw new Error(`ERR_IMMUTABLE_RUN_CONFLICT: ${run.runId}`);
    this.runs.set(run.runId, structuredClone(run));
  }
  async getRunById(runId: string): Promise<CapabilityDiscoveryRun | null> { const run = this.runs.get(runId); return run ? structuredClone(run) : null; }
  async saveConvergenceRun(run: CapabilityConvergenceRun): Promise<void> { const existing = this.convergenceRuns.get(run.convergenceRunId); if (existing && !isDeepStrictEqual(existing, run)) throw new Error(`ERR_IMMUTABLE_CONVERGENCE_RUN_CONFLICT: ${run.convergenceRunId}`); this.convergenceRuns.set(run.convergenceRunId, structuredClone(run)); }
  async getConvergenceRunById(convergenceRunId: string): Promise<CapabilityConvergenceRun | null> { const run = this.convergenceRuns.get(convergenceRunId); return run ? structuredClone(run) : null; }
  async saveVerificationRun(run: CapabilityVerificationRun): Promise<void> {
    assertPersistableCapabilityVerificationRun(run);
    const existing = this.verificationRuns.get(run.verificationRunId);
    if (existing && !isDeepStrictEqual(existing, run)) throw new Error(`ERR_IMMUTABLE_VERIFICATION_RUN_CONFLICT: ${run.verificationRunId}`);
    if (!existing) this.verificationRuns.set(run.verificationRunId, structuredClone(run));
  }
  async getVerificationRunById(verificationRunId: string): Promise<CapabilityVerificationRun | null> {
    const run = this.verificationRuns.get(verificationRunId);
    return run ? structuredClone(run) : null;
  }
  async getSnapshotByKey(snapshotKey: string): Promise<VerifiedCapabilitySnapshot | null> { const snapshot = this.snapshots.get(snapshotKey); return snapshot ? structuredClone(snapshot) : null; }
  async getSnapshotById(snapshotId: string): Promise<VerifiedCapabilitySnapshot | null> {
    const snapshots = [...this.snapshots.values()].filter((snapshot) => snapshot.snapshotId === snapshotId);
    if (snapshots.length > 1) return fail("ERR_CAPABILITY_SNAPSHOT_ID_AMBIGUOUS");
    return snapshots[0] ? structuredClone(snapshots[0]) : null;
  }
  async saveSnapshot(snapshot: VerifiedCapabilitySnapshot): Promise<void> {
    assertGenericSnapshotRoute(snapshot);
    await this.saveSnapshotImmutable(snapshot);
  }
  async #persistPhase4VerifiedSnapshot(snapshot: VerifiedCapabilitySnapshot): Promise<void> {
    assertPhase4SnapshotRoute(snapshot);
    await this.saveSnapshotImmutable(snapshot);
  }
  createVerifiedCapabilitySnapshotPublisher(): VerifiedCapabilitySnapshotPublisher {
    return createBoundVerifiedCapabilitySnapshotPublisher(this, (snapshot) => this.#persistPhase4VerifiedSnapshot(snapshot));
  }
  private async saveSnapshotImmutable(snapshot: VerifiedCapabilitySnapshot): Promise<void> {
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
  async saveVerificationRun(run: CapabilityVerificationRun): Promise<void> {
    assertPersistableCapabilityVerificationRun(run);
    const existing = await this.getVerificationRunById(run.verificationRunId);
    if (existing && !isDeepStrictEqual(existing, run)) throw new Error(`ERR_IMMUTABLE_VERIFICATION_RUN_CONFLICT: ${run.verificationRunId}`);
    if (existing) return;
    const inserted = await this.database.insert(careerCapabilityRuns).values({ runId: run.verificationRunId, sourceBundleHash: run.sourceBundleHash, kernelVersion: run.kernelVersion, promptChecksum: run.promptChecksum, provider: run.inference.provider, model: run.inference.model, schemaVersion: run.schemaVersion, status: run.status, rawOutputHash: run.rawOutputHash, payload: run, createdAt: run.createdAt, completedAt: run.completedAt }).onConflictDoNothing().returning({ runId: careerCapabilityRuns.runId });
    if (!inserted.length) {
      const persisted = await this.getVerificationRunById(run.verificationRunId);
      if (!persisted || !isDeepStrictEqual(persisted, run)) throw new Error(`ERR_IMMUTABLE_VERIFICATION_RUN_CONFLICT: ${run.verificationRunId}`);
    }
  }
  async getVerificationRunById(verificationRunId: string): Promise<CapabilityVerificationRun | null> {
    const rows = await this.database.select({ payload: careerCapabilityRuns.payload }).from(careerCapabilityRuns).where(eq(careerCapabilityRuns.runId, verificationRunId)).limit(1);
    const payload = rows[0]?.payload;
    if (!payload || typeof payload !== "object" || Array.isArray(payload) || (payload as { runKind?: unknown }).runKind !== "CAPABILITY_VERIFICATION") return null;
    try {
      assertPersistableCapabilityVerificationRun(payload as CapabilityVerificationRun);
      return structuredClone(payload as CapabilityVerificationRun);
    } catch {
      return null;
    }
  }
  async getSnapshotByKey(snapshotKey: string): Promise<VerifiedCapabilitySnapshot | null> {
    const rows = await this.database.select({ payload: careerCapabilitySnapshots.payload }).from(careerCapabilitySnapshots).where(eq(careerCapabilitySnapshots.snapshotKey, snapshotKey)).limit(1);
    const snapshot = rows[0]?.payload as VerifiedCapabilitySnapshot | undefined;
    if (!snapshot) return null;
    assertVerifiedCapabilitySnapshot(snapshot);
    return snapshot;
  }
  async getSnapshotById(snapshotId: string): Promise<VerifiedCapabilitySnapshot | null> {
    const rows = await this.database.select({ payload: careerCapabilitySnapshots.payload }).from(careerCapabilitySnapshots).where(eq(careerCapabilitySnapshots.snapshotId, snapshotId)).limit(2);
    if (rows.length > 1) return fail("ERR_CAPABILITY_SNAPSHOT_ID_AMBIGUOUS");
    const snapshot = rows[0]?.payload as VerifiedCapabilitySnapshot | undefined;
    if (!snapshot) return null;
    assertVerifiedCapabilitySnapshot(snapshot);
    if (snapshot.snapshotId !== snapshotId) return fail("ERR_CAPABILITY_SNAPSHOT_ID_AMBIGUOUS");
    return structuredClone(snapshot);
  }
  async saveSnapshot(snapshot: VerifiedCapabilitySnapshot): Promise<void> {
    assertGenericSnapshotRoute(snapshot);
    await this.saveSnapshotImmutable(snapshot);
  }
  async #persistPhase4VerifiedSnapshot(snapshot: VerifiedCapabilitySnapshot): Promise<void> {
    assertPhase4SnapshotRoute(snapshot);
    await this.saveSnapshotImmutable(snapshot);
  }
  createVerifiedCapabilitySnapshotPublisher(): VerifiedCapabilitySnapshotPublisher {
    return createBoundVerifiedCapabilitySnapshotPublisher(this, (snapshot) => this.#persistPhase4VerifiedSnapshot(snapshot));
  }
  private async saveSnapshotImmutable(snapshot: VerifiedCapabilitySnapshot): Promise<void> {
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
