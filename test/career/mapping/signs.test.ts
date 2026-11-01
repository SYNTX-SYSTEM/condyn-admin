import { describe, expect, it } from "vitest";
import { COUPLING_STATES, couplingSign, runSign } from "../../../lib/career/mapping/signs";
import { AUTO_MATCH_STATES, RANKING_SEMANTIC_STATES } from "../../../lib/career/ui/auto-match";
import type { LexicalBasis } from "../../../lib/career/job-pool/pool-role-discovery";

/** MAPPING_SIGNS_V1 · the product module against the system's real state lists. DETERMINISTIC_FIXTURE: no database, no network, no model. */
// Every LexicalBasis, written so that a new basis in the type breaks this record at compile time.
const LEXICAL_BASES: Record<LexicalBasis, true> = { NAME_EXACT: true, NAME_ALIAS: true, NAME_COMPOSITE_CONSTITUENT: true, WEAK_TOKEN_CONTAINMENT: true, NONE: true };
const LEXICAL = (Object.keys(LEXICAL_BASES) as LexicalBasis[]).filter(b => b !== "NONE");
const PAIRS: Array<["SEMANTIC" | "LEXICAL" | "NONE", string]> = [...RANKING_SEMANTIC_STATES.map(s => ["SEMANTIC", s] as ["SEMANTIC", string]), ...LEXICAL.map(s => ["LEXICAL", s] as ["LEXICAL", string]), ["NONE", "NONE"]];
const signature = (s: { arcLine: string; arcFill: number; beam: string; mark: string }) => [s.arcLine, s.arcFill, s.beam, s.mark].join("|");

describe("MAP-SIGNS · coupling signs", () => {
  it("every semantic state, every lexical basis and NONE has a sign of its own class; the module knows no other state", () => {
    expect(PAIRS).toHaveLength(10);
    expect([...COUPLING_STATES].sort()).toEqual(PAIRS.map(([, s]) => s).sort());
    for (const [source, state] of PAIRS) expect(couplingSign(source, state).class, state).toBe(source);
  });

  it("the ten signs differ pairwise in arcLine + arcFill + beam + mark", () => {
    const seen = new Map<string, string>();
    for (const [source, state] of PAIRS) { const key = signature(couplingSign(source, state)); expect(seen.get(key), `${state} looks like ${seen.get(key)}`).toBeUndefined(); seen.set(key, state); }
  });

  it("honesty: DIFFERENT, UNCLEAR and NONE are three signs; a name relation is never phase locked and at most half filled", () => {
    expect(new Set([signature(couplingSign("SEMANTIC", "DIFFERENT")), signature(couplingSign("SEMANTIC", "UNCLEAR")), signature(couplingSign("NONE", "NONE"))]).size).toBe(3);
    for (const basis of LEXICAL) { const s = couplingSign("LEXICAL", basis); expect(s.phaseLocked, basis).toBe(false); expect(s.arcFill, basis).toBeLessThanOrEqual(0.5); expect(s.arcLine, basis).toBe("dotted"); }
    expect(couplingSign("SEMANTIC", "EQUIVALENT")).toEqual({ class: "SEMANTIC", arcLine: "solid", arcFill: 1, luminance: 1, beam: "solid", phaseLocked: true, mark: "double" });
  });

  it("INVERSE: an unknown state and a state under the wrong source throw — nothing is mapped silently", () => {
    expect(() => couplingSign("SEMANTIC", "SUPERSEDES")).toThrow(/ERR_MAPPING_SIGN_UNKNOWN_STATE/);
    expect(() => couplingSign("LEXICAL", "NAME_PHONETIC")).toThrow(/ERR_MAPPING_SIGN_UNKNOWN_STATE/);
    expect(() => couplingSign("SEMANTIC", "NAME_EXACT")).toThrow(/ERR_MAPPING_SIGN_SOURCE_MISMATCH/);
    expect(() => couplingSign("NONE", "EQUIVALENT")).toThrow(/ERR_MAPPING_SIGN_SOURCE_MISMATCH/);
    expect(() => couplingSign("LEXICAL", "COVERS")).toThrow(/ERR_MAPPING_SIGN_SOURCE_MISMATCH/);
    // NONE is the class of no relation; the decoder lets LEXICAL/NONE pass, the sign does not take it for a name relation.
    expect(() => couplingSign("LEXICAL", "NONE")).toThrow(/ERR_MAPPING_SIGN_SOURCE_MISMATCH/);
    expect(() => couplingSign("MODEL" as never, "COVERS")).toThrow(/ERR_MAPPING_SIGN_UNKNOWN_SOURCE/);
    expect(() => couplingSign("SEMANTIC", "toString")).toThrow(/ERR_MAPPING_SIGN_UNKNOWN_STATE/);
  });

  it("a returned sign is frozen: no caller can repaint a state", () => {
    const s = couplingSign("SEMANTIC", "COVERS");
    expect(Object.isFrozen(s)).toBe(true);
    expect(couplingSign("SEMANTIC", "COVERS")).toEqual(s);
  });
});

describe("MAP-SIGNS · run signs", () => {
  const all = (pending: boolean) => AUTO_MATCH_STATES.map(state => [state, runSign(state, pending)] as const);

  it("every run state of the automatic path has a sign; only RUNNING breathes, only STALLED is frozen", () => {
    for (const pending of [false, true]) for (const [state, sign] of all(pending)) {
      expect(sign.pendingBreath, state).toBe(state === "RUNNING");
      expect(sign.frozen, state).toBe(state === "STALLED");
      expect(sign.fieldMotion, state).toBe(state === "RUNNING" ? "formation" : "none");
    }
  });

  it("a resume pulse exactly for PARTIAL and FAILED while resumePending; STALLED + resumePending stays frozen without a pulse", () => {
    for (const [state, sign] of all(true)) expect(sign.resumePulse, state).toBe(state === "PARTIAL" || state === "FAILED");
    for (const [state, sign] of all(false)) expect(sign.resumePulse, state).toBe(false);
    expect(runSign("STALLED", true)).toEqual({ fieldMotion: "none", pendingBreath: false, frozen: true, resumePulse: false });
  });

  it("INVERSE: an unknown run state throws; a pending flag that is not a boolean throws", () => {
    expect(() => runSign("PAUSED" as never, false)).toThrow(/ERR_MAPPING_SIGN_UNKNOWN_RUN_STATE/);
    expect(() => runSign("constructor" as never, false)).toThrow(/ERR_MAPPING_SIGN_UNKNOWN_RUN_STATE/);
    expect(() => runSign("RUNNING", "yes" as never)).toThrow(/ERR_MAPPING_SIGN_RESUME_PENDING/);
    expect(Object.isFrozen(runSign("RUNNING", false))).toBe(true);
  });
});
