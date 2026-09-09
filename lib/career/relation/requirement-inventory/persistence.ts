import { assertRequirementRelationAggregate, assertTargetRoleRequirementInventory, sameRequirementInventoryData } from "./contract";
import type { RequirementRelationAggregate, TargetRoleRequirementInventory } from "./types";

const fail = (code: string): never => { throw new Error(code); };
/** Exact locator makes aggregate absence/multiplicity a repository fact, never caller-selected authority. */
export interface RequirementRelationAggregateLocator { targetRoleRequirementInventoryId: string; verifiedCapabilitySnapshotId: string; targetRequirementEntityId: string; targetRequirementRevisionId: string; }
export interface RequirementInventoryRepository {
  getInventoryById(id: string): Promise<TargetRoleRequirementInventory | null>;
  getAggregateById(id: string): Promise<RequirementRelationAggregate | null>;
  listAggregatesByInventoryAndSnapshot(input: { targetRoleRequirementInventoryId: string; verifiedCapabilitySnapshotId: string }): Promise<RequirementRelationAggregate[]>;
  listAggregatesByExactLocator(input: RequirementRelationAggregateLocator): Promise<RequirementRelationAggregate[]>;
  persistInventory(value: TargetRoleRequirementInventory): Promise<TargetRoleRequirementInventory>;
  persistAggregate(value: RequirementRelationAggregate): Promise<RequirementRelationAggregate>;
}
export class InMemoryRequirementInventoryRepository implements RequirementInventoryRepository {
  #inventories = new Map<string, TargetRoleRequirementInventory>();
  #aggregates = new Map<string, RequirementRelationAggregate>();
  async getInventoryById(id: string) { const value = this.#inventories.get(id); if (!value) return null; try { assertTargetRoleRequirementInventory(value); return structuredClone(value); } catch { return fail("ERR_REQUIREMENT_INVENTORY_PERSISTENCE_INVALID"); } }
  async getAggregateById(id: string) { const value = this.#aggregates.get(id); if (!value) return null; try { assertRequirementRelationAggregate(value); return structuredClone(value); } catch { return fail("ERR_REQUIREMENT_INVENTORY_PERSISTENCE_INVALID"); } }
  async listAggregatesByInventoryAndSnapshot(input: { targetRoleRequirementInventoryId: string; verifiedCapabilitySnapshotId: string }): Promise<RequirementRelationAggregate[]> { return [...this.#aggregates.values()].filter(value => value.targetRoleRequirementInventoryId === input.targetRoleRequirementInventoryId && value.verifiedCapabilitySnapshotId === input.verifiedCapabilitySnapshotId).map(value => structuredClone(value)).sort((a, b) => a.requirementRelationAggregateId.localeCompare(b.requirementRelationAggregateId)); }
  async listAggregatesByExactLocator(input: RequirementRelationAggregateLocator): Promise<RequirementRelationAggregate[]> { return [...this.#aggregates.values()].filter(value => value.targetRoleRequirementInventoryId === input.targetRoleRequirementInventoryId && value.verifiedCapabilitySnapshotId === input.verifiedCapabilitySnapshotId && value.targetRequirementEntityId === input.targetRequirementEntityId && value.targetRequirementRevisionId === input.targetRequirementRevisionId).map(value => structuredClone(value)).sort((a, b) => a.requirementRelationAggregateId.localeCompare(b.requirementRelationAggregateId)); }
  async persistInventory(value: TargetRoleRequirementInventory): Promise<TargetRoleRequirementInventory> { assertTargetRoleRequirementInventory(value); const prior = this.#inventories.get(value.targetRoleRequirementInventoryId); if (prior && !sameRequirementInventoryData(prior, value)) fail("ERR_REQUIREMENT_INVENTORY_IMMUTABLE_CONFLICT"); if (!prior) this.#inventories.set(value.targetRoleRequirementInventoryId, structuredClone(value)); const reread = await this.getInventoryById(value.targetRoleRequirementInventoryId); if (!reread || !sameRequirementInventoryData(reread, value)) fail("ERR_REQUIREMENT_INVENTORY_PERSISTENCE_INVALID"); return reread!; }
  async persistAggregate(value: RequirementRelationAggregate): Promise<RequirementRelationAggregate> { assertRequirementRelationAggregate(value); if (!await this.getInventoryById(value.targetRoleRequirementInventoryId)) fail("ERR_REQUIREMENT_INVENTORY_NOT_FOUND"); const prior = this.#aggregates.get(value.requirementRelationAggregateId); if (prior && !sameRequirementInventoryData(prior, value)) fail("ERR_REQUIREMENT_INVENTORY_IMMUTABLE_CONFLICT"); if (!prior) this.#aggregates.set(value.requirementRelationAggregateId, structuredClone(value)); const reread = await this.getAggregateById(value.requirementRelationAggregateId); if (!reread || !sameRequirementInventoryData(reread, value)) fail("ERR_REQUIREMENT_INVENTORY_PERSISTENCE_INVALID"); return reread!; }
}
