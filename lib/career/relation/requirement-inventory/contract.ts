import { createHash } from "node:crypto";
import type { RequirementRelationAggregate, TargetRoleRequirementInventory, T6BProtocol } from "./types";
const fail=(c:string):never=>{throw new Error(c)}; const stable=(v:unknown)=>JSON.stringify(v,(_k,x)=>x&&typeof x==="object"&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x); const h=(v:unknown)=>createHash("sha256").update(stable(v),"utf8").digest("hex").slice(0,32).toUpperCase(); const text=(v:unknown):v is string=>typeof v==="string"&&v.length>0;
export const protocolKeys=["relationProducerVersion","requirementAdmissionPolicyVersion","semanticPolicyVersion","levelPolicyVersion","scopePolicyVersion","evidencePolicyVersion"] as const;
export function assertT6BProtocol(value: unknown): asserts value is T6BProtocol { if(!value||typeof value!=="object"||Array.isArray(value)||Object.keys(value).length!==6||protocolKeys.some(k=>!text((value as any)[k]))) fail("ERR_REQUIREMENT_RELATION_AGGREGATE_INVALID"); }
export function deriveTargetRoleRequirementInventoryId(v: Omit<TargetRoleRequirementInventory,"targetRoleRequirementInventoryId"|"createdAt">){return `TRQINV_${h(["TARGET_ROLE_REQUIREMENT_INVENTORY_V1",v.targetRoleProfileRevisionId,v.requirementGroups,v.lineage.requirementInventoryPolicyVersion,v.schemaVersion])}`}
export function deriveRequirementRelationAggregateId(v: Omit<RequirementRelationAggregate,"requirementRelationAggregateId"|"createdAt">){return `RRA_${h(["REQUIREMENT_RELATION_AGGREGATE_V1",v.targetRoleRequirementInventoryId,v.verifiedCapabilitySnapshotId,v.targetRequirementEntityId,v.targetRequirementRevisionId,v.candidateCapabilityOperandIds,v.pairDispositions,v.lineage.t6bProtocol,v.lineage.pairInventoryPolicyVersion,v.lineage.compositionPolicyVersion,v.schemaVersion])}`}
const sortedUniqueText = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(text) && new Set(value).size === value.length &&
  value.every((id, index) => index === 0 || value[index - 1] < id);
const sameIdSet = (left: string[], right: string[]) =>
  left.length === right.length && new Set(left).size === left.length && left.every(id => right.includes(id));

const admissions = new Set([
  "DIRECT_CAPABILITY_REQUIREMENT",
  "TARGET_REQUIREMENT_INELIGIBLE",
  "TARGET_REQUIREMENT_ELIGIBILITY_UNKNOWN",
  "TARGET_REQUIREMENT_TYPE_NOT_DIRECT_CAPABILITY",
]);
const necessities = new Set(["REQUIRED", "PREFERRED", "OPTIONAL", "CONDITIONAL", "UNKNOWN"]);
const dimensionKeys = {
  semanticRelationInventory: ["SEMANTIC_EQUIVALENT", "SEMANTIC_CANDIDATE_COVERS_REQUIREMENT", "SEMANTIC_PARTIAL", "SEMANTIC_DISTINCT", "SEMANTIC_UNKNOWN"],
  levelRelationInventory: ["LEVEL_MEETS", "LEVEL_EXCEEDS", "LEVEL_BELOW", "LEVEL_NOT_COMPARABLE", "LEVEL_NOT_APPLICABLE", "LEVEL_UNKNOWN"],
  evidenceSufficiencyInventory: ["EVIDENCE_SUFFICIENT", "EVIDENCE_INSUFFICIENT", "EVIDENCE_UNKNOWN"],
  scopeRelationInventory: ["SCOPE_COMPATIBLE", "SCOPE_PARTIAL", "SCOPE_INCOMPATIBLE", "SCOPE_NOT_APPLICABLE", "SCOPE_UNKNOWN"],
} as const;

export function assertTargetRoleRequirementInventory(value: unknown): asserts value is TargetRoleRequirementInventory {
  const x = value as any;
  const groupsValid = Array.isArray(x?.requirementGroups) && x.requirementGroups.every((group: any, index: number) => {
    if (!text(group.targetRequirementEntityId) || (index > 0 && x.requirementGroups[index - 1].targetRequirementEntityId >= group.targetRequirementEntityId)) return false;
    if (!sortedUniqueText(group.targetRequirementRevisionIds)) return false;
    if (!['SINGLE_REVISION', 'MULTIPLE_REVISIONS_UNRESOLVED'].includes(group.revisionDisposition)) return false;
    if (group.revisionDisposition === 'SINGLE_REVISION' && (group.targetRequirementRevisionIds.length !== 1 || !admissions.has(group.directRelationAdmission))) return false;
    if (group.revisionDisposition === 'MULTIPLE_REVISIONS_UNRESOLVED' && group.directRelationAdmission !== null) return false;
    return Array.isArray(group.necessityStates) && group.necessityStates.length === group.targetRequirementRevisionIds.length && group.necessityStates.every((state: any, stateIndex: number) =>
      state?.targetRequirementRevisionId === group.targetRequirementRevisionIds[stateIndex] && necessities.has(state?.necessityState),
    );
  });
  if (!x || x.schemaVersion !== 'TARGET_ROLE_REQUIREMENT_INVENTORY_V1' || !text(x.targetRoleRequirementInventoryId) || !text(x.targetRoleProfileRevisionId) || !text(x.createdAt) || !text(x.lineage?.requirementInventoryPolicyVersion) || !groupsValid || !Array.isArray(x.failureReasons) || !x.failureReasons.every(text) || new Set(x.failureReasons).size !== x.failureReasons.length || !['COMPLETE', 'PARTIAL'].includes(x.inventoryState)) fail('ERR_TARGET_ROLE_REQUIREMENT_INVENTORY_INVALID');
  const expected = deriveTargetRoleRequirementInventoryId({ targetRoleProfileRevisionId: x.targetRoleProfileRevisionId, requirementGroups: x.requirementGroups, inventoryState: x.inventoryState, failureReasons: x.failureReasons, lineage: x.lineage, schemaVersion: x.schemaVersion });
  if (x.targetRoleRequirementInventoryId !== expected) fail('ERR_TARGET_ROLE_REQUIREMENT_INVENTORY_INVALID');
}

