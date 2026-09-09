import { deriveCandidateCapabilityOperand, type CandidateCapabilityOperandRepository } from "../../capability-core/relation-operand";
import { assertTargetRoleProfileRevision, type TargetRoleProfileRevision } from "../../target/role/profile";
import { assertTargetRequirementRevision } from "../../target/role/requirement";
import { assertRequirementRelationAggregate, assertTargetRoleRequirementInventory, deriveRequirementRelationAggregateId, deriveTargetRoleRequirementInventoryId, sameRequirementInventoryData } from "./contract";
import { buildRequirementRelationAggregate, buildTargetRoleRequirementInventory } from "./producer";
import type { RequirementInventoryRepository } from "./persistence";
import type { RequirementInventoryDependencies, RequirementRelationAggregate, T6BPairRepository, TargetRoleRequirementInventory } from "./types";

const fail = (code: string): never => { throw new Error(code); };
const semanticEqual = <T extends { createdAt: string }>(left: T, right: T) => {
  const { createdAt: _leftTimestamp, ...leftSemantic } = left;
  const { createdAt: _rightTimestamp, ...rightSemantic } = right;
  return sameRequirementInventoryData(leftSemantic, rightSemantic);
};

export interface T7AReplayImplementation { version: string; }
/** Exact-version lookup only. This registry deliberately has no default/current fallback. */
export interface T7AReplayImplementationRegistry {
  resolveRequirementInventoryPolicy(version: string): T7AReplayImplementation | null;
  resolvePairInventoryPolicy(version: string): T7AReplayImplementation | null;
  resolveCompositionPolicy(version: string): T7AReplayImplementation | null;
}
export interface T7AReplayDependencies {
  repository: RequirementInventoryRepository;
  requirements: RequirementInventoryDependencies;
  getTargetRoleProfileRevisionById(id: string): Promise<TargetRoleProfileRevision | null>;
  candidateRepository: CandidateCapabilityOperandRepository;
  t6b: T6BPairRepository;
  implementations: T7AReplayImplementationRegistry;
}

export async function byteReplayTargetRoleRequirementInventory(id: string, repository: RequirementInventoryRepository): Promise<TargetRoleRequirementInventory> {
  const inventory = await repository.getInventoryById(id);
  if (!inventory) fail("ERR_REQUIREMENT_INVENTORY_NOT_FOUND");
  return structuredClone(inventory!);
}
export async function byteReplayRequirementRelationAggregate(id: string, repository: RequirementInventoryRepository): Promise<RequirementRelationAggregate> {
  const aggregate = await repository.getAggregateById(id);
  if (!aggregate) fail("ERR_REQUIREMENT_RELATION_AGGREGATE_NOT_FOUND");
  return structuredClone(aggregate!);
}

function requireImplementation(value: T7AReplayImplementation | null, version: string): void {
  if (!value || value.version !== version) fail("ERR_REQUIREMENT_INVENTORY_PINNED_VERSION_UNAVAILABLE");
}
async function exactProfile(id: string, dependencies: T7AReplayDependencies): Promise<TargetRoleProfileRevision> {
  const profile = await dependencies.getTargetRoleProfileRevisionById(id);
  if (!profile) fail("ERR_REQUIREMENT_INVENTORY_DERIVATION_REPLAY_MISMATCH");
  try { assertTargetRoleProfileRevision(profile); } catch { fail("ERR_REQUIREMENT_INVENTORY_DERIVATION_REPLAY_MISMATCH"); }
  if (profile!.targetRoleProfileRevisionId !== id) fail("ERR_REQUIREMENT_INVENTORY_DERIVATION_REPLAY_MISMATCH");
  return structuredClone(profile!);
}
async function candidateIds(aggregate: RequirementRelationAggregate, dependencies: T7AReplayDependencies): Promise<void> {
  const snapshot = await dependencies.candidateRepository.getSnapshotById(aggregate.verifiedCapabilitySnapshotId);
  if (!snapshot || snapshot.snapshotId !== aggregate.verifiedCapabilitySnapshotId) fail("ERR_REQUIREMENT_INVENTORY_DERIVATION_REPLAY_MISMATCH");
  const operands = await Promise.all(snapshot!.capabilities.map(capability => deriveCandidateCapabilityOperand({ verifiedCapabilitySnapshotId: snapshot!.snapshotId, capabilityId: capability.capabilityId }, dependencies.candidateRepository)));
  const actual = operands.map(operand => operand.candidateCapabilityOperandId).filter(id => aggregate.candidateCapabilityOperandIds.includes(id)).sort();
  const expected = [...aggregate.candidateCapabilityOperandIds].sort();
  if (actual.length !== expected.length || actual.some((id, index) => id !== expected[index])) fail("ERR_REQUIREMENT_INVENTORY_DERIVATION_REPLAY_MISMATCH");
}
async function rediscover(aggregate: RequirementRelationAggregate, dependencies: T7AReplayDependencies) {
  return Promise.all(aggregate.candidateCapabilityOperandIds.map(async candidateCapabilityOperandId => {
    const terminal = await dependencies.t6b.discoverPairTerminal({ candidateCapabilityOperandId, targetRequirementRevisionId: aggregate.targetRequirementRevisionId, protocol: aggregate.lineage.t6bProtocol });
    if (terminal.disposition === "MATERIALIZED_RELATION") return { candidateCapabilityOperandId, disposition: "MATERIALIZED_RELATION" as const, capabilityRequirementRelationId: terminal.relation.capabilityRequirementRelationId, capabilityRequirementRelationEvaluationResultId: null };
    if (terminal.disposition === "EVALUATION_FAILED") return { candidateCapabilityOperandId, disposition: "EVALUATION_FAILED" as const, capabilityRequirementRelationId: null, capabilityRequirementRelationEvaluationResultId: terminal.result.capabilityRequirementRelationEvaluationResultId };
    return { candidateCapabilityOperandId, disposition: "NOT_EVALUATED" as const, capabilityRequirementRelationId: null, capabilityRequirementRelationEvaluationResultId: null };
  }));
}

