import { describe, expect, it } from "vitest";
import {
  arcPath,
  countRequirements,
  deriveJobField,
  derivePending,
  deriveRequirements,
  describeRoleSelection,
  hasScoredMatch,
  JOB_FIELD_LAYOUT,
  provenanceOf,
  ringSegments
} from "../../../lib/career/job-pool/job-field-presentation";
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

  it("places roles by delivered pool resonance only, grouped by pool organization, in delivered order", () => {
    const field = deriveJobField(matches);
    expect(field.roles.map(role => [role.poolRoleId, role.deliveredRank, role.resonanceScore, role.distance, role.angle])).toEqual([
      ["ROLE_A", 1, 0.75, 0.25, 90],
      ["ROLE_B", 2, 0.3, 0.7, 270]
    ]);
    const { center, innerRadius, outerRadius } = JOB_FIELD_LAYOUT;
    expect(field.roles[0].x).toBeCloseTo(center + innerRadius + 0.25 * (outerRadius - innerRadius), 1);
    expect(field.roles[0].y).toBeCloseTo(center, 1);
    expect(field.organizations).toEqual([{ poolOrganizationId: "ORG_1", name: "Acme", roleIds: ["ROLE_A", "ROLE_B"], startAngle: 0, endAngle: 360 }]);
    expect(field.ranking).toBe("MONOTONE_BY_RESONANCE");
    expect(field.candidateCapabilityCount).toBe(2);
    expect(field.capabilitySweep).toEqual({ state: "AVAILABLE", proposalCount: 3, scored: false });
  });

  it("keeps roles at zero resonance visible on the outer ring and never reorders a non-monotone delivery", () => {
    const body = clone(matches);
    body.roleMatches[1].resonanceScore = 0;
    body.roleMatches[1].weakEvidence = [];
    body.roleMatches[1].missing = [{ poolRequirementId: "REQ_3", capabilityName: "SQL", requiredLevel: "L2", weight: 0.6, necessity: "PREFERRED", evidenceHint: null, sweepProposal: null }];
    const field = deriveJobField(body);
    expect(field.roles[1]).toMatchObject({ distance: 1, hasScoredMatch: false, counts: { matched: 0, unresolved: 0, coveredUnscored: 0, noEvidence: 1, total: 1 } });
    const reversed = clone(matches);
    reversed.roleMatches.reverse();
    const nonMonotone = deriveJobField(reversed);
    expect(nonMonotone.ranking).toBe("DELIVERED_ORDER_NOT_MONOTONE");
    expect(nonMonotone.roles.map(role => role.poolRoleId)).toEqual(["ROLE_B", "ROLE_A"]);
  });

  it("names the nearest presented role as the first delivered role with a scored match, or none", () => {
    expect(deriveJobField(matches).nearestPresentedRole).toEqual({ poolRoleId: "ROLE_A", pending: derivePending(matches.roleMatches[0], deriveRequirements(matches.roleMatches[0])) });
    expect(hasScoredMatch(matches.roleMatches[1])).toBe(false);
    const reversed = clone(matches);
    reversed.roleMatches.reverse();
    // Delivered order wins: the weak-only role comes first but has no scored match, so ROLE_A is still nearest.
    expect(deriveJobField(reversed).nearestPresentedRole?.poolRoleId).toBe("ROLE_A");
    const none = clone(matches);
    for (const role of none.roleMatches) { role.matched = []; role.resonanceScore = 0; }
    expect(deriveJobField(none).nearestPresentedRole).toBeNull();
    const positiveButUnscored = clone(matches);
    positiveButUnscored.roleMatches[0].matched = [];
    expect(deriveJobField(positiveButUnscored).nearestPresentedRole).toBeNull();
  });

  it("builds ring segments proportional to counts in a fixed state order and valid arc paths", () => {
    expect(ringSegments(countRequirements(deriveRequirements(matches.roleMatches[0])))).toEqual([
      { state: "MATCHED", startAngle: 0, endAngle: 180 },
      { state: "COVERED_UNSCORED", startAngle: 180, endAngle: 360 }
    ]);
    expect(ringSegments({ matched: 0, unresolved: 0, coveredUnscored: 0, noEvidence: 0, total: 0 })).toEqual([]);
    expect(arcPath(0, 0, 10, 0, 90)).toMatch(/^M .* A 10 10 0 0 1 /);
    expect(arcPath(0, 0, 10, 0, 270)).toMatch(/ A 10 10 0 1 1 /);
    expect(arcPath(0, 0, 10, 10, 10)).toBe("");
  });

  it("keeps role selection exact: delivered, none, or a named stale id", () => {
    const field = deriveJobField(matches);
    expect(describeRoleSelection(null, field)).toEqual({ kind: "NONE" });
    expect(describeRoleSelection("ROLE_B", field)).toMatchObject({ kind: "ROLE", role: { poolRoleId: "ROLE_B" } });
    expect(describeRoleSelection("ROLE_STALE", field)).toEqual({ kind: "NOT_DELIVERED", poolRoleId: "ROLE_STALE" });
  });

  it("never carries a canonical relation, decision or verified-capability claim", () => {
    const text = JSON.stringify(deriveJobField(matches));
    expect(text).not.toMatch(/\b(CRR|RRA|RRL|TSN|EIS|RPR|RCP|DAR|DCTXREV|DCR|DREV|DCDRB)_[0-9A-Z]/);
    expect(text).not.toMatch(/PHASE4_VERIFIED|VERIFIED_CAPABILITY"|AUTHORITATIVE|"decision":true|"scored":true/);
    expect(text).toContain('"capabilityRequirementRelationState":"NOT_EVALUATED"');
  });
});
