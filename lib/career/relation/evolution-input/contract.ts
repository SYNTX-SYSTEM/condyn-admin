import { createHash } from "node:crypto";
import type { EvolutionInputDerivationDisposition, EvolutionInputItem, EvolutionInputState } from "./types";

const fail=(code:string):never=>{throw new Error(code)};
export const stableEvolutionInput=(value:unknown):string=>JSON.stringify(value,(_key,item)=>item&&typeof item==="object"&&!Array.isArray(item)?Object.fromEntries(Object.keys(item).sort().map(key=>[key,(item as Record<string,unknown>)[key]])):item);
const text=(value:unknown):value is string=>typeof value==="string"&&value.length>0;
const sorted=(value:unknown):value is string[]=>Array.isArray(value)&&value.every(text)&&new Set(value).size===value.length&&value.every((item,index)=>index===0||value[index-1]<item);
const itemKey=(item:unknown)=>stableEvolutionInput(item);

/** Frozen V1 mapping: unhandled codes remain UNRESOLVED; ACQUIRE_CAPABILITY, BROADEN_SCOPE, and GAIN_DOMAIN_CONTEXT intentionally have no route. */
export function evolutionInputDerivationFor(family:EvolutionInputItem["tensionClassificationFamily"],code:string):Pick<EvolutionInputItem,"evolutionInputClass"|"derivationDisposition"> {
  if(family==="STRUCTURAL_DIFFERENCE") return code==="LEVEL_BELOW_RELATION"?{derivationDisposition:"DERIVABLE",evolutionInputClass:"INCREASE_DEMONSTRATED_LEVEL_INPUT"}:{derivationDisposition:"NOT_DERIVABLE",evolutionInputClass:null};
  if(family==="OPERAND_FAILURE") return code==="EVALUATION_FAILED"?{derivationDisposition:"UPSTREAM_FAILURE",evolutionInputClass:null}:{derivationDisposition:"UNRESOLVED",evolutionInputClass:null};
  // This means only that the pinned policy derived no movement input for this reviewed fact, never fit, satisfaction, or recommended inaction.
  if(family==="NOT_A_TENSION")return {derivationDisposition:"DERIVABLE",evolutionInputClass:"NO_ACTION_JUSTIFIED_INPUT"};
  if(code==="EVIDENCE_INSUFFICIENT")return {derivationDisposition:"DERIVABLE",evolutionInputClass:"STRENGTHEN_EVIDENCE_INPUT"};
  if(["SEMANTIC_UNKNOWN","LEVEL_UNKNOWN","EVIDENCE_UNKNOWN","SCOPE_UNKNOWN","RELATION_NOT_AVAILABLE","PAIR_NOT_EVALUATED","COMPOSITION_UNEVALUATED"].includes(code))return {derivationDisposition:"DERIVABLE",evolutionInputClass:"RESOLVE_SEMANTIC_UNCERTAINTY_INPUT"};
  if(["ELIGIBILITY_UNKNOWN","REQUIREMENT_REVISION_BRANCH_UNRESOLVED","REQUIREMENT_RELATION_AGGREGATE_SET_UNRESOLVED"].includes(code))return {derivationDisposition:"DERIVABLE",evolutionInputClass:"RESOLVE_TARGET_UNCERTAINTY_INPUT"};
  return {derivationDisposition:"UNRESOLVED",evolutionInputClass:null};
}

/** The hash binds the exact historical T8 causes and pinned policy, never a recommendation, timestamp, or current view. */
export function deriveEvolutionInputStateId(value:Omit<EvolutionInputState,"evolutionInputStateId"|"createdAt">):string {
  return `EIS_${createHash("sha256").update(stableEvolutionInput(["EVOLUTION_INPUT_STATE_V1",value.tensionStateId,value.roleRelationId,value.verifiedCapabilitySnapshotId,value.targetRoleProfileRevisionId,value.targetRoleRequirementInventoryId,value.items,value.derivationPolicyLineage,value.proposalState,value.authorityState,value.schemaVersion]),"utf8").digest("hex").slice(0,32).toUpperCase()}`;
}
export function sameEvolutionInputStateData(a:unknown,b:unknown){return stableEvolutionInput(a)===stableEvolutionInput(b)}

