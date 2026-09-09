import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { PostgresCapabilityRequirementRelationRepository } from "../capability-requirement-persistence";
import { assertRequirementRelationAggregate, assertTargetRoleRequirementInventory, protocolKeys, sameRequirementInventoryData } from "../../relation/requirement-inventory/contract";
import type { RequirementInventoryRepository } from "../../relation/requirement-inventory/persistence";
import type { RequirementRelationAggregate, TargetRoleRequirementInventory } from "../../relation/requirement-inventory/types";
import { requirementRelationAggregateFailedResults, requirementRelationAggregateMaterializedRelations, requirementRelationAggregateNotEvaluatedPairs, requirementRelationAggregates, targetRoleRequirementInventories } from "./postgres-schema";

const fail = (code: string): never => { throw new Error(code); };
const physicalRefId = (aggregateId: string, candidateId: string) => `${aggregateId}:${candidateId}`;
const sameSet = (left: string[], right: string[]) => left.length === right.length && new Set(left).size === left.length && left.every(value => right.includes(value));

/** PostgreSQL preserves exact T7A artifact lineage; it does not select a requirement branch or decide relation meaning. */
export class PostgresRequirementInventoryRepository implements RequirementInventoryRepository {
  constructor(private readonly database: PostgresJsDatabase) {}

  async getInventoryById(id: string): Promise<TargetRoleRequirementInventory | null> {
    const rows = await this.database.select().from(targetRoleRequirementInventories).where(eq(targetRoleRequirementInventories.targetRoleRequirementInventoryId, id)).limit(1);
    if (!rows.length) return null;
    const row = rows[0];
    try {
      assertTargetRoleRequirementInventory(row.payload);
      if (row.targetRoleRequirementInventoryId !== row.payload.targetRoleRequirementInventoryId || row.targetRoleProfileRevisionId !== row.payload.targetRoleProfileRevisionId) fail("ERR_REQUIREMENT_INVENTORY_PERSISTENCE_INVALID");
      return structuredClone(row.payload);
    } catch { return fail("ERR_REQUIREMENT_INVENTORY_PERSISTENCE_INVALID"); }
  }

  async getAggregateById(id: string): Promise<RequirementRelationAggregate | null> {
    const rows = await this.database.select().from(requirementRelationAggregates).where(eq(requirementRelationAggregates.requirementRelationAggregateId, id)).limit(1);
    if (!rows.length) return null;
    const row = rows[0];
    try {
      assertRequirementRelationAggregate(row.payload);
      const aggregate = row.payload;
      if (row.requirementRelationAggregateId !== aggregate.requirementRelationAggregateId || row.targetRoleRequirementInventoryId !== aggregate.targetRoleRequirementInventoryId || row.verifiedCapabilitySnapshotId !== aggregate.verifiedCapabilitySnapshotId || row.targetRequirementRevisionId !== aggregate.targetRequirementRevisionId) fail("ERR_REQUIREMENT_INVENTORY_PERSISTENCE_INVALID");
      const [materializedRows, failedRows, notEvaluatedRows] = await Promise.all([
        this.database.select().from(requirementRelationAggregateMaterializedRelations).where(eq(requirementRelationAggregateMaterializedRelations.requirementRelationAggregateId, id)),
        this.database.select().from(requirementRelationAggregateFailedResults).where(eq(requirementRelationAggregateFailedResults.requirementRelationAggregateId, id)),
        this.database.select().from(requirementRelationAggregateNotEvaluatedPairs).where(eq(requirementRelationAggregateNotEvaluatedPairs.requirementRelationAggregateId, id)),
      ]);
      const expectedMaterialized = aggregate.pairDispositions.filter(pair => pair.disposition === "MATERIALIZED_RELATION").map(pair => `${pair.candidateCapabilityOperandId}:${pair.capabilityRequirementRelationId}`);
      const expectedFailed = aggregate.pairDispositions.filter(pair => pair.disposition === "EVALUATION_FAILED").map(pair => `${pair.candidateCapabilityOperandId}:${pair.capabilityRequirementRelationEvaluationResultId}`);
      const expectedNotEvaluated = aggregate.pairDispositions.filter(pair => pair.disposition === "NOT_EVALUATED").map(pair => `${pair.candidateCapabilityOperandId}:${aggregate.targetRequirementRevisionId}`);
      const actualMaterialized = materializedRows.map(pair => `${pair.candidateCapabilityOperandId}:${pair.capabilityRequirementRelationId}`);
      const actualFailed = failedRows.map(pair => `${pair.candidateCapabilityOperandId}:${pair.capabilityRequirementRelationEvaluationResultId}`);
      const actualNotEvaluated = notEvaluatedRows.map(pair => `${pair.candidateCapabilityOperandId}:${pair.targetRequirementRevisionId}`);
      if (!sameSet(expectedMaterialized, actualMaterialized) || !sameSet(expectedFailed, actualFailed) || !sameSet(expectedNotEvaluated, actualNotEvaluated)) fail("ERR_REQUIREMENT_INVENTORY_PERSISTENCE_INVALID");
      return structuredClone(aggregate);
    } catch { return fail("ERR_REQUIREMENT_INVENTORY_PERSISTENCE_INVALID"); }
  }

