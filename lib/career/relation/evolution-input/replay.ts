import { assertTensionState, type TensionStateRepository } from "../tension-state";
import { assertEvolutionInputState, sameEvolutionInputStateData } from "./contract";
import { deriveEvolutionInputState, type EvolutionInputDerivationPolicyRegistry } from "./producer";
import type { EvolutionInputStateRepository } from "./persistence";
import type { EvolutionInputState } from "./types";
const fail=(code:string):never=>{throw new Error(code)};
export interface EvolutionInputReplayDependencies { evolutionInputs:EvolutionInputStateRepository; tensionStates:TensionStateRepository; policies:EvolutionInputDerivationPolicyRegistry; }
async function exactStored(id:string,deps:EvolutionInputReplayDependencies):Promise<EvolutionInputState>{const value=await deps.evolutionInputs.getEvolutionInputStateById(id);if(!value)fail("ERR_EVOLUTION_INPUT_TENSION_STATE_NOT_FOUND");assertEvolutionInputState(value);return value;}
/** BYTE_REPLAY is precisely the validated immutable durable artifact. */
export async function byteReplayEvolutionInputState(id:string,deps:EvolutionInputReplayDependencies){return structuredClone(await exactStored(id,deps));}
async function rederive(id:string,deps:EvolutionInputReplayDependencies){const stored=await exactStored(id,deps);const found=await deps.tensionStates.getTensionStateById(stored.tensionStateId);if(!found)fail("ERR_EVOLUTION_INPUT_TENSION_STATE_NOT_FOUND");const tension=found as import("../tension-state").TensionState;try{assertTensionState(tension)}catch{fail("ERR_EVOLUTION_INPUT_TENSION_STATE_INVALID")};if(tension.roleRelationId!==stored.roleRelationId||tension.verifiedCapabilitySnapshotId!==stored.verifiedCapabilitySnapshotId||tension.targetRoleProfileRevisionId!==stored.targetRoleProfileRevisionId||tension.targetRoleRequirementInventoryId!==stored.targetRoleRequirementInventoryId)fail("ERR_EVOLUTION_INPUT_REPLAY_MISMATCH");const version=stored.derivationPolicyLineage.evolutionInputDerivationPolicyVersion;const policy=deps.policies.resolveEvolutionInputDerivationPolicy(version);if(!policy||policy.version!==version)fail("ERR_EVOLUTION_INPUT_DERIVATION_POLICY_UNAVAILABLE");const rebuilt=deriveEvolutionInputState(tension,policy as import("./producer").EvolutionInputDerivationPolicy,stored.createdAt);if(!sameEvolutionInputStateData(stored,rebuilt))fail("ERR_EVOLUTION_INPUT_REPLAY_MISMATCH");return rebuilt;}
/** SEMANTIC_REPLAY uses the exact historical T8 operand and pinned T9 policy; no provider or current-policy fallback is consulted. */
export async function semanticReplayEvolutionInputState(id:string,deps:EvolutionInputReplayDependencies){return rederive(id,deps);}
/** DERIVATION_REPLAY retains T8 as the direct historical boundary and never re-evaluates older relation layers. */
export async function derivationReplayEvolutionInputState(id:string,deps:EvolutionInputReplayDependencies){return rederive(id,deps);}
