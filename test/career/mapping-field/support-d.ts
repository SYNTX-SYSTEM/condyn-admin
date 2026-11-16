/**
 * PERSON × JOB phase D test support: readings that reach every sign of MAPPING_SIGNS_V1. `allStates` is one role carrying one
 * requirement in each of the ten coupling states (five semantic, four lexical bases, NONE); `keyCases` puts a known key, a key no PERSON
 * capability carries and an absent key (an older payload) side by side. Built on the phase-B fixtures, so every ranking here is one the
 * client's strict decoder accepts.
 */
import { CAPS, POOL_A, POOL_B, lex, sem, type RoleSpec } from "../mapping/fixtures";

/** The ten coupling states, in the sign table's order. */
export const STATES = ["EQUIVALENT", "COVERS", "PARTIAL", "DIFFERENT", "UNCLEAR", "NAME_EXACT", "NAME_ALIAS", "NAME_COMPOSITE_CONSTITUENT", "WEAK_TOKEN_CONTAINMENT", "NONE"] as const;
export type State = typeof STATES[number];
const SEMANTIC = new Set<State>(["EQUIVALENT", "COVERS", "PARTIAL", "DIFFERENT", "UNCLEAR"]);
/** The requirement id of the state's requirement in `allStates`. */
export const reqOf = (state: State) => `q_${state.toLowerCase()}`;

/** One role, one REQUIRED requirement per coupling state; every named one couples PCAP_TS (a PERSON key). */
export function allStates(pool = POOL_A, roleId = "role_all"): RoleSpec {
  return {
    pool, roleId, title: "All States", requirements: STATES.map(state =>
      SEMANTIC.has(state) ? sem(reqOf(state), "REQUIRED", state as Parameters<typeof sem>[2], "PCAP_TS", "TypeScript")
        : lex(reqOf(state), "REQUIRED", state as Parameters<typeof lex>[2], "PCAP_TS", "TypeScript"))
  };
}

/** Three couplings of one role whose beams have no drawn start point or a drawn one: KNOWN, NOT_IN_PERSON and ABSENT (no key). */
export function keyCases(pool = POOL_B, roleId = "role_keys"): RoleSpec {
  return {
    pool, roleId, title: "Key Cases", requirements: [
      lex("q_known", "REQUIRED", "NAME_EXACT", "PCAP_K8", "Kubernetes"),
      lex("q_foreign", "REQUIRED", "NAME_EXACT", "PCAP_ELSEWHERE", "Rust"),
      lex("q_absent", "PREFERRED", "NAME_ALIAS", undefined, "TypeScript")
    ]
  };
}

/** n PERSON capabilities, by name in key order: the constellation holds 13 + 23 + 33 = 69 of them, the rest is counted. */
export const manyCapabilities = (n: number) => Array.from({ length: n }, (_, i) => ({ key: `PCAP_${String(i).padStart(3, "0")}`, name: `Capability ${String(i).padStart(3, "0")}` }));

export { CAPS, POOL_A, POOL_B, lex, sem };
