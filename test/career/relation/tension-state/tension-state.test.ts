import { describe, expect, it } from "vitest";
import { deriveRoleRelationId, InMemoryRoleRelationRepository, type RoleRelation } from "../../../../lib/career/relation/role-relation";
import { byteReplayTensionState, classifyRoleRelation, derivationReplayTensionState, InMemoryTensionStateRepository, produceAndPersistTensionState, produceTensionState, semanticReplayTensionState } from "../../../../lib/career/relation/tension-state";

const stamp="2026-11-01T00:00:00.000Z";
const policy={resolveTensionClassificationPolicy:(version:string)=>version==="tension-v1"?{version}:null};
const inventory=(values:string[], relationIds:string[])=>Object.fromEntries(values.map((value,index)=>[value,{count:1,capabilityRequirementRelationIds:[relationIds[index]??`CRREL_${value}`]}]));

function role():RoleRelation {
  const semantic={
    verifiedCapabilitySnapshotId:"SNAPSHOT_1",targetRoleProfileRevisionId:"PROFILE_1",targetRoleRequirementInventoryId:"TRQINV_1",
    requirementCoverages:[
      {targetRequirementEntityId:"REQ_A",targetRequirementRevisionIds:["REV_A"],necessityStates:[{targetRequirementRevisionId:"REV_A",necessityState:"REQUIRED"}],disposition:"DIRECT_CAPABILITY_AGGREGATE_PRESENT",requirementRelationAggregateIds:["RRA_A"]},
      {targetRequirementEntityId:"REQ_B",targetRequirementRevisionIds:["REV_B"],necessityStates:[{targetRequirementRevisionId:"REV_B",necessityState:"OPTIONAL"}],disposition:"NO_AGGREGATE",requirementRelationAggregateIds:[]},
      {targetRequirementEntityId:"REQ_C",targetRequirementRevisionIds:["REV_C"],necessityStates:[{targetRequirementRevisionId:"REV_C",necessityState:"CONDITIONAL"}],disposition:"ELIGIBILITY_UNKNOWN",requirementRelationAggregateIds:[]},
      {targetRequirementEntityId:"REQ_D",targetRequirementRevisionIds:["REV_D1","REV_D2"],necessityStates:[{targetRequirementRevisionId:"REV_D1",necessityState:"UNKNOWN"},{targetRequirementRevisionId:"REV_D2",necessityState:"PREFERRED"}],disposition:"REQUIREMENT_REVISION_BRANCH_UNRESOLVED",requirementRelationAggregateIds:[]},
    ],
    requirementRelationAggregateIds:["RRA_A"],aggregateDimensionInventories:[{requirementRelationAggregateId:"RRA_A",lineage:{},semanticRelationInventory:inventory(["SEMANTIC_CANDIDATE_COVERS_REQUIREMENT","SEMANTIC_DISTINCT","SEMANTIC_EQUIVALENT","SEMANTIC_PARTIAL","SEMANTIC_UNKNOWN"],["CRREL_COVERS","CRREL_DISTINCT","CRREL_EQ","CRREL_PARTIAL","CRREL_SEM_UNKNOWN"]),levelRelationInventory:inventory(["LEVEL_BELOW","LEVEL_EXCEEDS","LEVEL_MEETS","LEVEL_NOT_APPLICABLE","LEVEL_UNKNOWN"],["CRREL_BELOW","CRREL_EXCEEDS","CRREL_MEETS","CRREL_LEVEL_NA","CRREL_LEVEL_UNKNOWN"]),evidenceSufficiencyInventory:inventory(["EVIDENCE_INSUFFICIENT","EVIDENCE_SUFFICIENT","EVIDENCE_UNKNOWN"],["CRREL_EVIDENCE_INSUFFICIENT","CRREL_EVIDENCE_SUFFICIENT","CRREL_EVIDENCE_UNKNOWN"]),scopeRelationInventory:inventory(["SCOPE_COMPATIBLE","SCOPE_INCOMPATIBLE","SCOPE_NOT_APPLICABLE","SCOPE_PARTIAL","SCOPE_UNKNOWN"],["CRREL_SCOPE_COMPATIBLE","CRREL_SCOPE_INCOMPATIBLE","CRREL_SCOPE_NA","CRREL_SCOPE_PARTIAL","CRREL_SCOPE_UNKNOWN"]),pairDispositions:[{candidateCapabilityOperandId:"CCO_FAILED",disposition:"EVALUATION_FAILED",capabilityRequirementRelationId:null,capabilityRequirementRelationEvaluationResultId:"CRRER_FAILED"},{candidateCapabilityOperandId:"CCO_MATERIALIZED",disposition:"MATERIALIZED_RELATION",capabilityRequirementRelationId:"CRREL_EQ",capabilityRequirementRelationEvaluationResultId:null},{candidateCapabilityOperandId:"CCO_NOT_EVALUATED",disposition:"NOT_EVALUATED",capabilityRequirementRelationId:null,capabilityRequirementRelationEvaluationResultId:null}]}],
    pairTerminalInventory:{MATERIALIZED_RELATION:{count:1,references:["CCO_MATERIALIZED"]},EVALUATION_FAILED:{count:1,references:["CCO_FAILED"]},NOT_EVALUATED:{count:1,references:["CCO_NOT_EVALUATED"]}},necessityInventory:{REQUIRED:{count:1,targetRequirementRevisionIds:["REV_A"]},PREFERRED:{count:1,targetRequirementRevisionIds:["REV_D2"]},OPTIONAL:{count:1,targetRequirementRevisionIds:["REV_B"]},CONDITIONAL:{count:1,targetRequirementRevisionIds:["REV_C"]},UNKNOWN:{count:1,targetRequirementRevisionIds:["REV_D1"]}},composition:{state:"COMPOSITION_NOT_EVALUATED" as const},structuralStateInventory:["NO_AGGREGATE","REQUIREMENT_REVISION_BRANCH_UNRESOLVED"],lineage:{roleRequirementCoveragePolicyVersion:"coverage-v1",roleDimensionInventoryPolicyVersion:"dimension-v1",roleNecessityPolicyVersion:"necessity-v1",roleCompositionPolicyVersion:"composition-v1"},proposalState:"PROPOSAL_ONLY" as const,authorityState:"NONE" as const,schemaVersion:"ROLE_RELATION_V1" as const,
  };
  return {roleRelationId:deriveRoleRelationId(semantic as any),...semantic,createdAt:stamp} as unknown as RoleRelation;
}

