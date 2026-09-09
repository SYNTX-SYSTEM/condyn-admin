import type { CandidateCapabilityOperandRepository } from "../../capability-core/relation-operand";
import type { TargetRoleProfileRevision } from "../../target/role/profile";
import type { RequirementInventoryRepository, T6BPairRepository, TargetRoleRequirementInventory } from "../requirement-inventory";
import { assertRoleRelation, deriveRoleRelationId, sameRoleRelationData } from "./contract";
import type { RoleRelationRepository } from "./persistence";
import { produceRoleRelation, type RoleRelationProducerDependencies } from "./producer";
import type { RoleRelation } from "./types";

const fail = (code: string): never => { throw new Error(code); };

export interface T7BReplayImplementation { version: string; }
/** Exact historical policy lookup only; there is deliberately no current/default fallback. */
export interface T7BReplayImplementationRegistry {
  resolveRoleRequirementCoveragePolicy(version: string): T7BReplayImplementation | null;
  resolveRoleDimensionInventoryPolicy(version: string): T7BReplayImplementation | null;
  resolveRoleNecessityPolicy(version: string): T7BReplayImplementation | null;
  resolveRoleCompositionPolicy(version: string): T7BReplayImplementation | null;
}
export interface T7BReplayDependencies extends RoleRelationProducerDependencies {
  repository: RoleRelationRepository;
  inventories: Pick<RequirementInventoryRepository, "getInventoryById">;
  candidateRepository: CandidateCapabilityOperandRepository;
  t6b: T6BPairRepository;
  getTargetRoleProfileRevisionById(id: string): Promise<TargetRoleProfileRevision | null>;
  implementations: T7BReplayImplementationRegistry;
}

/** BYTE replay returns the exact validated durable artifact, without recomposition or provider work. */
export async function byteReplayRoleRelation(id: string, repository: RoleRelationRepository): Promise<RoleRelation> {
  const value = await repository.getRoleRelationById(id);
  if (!value) fail("ERR_ROLE_RELATION_NOT_FOUND");
  return structuredClone(value!);
}

async function exactInputs(historical: RoleRelation, dependencies: T7BReplayDependencies): Promise<{ profile: TargetRoleProfileRevision; inventory: TargetRoleRequirementInventory }> {
  const [profile, inventory] = await Promise.all([dependencies.getTargetRoleProfileRevisionById(historical.targetRoleProfileRevisionId), dependencies.inventories.getInventoryById(historical.targetRoleRequirementInventoryId)]);
  if (!profile || !inventory || inventory.targetRoleProfileRevisionId !== historical.targetRoleProfileRevisionId) fail("ERR_ROLE_RELATION_REPLAY_OPERAND_MISMATCH");
  return { profile: structuredClone(profile!), inventory: structuredClone(inventory!) };
}

async function recompose(historical: RoleRelation, dependencies: T7BReplayDependencies): Promise<RoleRelation> {
  const { profile, inventory } = await exactInputs(historical, dependencies);
  return produceRoleRelation({ verifiedCapabilitySnapshotId: historical.verifiedCapabilitySnapshotId, targetRoleProfileRevision: profile, inventory, createdAt: historical.createdAt, lineage: historical.lineage }, dependencies);
}

/** Semantic replay uses exact aggregate discovery; it cannot substitute a current policy or role conclusion. */
export async function semanticReplayRoleRelation(id: string, dependencies: T7BReplayDependencies): Promise<RoleRelation> {
  const historical = await byteReplayRoleRelation(id, dependencies.repository);
  try { assertRoleRelation(historical); } catch { fail("ERR_ROLE_RELATION_SEMANTIC_REPLAY_MISMATCH"); }
  const rebuilt = await recompose(historical, dependencies);
  if (rebuilt.roleRelationId !== historical.roleRelationId || !sameRoleRelationData(rebuilt, historical)) fail("ERR_ROLE_RELATION_SEMANTIC_REPLAY_MISMATCH");
  return structuredClone(historical);
}

function requireImplementation(value: T7BReplayImplementation | null, version: string): void {
  if (!value || value.version !== version) fail("ERR_ROLE_RELATION_PINNED_VERSION_UNAVAILABLE");
}

/** Derivation replay pins historical policy and rediscovers T6B terminals; T7B itself never calls a provider. */
export async function derivationReplayRoleRelation(id: string, dependencies: T7BReplayDependencies): Promise<RoleRelation> {
  const historical = await byteReplayRoleRelation(id, dependencies.repository);
  requireImplementation(dependencies.implementations.resolveRoleRequirementCoveragePolicy(historical.lineage.roleRequirementCoveragePolicyVersion), historical.lineage.roleRequirementCoveragePolicyVersion);
  requireImplementation(dependencies.implementations.resolveRoleDimensionInventoryPolicy(historical.lineage.roleDimensionInventoryPolicyVersion), historical.lineage.roleDimensionInventoryPolicyVersion);
  requireImplementation(dependencies.implementations.resolveRoleNecessityPolicy(historical.lineage.roleNecessityPolicyVersion), historical.lineage.roleNecessityPolicyVersion);
  requireImplementation(dependencies.implementations.resolveRoleCompositionPolicy(historical.lineage.roleCompositionPolicyVersion), historical.lineage.roleCompositionPolicyVersion);
  await exactInputs(historical, dependencies);
  for (const coverage of historical.requirementCoverages) {
    if (!coverage.requirementRelationAggregateIds.length) continue;
    if (coverage.targetRequirementRevisionIds.length !== 1) fail("ERR_ROLE_RELATION_DERIVATION_REPLAY_MISMATCH");
    const aggregates = await dependencies.aggregates.listAggregatesByExactLocator({ targetRoleRequirementInventoryId: historical.targetRoleRequirementInventoryId, verifiedCapabilitySnapshotId: historical.verifiedCapabilitySnapshotId, targetRequirementEntityId: coverage.targetRequirementEntityId, targetRequirementRevisionId: coverage.targetRequirementRevisionIds[0] });
    for (const aggregateId of coverage.requirementRelationAggregateIds) {
      const aggregate = aggregates.find(value => value.requirementRelationAggregateId === aggregateId);
      if (!aggregate) fail("ERR_ROLE_RELATION_DERIVATION_REPLAY_MISMATCH");
      const exactAggregate = aggregate!;
      for (const pair of exactAggregate.pairDispositions) {
        const terminal = await dependencies.t6b.discoverPairTerminal({ candidateCapabilityOperandId: pair.candidateCapabilityOperandId, targetRequirementRevisionId: exactAggregate.targetRequirementRevisionId, protocol: exactAggregate.lineage.t6bProtocol });
        if (terminal.disposition !== pair.disposition || (terminal.disposition === "MATERIALIZED_RELATION" && terminal.relation.capabilityRequirementRelationId !== pair.capabilityRequirementRelationId) || (terminal.disposition === "EVALUATION_FAILED" && terminal.result.capabilityRequirementRelationEvaluationResultId !== pair.capabilityRequirementRelationEvaluationResultId)) fail("ERR_ROLE_RELATION_DERIVATION_REPLAY_MISMATCH");
      }
    }
  }
  const rebuilt = await recompose(historical, dependencies);
  const { roleRelationId: _id, createdAt: _createdAt, ...semantic } = historical;
  if (deriveRoleRelationId(semantic) !== historical.roleRelationId || rebuilt.roleRelationId !== historical.roleRelationId || !sameRoleRelationData(rebuilt, historical)) fail("ERR_ROLE_RELATION_DERIVATION_REPLAY_MISMATCH");
  return structuredClone(historical);
}
