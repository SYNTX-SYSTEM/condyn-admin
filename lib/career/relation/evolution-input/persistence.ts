import { assertEvolutionInputState, sameEvolutionInputStateData } from "./contract";
import type { EvolutionInputState } from "./types";
const fail=(code:string):never=>{throw new Error(code)};

/** T9 is materialized so T10 can reference exact, replayable historical inputs rather than a mutable/current state pointer. */
export interface EvolutionInputStateRepository { getEvolutionInputStateById(id:string):Promise<EvolutionInputState|null>; persistEvolutionInputState(value:EvolutionInputState):Promise<EvolutionInputState>; }
export class InMemoryEvolutionInputStateRepository implements EvolutionInputStateRepository {
  #items=new Map<string,EvolutionInputState>();
  async getEvolutionInputStateById(id:string){const value=this.#items.get(id);if(!value)return null;try{assertEvolutionInputState(value);return structuredClone(value)}catch{return fail("ERR_EVOLUTION_INPUT_PERSISTENCE_FAILED")}}
  async persistEvolutionInputState(value:EvolutionInputState):Promise<EvolutionInputState>{assertEvolutionInputState(value);const existing=this.#items.get(value.evolutionInputStateId);if(existing&&!sameEvolutionInputStateData(existing,value))fail("ERR_EVOLUTION_INPUT_IMMUTABLE_CONFLICT");if(!existing)this.#items.set(value.evolutionInputStateId,structuredClone(value));const reread=await this.getEvolutionInputStateById(value.evolutionInputStateId);if(!reread||!sameEvolutionInputStateData(value,reread))fail("ERR_EVOLUTION_INPUT_PERSISTENCE_FAILED");return reread!;}
}
