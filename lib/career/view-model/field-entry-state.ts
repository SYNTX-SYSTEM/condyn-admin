/**
 * SFE::SEMIOTIC_ENTRY_FIX (owner, 2026-10-30): the field state at the shell's entry into the Capability Field, as ONE named state —
 * derived only from what already exists (the investigation mode, the gate, the job-scope validation, the job pool list, the opened
 * pool and the observed role). It never decides the gate: `capabilityGateOpen` and the mode logic stay where they are; this only
 * says which calm sentence and which next context stand at the entry.
 *
 *   NO_POOL          PERSON × JOB, the pool list is empty                                    (owner state 1)
 *   POOL_NOT_OPENED  PERSON × JOB, pools exist, none is opened                              (owner state 2, step a)
 *   ROLE_NOT_OPENED  PERSON × JOB, a pool is opened, no role is opened in it               (owner state 2, step b)
 *   PERSON_OPEN      PERSON in the Job Field: the Capability Field is open, no role needed  (owner state 3)
 *   ROLE_NOT_CHOSEN  PERSON × JOB, a role is opened (observation point) but not the job    (owner state 4)
 *   POOLS_UNREAD     PERSON × JOB, the pool list is not read (loading, failed, not provisioned): no claim about pools
 *   CHECKING / INVALID  a selected job still being checked / not valid (unchanged meaning)
 *   JOB              the mode JOB (unchanged meaning)
 *   null             nothing to say: the gate is open (a valid job), or PERSON inside the Capability Field (T-07 unchanged)
 */
export type FieldEntryState = "NO_POOL" | "POOL_NOT_OPENED" | "ROLE_NOT_OPENED" | "PERSON_OPEN" | "ROLE_NOT_CHOSEN" | "POOLS_UNREAD" | "CHECKING" | "INVALID" | "JOB";

export interface FieldEntryInput {
  mode: "PERSON" | "PERSON_X_JOB" | "JOB";
  gateOpen: boolean;
  focus: "CAPABILITY" | "FIELD";
  scope: "NONE" | "CHECKING" | "INVALID" | "VALID";
  pools: string;
  poolOpen: boolean;
  roleOpen: boolean;
}

export function fieldEntryState(input: FieldEntryInput): FieldEntryState | null {
  if (input.mode === "JOB") return "JOB";
  if (input.mode === "PERSON") return input.focus === "FIELD" ? "PERSON_OPEN" : null;
  if (input.gateOpen) return null;
  if (input.scope === "CHECKING") return "CHECKING";
  if (input.scope === "INVALID") return "INVALID";
  if (input.pools === "EMPTY") return "NO_POOL";
  if (input.pools !== "AVAILABLE") return "POOLS_UNREAD";
  if (!input.poolOpen) return "POOL_NOT_OPENED";
  if (!input.roleOpen) return "ROLE_NOT_OPENED";
  return "ROLE_NOT_CHOSEN";
}

/** The gate cause the closed controls keep naming in `data-gate` (unchanged contract): every PERSON × JOB state without a job is NONE. */
export function gateCauseOf(state: FieldEntryState): "NONE" | "CHECKING" | "INVALID" | "JOB" | null {
  if (state === "PERSON_OPEN") return null;
  if (state === "CHECKING" || state === "INVALID" || state === "JOB") return state;
  return "NONE";
}