export function assertRequirementRelationAggregate(value: unknown): asserts value is RequirementRelationAggregate {
  const x = value as any;
  const pairsValid = Array.isArray(x?.pairDispositions) && Array.isArray(x?.candidateCapabilityOperandIds) && x.pairDispositions.length === x.candidateCapabilityOperandIds.length && x.pairDispositions.every((pair: any, index: number) => {
    if (pair?.candidateCapabilityOperandId !== x.candidateCapabilityOperandIds[index]) return false;
    if (pair.disposition === 'MATERIALIZED_RELATION') return text(pair.capabilityRequirementRelationId) && pair.capabilityRequirementRelationEvaluationResultId === null;
    if (pair.disposition === 'EVALUATION_FAILED') return text(pair.capabilityRequirementRelationEvaluationResultId) && pair.capabilityRequirementRelationId === null;
    return pair.disposition === 'NOT_EVALUATED' && pair.capabilityRequirementRelationId === null && pair.capabilityRequirementRelationEvaluationResultId === null;
  });
  const materializedIds = x?.pairDispositions?.filter((pair: any) => pair.disposition === 'MATERIALIZED_RELATION').map((pair: any) => pair.capabilityRequirementRelationId) ?? [];
  const dimensionsValid = Object.entries(dimensionKeys).every(([field, keys]) => {
    const inventory = x?.[field];
    if (!inventory || typeof inventory !== 'object' || Array.isArray(inventory) || Object.keys(inventory).length !== keys.length || keys.some(key => !Object.hasOwn(inventory, key))) return false;
    const listed = keys.flatMap(key => {
      const entry = inventory[key];
      return Number.isSafeInteger(entry?.count) && entry.count >= 0 && sortedUniqueText(entry?.capabilityRequirementRelationIds) && entry.count === entry.capabilityRequirementRelationIds.length ? entry.capabilityRequirementRelationIds : [null];
    });
    return !listed.includes(null) && sameIdSet(listed as string[], materializedIds);
  });
  if (!x || x.schemaVersion !== 'REQUIREMENT_RELATION_AGGREGATE_V1' || !text(x.requirementRelationAggregateId) || !text(x.createdAt) || !text(x.targetRoleRequirementInventoryId) || !text(x.verifiedCapabilitySnapshotId) || !text(x.targetRequirementEntityId) || !text(x.targetRequirementRevisionId) || !sortedUniqueText(x.candidateCapabilityOperandIds) || !pairsValid || !dimensionsValid || x.composition?.state !== 'COMPOSITION_NOT_EVALUATED' || x.proposalState !== 'PROPOSAL_ONLY' || x.authorityState !== 'NONE') fail('ERR_REQUIREMENT_RELATION_AGGREGATE_INVALID');
  assertT6BProtocol(x.lineage?.t6bProtocol);
  if (!text(x.lineage?.pairInventoryPolicyVersion) || !text(x.lineage?.compositionPolicyVersion)) fail('ERR_REQUIREMENT_RELATION_AGGREGATE_INVALID');
  const expected = deriveRequirementRelationAggregateId({ targetRoleRequirementInventoryId: x.targetRoleRequirementInventoryId, verifiedCapabilitySnapshotId: x.verifiedCapabilitySnapshotId, targetRequirementEntityId: x.targetRequirementEntityId, targetRequirementRevisionId: x.targetRequirementRevisionId, candidateCapabilityOperandIds: x.candidateCapabilityOperandIds, pairDispositions: x.pairDispositions, semanticRelationInventory: x.semanticRelationInventory, levelRelationInventory: x.levelRelationInventory, evidenceSufficiencyInventory: x.evidenceSufficiencyInventory, scopeRelationInventory: x.scopeRelationInventory, composition: x.composition, lineage: x.lineage, proposalState: x.proposalState, authorityState: x.authorityState, schemaVersion: x.schemaVersion });
  if (x.requirementRelationAggregateId !== expected) fail('ERR_REQUIREMENT_RELATION_AGGREGATE_INVALID');
}
export const sameRequirementInventoryData=(a:unknown,b:unknown)=>stable(a)===stable(b);
