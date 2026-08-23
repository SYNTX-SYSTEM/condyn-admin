import { sha256Utf8 } from "./hashing";
import { createCapabilityRelation, type CapabilityRelation, type EvidenceClaim, type VerifiedCapability, type VerifiedCapabilitySnapshot } from "./schema";

export interface SnapshotConfiguration {
  sourceBundleHash: string;
  kernelVersion: string;
  prompt: VerifiedCapabilitySnapshot["prompt"];
  inference: VerifiedCapabilitySnapshot["inference"];
  schemaVersion: string;
}

export function computeSnapshotKey(snapshot: SnapshotConfiguration): string {
  return sha256Utf8(JSON.stringify([snapshot.sourceBundleHash, snapshot.kernelVersion, snapshot.prompt.checksum, snapshot.inference.provider, snapshot.inference.model, snapshot.schemaVersion]));
}

export function buildSnapshotId(snapshot: SnapshotConfiguration): string {
  return `SNAP_${computeSnapshotKey(snapshot).slice(0, 24).toUpperCase()}`;
}

export function assertVerifiedCapabilityEvidence(capability: VerifiedCapability, evidence: EvidenceClaim[]): void {
  if (!capability.evidenceIds.length || !capability.evidenceIds.every((id) => evidence.some((item) => item.evidenceId === id && item.verification.status === "VERIFIED"))) {
    throw new Error(`ERR_VERIFIED_CAPABILITY_WITHOUT_EVIDENCE: ${capability.capabilityId} requires at least one verified evidence item.`);
  }
}

export type VerifiedSnapshotInput = Pick<VerifiedCapabilitySnapshot, "sourceBundleHash" | "kernelVersion" | "prompt" | "inference" | "schemaVersion" | "createdAt" | "status"> & Pick<VerifiedCapabilitySnapshot["validationSummary"], "candidateCount" | "rejectedCandidateCount">;