  async persistInventory(value: TargetRoleRequirementInventory): Promise<TargetRoleRequirementInventory> {
    assertTargetRoleRequirementInventory(value);
    const existing = await this.getInventoryById(value.targetRoleRequirementInventoryId);
    if (existing) {
      if (!sameRequirementInventoryData(existing, value)) fail("ERR_REQUIREMENT_INVENTORY_IMMUTABLE_CONFLICT");
      return existing;
    }
    const inserted = await this.database.insert(targetRoleRequirementInventories).values({ targetRoleRequirementInventoryId: value.targetRoleRequirementInventoryId, targetRoleProfileRevisionId: value.targetRoleProfileRevisionId, payload: structuredClone(value) }).onConflictDoNothing().returning();
    const reread = await this.getInventoryById(value.targetRoleRequirementInventoryId);
    if (!reread) fail("ERR_REQUIREMENT_INVENTORY_PERSISTENCE_INVALID");
    if (!sameRequirementInventoryData(reread, value)) fail(inserted.length ? "ERR_REQUIREMENT_INVENTORY_PERSISTENCE_INVALID" : "ERR_REQUIREMENT_INVENTORY_IMMUTABLE_CONFLICT");
    return reread!;
  }

  async persistAggregate(value: RequirementRelationAggregate): Promise<RequirementRelationAggregate> {
    assertRequirementRelationAggregate(value);
    const inventory = await this.getInventoryById(value.targetRoleRequirementInventoryId);
    if (!inventory) fail("ERR_REQUIREMENT_INVENTORY_NOT_FOUND");
    const group = inventory!.requirementGroups.find(candidate => candidate.targetRequirementEntityId === value.targetRequirementEntityId);
    if (!group || group.revisionDisposition !== "SINGLE_REVISION" || group.targetRequirementRevisionIds[0] !== value.targetRequirementRevisionId || group.directRelationAdmission !== "DIRECT_CAPABILITY_REQUIREMENT") fail("ERR_REQUIREMENT_INVENTORY_PERSISTENCE_INVALID");
    await this.assertExactTerminalReferences(value);
    const existing = await this.getAggregateById(value.requirementRelationAggregateId);
    if (existing) {
      if (!sameRequirementInventoryData(existing, value)) fail("ERR_REQUIREMENT_INVENTORY_IMMUTABLE_CONFLICT");
      return existing;
    }
    const inserted = await this.database.insert(requirementRelationAggregates).values({ requirementRelationAggregateId: value.requirementRelationAggregateId, targetRoleRequirementInventoryId: value.targetRoleRequirementInventoryId, verifiedCapabilitySnapshotId: value.verifiedCapabilitySnapshotId, targetRequirementRevisionId: value.targetRequirementRevisionId, payload: structuredClone(value) }).onConflictDoNothing().returning();
    for (const pair of value.pairDispositions) {
      const referenceId = physicalRefId(value.requirementRelationAggregateId, pair.candidateCapabilityOperandId);
      if (pair.disposition === "MATERIALIZED_RELATION") await this.database.insert(requirementRelationAggregateMaterializedRelations).values({ referenceId, requirementRelationAggregateId: value.requirementRelationAggregateId, candidateCapabilityOperandId: pair.candidateCapabilityOperandId, capabilityRequirementRelationId: pair.capabilityRequirementRelationId! }).onConflictDoNothing();
      else if (pair.disposition === "EVALUATION_FAILED") await this.database.insert(requirementRelationAggregateFailedResults).values({ referenceId, requirementRelationAggregateId: value.requirementRelationAggregateId, candidateCapabilityOperandId: pair.candidateCapabilityOperandId, capabilityRequirementRelationEvaluationResultId: pair.capabilityRequirementRelationEvaluationResultId! }).onConflictDoNothing();
      else await this.database.insert(requirementRelationAggregateNotEvaluatedPairs).values({ referenceId, requirementRelationAggregateId: value.requirementRelationAggregateId, candidateCapabilityOperandId: pair.candidateCapabilityOperandId, targetRequirementRevisionId: value.targetRequirementRevisionId }).onConflictDoNothing();
    }
    const reread = await this.getAggregateById(value.requirementRelationAggregateId);
    if (!reread) fail("ERR_REQUIREMENT_INVENTORY_PERSISTENCE_INVALID");
    if (!sameRequirementInventoryData(reread, value)) fail(inserted.length ? "ERR_REQUIREMENT_INVENTORY_PERSISTENCE_INVALID" : "ERR_REQUIREMENT_INVENTORY_IMMUTABLE_CONFLICT");
    return reread!;
  }

