import { describe, expect, it } from "vitest";
import { deriveTensionStateId, type TensionClassification, type TensionState } from "../../../../lib/career/relation/tension-state";
import { byteReplayEvolutionInputState, derivationReplayEvolutionInputState, deriveEvolutionInputStateId, InMemoryEvolutionInputStateRepository, produceAndPersistEvolutionInputState, produceEvolutionInputState, semanticReplayEvolutionInputState } from "../../../../lib/career/relation/evolution-input";
import { InMemoryTensionStateRepository } from "../../../../lib/career/relation/tension-state";

const stamp="2026-12-01T00:00:00.000Z";
const classification=(family:TensionClassification["family"],code:string,dimension:TensionClassification["dimension"]="SEMANTIC"):TensionClassification=>({family,code,subjectKind:"AGGREGATE_DIMENSION",dimension,targetRequirementEntityId:"TRE_ENTITY",targetRequirementRevisionIds:["TRR_1"],requirementRelationAggregateId:"RRA_1",candidateCapabilityOperandId:"CCO_1",capabilityRequirementRelationId:"CRREL_1",capabilityRequirementRelationEvaluationResultId:null,necessityStates:[{targetRequirementRevisionId:"TRR_1",necessityState:"CONDITIONAL" as const}]});
const tension=(classifications:TensionClassification[]):TensionState=>{const semantic={roleRelationId:"RRL_1",verifiedCapabilitySnapshotId:"CCSNAP_1",targetRoleProfileRevisionId:"TRP_1",targetRoleRequirementInventoryId:"TRQINV_1",roleClassifications:[],requirementItems:[{targetRequirementEntityId:"TRE_ENTITY",targetRequirementRevisionIds:["TRR_1"],necessityStates:[{targetRequirementRevisionId:"TRR_1",necessityState:"CONDITIONAL" as const}],coverageDisposition:"DIRECT_CAPABILITY_AGGREGATE_PRESENT" as const,classifications}],classificationPolicyLineage:{tensionClassificationPolicyVersion:"tension-v1"},proposalState:"PROPOSAL_ONLY" as const,authorityState:"NONE" as const,schemaVersion:"TENSION_STATE_V1" as const};return {tensionStateId:deriveTensionStateId(semantic),...semantic,createdAt:stamp};};
const policy={resolveEvolutionInputDerivationPolicy:(version:string)=>version==="evolution-v1"?{version}:null};