export function assertVerifiedCapabilitySnapshot(snapshot: VerifiedCapabilitySnapshot): void {
  const expectedSnapshotId = buildSnapshotId(snapshot);
  if (snapshot.snapshotId !== expectedSnapshotId) throw new Error(`ERR_SNAPSHOT_ID_MISMATCH: expected ${expectedSnapshotId}.`);
  const assertUnique = (ids: string[], kind: string) => {
    if (new Set(ids).size !== ids.length) throw new Error(`ERR_SNAPSHOT_DUPLICATE_${kind}_ID`);
  };
  assertUnique(snapshot.capabilities.map(({ capabilityId }) => capabilityId), "CAPABILITY");
  assertUnique(snapshot.evidence.map(({ evidenceId }) => evidenceId), "EVIDENCE");
  assertUnique(snapshot.relations.map(({ relationId }) => relationId), "RELATION");
  if (JSON.stringify(snapshot.capabilityIds) !== JSON.stringify(snapshot.capabilities.map(({ capabilityId }) => capabilityId)) || JSON.stringify(snapshot.evidenceIds) !== JSON.stringify(snapshot.evidence.map(({ evidenceId }) => evidenceId)) || JSON.stringify(snapshot.relationIds) !== JSON.stringify(snapshot.relations.map(({ relationId }) => relationId))) throw new Error("ERR_SNAPSHOT_DERIVED_IDS_MISMATCH");
  snapshot.capabilities.forEach((capability) => assertVerifiedCapabilityEvidence(capability, snapshot.evidence));
  const capabilityIds = new Set(snapshot.capabilities.map(({ capabilityId }) => capabilityId));
  const relationsById = new Map(snapshot.relations.map((relation) => [relation.relationId, relation]));
  snapshot.capabilities.forEach((capability) => {
    capability.relationIds.forEach((relationId) => {
      const relation = relationsById.get(relationId);
      if (!relation) throw new Error(`ERR_SNAPSHOT_DANGLING_CAPABILITY_RELATION: ${capability.capabilityId}/${relationId}`);
      if (relation.sourceCapabilityRef !== capability.capabilityId && relation.targetCapabilityRef !== capability.capabilityId) throw new Error(`ERR_SNAPSHOT_UNRELATED_CAPABILITY_RELATION: ${capability.capabilityId}/${relationId}`);
    });
  });
  snapshot.relations.forEach((relation) => {
    if (!capabilityIds.has(relation.sourceCapabilityRef) || !capabilityIds.has(relation.targetCapabilityRef)) throw new Error(`ERR_SNAPSHOT_RELATION_ENDPOINT: ${relation.relationId}`);
    if (relation.relationId !== createCapabilityRelation({ sourceCapabilityRef: relation.sourceCapabilityRef, targetCapabilityRef: relation.targetCapabilityRef, relationType: relation.relationType, status: relation.status, reason: relation.reason, createdBy: relation.createdBy, createdAt: relation.createdAt }).relationId) throw new Error(`ERR_SNAPSHOT_RELATION_ID: ${relation.relationId}`);
    const source = snapshot.capabilities.find(({ capabilityId }) => capabilityId === relation.sourceCapabilityRef)!;
    const target = snapshot.capabilities.find(({ capabilityId }) => capabilityId === relation.targetCapabilityRef)!;
    if (!source.relationIds.includes(relation.relationId) || !target.relationIds.includes(relation.relationId)) throw new Error(`ERR_SNAPSHOT_RELATION_ENDPOINT_INDEX: ${relation.relationId}`);
  });
  const expectedSummary = { candidateCount: snapshot.validationSummary.candidateCount, rejectedCandidateCount: snapshot.validationSummary.rejectedCandidateCount, verifiedCapabilityCount: snapshot.capabilities.length, verifiedEvidenceCount: snapshot.evidence.filter(({ verification }) => verification.status === "VERIFIED").length, rejectedEvidenceCount: snapshot.evidence.filter(({ verification }) => verification.status !== "VERIFIED").length, unresolvedRelationCount: snapshot.relations.filter(({ relationType }) => relationType === "UNRESOLVED").length };
  if (JSON.stringify(snapshot.validationSummary) !== JSON.stringify(expectedSummary)) throw new Error("ERR_SNAPSHOT_VALIDATION_SUMMARY_MISMATCH");
}

export function createVerifiedCapabilitySnapshot(input: VerifiedSnapshotInput, capabilities: VerifiedCapability[], evidence: EvidenceClaim[], relations: CapabilityRelation[] = []): VerifiedCapabilitySnapshot {
  capabilities.forEach((capability) => assertVerifiedCapabilityEvidence(capability, evidence));
  const capabilityIds = capabilities.map(({ capabilityId }) => capabilityId);
  const evidenceIds = evidence.map(({ evidenceId }) => evidenceId);
  const relationIds = relations.map(({ relationId }) => relationId);
  const snapshotConfig = { sourceBundleHash: input.sourceBundleHash, kernelVersion: input.kernelVersion, prompt: input.prompt, inference: input.inference, schemaVersion: input.schemaVersion };
  const snapshot: VerifiedCapabilitySnapshot = { ...input, snapshotId: buildSnapshotId(snapshotConfig), capabilityIds, evidenceIds, relationIds, capabilities, evidence, relations, validationSummary: { candidateCount: input.candidateCount, rejectedCandidateCount: input.rejectedCandidateCount, verifiedCapabilityCount: capabilities.length, verifiedEvidenceCount: evidence.filter(({ verification }) => verification.status === "VERIFIED").length, rejectedEvidenceCount: evidence.filter(({ verification }) => verification.status !== "VERIFIED").length, unresolvedRelationCount: relations.filter(({ relationType }) => relationType === "UNRESOLVED").length } };
  assertVerifiedCapabilitySnapshot(snapshot);
  return snapshot;
}
