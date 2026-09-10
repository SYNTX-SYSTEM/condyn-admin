import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { assertTensionState, type TensionState, type TensionStateRepository } from "../../relation/tension-state";
import { assertEvolutionInputState, sameEvolutionInputStateData, stableEvolutionInput, type EvolutionInputState, type EvolutionInputStateRepository } from "../../relation/evolution-input";
import { evolutionInputAggregateReferences, evolutionInputCandidateOperandReferences, evolutionInputEvaluationResultReferences, evolutionInputItemReferences, evolutionInputRelationReferences, evolutionInputRequirementReferences, evolutionInputStates } from "./postgres-schema";

const fail=(code:string):never=>{throw new Error(code)};
const unique=(values:string[])=>[...new Set(values)].sort();
const sameSet=(a:string[],b:string[])=>a.length===b.length&&new Set(a).size===a.length&&a.every(value=>b.includes(value));
const references=(value:EvolutionInputState)=>({
  items:value.items.map(stableEvolutionInput).sort(),
  requirements:unique(value.items.flatMap(item=>item.targetRequirementEntityId?item.targetRequirementRevisionIds.map(revision=>`${item.targetRequirementEntityId}:${revision}`):[])),
  aggregates:unique(value.items.flatMap(item=>item.requirementRelationAggregateId?[item.requirementRelationAggregateId]:[])),
  relations:unique(value.items.flatMap(item=>item.capabilityRequirementRelationId?[item.capabilityRequirementRelationId]:[])),
  results:unique(value.items.flatMap(item=>item.capabilityRequirementRelationEvaluationResultId?[item.capabilityRequirementRelationEvaluationResultId]:[])),
  operands:unique(value.items.flatMap(item=>item.candidateCapabilityOperandId?[item.candidateCapabilityOperandId]:[])),
});
const sameList=(a:string[],b:string[])=>a.length===b.length&&a.every((value,index)=>value===b[index]);

/** T9 carries no new facts: every item must be an exact T8 classification witness under matching root lineage; unresolved aggregates have no winner. */
const assertExactTensionReferences=(value:EvolutionInputState,tension:TensionState|null)=>{
  if(!tension)fail("ERR_EVOLUTION_INPUT_PERSISTENCE_FAILED");
  const exact=tension as TensionState;
  if(exact.roleRelationId!==value.roleRelationId||exact.verifiedCapabilitySnapshotId!==value.verifiedCapabilitySnapshotId||exact.targetRoleProfileRevisionId!==value.targetRoleProfileRevisionId||exact.targetRoleRequirementInventoryId!==value.targetRoleRequirementInventoryId)fail("ERR_EVOLUTION_INPUT_PERSISTENCE_FAILED");
  const source=[...exact.roleClassifications,...exact.requirementItems.flatMap(item=>item.classifications)].map(classification=>stableEvolutionInput({family:classification.family,code:classification.code,subjectKind:classification.subjectKind,dimension:classification.dimension,targetRequirementEntityId:classification.targetRequirementEntityId,targetRequirementRevisionIds:classification.targetRequirementRevisionIds,requirementRelationAggregateId:classification.requirementRelationAggregateId,candidateCapabilityOperandId:classification.candidateCapabilityOperandId,capabilityRequirementRelationId:classification.capabilityRequirementRelationId,capabilityRequirementRelationEvaluationResultId:classification.capabilityRequirementRelationEvaluationResultId,necessityStates:classification.necessityStates})).sort();
  const carried=value.items.map(item=>stableEvolutionInput({family:item.tensionClassificationFamily,code:item.tensionClassificationCode,subjectKind:item.subjectKind,dimension:item.dimension,targetRequirementEntityId:item.targetRequirementEntityId,targetRequirementRevisionIds:item.targetRequirementRevisionIds,requirementRelationAggregateId:item.requirementRelationAggregateId,candidateCapabilityOperandId:item.candidateCapabilityOperandId,capabilityRequirementRelationId:item.capabilityRequirementRelationId,capabilityRequirementRelationEvaluationResultId:item.capabilityRequirementRelationEvaluationResultId,necessityStates:item.necessityStates})).sort();
  if(!sameList(source,carried))fail("ERR_EVOLUTION_INPUT_PERSISTENCE_FAILED");
};

