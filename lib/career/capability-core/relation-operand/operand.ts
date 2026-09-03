import { buildProvisionalCapabilityId } from "../identity";
import { sha256Utf8 } from "../hashing";
import { assertVerifiedCapabilitySnapshot } from "../snapshot";
import { assertPersistableCapabilityVerificationRun } from "../verification/run";
import type { CapabilityVerificationRun } from "../verification/types";
import type { CapabilityLevel, CapabilityScope, VerifiedCapabilitySnapshot } from "../schema";

// This boundary intentionally has no legacy matching dependency: historical
// matching output is neither a Phase-4 publication nor operand authority.
const fail = (code: string): never => { throw new Error(code); };
const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.length > 0;
const exactKeys = (value: unknown, keys: string[]): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
const sameSet = (left: string[], right: string[]) => left.length === right.length && new Set(left).size === left.length && new Set(right).size === right.length && left.every((item) => right.includes(item));

/**
 * A Phase-4 capability is admissible only as a future relation operand. It
 * establishes no relation outcome or downstream evaluation.
 */
export interface CandidateCapabilityOperand {
  candidateCapabilityOperandId: string;
  identity: { capabilityId: string; verifiedCapabilitySnapshotId: string };
  source: { sourceBundleHash: string; evidenceIds: string[]; sourceDocumentIds: string[] };
  capability: { canonicalName: string; scope: CapabilityScope; structuralDefinition: string; primaryDomain: string | null; demonstratedCapabilityLevel: CapabilityLevel | null };
  validation: { evidenceState: "VERIFIED"; semanticDefinitionState: "PASSED"; convergenceState: "VERIFIED"; levelVerificationState: "VERIFIED" | "UNVERIFIED" };
  authority: { publicationState: "PHASE4_VERIFIED"; relationEligibilityState: "RELATION_ELIGIBLE" | "RELATION_ELIGIBILITY_UNKNOWN" };
  lineage: { verificationRunId: string; verificationRawOutputHash: string; kernelVersion: string; promptChecksum: string; provider: string; model: string; snapshotSchemaVersion: string };
  schemaVersion: "CANDIDATE_CAPABILITY_OPERAND_V1";
}

export interface CandidateCapabilityOperandRepository {
  getSnapshotById(snapshotId: string): Promise<VerifiedCapabilitySnapshot | null>;
  getVerificationRunById(verificationRunId: string): Promise<CapabilityVerificationRun | null>;
}

export interface CandidateCapabilityOperandDerivationInput { verifiedCapabilitySnapshotId: string; capabilityId: string; }

/** The ID binds the exact authenticated publication, never a name, provider order, or timestamp. */
export function deriveCandidateCapabilityOperandId(input: Pick<CandidateCapabilityOperand, "identity" | "lineage" | "schemaVersion">): string {
  return `CCOP_${sha256Utf8(JSON.stringify(["CANDIDATE_CAPABILITY_OPERAND_V1", input.identity.verifiedCapabilitySnapshotId, input.identity.capabilityId, input.lineage.verificationRunId, input.lineage.verificationRawOutputHash, input.schemaVersion])).slice(0, 32).toUpperCase()}`;
}