  private async assertExactTerminalReferences(value: RequirementRelationAggregate): Promise<void> {
    const relations = new PostgresCapabilityRequirementRelationRepository(this.database);
    for (const pair of value.pairDispositions) {
      if (pair.disposition === "NOT_EVALUATED") continue;
      if (pair.disposition === "MATERIALIZED_RELATION") {
        const relation = await relations.getRelationById(pair.capabilityRequirementRelationId!);
        if (!relation || relation.evaluationState !== "COMPLETED" || relation.proposalState !== "PROPOSAL_ONLY" || relation.authorityState !== "NONE" || relation.operands.candidate.candidateCapabilityOperandId !== pair.candidateCapabilityOperandId || relation.operands.candidate.verifiedCapabilitySnapshotId !== value.verifiedCapabilitySnapshotId || relation.operands.targetRequirementRevisionId !== value.targetRequirementRevisionId || protocolKeys.some(key => relation.lineage[key] !== value.lineage.t6bProtocol[key])) fail("ERR_REQUIREMENT_INVENTORY_PERSISTENCE_INVALID");
        continue;
      }
      const result = await relations.getResultById(pair.capabilityRequirementRelationEvaluationResultId!);
      if (!result || result.resultState === "COMPLETED" || result.candidate.candidateCapabilityOperandId !== pair.candidateCapabilityOperandId || result.candidate.verifiedCapabilitySnapshotId !== value.verifiedCapabilitySnapshotId || result.targetRequirementRevisionId !== value.targetRequirementRevisionId) fail("ERR_REQUIREMENT_INVENTORY_PERSISTENCE_INVALID");
      const run = await relations.getRunById(result!.capabilityRequirementRelationEvaluationRunId);
      if (!run || run.status === "COMPLETED" || run.candidate.candidateCapabilityOperandId !== pair.candidateCapabilityOperandId || run.candidate.verifiedCapabilitySnapshotId !== value.verifiedCapabilitySnapshotId || run.targetRequirementRevisionId !== value.targetRequirementRevisionId || protocolKeys.some(key => run.producer[key] !== value.lineage.t6bProtocol[key])) fail("ERR_REQUIREMENT_INVENTORY_PERSISTENCE_INVALID");
    }
  }
}
