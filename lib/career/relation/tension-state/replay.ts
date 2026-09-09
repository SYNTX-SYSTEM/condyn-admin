import type { RoleRelationRepository } from "../role-relation";
import { assertTensionState, sameTensionStateData } from "./contract";
import { classifyRoleRelation, type TensionClassificationPolicyRegistry } from "./producer";
import type { TensionStateRepository } from "./persistence";
import type { TensionState } from "./types";

const fail=(code:string):never=>{throw new Error(code)};
export interface TensionStateReplayDependencies {
  tensionStates:TensionStateRepository;
  roles:RoleRelationRepository;
  policies:TensionClassificationPolicyRegistry;
}

async function exactStored(id:string,deps:TensionStateReplayDependencies):Promise<TensionState>{
  const state=await deps.tensionStates.getTensionStateById(id);
  if(!state) return fail("ERR_TENSION_STATE_ROLE_RELATION_NOT_FOUND");
  assertTensionState(state);
  return state;
}

/** BYTE_REPLAY is intentionally only the validated durable T8 artifact. */
export async function byteReplayTensionState(id:string,deps:TensionStateReplayDependencies){return structuredClone(await exactStored(id,deps));}

async function reclassify(id:string,deps:TensionStateReplayDependencies){
  const stored=await exactStored(id,deps);
  const role=await deps.roles.getRoleRelationById(stored.roleRelationId);
  if(!role) return fail("ERR_TENSION_STATE_ROLE_RELATION_NOT_FOUND");
  if(role.verifiedCapabilitySnapshotId!==stored.verifiedCapabilitySnapshotId||role.targetRoleProfileRevisionId!==stored.targetRoleProfileRevisionId||role.targetRoleRequirementInventoryId!==stored.targetRoleRequirementInventoryId) return fail("ERR_TENSION_STATE_REPLAY_MISMATCH");
  const version=stored.classificationPolicyLineage.tensionClassificationPolicyVersion;
  const policy=deps.policies.resolveTensionClassificationPolicy(version);
  if(!policy||policy.version!==version)return fail("ERR_TENSION_STATE_CLASSIFICATION_POLICY_UNAVAILABLE");
  const rebuilt=classifyRoleRelation(role,policy,stored.createdAt);
  if(!sameTensionStateData(stored,rebuilt))return fail("ERR_TENSION_STATE_REPLAY_MISMATCH");
  return rebuilt;
}

/** SEMANTIC_REPLAY reclassifies the exact historical T7B operand with its pinned policy; it does not discover newer upstream state or invoke a provider audit. */
export async function semanticReplayTensionState(id:string,deps:TensionStateReplayDependencies){return reclassify(id,deps);}
/** DERIVATION_REPLAY retains the same direct operand boundary and pinned policy; T7B owns prior derivation and no provider audit exists for T8. */
export async function derivationReplayTensionState(id:string,deps:TensionStateReplayDependencies){return reclassify(id,deps);}