/** BYTE replay returns durable bytes. Semantic replay re-composes canonical state; neither mode promotes authority. */
export async function semanticReplayTargetRoleRequirementInventory(id: string, repository: RequirementInventoryRepository): Promise<TargetRoleRequirementInventory> {
  const inventory = await byteReplayTargetRoleRequirementInventory(id, repository);
  try { assertTargetRoleRequirementInventory(inventory); } catch { fail("ERR_REQUIREMENT_INVENTORY_SEMANTIC_REPLAY_MISMATCH"); }
  const { targetRoleRequirementInventoryId: _id, createdAt: _timestamp, ...semantic } = inventory;
  if (deriveTargetRoleRequirementInventoryId(semantic) !== id) fail("ERR_REQUIREMENT_INVENTORY_SEMANTIC_REPLAY_MISMATCH");
  return structuredClone(inventory!);
}
export async function semanticReplayRequirementRelationAggregate(id: string, dependencies: Pick<T7AReplayDependencies, "repository" | "t6b">): Promise<RequirementRelationAggregate> {
  const aggregate = await byteReplayRequirementRelationAggregate(id, dependencies.repository);
  const inventory = await dependencies.repository.getInventoryById(aggregate.targetRoleRequirementInventoryId);
  if (!inventory) fail("ERR_REQUIREMENT_RELATION_AGGREGATE_SEMANTIC_REPLAY_MISMATCH");
  try {
    const recomposed = await buildRequirementRelationAggregate({
      inventory: inventory!,
      verifiedCapabilitySnapshotId: aggregate.verifiedCapabilitySnapshotId,
      targetRequirementEntityId: aggregate.targetRequirementEntityId,
      targetRequirementRevisionId: aggregate.targetRequirementRevisionId,
      candidateCapabilityOperandIds: aggregate.candidateCapabilityOperandIds,
      pairDispositions: aggregate.pairDispositions,
      t6bProtocol: aggregate.lineage.t6bProtocol,
      pairInventoryPolicyVersion: aggregate.lineage.pairInventoryPolicyVersion,
      compositionPolicyVersion: aggregate.lineage.compositionPolicyVersion,
      createdAt: aggregate.createdAt,
    }, dependencies.t6b);
    if (recomposed.requirementRelationAggregateId !== aggregate.requirementRelationAggregateId || !sameRequirementInventoryData(recomposed, aggregate)) fail("ERR_REQUIREMENT_RELATION_AGGREGATE_SEMANTIC_REPLAY_MISMATCH");
  } catch {
    fail("ERR_REQUIREMENT_RELATION_AGGREGATE_SEMANTIC_REPLAY_MISMATCH");
  }
  return structuredClone(aggregate);
}

