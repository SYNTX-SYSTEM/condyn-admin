import { describe, expect, it } from "vitest";
import {
  decodeJobPoolErrorBody,
  decodeJobPoolMatchPresentation,
  decodeJobPoolUploadSummary,
  decodeJobPoolUploadView,
  describeAnalysisSource,
  describeRanking,
  describeSelection,
  presentationLabels,
  requirementCounts
} from "../../../lib/career/job-pool/frontend-presentation";
import { kubernetesSweepCoverage, matches, summary, UPLOAD_ID, view } from "./fixtures/match-bodies";

const clone = <T>(value: T): T => structuredClone(value);

describe("Job Pool frontend presentation", () => {
  it("decodes the documented bodies exactly and returns structurally identical values", () => {
    expect(decodeJobPoolUploadSummary(clone(summary))).toEqual(summary);
    expect(decodeJobPoolUploadView(clone(view))).toEqual(view);
    expect(decodeJobPoolMatchPresentation(clone(matches))).toEqual(matches);
  });

  it("refuses a presentation block that claims anything other than the contract's non-claims", () => {
    for (const mutation of [
      (body: typeof matches) => { (body.presentation as { canonicalEvaluation: boolean }).canonicalEvaluation = true; },
      (body: typeof matches) => { (body.presentation as { decision: boolean }).decision = true; },
      (body: typeof matches) => { (body.presentation as { authorityState: string }).authorityState = "ASSERTED"; },
      (body: typeof matches) => { (body.presentation as { kind: string }).kind = "CANONICAL_EVALUATION"; },
      (body: typeof matches) => { (body.roleMatches[0].canonical as { capabilityRequirementRelationState: string }).capabilityRequirementRelationState = "EVALUATED"; },
      (body: typeof matches) => { (body.roleMatches[0].matched[0] as { matchBasis: string }).matchBasis = "SEMANTIC"; },
      (body: typeof matches) => { delete (body.roleMatches[0].matched[0] as { evidence?: unknown }).evidence; },
      (body: typeof matches) => { delete (body.roleMatches[0].matched[0] as { matchedConstituent?: unknown }).matchedConstituent; },
      (body: typeof matches) => { (body.roleMatches[0].matched[0] as { matchedConstituent: unknown }).matchedConstituent = "TypeScript"; },
      (body: typeof matches) => { (body.roleMatches[0].matched[0] as { matchBasis: string }).matchBasis = "COMPOSITE_CONSTITUENT"; },
      // Sweep coverage is unscored proposal coverage: every softened or missing claim is refused.
      (body: typeof matches) => { delete (body.roleMatches[0].matched[0] as { sweepProposal?: unknown }).sweepProposal; },
      (body: typeof matches) => { delete (body.roleMatches[0].missing[0] as { sweepProposal?: unknown }).sweepProposal; },
      (body: typeof matches) => { (body.roleMatches[0].missing[0].sweepProposal as { scored: boolean }).scored = true; },
      (body: typeof matches) => { (body.roleMatches[0].missing[0].sweepProposal as { authorityState: string }).authorityState = "GRANTED"; },
      (body: typeof matches) => { (body.roleMatches[0].missing[0].sweepProposal as { evidenceState: string }).evidenceState = "UNVERIFIED"; },
      (body: typeof matches) => { (body.roleMatches[0].missing[0].sweepProposal as { capabilityProposalId: string }).capabilityProposalId = "CAP_NOT_A_PROPOSAL"; },
      (body: typeof matches) => { (body.roleMatches[0] as { sweepOnlyCoverageCount: number }).sweepOnlyCoverageCount = 2; },
      (body: typeof matches) => { (body.capabilitySweep as { scored: boolean }).scored = true; },
      (body: typeof matches) => { (body.capabilitySweep as { state: string }).state = "EVALUATED"; },
      (body: typeof matches) => { delete (body as { capabilitySweep?: unknown }).capabilitySweep; }
    ]) {
      const body = clone(matches);
      mutation(body);
      expect(decodeJobPoolMatchPresentation(body)).toBeNull();
    }
    const mapping = clone(view);
    (mapping.canonicalMapping as { authorityState: string }).authorityState = "GRANTED";
    expect(decodeJobPoolUploadView(mapping)).toBeNull();
    expect(decodeJobPoolUploadSummary({ ...summary, poolStatus: "LIVE" })).toBeNull();
  });

  it("decodes a COMPOSITE_CONSTITUENT match only with its constituent, keeping the composite name as delivered", () => {
    const body = clone(matches);
    const item = body.roleMatches[0].matched[0] as { matchBasis: string; matchedCapabilityName: string; matchedConstituent: string | null };
    item.matchBasis = "COMPOSITE_CONSTITUENT";
    item.matchedCapabilityName = "TypeScript and Node.js";
    item.matchedConstituent = "TypeScript";
    const decoded = decodeJobPoolMatchPresentation(body);
    expect(decoded?.roleMatches[0].matched[0]).toMatchObject({ matchBasis: "COMPOSITE_CONSTITUENT", matchedCapabilityName: "TypeScript and Node.js", matchedConstituent: "TypeScript" });
  });

  it("keeps sweep coverage as unscored coverage: present per entry, counted per role, stated per response", () => {
    const decoded = decodeJobPoolMatchPresentation(clone(matches))!;
    expect(decoded.capabilitySweep).toEqual({ state: "AVAILABLE", proposalCount: 3, scored: false });
    expect(decoded.roleMatches[0].missing[0].sweepProposal).toEqual(kubernetesSweepCoverage);
    expect(decoded.roleMatches[0].matched[0].sweepProposal).toBeNull();
    expect(requirementCounts(decoded.roleMatches[0])).toMatchObject({ sweepCovered: 1, sweepOnlyCoverage: 1 });
    expect(requirementCounts(decoded.roleMatches[1])).toMatchObject({ sweepCovered: 0, sweepOnlyCoverage: 0 });
    for (const state of ["NOT_PRODUCED", "FAILED"] as const) {
      const body = clone(matches);
      body.capabilitySweep = { state, proposalCount: 0, scored: false };
      expect(decodeJobPoolMatchPresentation(body)?.capabilitySweep.state).toBe(state);
    }
  });

  it("decodes error bodies with and without issues and rejects malformed ones", () => {
    expect(decodeJobPoolErrorBody({ error: { code: "ERR_JOB_POOL_SCHEMA_INVALID", message: "m", issues: [{ path: "roles[0].title", message: "required" }] } })).toEqual({ code: "ERR_JOB_POOL_SCHEMA_INVALID", message: "m", issues: [{ path: "roles[0].title", message: "required" }] });
    expect(decodeJobPoolErrorBody({ error: { code: "ERR_JOB_POOL_JSON_INVALID", message: "m" } })).toEqual({ code: "ERR_JOB_POOL_JSON_INVALID", message: "m" });
    expect(decodeJobPoolErrorBody({ error: { code: "X", message: "m", issues: "nope" } })).toBeNull();
    expect(decodeJobPoolErrorBody({ success: false })).toBeNull();
  });

  it("derives the three layer labels from the literal block fields only", () => {
    expect(presentationLabels(matches.presentation)).toEqual(["DETERMINISTIC_PRESENTATION", "NOT_A_CANONICAL_EVALUATION", "NOT_A_DECISION"]);
  });

  it("renders the delivered order and names a non-monotone delivery instead of sorting", () => {
    expect(describeRanking(matches.roleMatches)).toBe("MONOTONE_BY_RESONANCE");
    expect(describeRanking([matches.roleMatches[1], matches.roleMatches[0]])).toBe("DELIVERED_ORDER_NOT_MONOTONE");
    expect(describeRanking([])).toBe("EMPTY");
  });

  it("counts requirements per presentation set and TRQREV ids separately", () => {
    expect(requirementCounts(matches.roleMatches[0])).toEqual({ matched: 1, weakEvidence: 0, missing: 1, total: 2, canonicalRequirementRevisions: 2, sweepCovered: 1, sweepOnlyCoverage: 1 });
    expect(requirementCounts(matches.roleMatches[1])).toEqual({ matched: 0, weakEvidence: 1, missing: 0, total: 1, canonicalRequirementRevisions: 1, sweepCovered: 0, sweepOnlyCoverage: 0 });
  });

  it("keeps selection and analysis source explicit: no latest pool, no latest analysis", () => {
    expect(describeSelection(null, [summary])).toEqual({ kind: "NONE" });
    expect(describeSelection(UPLOAD_ID, [summary])).toEqual({ kind: "LISTED", jobPoolUploadId: UPLOAD_ID, summary });
    expect(describeSelection("JPOOL_stale", [summary])).toEqual({ kind: "NOT_LISTED", jobPoolUploadId: "JPOOL_stale" });
    expect(describeAnalysisSource(null, null)).toEqual({ kind: "NONE" });
    expect(describeAnalysisSource("ANL_JOB", "ANL_URL")).toEqual({ kind: "JOB_RESULT", analysisId: "ANL_JOB" });
    expect(describeAnalysisSource(null, "ANL_URL")).toEqual({ kind: "URL", analysisId: "ANL_URL" });
    expect(describeAnalysisSource("", "")).toEqual({ kind: "NONE" });
  });
});