describe("T8 TensionState",()=>{
  it("fails closed when its only direct operand is missing",async()=>{
    await expect(produceTensionState({roleRelationId:"RRL_MISSING",classificationPolicyVersion:"tension-v1",createdAt:stamp},{roles:new InMemoryRoleRelationRepository(),policies:policy})).rejects.toThrow("ROLE_RELATION_NOT_FOUND");
  });
  it("preserves complete dimensional, uncertainty, failure, and non-tension classifications without a role conclusion",async()=>{
    const roles=new InMemoryRoleRelationRepository(); const source=role(); await roles.persistRoleRelation(source);
    const states=new InMemoryTensionStateRepository(); const value=await produceAndPersistTensionState({roleRelationId:source.roleRelationId,classificationPolicyVersion:"tension-v1",createdAt:stamp},{roles,policies:policy,tensionStates:states});
    const codes=value.requirementItems.flatMap(item=>item.classifications.map(c=>`${c.family}:${c.code}`));
    expect(value.tensionStateId).toMatch(/^TSN_/); expect(value.proposalState).toBe("PROPOSAL_ONLY"); expect(value.authorityState).toBe("NONE");
    expect(codes).toEqual(expect.arrayContaining(["STRUCTURAL_DIFFERENCE:SEMANTIC_DISTINCT_RELATION","STRUCTURAL_DIFFERENCE:SEMANTIC_PARTIAL_RELATION","STRUCTURAL_DIFFERENCE:LEVEL_BELOW_RELATION","STRUCTURAL_DIFFERENCE:SCOPE_INCOMPATIBLE_RELATION","STRUCTURAL_DIFFERENCE:SCOPE_PARTIAL_RELATION","EPISTEMIC_UNCERTAINTY:SEMANTIC_UNKNOWN","EPISTEMIC_UNCERTAINTY:LEVEL_UNKNOWN","EPISTEMIC_UNCERTAINTY:EVIDENCE_UNKNOWN","EPISTEMIC_UNCERTAINTY:EVIDENCE_INSUFFICIENT","EPISTEMIC_UNCERTAINTY:SCOPE_UNKNOWN","EPISTEMIC_UNCERTAINTY:RELATION_NOT_AVAILABLE","EPISTEMIC_UNCERTAINTY:PAIR_NOT_EVALUATED","EPISTEMIC_UNCERTAINTY:COMPOSITION_UNEVALUATED","OPERAND_FAILURE:EVALUATION_FAILED","NOT_A_TENSION:SEMANTIC_EQUIVALENT","NOT_A_TENSION:EVIDENCE_SUFFICIENT","NOT_A_TENSION:SCOPE_NOT_APPLICABLE"]));
    expect(value.requirementItems.find(item=>item.targetRequirementEntityId==="REQ_B")?.necessityStates[0]?.necessityState).toBe("OPTIONAL");
    expect(value.requirementItems.find(item=>item.targetRequirementEntityId==="REQ_C")?.necessityStates[0]?.necessityState).toBe("CONDITIONAL");
    expect(value.requirementItems.find(item=>item.targetRequirementEntityId==="REQ_D")?.classifications[0]?.code).toBe("REQUIREMENT_REVISION_BRANCH_UNRESOLVED");
    await expect(byteReplayTensionState(value.tensionStateId,{tensionStates:states,roles,policies:policy})).resolves.toEqual(value);
    await expect(semanticReplayTensionState(value.tensionStateId,{tensionStates:states,roles,policies:policy})).resolves.toEqual(value);
    await expect(derivationReplayTensionState(value.tensionStateId,{tensionStates:states,roles,policies:policy})).resolves.toEqual(value);
    await expect(semanticReplayTensionState(value.tensionStateId,{tensionStates:states,roles,policies:{resolveTensionClassificationPolicy:()=>null}})).rejects.toThrow("ERR_TENSION_STATE_CLASSIFICATION_POLICY_UNAVAILABLE");
  });
  it("binds identity to policy and exact role, rejects unknown data, and explicitly represents empty review",async()=>{
    const source=role(); const first=classifyRoleRelation(source,{version:"tension-v1"},stamp); const later=classifyRoleRelation(source,{version:"tension-v1"},"2026-11-02T00:00:00.000Z");
    expect(later.tensionStateId).toBe(first.tensionStateId); expect(classifyRoleRelation(source,{version:"tension-v2"},stamp).tensionStateId).not.toBe(first.tensionStateId);
    const repository=new InMemoryTensionStateRepository(); await repository.persistTensionState(first);
    await expect(repository.persistTensionState({...first,extra:"unknown"} as any)).rejects.toThrow("TENSION_STATE_INVALID");
    await expect(repository.persistTensionState({...first,createdAt:"2026-11-03T00:00:00.000Z"})).rejects.toThrow("IMMUTABLE_CONFLICT");
    const empty={...source,requirementCoverages:[],requirementRelationAggregateIds:[],aggregateDimensionInventories:[],pairTerminalInventory:{MATERIALIZED_RELATION:{count:0,references:[]},EVALUATION_FAILED:{count:0,references:[]},NOT_EVALUATED:{count:0,references:[]}},necessityInventory:{REQUIRED:{count:0,targetRequirementRevisionIds:[]},PREFERRED:{count:0,targetRequirementRevisionIds:[]},OPTIONAL:{count:0,targetRequirementRevisionIds:[]},CONDITIONAL:{count:0,targetRequirementRevisionIds:[]},UNKNOWN:{count:0,targetRequirementRevisionIds:[]}},structuralStateInventory:["NO_REQUIREMENTS"]} as any;
    const {roleRelationId:_id,createdAt:_created,...emptySemantic}=empty; empty.roleRelationId=deriveRoleRelationId(emptySemantic);
    expect(classifyRoleRelation(empty,{version:"tension-v1"},stamp).roleClassifications[0]?.code).toBe("NO_REQUIREMENTS_REVIEWED");
  });
  it("preserves an unresolved exact aggregate set without selecting a winner",()=>{
    const source=role(); const duplicate=structuredClone(source.aggregateDimensionInventories[0]); duplicate.requirementRelationAggregateId="RRA_B";
    source.requirementCoverages[0].disposition="REQUIREMENT_RELATION_AGGREGATE_SET_UNRESOLVED";
    source.requirementCoverages[0].requirementRelationAggregateIds=["RRA_A","RRA_B"];
    source.requirementRelationAggregateIds=["RRA_A","RRA_B"]; source.aggregateDimensionInventories=[source.aggregateDimensionInventories[0],duplicate];
    source.pairTerminalInventory={MATERIALIZED_RELATION:{count:2,references:["CCO_MATERIALIZED","RRA_B:CCO_MATERIALIZED"]},EVALUATION_FAILED:{count:2,references:["CCO_FAILED","RRA_B:CCO_FAILED"]},NOT_EVALUATED:{count:2,references:["CCO_NOT_EVALUATED","RRA_B:CCO_NOT_EVALUATED"]}};
    const {roleRelationId:_id,createdAt:_created,...semantic}=source; source.roleRelationId=deriveRoleRelationId(semantic);
    const item=classifyRoleRelation(source,{version:"tension-v1"},stamp).requirementItems[0];
    expect(item.coverageDisposition).toBe("REQUIREMENT_RELATION_AGGREGATE_SET_UNRESOLVED");
    expect(item.classifications.filter(value=>value.code==="REQUIREMENT_RELATION_AGGREGATE_SET_UNRESOLVED")).toHaveLength(1);
    expect(item.classifications.filter(value=>value.requirementRelationAggregateId).map(value=>value.requirementRelationAggregateId)).toEqual(expect.arrayContaining(["RRA_A","RRA_B"]));
  });
});