/** Exact reads reject JSON, physical columns, normalized witness sets, or direct T8 lineage that disagree; they never repair or filter corruption. */
export class PostgresEvolutionInputStateRepository implements EvolutionInputStateRepository {
  constructor(private readonly database:PostgresJsDatabase,private readonly tensions:TensionStateRepository){}
  async getEvolutionInputStateById(id:string):Promise<EvolutionInputState|null>{
    const rows=await this.database.select().from(evolutionInputStates).where(eq(evolutionInputStates.evolutionInputStateId,id)).limit(1);if(!rows.length)return null;
    try {const row=rows[0];assertEvolutionInputState(row.payload);const value=row.payload;
      if(row.evolutionInputStateId!==value.evolutionInputStateId||row.tensionStateId!==value.tensionStateId||row.roleRelationId!==value.roleRelationId||row.verifiedCapabilitySnapshotId!==value.verifiedCapabilitySnapshotId||row.targetRoleProfileRevisionId!==value.targetRoleProfileRevisionId||row.targetRoleRequirementInventoryId!==value.targetRoleRequirementInventoryId)fail("ERR_EVOLUTION_INPUT_PERSISTENCE_FAILED");
      const [items,requirements,aggregates,relations,results,operands]=await Promise.all([this.database.select().from(evolutionInputItemReferences).where(eq(evolutionInputItemReferences.evolutionInputStateId,id)),this.database.select().from(evolutionInputRequirementReferences).where(eq(evolutionInputRequirementReferences.evolutionInputStateId,id)),this.database.select().from(evolutionInputAggregateReferences).where(eq(evolutionInputAggregateReferences.evolutionInputStateId,id)),this.database.select().from(evolutionInputRelationReferences).where(eq(evolutionInputRelationReferences.evolutionInputStateId,id)),this.database.select().from(evolutionInputEvaluationResultReferences).where(eq(evolutionInputEvaluationResultReferences.evolutionInputStateId,id)),this.database.select().from(evolutionInputCandidateOperandReferences).where(eq(evolutionInputCandidateOperandReferences.evolutionInputStateId,id))]);
      const expected=references(value);if(!sameList(expected.items,items.map(item=>item.itemKey).sort())||!sameSet(expected.requirements,requirements.map(item=>`${item.targetRequirementEntityId}:${item.targetRequirementRevisionId}`))||!sameSet(expected.aggregates,aggregates.map(item=>item.requirementRelationAggregateId))||!sameSet(expected.relations,relations.map(item=>item.capabilityRequirementRelationId))||!sameSet(expected.results,results.map(item=>item.capabilityRequirementRelationEvaluationResultId))||!sameSet(expected.operands,operands.map(item=>item.candidateCapabilityOperandId)))fail("ERR_EVOLUTION_INPUT_PERSISTENCE_FAILED");
      const tension=await this.tensions.getTensionStateById(value.tensionStateId);assertExactTensionReferences(value,tension);return structuredClone(value);
    }catch {return fail("ERR_EVOLUTION_INPUT_PERSISTENCE_FAILED");}
  }
  async persistEvolutionInputState(value:EvolutionInputState):Promise<EvolutionInputState>{
    assertEvolutionInputState(value);const existing=await this.getEvolutionInputStateById(value.evolutionInputStateId);if(existing){if(!sameEvolutionInputStateData(existing,value))fail("ERR_EVOLUTION_INPUT_IMMUTABLE_CONFLICT");return existing;}
    const tension=await this.tensions.getTensionStateById(value.tensionStateId);assertExactTensionReferences(value,tension);
    await this.database.insert(evolutionInputStates).values({evolutionInputStateId:value.evolutionInputStateId,tensionStateId:value.tensionStateId,roleRelationId:value.roleRelationId,verifiedCapabilitySnapshotId:value.verifiedCapabilitySnapshotId,targetRoleProfileRevisionId:value.targetRoleProfileRevisionId,targetRoleRequirementInventoryId:value.targetRoleRequirementInventoryId,payload:structuredClone(value)}).onConflictDoNothing();
    const expected=references(value);for(const [index,item] of expected.items.entries())await this.database.insert(evolutionInputItemReferences).values({referenceId:`${value.evolutionInputStateId}:item:${index}`,evolutionInputStateId:value.evolutionInputStateId,itemKey:item}).onConflictDoNothing();
    for(const requirement of expected.requirements){const [entity,revision]=requirement.split(":");await this.database.insert(evolutionInputRequirementReferences).values({referenceId:`${value.evolutionInputStateId}:req:${requirement}`,evolutionInputStateId:value.evolutionInputStateId,targetRequirementEntityId:entity,targetRequirementRevisionId:revision}).onConflictDoNothing();}
    for(const aggregate of expected.aggregates)await this.database.insert(evolutionInputAggregateReferences).values({referenceId:`${value.evolutionInputStateId}:agg:${aggregate}`,evolutionInputStateId:value.evolutionInputStateId,requirementRelationAggregateId:aggregate}).onConflictDoNothing();
    for(const relation of expected.relations)await this.database.insert(evolutionInputRelationReferences).values({referenceId:`${value.evolutionInputStateId}:rel:${relation}`,evolutionInputStateId:value.evolutionInputStateId,capabilityRequirementRelationId:relation}).onConflictDoNothing();
    for(const result of expected.results)await this.database.insert(evolutionInputEvaluationResultReferences).values({referenceId:`${value.evolutionInputStateId}:result:${result}`,evolutionInputStateId:value.evolutionInputStateId,capabilityRequirementRelationEvaluationResultId:result}).onConflictDoNothing();
    for(const operand of expected.operands)await this.database.insert(evolutionInputCandidateOperandReferences).values({referenceId:`${value.evolutionInputStateId}:operand:${operand}`,evolutionInputStateId:value.evolutionInputStateId,candidateCapabilityOperandId:operand}).onConflictDoNothing();
    const reread=await this.getEvolutionInputStateById(value.evolutionInputStateId);if(!reread)fail("ERR_EVOLUTION_INPUT_PERSISTENCE_FAILED");if(!sameEvolutionInputStateData(reread,value))fail("ERR_EVOLUTION_INPUT_IMMUTABLE_CONFLICT");return reread!;
  }
}