/** Rejects authority language so bounded movement inputs cannot silently become recommendations or decisions. */
export function assertEvolutionInputState(value:unknown):asserts value is EvolutionInputState {
  const x=value as any;
  const terms=/\b(fit|qualification|satisfaction|lacks capability|missing capability|gap|score|ranking|resonance|recommendation|priority|next action|decision|commitment|execution|outcome|feedback|causality)\b/i;
  const families=new Set(["STRUCTURAL_DIFFERENCE","EPISTEMIC_UNCERTAINTY","OPERAND_FAILURE","NOT_A_TENSION"]);
  const dispositions=new Set(["DERIVABLE","NOT_DERIVABLE","UNRESOLVED","UPSTREAM_FAILURE","NOT_APPLICABLE"]);
  const classes=new Set(["ACQUIRE_CAPABILITY_INPUT","INCREASE_DEMONSTRATED_LEVEL_INPUT","STRENGTHEN_EVIDENCE_INPUT","BROADEN_SCOPE_INPUT","GAIN_DOMAIN_CONTEXT_INPUT","RESOLVE_SEMANTIC_UNCERTAINTY_INPUT","RESOLVE_TARGET_UNCERTAINTY_INPUT","NO_ACTION_JUSTIFIED_INPUT"]);
  if(!x||Object.keys(x).length!==12||!text(x.evolutionInputStateId)||!text(x.tensionStateId)||!text(x.roleRelationId)||!text(x.verifiedCapabilitySnapshotId)||!text(x.targetRoleProfileRevisionId)||!text(x.targetRoleRequirementInventoryId)||!text(x.createdAt)||x.schemaVersion!=="EVOLUTION_INPUT_STATE_V1"||x.proposalState!=="PROPOSAL_ONLY"||x.authorityState!=="NONE"||!x.derivationPolicyLineage||Object.keys(x.derivationPolicyLineage).length!==1||!text(x.derivationPolicyLineage.evolutionInputDerivationPolicyVersion)||!Array.isArray(x.items)||x.items.some((item:any,index:number)=>{const expected=evolutionInputDerivationFor(item?.tensionClassificationFamily,item?.tensionClassificationCode);return !item||Object.keys(item).length!==13||!(item.evolutionInputClass===null||classes.has(item.evolutionInputClass))||!dispositions.has(item.derivationDisposition as EvolutionInputDerivationDisposition)||!families.has(item.tensionClassificationFamily)||!text(item.tensionClassificationCode)||!["ROLE","REQUIREMENT","AGGREGATE_DIMENSION","PAIR"].includes(item.subjectKind)||!(item.dimension===null||["SEMANTIC","LEVEL","EVIDENCE","SCOPE","COMPOSITION","COVERAGE","PAIR"].includes(item.dimension))||!(item.targetRequirementEntityId===null||text(item.targetRequirementEntityId))||![item.requirementRelationAggregateId,item.candidateCapabilityOperandId,item.capabilityRequirementRelationId,item.capabilityRequirementRelationEvaluationResultId].every(value=>value===null||text(value))||!sorted(item.targetRequirementRevisionIds)||!Array.isArray(item.necessityStates)||expected.evolutionInputClass!==item.evolutionInputClass||expected.derivationDisposition!==item.derivationDisposition||itemKey(x.items[index-1])>itemKey(item)})||terms.test(JSON.stringify(x)))fail("ERR_EVOLUTION_INPUT_INVALID");
  const {evolutionInputStateId,createdAt,...semantic}=x;
  if(evolutionInputStateId!==deriveEvolutionInputStateId(semantic))fail("ERR_EVOLUTION_INPUT_INVALID");
}
