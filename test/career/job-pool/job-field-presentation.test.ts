import { describe, expect, it } from "vitest";
import { countRequirements, derivePending, deriveRequirements, hasScoredMatch, provenanceOf } from "../../../lib/career/job-pool/job-field-presentation";
import { SIL_COPY } from "../../../lib/career/view-model/sil-language";
import { kubernetesSweepCoverage, matches } from "./fixtures/match-bodies";

const clone = <T>(value: T): T => structuredClone(value);

describe("Job Field presentation (pure derivation over one delivered body)", () => {
  it("derives requirement states from the delivered sets without re-scoring and keeps provenance per line", () => {
    const requirements = deriveRequirements(matches.roleMatches[0]);
    expect(requirements.map(item => [item.poolRequirementId, item.state, provenanceOf(item)])).toEqual([
      ["REQ_1", "MATCHED", "ANALYSIS_CAPABILITY"],
      ["REQ_2", "COVERED_UNSCORED", "SWEEP_PROPOSAL"]
    ]);
    expect(requirements[0].match?.confidence).toBe(0.9);
    expect(requirements[1].match).toBeNull();
    expect(requirements[1].sweep).toEqual(kubernetesSweepCoverage);
    const weak = deriveRequirements(matches.roleMatches[1]);
    expect(weak.map(item => [item.state, item.weakReason, provenanceOf(item)])).toEqual([["UNRESOLVED", "confidence 0.3 below weakEvidenceThreshold 0.4", "ANALYSIS_CAPABILITY"]]);
    const uncovered = clone(matches.roleMatches[0]);
    uncovered.missing[0].sweepProposal = null;
    const states = deriveRequirements(uncovered);
    expect(states[1].state).toBe("NO_EVIDENCE_DELIVERED");
    expect(provenanceOf(states[1])).toBe("NONE");
  });

  it("names four distinct pending kinds and never merges them", () => {
    const role = matches.roleMatches[0];
    const pending = derivePending(role, deriveRequirements(role));
    expect(pending).toEqual([
      { kind: "UNPROVEN_CANONICAL", ids: ["TRQREV_1", "TRQREV_2"] },
      { kind: "UNRESOLVED_EVIDENCE", ids: [] },
      { kind: "UNSCORED_COVERAGE", ids: ["REQ_2"] },
      { kind: "NO_EVIDENCE_DELIVERED", ids: [] }
    ]);
    const uncovered = clone(role);
    uncovered.missing[0].sweepProposal = null;
    expect(derivePending(uncovered, deriveRequirements(uncovered)).map(item => item.ids)).toEqual([["TRQREV_1", "TRQREV_2"], [], [], ["REQ_2"]]);
  });

  it("keeps a weak requirement with sweep coverage in both pending dimensions, and its label claims no exclusivity (F-LF-1)", () => {
    const role = clone(matches.roleMatches[1]);
    role.weakEvidence[0].sweepProposal = kubernetesSweepCoverage;
    const requirements = deriveRequirements(role);
    expect(requirements.map(item => [item.poolRequirementId, item.state])).toEqual([["REQ_3", "UNRESOLVED"]]);
    expect(role.weakEvidence[0].contribution).toBeGreaterThan(0);
    expect(derivePending(role, requirements)).toEqual([
      { kind: "UNPROVEN_CANONICAL", ids: ["TRQREV_3"] },
      { kind: "UNRESOLVED_EVIDENCE", ids: ["REQ_3"] },
      { kind: "UNSCORED_COVERAGE", ids: ["REQ_3"] },
      { kind: "NO_EVIDENCE_DELIVERED", ids: [] }
    ]);
    expect(countRequirements(requirements)).toMatchObject({ unresolved: 1, coveredUnscored: 0, total: 1 });
    expect(SIL_COPY.en.jobField.pendingKinds.UNSCORED_COVERAGE).toBe("UNSCORED SWEEP COVERAGE");
    expect(SIL_COPY.de.jobField.pendingKinds.UNSCORED_COVERAGE).toBe("UNBEWERTETE SWEEP-ABDECKUNG");
    for (const label of [SIL_COPY.en.jobField.pendingKinds.UNSCORED_COVERAGE, SIL_COPY.de.jobField.pendingKinds.UNSCORED_COVERAGE]) expect(label).not.toMatch(/\b(ONLY|NUR)\b/);
  });

  it("never carries a canonical relation, decision or verified-capability claim", () => {
    expect(hasScoredMatch(matches.roleMatches[0])).toBe(true);
    expect(hasScoredMatch(matches.roleMatches[1])).toBe(false);
    const text = JSON.stringify(matches.roleMatches.map(role => ({ requirements: deriveRequirements(role), pending: derivePending(role, deriveRequirements(role)), canonical: role.canonical })));
    expect(text).not.toMatch(/\b(CRR|RRA|RRL|TSN|EIS|RPR|RCP|DAR|DCTXREV|DCR|DREV|DCDRB)_[0-9A-Z]/);
    expect(text).not.toMatch(/PHASE4_VERIFIED|VERIFIED_CAPABILITY"|AUTHORITATIVE|"decision":true|"scored":true/);
    expect(text).toContain('"capabilityRequirementRelationState":"NOT_EVALUATED"');
  });
});
