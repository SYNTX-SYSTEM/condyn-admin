import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { assertRoleRelation, sameRoleRelationData, type RoleRelation, type RoleRelationRepository } from "../../relation/role-relation";
import { PostgresRequirementInventoryRepository } from "../requirement-inventory-persistence";
import { targetRequirementRevisions } from "../../target-adapters/role-requirement-revision-persistence/postgres-schema";
import { roleRelationAggregateReferences, roleRelationCoverageReferences, roleRelations } from "./postgres-schema";

const fail = (code: string): never => { throw new Error(code); };
const sameSet = (left: string[], right: string[]) => left.length === right.length && new Set(left).size === left.length && left.every(value => right.includes(value));
const coverageRefId = (roleRelationId: string, targetRequirementEntityId: string, targetRequirementRevisionId: string) => `${roleRelationId}:${targetRequirementEntityId}:${targetRequirementRevisionId}`;

/**
 * Immutable PostgreSQL representation for T7B. JSON and normalized references are both revalidated
 * so exact historical absence, failure, and unresolved facts cannot drift before downstream use.
 */
export class PostgresRoleRelationRepository implements RoleRelationRepository {
  constructor(private readonly database: PostgresJsDatabase) {}

  async getRoleRelationById(id: string): Promise<RoleRelation | null> {
    const rows = await this.database.select().from(roleRelations).where(eq(roleRelations.roleRelationId, id)).limit(1);
    if (!rows.length) return null;
    try {
      const row = rows[0];
      assertRoleRelation(row.payload);
      const value = row.payload;
      if (row.roleRelationId !== value.roleRelationId || row.targetRoleProfileRevisionId !== value.targetRoleProfileRevisionId || row.targetRoleRequirementInventoryId !== value.targetRoleRequirementInventoryId || row.verifiedCapabilitySnapshotId !== value.verifiedCapabilitySnapshotId) fail("ERR_ROLE_RELATION_PERSISTENCE_INVALID");
      const [aggregateRows, coverageRows] = await Promise.all([
        this.database.select().from(roleRelationAggregateReferences).where(eq(roleRelationAggregateReferences.roleRelationId, id)),
        this.database.select().from(roleRelationCoverageReferences).where(eq(roleRelationCoverageReferences.roleRelationId, id)),
      ]);
      if (!sameSet(value.requirementRelationAggregateIds, aggregateRows.map(row => row.requirementRelationAggregateId))) fail("ERR_ROLE_RELATION_PERSISTENCE_INVALID");
      const expectedCoverage = value.requirementCoverages.flatMap(coverage => coverage.targetRequirementRevisionIds.map(revisionId => `${coverage.targetRequirementEntityId}:${revisionId}:${coverage.disposition}`));
      const actualCoverage = coverageRows.map(row => `${row.targetRequirementEntityId}:${row.targetRequirementRevisionId}:${row.disposition}`);
      if (!sameSet(expectedCoverage, actualCoverage)) fail("ERR_ROLE_RELATION_PERSISTENCE_INVALID");
      await this.assertExactUpstreamReferences(value);
      return structuredClone(value);
    } catch { return fail("ERR_ROLE_RELATION_PERSISTENCE_INVALID"); }
  }

  async listRoleRelationAggregateIds(id: string): Promise<string[]> {
    const value = await this.getRoleRelationById(id);
    return value ? [...value.requirementRelationAggregateIds] : [];
  }

  async persistRoleRelation(value: RoleRelation): Promise<RoleRelation> {
    assertRoleRelation(value);
    await this.assertExactUpstreamReferences(value);
    const existing = await this.getRoleRelationById(value.roleRelationId);
    if (existing) {
      if (!sameRoleRelationData(existing, value)) fail("ERR_ROLE_RELATION_IMMUTABLE_CONFLICT");
      return existing;
    }
    const inserted = await this.database.insert(roleRelations).values({ roleRelationId: value.roleRelationId, targetRoleProfileRevisionId: value.targetRoleProfileRevisionId, targetRoleRequirementInventoryId: value.targetRoleRequirementInventoryId, verifiedCapabilitySnapshotId: value.verifiedCapabilitySnapshotId, payload: structuredClone(value) }).onConflictDoNothing().returning();
    for (const aggregateId of value.requirementRelationAggregateIds) await this.database.insert(roleRelationAggregateReferences).values({ referenceId: `${value.roleRelationId}:${aggregateId}`, roleRelationId: value.roleRelationId, requirementRelationAggregateId: aggregateId }).onConflictDoNothing();
    for (const coverage of value.requirementCoverages) for (const revisionId of coverage.targetRequirementRevisionIds) await this.database.insert(roleRelationCoverageReferences).values({ referenceId: coverageRefId(value.roleRelationId, coverage.targetRequirementEntityId, revisionId), roleRelationId: value.roleRelationId, targetRequirementEntityId: coverage.targetRequirementEntityId, targetRequirementRevisionId: revisionId, disposition: coverage.disposition }).onConflictDoNothing();
    const reread = await this.getRoleRelationById(value.roleRelationId);
    if (!reread) fail("ERR_ROLE_RELATION_PERSISTENCE_INVALID");
    if (!sameRoleRelationData(reread, value)) fail(inserted.length ? "ERR_ROLE_RELATION_PERSISTENCE_INVALID" : "ERR_ROLE_RELATION_IMMUTABLE_CONFLICT");
    return reread!;
  }

  private async assertExactUpstreamReferences(value: RoleRelation): Promise<void> {
    const inventories = new PostgresRequirementInventoryRepository(this.database);
    const inventory = await inventories.getInventoryById(value.targetRoleRequirementInventoryId);
    if (!inventory || inventory.targetRoleProfileRevisionId !== value.targetRoleProfileRevisionId) fail("ERR_ROLE_RELATION_PERSISTENCE_INVALID");
    const expectedAggregateIds = new Set(value.requirementRelationAggregateIds);
    for (const aggregateId of expectedAggregateIds) {
      const aggregate = await inventories.getAggregateById(aggregateId);
      if (!aggregate || aggregate.targetRoleRequirementInventoryId !== value.targetRoleRequirementInventoryId || aggregate.verifiedCapabilitySnapshotId !== value.verifiedCapabilitySnapshotId || !value.requirementCoverages.some(coverage => coverage.requirementRelationAggregateIds.includes(aggregateId) && coverage.targetRequirementEntityId === aggregate.targetRequirementEntityId && coverage.targetRequirementRevisionIds.length === 1 && coverage.targetRequirementRevisionIds[0] === aggregate.targetRequirementRevisionId)) fail("ERR_ROLE_RELATION_PERSISTENCE_INVALID");
    }
    for (const coverage of value.requirementCoverages) for (const revisionId of coverage.targetRequirementRevisionIds) {
      const rows = await this.database.select().from(targetRequirementRevisions).where(eq(targetRequirementRevisions.targetRequirementRevisionId, revisionId)).limit(1);
      if (!rows.length || rows[0].targetRoleProfileRevisionId !== value.targetRoleProfileRevisionId || rows[0].targetRequirementEntityId !== coverage.targetRequirementEntityId) fail("ERR_ROLE_RELATION_PERSISTENCE_INVALID");
    }
  }
}
