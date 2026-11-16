import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ROLE_RANKING_FORMULA } from "../../../lib/career/job-pool/role-ranking";
import { RANKING_SEMANTIC_STATES, AUTO_MATCH_STATES } from "../../../lib/career/ui/auto-match";

/** MAPPING_SIGNS_V1 against the states the system really has. DETERMINISTIC_FIXTURE: no database, no network, no model. */
const table = JSON.parse(readFileSync(join(__dirname, "../../../docs/architecture/decision-fields/mapping-spec/sign-table.json"), "utf8")) as {
  couplingStates: Record<string, { class: string; arcLine: string; arcFill: number; luminance: number; beam: string; phaseLocked: boolean; mark: string }>;
  runStates: Record<string, { fieldMotion: string; pendingBreath: boolean; frozen: boolean; resumePulse: boolean | string }>;
};
const SEMANTIC = [...RANKING_SEMANTIC_STATES] as string[];
const LEXICAL = Object.keys(ROLE_RANKING_FORMULA.lexicalValue);
const ALL = [...SEMANTIC, ...LEXICAL, "NONE"];
const signature = (s: { arcLine: string; arcFill: number; beam: string; mark: string }) => [s.arcLine, s.arcFill, s.beam, s.mark].join("|");

describe("SIGNS · the table covers exactly the states of the system", () => {
  it("every semantic state, every lexical basis and NONE has a sign — and nothing else does", () => {
    expect(Object.keys(table.couplingStates).sort()).toEqual([...ALL].sort());
    expect(ALL).toHaveLength(10);
  });

  it("the ten signs differ pairwise in arcLine + arcFill + beam + mark (never in luminance or colour alone)", () => {
    /* §131: every limb in this file walks a population READ OUT OF A JSON FILE. A renamed key empties the
       record and each walk then asserts a property of nothing. The first limb above pins the key set, but a
       guard in a SIBLING it-block does not protect this one — vitest runs it regardless of that one's
       verdict — so each walk states its own floor. */
    expect(Object.keys(table.couplingStates).length, "§131: an empty coupling-state record would make the walk below vacuous").toBe(10);
    const seen = new Map<string, string>();
    for (const [state, sign] of Object.entries(table.couplingStates)) {
      const key = signature(sign);
      expect(seen.get(key), `${state} looks like ${seen.get(key)}`).toBeUndefined();
      seen.set(key, state);
    }
  });

  it("the arc fill is the value of the published ranking formula", () => {
    expect(Object.keys(table.couplingStates).length, "§131: an empty coupling-state record would make the walk below vacuous").toBeGreaterThan(0);
    const value: Record<string, number> = { ...ROLE_RANKING_FORMULA.semanticValue, ...ROLE_RANKING_FORMULA.lexicalValue, NONE: 0 };
    for (const [state, sign] of Object.entries(table.couplingStates)) expect([state, sign.arcFill]).toEqual([state, value[state]]);
  });

  it("class is right; only a semantic state that carries value is phase locked; a lexical relation never is", () => {
    expect(Object.keys(table.couplingStates).length, "§131: an empty coupling-state record would make the walk below vacuous").toBeGreaterThan(0);
    for (const [state, sign] of Object.entries(table.couplingStates)) {
      expect(sign.class, state).toBe(SEMANTIC.includes(state) ? "SEMANTIC" : LEXICAL.includes(state) ? "LEXICAL" : "NONE");
      expect(sign.phaseLocked, state).toBe(SEMANTIC.includes(state) && sign.arcFill > 0);
    }
  });

  it("honesty: DIFFERENT, UNCLEAR and NONE (all value 0) are three different signs; a lexical sign is never as bright as a checked full cover", () => {
    const t = table.couplingStates;
    expect(new Set([signature(t.DIFFERENT), signature(t.UNCLEAR), signature(t.NONE)]).size).toBe(3);
    for (const lex of LEXICAL) expect(t[lex].luminance).toBeLessThan(t.COVERS.luminance);
    expect(t.NONE.beam).toBe("none");
    expect(t.DIFFERENT.beam).toBe("none");
  });

  it("INVERSE: the distinctness rule has teeth — give COVERS the mark of EQUIVALENT and two signs collide", () => {
    const broken = { ...table.couplingStates, COVERS: { ...table.couplingStates.COVERS, mark: "double" } };
    const signatures = Object.values(broken).map(signature);
    expect(new Set(signatures).size).toBeLessThan(signatures.length);
  });
});

describe("SIGNS · the run states", () => {
  it("every run state of the automatic path has a time sign — and nothing else does", () => {
    expect(Object.keys(table.runStates).sort()).toEqual([...AUTO_MATCH_STATES].sort());
  });

  it("only a RUNNING run breathes; only a STALLED run is frozen; the two never coincide; an end state moves nothing", () => {
    expect(Object.keys(table.runStates).length, "§131: an empty run-state record would make the walk below vacuous").toBeGreaterThan(0);
    for (const [state, sign] of Object.entries(table.runStates)) {
      expect(sign.pendingBreath, state).toBe(state === "RUNNING");
      expect(sign.frozen, state).toBe(state === "STALLED");
      expect(sign.pendingBreath && sign.frozen).toBe(false);
      if (["COMPLETED", "SKIPPED", "DISABLED", "NOT_STARTED"].includes(state)) expect([sign.fieldMotion, sign.resumePulse]).toEqual(["none", false]);
    }
  });

  it("a resume pulse exists only where a run can be taken up again (PARTIAL, FAILED)", () => {
    expect(Object.keys(table.runStates).length, "§131: an empty run-state record would make the walk below vacuous").toBeGreaterThan(0);
    for (const [state, sign] of Object.entries(table.runStates)) expect(sign.resumePulse !== false, state).toBe(state === "PARTIAL" || state === "FAILED");
  });
});
