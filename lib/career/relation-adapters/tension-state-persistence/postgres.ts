import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { assertTensionState, sameTensionStateData, type TensionState, type TensionStateRepository } from "../../relation/tension-state";
import { PostgresRoleRelationRepository } from "../role-relation-persistence";
import { tensionStateAggregateReferences, tensionStateCandidateOperandReferences, tensionStateEvaluationResultReferences, tensionStateRelationReferences, tensionStateRequirementReferences, tensionStates } from "./postgres-schema";

const fail=(code:string):never=>{throw new Error(code)};
const sameSet=(a:string[],b:string[])=>a.length===b.length&&new Set(a).size===a.length&&a.every(x=>b.includes(x));
const unique=(values:string[])=>[...new Set(values)].sort();
const refs=(value:TensionState)=>{
  const classifications=[...value.roleClassifications,...value.requirementItems.flatMap(item=>item.classifications)];
  return {
    requirements:unique(value.requirementItems.flatMap(item=>item.targetRequirementRevisionIds.map(revisionId=>`${item.targetRequirementEntityId}:${revisionId}`))),
    aggregates:unique(classifications.flatMap(x=>x.requirementRelationAggregateId?[x.requirementRelationAggregateId]:[])),
    relations:unique(classifications.flatMap(x=>x.capabilityRequirementRelationId?[x.capabilityRequirementRelationId]:[])),
    results:unique(classifications.flatMap(x=>x.capabilityRequirementRelationEvaluationResultId?[x.capabilityRequirementRelationEvaluationResultId]:[])),
    operands:unique(classifications.flatMap(x=>x.candidateCapabilityOperandId?[x.candidateCapabilityOperandId]:[])),
  };
};

/** T8 carries references copied from T7B; a syntactically valid TSN_ must not introduce foreign witnesses. */
const assertExactRoleReferences=(value:TensionState,role:Awaited<ReturnType<PostgresRoleRelationRepository["getRoleRelationById"]>>)=>{
  if(!role||role.verifiedCapabilitySnapshotId!==value.verifiedCapabilitySnapshotId||role.targetRoleProfileRevisionId!==value.targetRoleProfileRevisionId||role.targetRoleRequirementInventoryId!==value.targetRoleRequirementInventoryId)fail("ERR_TENSION_STATE_PERSISTENCE_FAILED");
  if(value.requirementItems.length!==role.requirementCoverages.length)fail("ERR_TENSION_STATE_PERSISTENCE_FAILED");
  const dimensions=new Map(role.aggregateDimensionInventories.map(aggregate=>[aggregate.requirementRelationAggregateId,aggregate]));
  for(const item of value.requirementItems){
    const coverage=role.requirementCoverages.find(candidate=>candidate.targetRequirementEntityId===item.targetRequirementEntityId);
    if(!coverage||item.coverageDisposition!==coverage.disposition||!sameSet(item.targetRequirementRevisionIds,coverage.targetRequirementRevisionIds)||JSON.stringify(item.necessityStates)!==JSON.stringify(coverage.necessityStates))fail("ERR_TENSION_STATE_PERSISTENCE_FAILED");
    for(const classification of item.classifications){
      if(classification.targetRequirementEntityId!==item.targetRequirementEntityId||!sameSet(classification.targetRequirementRevisionIds,item.targetRequirementRevisionIds)||JSON.stringify(classification.necessityStates)!==JSON.stringify(item.necessityStates))fail("ERR_TENSION_STATE_PERSISTENCE_FAILED");
      if(!classification.requirementRelationAggregateId)continue;
      if(!coverage.requirementRelationAggregateIds.includes(classification.requirementRelationAggregateId))fail("ERR_TENSION_STATE_PERSISTENCE_FAILED");
      const aggregate=dimensions.get(classification.requirementRelationAggregateId);
      if(!aggregate)fail("ERR_TENSION_STATE_PERSISTENCE_FAILED");
      const relationIds=[...Object.values(aggregate.semanticRelationInventory),...Object.values(aggregate.levelRelationInventory),...Object.values(aggregate.evidenceSufficiencyInventory),...Object.values(aggregate.scopeRelationInventory)].flatMap(entry=>entry.capabilityRequirementRelationIds);
      if(classification.capabilityRequirementRelationId&&!relationIds.includes(classification.capabilityRequirementRelationId))fail("ERR_TENSION_STATE_PERSISTENCE_FAILED");
      const pair=classification.candidateCapabilityOperandId?aggregate.pairDispositions.find(candidate=>candidate.candidateCapabilityOperandId===classification.candidateCapabilityOperandId):null;
      if(classification.candidateCapabilityOperandId&&!pair)fail("ERR_TENSION_STATE_PERSISTENCE_FAILED");
      if(classification.capabilityRequirementRelationEvaluationResultId&&(!pair||pair.disposition!=="EVALUATION_FAILED"||pair.capabilityRequirementRelationEvaluationResultId!==classification.capabilityRequirementRelationEvaluationResultId))fail("ERR_TENSION_STATE_PERSISTENCE_FAILED");
    }
  }
};

