import table from "../../../docs/architecture/decision-fields/mapping-spec/sign-table.json";
import type { AutoMatchRunState } from "../ui/auto-match";

/**
 * PERSON × JOB mapping, phase B · the signs (MAPPING_SIGNS_V1, docs/architecture/decision-fields/mapping-spec/sign-table.json).
 * The table is the only source: this module reads it and refuses what it does not name, so a new state of the system is never
 * painted with the sign of another one. Pure: no clock, no randomness, nothing written.
 */
export type CouplingClass = "SEMANTIC" | "LEXICAL" | "NONE";
export interface CouplingSign {
  readonly class: CouplingClass;
  readonly arcLine: string;
  readonly arcFill: number;
  readonly luminance: number;
  readonly beam: string;
  readonly phaseLocked: boolean;
  readonly mark: string;
}
export interface RunSign {
  readonly fieldMotion: string;
  readonly pendingBreath: boolean;
  readonly frozen: boolean;
  /** One quiet pulse at the field's edge; only where the table allows it and only while resumePending. */
  readonly resumePulse: boolean;
}

const COUPLINGS: Readonly<Record<string, CouplingSign>> = table.couplingStates as Record<string, CouplingSign>;
const RUNS: Readonly<Record<string, { fieldMotion: string; pendingBreath: boolean; frozen: boolean; resumePulse: boolean | string }>> = table.runStates;
/** The table's word for "a pulse only while resumePending". */
const WHEN_PENDING = "when resumePending";
const CLASSES: readonly CouplingClass[] = ["SEMANTIC", "LEXICAL", "NONE"];

/** The ten coupling states the table names (five semantic, four lexical bases, NONE). */
export const COUPLING_STATES: readonly string[] = Object.freeze(Object.keys(COUPLINGS));

const own = <T,>(record: Readonly<Record<string, T>>, key: string): T | undefined => (Object.hasOwn(record, key) ? record[key] : undefined);
const signs = new Map(Object.entries(COUPLINGS).map(([state, sign]) => [state, Object.freeze({ ...sign })] as const));

/** The sign of one requirement's coupling: its source must be the class the table gives its state. */
export function couplingSign(source: CouplingClass, state: string): CouplingSign {
  if (!CLASSES.includes(source)) throw new Error(`ERR_MAPPING_SIGN_UNKNOWN_SOURCE:${String(source)}`);
  const sign = own(COUPLINGS, state) === undefined ? undefined : signs.get(state);
  if (sign === undefined) throw new Error(`ERR_MAPPING_SIGN_UNKNOWN_STATE:${state}`);
  if (sign.class !== source) throw new Error(`ERR_MAPPING_SIGN_SOURCE_MISMATCH:${source}/${state}`);
  return sign;
}

/** The time sign of the automatic run. STALLED stays frozen even while resumePending: the pulse is the table's, not the flag's. */
export function runSign(state: AutoMatchRunState, resumePending: boolean): RunSign {
  const sign = own(RUNS, state);
  if (sign === undefined) throw new Error(`ERR_MAPPING_SIGN_UNKNOWN_RUN_STATE:${String(state)}`);
  if (typeof resumePending !== "boolean") throw new Error("ERR_MAPPING_SIGN_RESUME_PENDING");
  let resumePulse: boolean;
  if (sign.resumePulse === WHEN_PENDING) resumePulse = resumePending;
  else if (typeof sign.resumePulse === "boolean") resumePulse = sign.resumePulse;
  else throw new Error(`ERR_MAPPING_SIGN_TABLE:${state}`);
  return Object.freeze({ fieldMotion: sign.fieldMotion, pendingBreath: sign.pendingBreath, frozen: sign.frozen, resumePulse });
}