export function assertCandidateCapabilityOperand(value: unknown): asserts value is CandidateCapabilityOperand {
  if (!exactKeys(value, ["candidateCapabilityOperandId", "identity", "source", "capability", "validation", "authority", "lineage", "schemaVersion"])) return fail("ERR_CANDIDATE_CAPABILITY_OPERAND_INVALID");
  const item = value as unknown as CandidateCapabilityOperand;
  if (!nonEmpty(item.candidateCapabilityOperandId) || !exactKeys(item.identity, ["capabilityId", "verifiedCapabilitySnapshotId"]) || !nonEmpty(item.identity.capabilityId) || !nonEmpty(item.identity.verifiedCapabilitySnapshotId) || !exactKeys(item.source, ["sourceBundleHash", "evidenceIds", "sourceDocumentIds"]) || !nonEmpty(item.source.sourceBundleHash) || !Array.isArray(item.source.evidenceIds) || !Array.isArray(item.source.sourceDocumentIds) || item.source.evidenceIds.some((id) => !nonEmpty(id)) || item.source.sourceDocumentIds.some((id) => !nonEmpty(id)) || new Set(item.source.evidenceIds).size !== item.source.evidenceIds.length || new Set(item.source.sourceDocumentIds).size !== item.source.sourceDocumentIds.length || !exactKeys(item.capability, ["canonicalName", "scope", "structuralDefinition", "primaryDomain", "demonstratedCapabilityLevel"]) || !nonEmpty(item.capability.canonicalName) || !["ATOMIC", "COMPOSITE"].includes(item.capability.scope) || !nonEmpty(item.capability.structuralDefinition) || !(item.capability.primaryDomain === null || nonEmpty(item.capability.primaryDomain)) || !(item.capability.demonstratedCapabilityLevel === null || ["L1", "L2", "L3", "L4", "L5", "L6"].includes(item.capability.demonstratedCapabilityLevel)) || !exactKeys(item.validation, ["evidenceState", "semanticDefinitionState", "convergenceState", "levelVerificationState"]) || item.validation.evidenceState !== "VERIFIED" || item.validation.semanticDefinitionState !== "PASSED" || item.validation.convergenceState !== "VERIFIED" || !["VERIFIED", "UNVERIFIED"].includes(item.validation.levelVerificationState) || !exactKeys(item.authority, ["publicationState", "relationEligibilityState"]) || item.authority.publicationState !== "PHASE4_VERIFIED" || !["RELATION_ELIGIBLE", "RELATION_ELIGIBILITY_UNKNOWN"].includes(item.authority.relationEligibilityState) || !exactKeys(item.lineage, ["verificationRunId", "verificationRawOutputHash", "kernelVersion", "promptChecksum", "provider", "model", "snapshotSchemaVersion"]) || Object.values(item.lineage).some((part) => !nonEmpty(part)) || !/^[a-f0-9]{64}$/.test(item.lineage.verificationRawOutputHash) || item.schemaVersion !== "CANDIDATE_CAPABILITY_OPERAND_V1" || item.candidateCapabilityOperandId !== deriveCandidateCapabilityOperandId(item)) return fail("ERR_CANDIDATE_CAPABILITY_OPERAND_INVALID");
}

function exactlyOne<T>(items: T[], predicate: (item: T) => boolean, code: string): T { const matches = items.filter(predicate); if (matches.length !== 1) return fail(code); return matches[0]; }

/**
 * Reconstructs an operand only from persisted Phase-4 truth. Generic VERIFIED
 * snapshots are insufficient because they lack the authenticated publication binding.
 */