describe("T9 EvolutionInputState",()=>{
  it("derives exactly one bounded item per T8 classification without authority amplification",async()=>{
    const source=tension([
      classification("STRUCTURAL_DIFFERENCE","LEVEL_BELOW_RELATION","LEVEL"),classification("STRUCTURAL_DIFFERENCE","SEMANTIC_PARTIAL_RELATION"),classification("EPISTEMIC_UNCERTAINTY","EVIDENCE_INSUFFICIENT","EVIDENCE"),classification("EPISTEMIC_UNCERTAINTY","SEMANTIC_UNKNOWN"),classification("EPISTEMIC_UNCERTAINTY","ELIGIBILITY_UNKNOWN","COVERAGE"),classification("EPISTEMIC_UNCERTAINTY","REQUIREMENT_RELATION_AGGREGATE_SET_UNRESOLVED","COVERAGE"),classification("OPERAND_FAILURE","EVALUATION_FAILED","PAIR"),classification("NOT_A_TENSION","LEVEL_NOT_APPLICABLE","LEVEL"),
    ]);
    const tensions=new InMemoryTensionStateRepository();await tensions.persistTensionState(source);
    const value=await produceEvolutionInputState({tensionStateId:source.tensionStateId,derivationPolicyVersion:"evolution-v1",createdAt:stamp},{tensionStates:tensions,policies:policy});
    expect(value.items).toHaveLength(8);expect(value.proposalState).toBe("PROPOSAL_ONLY");expect(value.authorityState).toBe("NONE");
    expect(value.items).toEqual(expect.arrayContaining([expect.objectContaining({tensionClassificationCode:"LEVEL_BELOW_RELATION",derivationDisposition:"DERIVABLE",evolutionInputClass:"INCREASE_DEMONSTRATED_LEVEL_INPUT"}),expect.objectContaining({tensionClassificationCode:"EVIDENCE_INSUFFICIENT",evolutionInputClass:"STRENGTHEN_EVIDENCE_INPUT"}),expect.objectContaining({tensionClassificationCode:"SEMANTIC_UNKNOWN",evolutionInputClass:"RESOLVE_SEMANTIC_UNCERTAINTY_INPUT"}),expect.objectContaining({tensionClassificationCode:"ELIGIBILITY_UNKNOWN",evolutionInputClass:"RESOLVE_TARGET_UNCERTAINTY_INPUT"}),expect.objectContaining({tensionClassificationCode:"REQUIREMENT_RELATION_AGGREGATE_SET_UNRESOLVED",evolutionInputClass:"RESOLVE_TARGET_UNCERTAINTY_INPUT"}),expect.objectContaining({tensionClassificationCode:"SEMANTIC_PARTIAL_RELATION",derivationDisposition:"NOT_DERIVABLE",evolutionInputClass:null}),expect.objectContaining({tensionClassificationCode:"EVALUATION_FAILED",derivationDisposition:"UPSTREAM_FAILURE",evolutionInputClass:null}),expect.objectContaining({tensionClassificationCode:"LEVEL_NOT_APPLICABLE",evolutionInputClass:"NO_ACTION_JUSTIFIED_INPUT"})]));
    expect(JSON.stringify(value)).not.toMatch(/fit|qualification|satisfaction|gap|score|recommendation|priority|decision/i);
    expect(value.items.every(item=>item.necessityStates[0]?.necessityState==="CONDITIONAL")).toBe(true);
  });

  it("keeps V1 acquisition, scope broadening, and domain context unreachable",async()=>{
    const source=tension([classification("STRUCTURAL_DIFFERENCE","SEMANTIC_DISTINCT_RELATION"),classification("STRUCTURAL_DIFFERENCE","SCOPE_INCOMPATIBLE_RELATION","SCOPE"),classification("EPISTEMIC_UNCERTAINTY","COMPOSITION_UNEVALUATED","COMPOSITION")]);const tensions=new InMemoryTensionStateRepository();await tensions.persistTensionState(source);
    const value=await produceEvolutionInputState({tensionStateId:source.tensionStateId,derivationPolicyVersion:"evolution-v1",createdAt:stamp},{tensionStates:tensions,policies:policy});
    expect(value.items.map(item=>item.evolutionInputClass).sort()).toEqual([null,null,"RESOLVE_SEMANTIC_UNCERTAINTY_INPUT"].sort());expect(value.items.some(item=>["ACQUIRE_CAPABILITY_INPUT","BROADEN_SCOPE_INPUT","GAIN_DOMAIN_CONTEXT_INPUT"].includes(item.evolutionInputClass??""))).toBe(false);
  });

  it("maps every frozen uncertainty family distinctly while necessity remains context only",async()=>{
    const codes=["SEMANTIC_UNKNOWN","LEVEL_UNKNOWN","EVIDENCE_UNKNOWN","SCOPE_UNKNOWN","RELATION_NOT_AVAILABLE","PAIR_NOT_EVALUATED","COMPOSITION_UNEVALUATED","ELIGIBILITY_UNKNOWN","REQUIREMENT_REVISION_BRANCH_UNRESOLVED","REQUIREMENT_RELATION_AGGREGATE_SET_UNRESOLVED"];
    const necessities=["REQUIRED","PREFERRED","OPTIONAL","CONDITIONAL","UNKNOWN"] as const;
    const source=tension(codes.map((code,index)=>({...classification("EPISTEMIC_UNCERTAINTY",code,code==="PAIR_NOT_EVALUATED"?"PAIR":"COVERAGE"),necessityStates:[{targetRequirementRevisionId:"TRR_1",necessityState:necessities[index%necessities.length]}]})));const tensions=new InMemoryTensionStateRepository();await tensions.persistTensionState(source);
    const value=await produceEvolutionInputState({tensionStateId:source.tensionStateId,derivationPolicyVersion:"evolution-v1",createdAt:stamp},{tensionStates:tensions,policies:policy});
    for(const item of value.items){const expected=["ELIGIBILITY_UNKNOWN","REQUIREMENT_REVISION_BRANCH_UNRESOLVED","REQUIREMENT_RELATION_AGGREGATE_SET_UNRESOLVED"].includes(item.tensionClassificationCode)?"RESOLVE_TARGET_UNCERTAINTY_INPUT":"RESOLVE_SEMANTIC_UNCERTAINTY_INPUT";expect(item).toEqual(expect.objectContaining({derivationDisposition:"DERIVABLE",evolutionInputClass:expected}));}
    expect([...new Set(value.items.map(item=>item.necessityStates[0]?.necessityState))].sort()).toEqual([...necessities].sort());
  });

  it("has deterministic identity, excludes createdAt, is immutable, and replays pinned history",async()=>{
    const source=tension([classification("NOT_A_TENSION","NO_REQUIREMENTS_REVIEWED","COVERAGE")]);const tensions=new InMemoryTensionStateRepository();await tensions.persistTensionState(source);const states=new InMemoryEvolutionInputStateRepository();
    const first=await produceAndPersistEvolutionInputState({tensionStateId:source.tensionStateId,derivationPolicyVersion:"evolution-v1",createdAt:stamp},{tensionStates:tensions,policies:policy,evolutionInputs:states});
    const changedTime=await produceEvolutionInputState({tensionStateId:source.tensionStateId,derivationPolicyVersion:"evolution-v1",createdAt:"2027-01-01T00:00:00.000Z"},{tensionStates:tensions,policies:policy});expect(changedTime.evolutionInputStateId).toBe(first.evolutionInputStateId);
    await expect(states.persistEvolutionInputState(first)).resolves.toEqual(first);await expect(states.persistEvolutionInputState({...first,createdAt:"2027-01-01T00:00:00.000Z"})).rejects.toThrow("IMMUTABLE_CONFLICT");
    const deps={evolutionInputs:states,tensionStates:tensions,policies:policy};await expect(byteReplayEvolutionInputState(first.evolutionInputStateId,deps)).resolves.toEqual(first);await expect(semanticReplayEvolutionInputState(first.evolutionInputStateId,deps)).resolves.toEqual(first);await expect(derivationReplayEvolutionInputState(first.evolutionInputStateId,deps)).resolves.toEqual(first);await expect(semanticReplayEvolutionInputState(first.evolutionInputStateId,{...deps,policies:{resolveEvolutionInputDerivationPolicy:()=>null}})).rejects.toThrow("DERIVATION_POLICY_UNAVAILABLE");
  });

  it("accepts only the exact persisted tension ID and rejects malformed durable payloads",async()=>{
    const tensions=new InMemoryTensionStateRepository();await expect(produceEvolutionInputState({tensionStateId:"TSN_MISSING",derivationPolicyVersion:"evolution-v1",createdAt:stamp},{tensionStates:tensions,policies:policy})).rejects.toThrow("TENSION_STATE_NOT_FOUND");
    const source=tension([classification("NOT_A_TENSION","SEMANTIC_EQUIVALENT")]);await tensions.persistTensionState(source);const state=await produceEvolutionInputState({tensionStateId:source.tensionStateId,derivationPolicyVersion:"evolution-v1",createdAt:stamp},{tensionStates:tensions,policies:policy});const repository=new InMemoryEvolutionInputStateRepository();await expect(repository.persistEvolutionInputState({...state,unknown:true} as any)).rejects.toThrow("ERR_EVOLUTION_INPUT_INVALID");
    const {evolutionInputStateId:_id,createdAt:_created,...semantic}=state;expect(deriveEvolutionInputStateId(semantic)).toBe(state.evolutionInputStateId);
  });
});
