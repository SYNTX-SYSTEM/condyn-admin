import { assertTensionState, type TensionClassification, type TensionState, type TensionStateRepository } from "../tension-state";
import { assertEvolutionInputState, deriveEvolutionInputStateId, evolutionInputDerivationFor, sameEvolutionInputStateData, stableEvolutionInput } from "./contract";
import type { EvolutionInputStateRepository } from "./persistence";
import type { EvolutionInputItem, EvolutionInputState } from "./types";

const fail=(code:string):never=>{throw new Error(code)};
export interface EvolutionInputDerivationPolicy { version:string; }
export interface EvolutionInputDerivationPolicyRegistry { resolveEvolutionInputDerivationPolicy(version:string):EvolutionInputDerivationPolicy|null; }

const toItem=(classification:TensionClassification):EvolutionInputItem=>({
  ...evolutionInputDerivationFor(classification.family,classification.code), tensionClassificationFamily:classification.family,tensionClassificationCode:classification.code,subjectKind:classification.subjectKind,dimension:classification.dimension,targetRequirementEntityId:classification.targetRequirementEntityId,targetRequirementRevisionIds:[...classification.targetRequirementRevisionIds].sort(),requirementRelationAggregateId:classification.requirementRelationAggregateId,candidateCapabilityOperandId:classification.candidateCapabilityOperandId,capabilityRequirementRelationId:classification.capabilityRequirementRelationId,capabilityRequirementRelationEvaluationResultId:classification.capabilityRequirementRelationEvaluationResultId,necessityStates:structuredClone(classification.necessityStates),
});

/** T9 accepts only the exact persisted T8 artifact, preserves compound causes independently, and performs no provider work or upstream rediscovery. */
export function deriveEvolutionInputState(tension:TensionState,policy:EvolutionInputDerivationPolicy,createdAt:string):EvolutionInputState {
  assertTensionState(tension);if(!policy||!policy.version)fail("ERR_EVOLUTION_INPUT_DERIVATION_POLICY_UNAVAILABLE");
  const items=[...tension.roleClassifications,...tension.requirementItems.flatMap(item=>item.classifications)].map(toItem).sort((a,b)=>stableEvolutionInput(a).localeCompare(stableEvolutionInput(b)));
  const semantic={tensionStateId:tension.tensionStateId,roleRelationId:tension.roleRelationId,verifiedCapabilitySnapshotId:tension.verifiedCapabilitySnapshotId,targetRoleProfileRevisionId:tension.targetRoleProfileRevisionId,targetRoleRequirementInventoryId:tension.targetRoleRequirementInventoryId,items,derivationPolicyLineage:{evolutionInputDerivationPolicyVersion:policy.version},proposalState:"PROPOSAL_ONLY" as const,authorityState:"NONE" as const,schemaVersion:"EVOLUTION_INPUT_STATE_V1" as const};
  const result={evolutionInputStateId:deriveEvolutionInputStateId(semantic),...semantic,createdAt};assertEvolutionInputState(result);return structuredClone(result);
}
export async function produceEvolutionInputState(input:{tensionStateId:string;derivationPolicyVersion:string;createdAt:string},deps:{tensionStates:TensionStateRepository;policies:EvolutionInputDerivationPolicyRegistry}){
  const found=await deps.tensionStates.getTensionStateById(input.tensionStateId);if(!found)fail("ERR_EVOLUTION_INPUT_TENSION_STATE_NOT_FOUND");const tension=found as TensionState;try{assertTensionState(tension)}catch{fail("ERR_EVOLUTION_INPUT_TENSION_STATE_INVALID")}
  const policy=deps.policies.resolveEvolutionInputDerivationPolicy(input.derivationPolicyVersion);if(!policy||policy.version!==input.derivationPolicyVersion)fail("ERR_EVOLUTION_INPUT_DERIVATION_POLICY_UNAVAILABLE");
  try{return deriveEvolutionInputState(tension,policy as EvolutionInputDerivationPolicy,input.createdAt)}catch(error){if(error instanceof Error&&error.message.startsWith("ERR_EVOLUTION_INPUT_"))throw error;return fail("ERR_EVOLUTION_INPUT_DERIVATION_FAILED")}
}
/** The mandatory reread makes immutable exact historical state, never a current/head pointer, the T9 production result. */
export async function produceAndPersistEvolutionInputState(input:{tensionStateId:string;derivationPolicyVersion:string;createdAt:string},deps:{tensionStates:TensionStateRepository;policies:EvolutionInputDerivationPolicyRegistry;evolutionInputs:EvolutionInputStateRepository}){
  const produced=await produceEvolutionInputState(input,deps);const reread=await deps.evolutionInputs.persistEvolutionInputState(produced);if(!sameEvolutionInputStateData(produced,reread))fail("ERR_EVOLUTION_INPUT_PERSISTENCE_FAILED");return reread;
}