export async function deriveCandidateCapabilityOperand(input: CandidateCapabilityOperandDerivationInput, repository: CandidateCapabilityOperandRepository): Promise<CandidateCapabilityOperand> {
  if (!nonEmpty(input.verifiedCapabilitySnapshotId) || !nonEmpty(input.capabilityId)) return fail("ERR_CANDIDATE_CAPABILITY_OPERAND_INVALID");
  const snapshot = await repository.getSnapshotById(input.verifiedCapabilitySnapshotId);
  if (snapshot === null) return fail("ERR_CANDIDATE_CAPABILITY_OPERAND_SNAPSHOT_NOT_FOUND");
  try { assertVerifiedCapabilitySnapshot(snapshot); } catch { return fail("ERR_CANDIDATE_CAPABILITY_OPERAND_SOURCE_INVALID"); }
  if (snapshot.snapshotId !== input.verifiedCapabilitySnapshotId || snapshot.status !== "VERIFIED" || snapshot.publication?.mode !== "PHASE4_VERIFIED") return fail("ERR_CANDIDATE_CAPABILITY_OPERAND_SOURCE_INVALID");
  const run = await repository.getVerificationRunById(snapshot.publication.verificationRunId);
  if (run === null) return fail("ERR_CANDIDATE_CAPABILITY_OPERAND_LINEAGE_NOT_FOUND");
  try { assertPersistableCapabilityVerificationRun(run); } catch { return fail("ERR_CANDIDATE_CAPABILITY_OPERAND_LINEAGE_INVALID"); }
  if (run.verificationRunId !== snapshot.publication.verificationRunId || run.rawOutputHash !== snapshot.publication.verificationRawOutputHash || run.sourceBundleHash !== snapshot.sourceBundleHash || run.kernelVersion !== snapshot.kernelVersion || run.promptChecksum !== snapshot.prompt.checksum || run.inference.provider !== snapshot.inference.provider || run.inference.model !== snapshot.inference.model || run.snapshotSchemaVersion !== snapshot.schemaVersion || run.payload.publicationEligibility !== "ELIGIBLE") return fail("ERR_CANDIDATE_CAPABILITY_OPERAND_LINEAGE_INVALID");
  const capability = exactlyOne(snapshot.capabilities, (item) => item.capabilityId === input.capabilityId, "ERR_CANDIDATE_CAPABILITY_OPERAND_CAPABILITY_NOT_FOUND");
  const provisionalCapabilityId = buildProvisionalCapabilityId(capability.canonicalName, capability.scope);
  if (capability.capabilityId !== provisionalCapabilityId.replace("PCAP_", "CAP_") || capability.validation.evidenceStatus !== "PASSED" || capability.validation.semanticDefinitionStatus !== "PASSED" || capability.validation.convergenceStatus !== "VERIFIED" || !capability.evidenceIds.length || !capability.provenance.sourceDocumentIds.length || new Set(capability.evidenceIds).size !== capability.evidenceIds.length || new Set(capability.provenance.sourceDocumentIds).size !== capability.provenance.sourceDocumentIds.length) return fail("ERR_CANDIDATE_CAPABILITY_OPERAND_SOURCE_INVALID");
  const semantic = exactlyOne(run.payload.semanticDefinitionOutcomes, (item) => item.provisionalCapabilityId === provisionalCapabilityId, "ERR_CANDIDATE_CAPABILITY_OPERAND_LINEAGE_INVALID");
  const level = exactlyOne(run.payload.demonstratedLevelOutcomes, (item) => item.provisionalCapabilityId === provisionalCapabilityId, "ERR_CANDIDATE_CAPABILITY_OPERAND_LINEAGE_INVALID");
  if (semantic.status !== "PASSED" || level.status !== capability.levelVerificationStatus || level.demonstratedCapabilityLevel !== capability.demonstratedCapabilityLevel) return fail("ERR_CANDIDATE_CAPABILITY_OPERAND_LINEAGE_INVALID");
  const evidence = capability.evidenceIds.map((evidenceId) => exactlyOne(snapshot.evidence, (item) => item.evidenceId === evidenceId, "ERR_CANDIDATE_CAPABILITY_OPERAND_EVIDENCE_INVENTORY_INVALID"));
  if (evidence.some((item) => item.verification.status !== "VERIFIED" || !nonEmpty(item.verification.matchedDocId)) || !sameSet(evidence.map((item) => item.verification.matchedDocId!), capability.provenance.sourceDocumentIds)) return fail("ERR_CANDIDATE_CAPABILITY_OPERAND_EVIDENCE_INVENTORY_INVALID");
  // Level truth is preserved independently. UNVERIFIED level does not make a
  // semantically authenticated operand ineligible for future evaluation.
  const operand: CandidateCapabilityOperand = { candidateCapabilityOperandId: "", identity: { capabilityId: capability.capabilityId, verifiedCapabilitySnapshotId: snapshot.snapshotId }, source: { sourceBundleHash: snapshot.sourceBundleHash, evidenceIds: [...capability.evidenceIds], sourceDocumentIds: [...capability.provenance.sourceDocumentIds] }, capability: { canonicalName: capability.canonicalName, scope: capability.scope, structuralDefinition: capability.structuralDefinition, primaryDomain: capability.primaryDomain, demonstratedCapabilityLevel: capability.demonstratedCapabilityLevel }, validation: { evidenceState: "VERIFIED", semanticDefinitionState: "PASSED", convergenceState: "VERIFIED", levelVerificationState: capability.levelVerificationStatus }, authority: { publicationState: "PHASE4_VERIFIED", relationEligibilityState: "RELATION_ELIGIBLE" }, lineage: { verificationRunId: run.verificationRunId, verificationRawOutputHash: run.rawOutputHash, kernelVersion: run.kernelVersion, promptChecksum: run.promptChecksum, provider: run.inference.provider, model: run.inference.model, snapshotSchemaVersion: run.snapshotSchemaVersion }, schemaVersion: "CANDIDATE_CAPABILITY_OPERAND_V1" };
  operand.candidateCapabilityOperandId = deriveCandidateCapabilityOperandId(operand);
  assertCandidateCapabilityOperand(operand);
  return structuredClone(operand);
}