export async function derivationReplayTargetRoleRequirementInventory(id: string, dependencies: T7AReplayDependencies): Promise<TargetRoleRequirementInventory> {
  const historical = await byteReplayTargetRoleRequirementInventory(id, dependencies.repository);
  requireImplementation(dependencies.implementations.resolveRequirementInventoryPolicy(historical.lineage.requirementInventoryPolicyVersion), historical.lineage.requirementInventoryPolicyVersion);
  await exactProfile(historical.targetRoleProfileRevisionId, dependencies);
  const requirements = await dependencies.requirements.listTargetRequirementRevisionsByTargetRoleProfileRevisionId(historical.targetRoleProfileRevisionId);
  try { requirements.forEach(assertTargetRequirementRevision); } catch { fail("ERR_REQUIREMENT_INVENTORY_DERIVATION_REPLAY_MISMATCH"); }
  const rebuilt = await buildTargetRoleRequirementInventory({ targetRoleProfileRevisionId: historical.targetRoleProfileRevisionId, requirementInventoryPolicyVersion: historical.lineage.requirementInventoryPolicyVersion, createdAt: historical.createdAt }, { listTargetRequirementRevisionsByTargetRoleProfileRevisionId: async () => structuredClone(requirements) });
  if (rebuilt.targetRoleRequirementInventoryId !== historical.targetRoleRequirementInventoryId || !semanticEqual(rebuilt, historical)) fail("ERR_REQUIREMENT_INVENTORY_DERIVATION_REPLAY_MISMATCH");
  return structuredClone(historical);
}

export async function derivationReplayRequirementRelationAggregate(id: string, dependencies: T7AReplayDependencies): Promise<RequirementRelationAggregate> {
  const historical = await byteReplayRequirementRelationAggregate(id, dependencies.repository);
  const historicalInventory = await byteReplayTargetRoleRequirementInventory(historical.targetRoleRequirementInventoryId, dependencies.repository);
  requireImplementation(dependencies.implementations.resolveRequirementInventoryPolicy(historicalInventory.lineage.requirementInventoryPolicyVersion), historicalInventory.lineage.requirementInventoryPolicyVersion);
  requireImplementation(dependencies.implementations.resolvePairInventoryPolicy(historical.lineage.pairInventoryPolicyVersion), historical.lineage.pairInventoryPolicyVersion);
  requireImplementation(dependencies.implementations.resolveCompositionPolicy(historical.lineage.compositionPolicyVersion), historical.lineage.compositionPolicyVersion);
  const inventory = await derivationReplayTargetRoleRequirementInventory(historical.targetRoleRequirementInventoryId, dependencies);
  await candidateIds(historical, dependencies);
  const revision = (await dependencies.requirements.listTargetRequirementRevisionsByTargetRoleProfileRevisionId(inventory.targetRoleProfileRevisionId)).find(value => value.targetRequirementRevisionId === historical.targetRequirementRevisionId);
  if (!revision) fail("ERR_REQUIREMENT_RELATION_AGGREGATE_DERIVATION_REPLAY_MISMATCH");
  try { assertTargetRequirementRevision(revision); } catch { fail("ERR_REQUIREMENT_RELATION_AGGREGATE_DERIVATION_REPLAY_MISMATCH"); }
  const pairs = await rediscover(historical, dependencies);
  if (!sameRequirementInventoryData(pairs, historical.pairDispositions)) fail("ERR_REQUIREMENT_RELATION_AGGREGATE_DERIVATION_REPLAY_MISMATCH");
  let rebuilt: RequirementRelationAggregate;
  try {
    rebuilt = await buildRequirementRelationAggregate({ inventory, verifiedCapabilitySnapshotId: historical.verifiedCapabilitySnapshotId, targetRequirementEntityId: historical.targetRequirementEntityId, targetRequirementRevisionId: historical.targetRequirementRevisionId, candidateCapabilityOperandIds: historical.candidateCapabilityOperandIds, pairDispositions: pairs, t6bProtocol: historical.lineage.t6bProtocol, pairInventoryPolicyVersion: historical.lineage.pairInventoryPolicyVersion, compositionPolicyVersion: historical.lineage.compositionPolicyVersion, createdAt: historical.createdAt }, dependencies.t6b);
  } catch { fail("ERR_REQUIREMENT_RELATION_AGGREGATE_DERIVATION_REPLAY_MISMATCH"); }
  if (rebuilt!.requirementRelationAggregateId !== historical.requirementRelationAggregateId || !semanticEqual(rebuilt!, historical)) fail("ERR_REQUIREMENT_RELATION_AGGREGATE_DERIVATION_REPLAY_MISMATCH");
  return structuredClone(historical);
}