/** Exact reads require physical columns, JSON, normalized witnesses, and the exact RoleRelation lineage to agree; PostgreSQL never repairs or selects among them. */
export class PostgresTensionStateRepository implements TensionStateRepository {
  constructor(private readonly database:PostgresJsDatabase){}
  async getTensionStateById(id:string):Promise<TensionState|null>{
    const rows=await this.database.select().from(tensionStates).where(eq(tensionStates.tensionStateId,id)).limit(1);
    if(!rows.length)return null;
    try{
      const row=rows[0]; assertTensionState(row.payload); const value=row.payload;
      if(row.tensionStateId!==value.tensionStateId||row.roleRelationId!==value.roleRelationId||row.verifiedCapabilitySnapshotId!==value.verifiedCapabilitySnapshotId||row.targetRoleProfileRevisionId!==value.targetRoleProfileRevisionId||row.targetRoleRequirementInventoryId!==value.targetRoleRequirementInventoryId)fail("ERR_TENSION_STATE_PERSISTENCE_FAILED");
      const [requirements,aggregates,relations,results,operands]=await Promise.all([
        this.database.select().from(tensionStateRequirementReferences).where(eq(tensionStateRequirementReferences.tensionStateId,id)),this.database.select().from(tensionStateAggregateReferences).where(eq(tensionStateAggregateReferences.tensionStateId,id)),this.database.select().from(tensionStateRelationReferences).where(eq(tensionStateRelationReferences.tensionStateId,id)),this.database.select().from(tensionStateEvaluationResultReferences).where(eq(tensionStateEvaluationResultReferences.tensionStateId,id)),this.database.select().from(tensionStateCandidateOperandReferences).where(eq(tensionStateCandidateOperandReferences.tensionStateId,id)),
      ]);
      const expected=refs(value);
      if(!sameSet(expected.requirements,requirements.map(x=>`${x.targetRequirementEntityId}:${x.targetRequirementRevisionId}`))||!sameSet(expected.aggregates,aggregates.map(x=>x.requirementRelationAggregateId))||!sameSet(expected.relations,relations.map(x=>x.capabilityRequirementRelationId))||!sameSet(expected.results,results.map(x=>x.capabilityRequirementRelationEvaluationResultId))||!sameSet(expected.operands,operands.map(x=>x.candidateCapabilityOperandId)))fail("ERR_TENSION_STATE_PERSISTENCE_FAILED");
      const role=await new PostgresRoleRelationRepository(this.database).getRoleRelationById(value.roleRelationId);
      assertExactRoleReferences(value,role);
      return structuredClone(value);
    }catch{return fail("ERR_TENSION_STATE_PERSISTENCE_FAILED");}
  }
  async persistTensionState(value:TensionState):Promise<TensionState>{
    assertTensionState(value);
    const existing=await this.getTensionStateById(value.tensionStateId);
    if(existing){if(!sameTensionStateData(existing,value))fail("ERR_TENSION_STATE_IMMUTABLE_CONFLICT");return existing;}
    const role=await new PostgresRoleRelationRepository(this.database).getRoleRelationById(value.roleRelationId);
    assertExactRoleReferences(value,role);
    await this.database.insert(tensionStates).values({tensionStateId:value.tensionStateId,roleRelationId:value.roleRelationId,verifiedCapabilitySnapshotId:value.verifiedCapabilitySnapshotId,targetRoleProfileRevisionId:value.targetRoleProfileRevisionId,targetRoleRequirementInventoryId:value.targetRoleRequirementInventoryId,payload:structuredClone(value)}).onConflictDoNothing();
    const expected=refs(value);
    for(const valueRef of expected.requirements){const [entity,revision]=valueRef.split(":");await this.database.insert(tensionStateRequirementReferences).values({referenceId:`${value.tensionStateId}:req:${valueRef}`,tensionStateId:value.tensionStateId,targetRequirementEntityId:entity,targetRequirementRevisionId:revision}).onConflictDoNothing();}
    for(const aggregateId of expected.aggregates)await this.database.insert(tensionStateAggregateReferences).values({referenceId:`${value.tensionStateId}:agg:${aggregateId}`,tensionStateId:value.tensionStateId,requirementRelationAggregateId:aggregateId}).onConflictDoNothing();
    for(const relationId of expected.relations)await this.database.insert(tensionStateRelationReferences).values({referenceId:`${value.tensionStateId}:rel:${relationId}`,tensionStateId:value.tensionStateId,capabilityRequirementRelationId:relationId}).onConflictDoNothing();
    for(const resultId of expected.results)await this.database.insert(tensionStateEvaluationResultReferences).values({referenceId:`${value.tensionStateId}:result:${resultId}`,tensionStateId:value.tensionStateId,capabilityRequirementRelationEvaluationResultId:resultId}).onConflictDoNothing();
    for(const operandId of expected.operands)await this.database.insert(tensionStateCandidateOperandReferences).values({referenceId:`${value.tensionStateId}:operand:${operandId}`,tensionStateId:value.tensionStateId,candidateCapabilityOperandId:operandId}).onConflictDoNothing();
    const reread=await this.getTensionStateById(value.tensionStateId);if(!reread)fail("ERR_TENSION_STATE_PERSISTENCE_FAILED");if(!sameTensionStateData(reread,value))fail("ERR_TENSION_STATE_IMMUTABLE_CONFLICT");return reread;
  }
}
