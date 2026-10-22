import { describe, expect, it } from "vitest";
import { decodeAnalysisResult, demoStateFromResult, firstScreenCoverageRequest, projectPxjFirstScreen, withoutLegacyOrbits, type FirstScreenInput } from "../../../lib/career/view-model/pxj-first-screen";
import { readAnalysisResult } from "../../../lib/career/ui/useAnalysisResult";
import { ANALYSIS, OTHER_ROLE, ROLE, UPLOAD, boundary, coverage, projection, resultBody, scripted, selection } from "./fixtures";

/** PERSON × JOB · first screen (owner G1): the decoder (T-01), one way for session and reload (T-02), the bindings (T-04), the lineage (T-05) and the quote join (T-06). */
const accepted = () => { const decoded = decodeAnalysisResult(resultBody(), ANALYSIS); if (!decoded.ok) throw new Error(decoded.code); return decoded.result; };
const input = (overrides: Partial<FirstScreenInput> = {}): FirstScreenInput => ({
  mode: "PERSON_X_JOB", analysisId: ANALYSIS, result: { state: "AVAILABLE", result: accepted() }, boundary: { state: "RESOLVED", value: boundary() }, selection, coverage: { state: "AVAILABLE", coverage: coverage() }, ...overrides
});

describe("T-01 · decodeAnalysisResult", () => {
  it("accepts the contract body: documents and the projection, nothing else read", () => {
    const decoded = decodeAnalysisResult(resultBody(), ANALYSIS);
    expect(decoded.ok).toBe(true);
    if (!decoded.ok) return;
    expect(decoded.result.analysisId).toBe(ANALYSIS);
    expect(decoded.result.documents).toEqual([{ entityId: "DOC_001", title: "Synthetic profile.pdf" }]);
    expect(decoded.result.projection?.capabilities.map(capability => capability.id)).toEqual(["CAPP_1", "CAPP_2", "CAPP_3"]);
    expect(decodeAnalysisResult(resultBody({ capabilityProposalProjection: null }), ANALYSIS)).toMatchObject({ ok: true, result: { projection: null } });
  });

  const rejected: Array<[string, unknown, string]> = [
    ["success missing", (() => { const body: Record<string, unknown> = resultBody(); delete body.success; return body; })(), "RESULT_NOT_SUCCESS"],
    ["success false", resultBody({ success: false }), "RESULT_NOT_SUCCESS"],
    ["status not VERIFIED", resultBody({ status: "FAILED" }), "RESULT_NOT_VERIFIED"],
    ["a foreign analysisId", resultBody({ analysisId: "ANL_OTHER" }), "RESULT_ANALYSIS_ID_MISMATCH"],
    ["a foreign metadata.analysis_id", resultBody({ metadata: { analysis_id: "ANL_OTHER" } }), "RESULT_METADATA_ANALYSIS_ID_MISMATCH"],
    ["metadata missing", resultBody({ metadata: undefined }), "RESULT_METADATA_ANALYSIS_ID_MISMATCH"],
    ["analysis.structured_data.analysis missing", resultBody({ analysis: { structured_data: {} } }), "RESULT_ANALYSIS_MISSING"],
    ["a projection state other than the fixed one", resultBody({ capabilityProposalProjection: { ...projection(), authorityState: "VERIFIED" } }), "RESULT_PROJECTION_INVALID"],
    ["a projection kind other than the fixed one", resultBody({ capabilityProposalProjection: { ...projection(), projectionState: "ACCEPTED" } }), "RESULT_PROJECTION_INVALID"],
    ["a capability with another scope", resultBody({ capabilityProposalProjection: { ...projection(), capabilities: [{ ...projection().capabilities[0], scope: "FUZZY" }] } }), "RESULT_PROJECTION_INVALID"],
    ["a capability without a name", resultBody({ capabilityProposalProjection: { ...projection(), capabilities: [{ ...projection().capabilities[0], name: undefined }] } }), "RESULT_PROJECTION_INVALID"],
    ["a quote without SOURCE_MATCH_VERIFIED", resultBody({ capabilityProposalProjection: { ...projection(), capabilities: [{ ...projection().capabilities[0], evidence: [{ ...projection().capabilities[0].evidence[0], verificationState: "UNVERIFIED" }] }] } }), "RESULT_PROJECTION_INVALID"],
    ["a projection that is not an object", resultBody({ capabilityProposalProjection: "PROPOSED" }), "RESULT_PROJECTION_INVALID"]
  ];
  for (const [name, body, code] of rejected) it(`rejects ${name} (${code}), never a partial success`, () => expect(decodeAnalysisResult(body, ANALYSIS)).toEqual({ ok: false, code }));
});

describe("T-02 · one way for the session and a reload", () => {
  it("the same body gives a deep-equal view model and the same first screen, whether loaded by the session or read again", async () => {
    const session = decodeAnalysisResult(resultBody(), ANALYSIS);
    const { fetcher, calls } = scripted({ [`/api/career/analyses/${ANALYSIS}`]: { status: 200, body: resultBody() } });
    const reload = await readAnalysisResult(ANALYSIS, fetcher);
    expect(calls).toEqual([{ url: `/api/career/analyses/${ANALYSIS}`, method: "GET", cache: "no-store" }]);
    expect(session.ok && reload.state === "AVAILABLE").toBe(true);
    if (!session.ok || reload.state !== "AVAILABLE") return;
    expect(demoStateFromResult(reload.result)).toEqual(demoStateFromResult(session.result));
    expect(projectPxjFirstScreen(input({ result: { state: "AVAILABLE", result: reload.result } }))).toEqual(projectPxjFirstScreen(input({ result: { state: "AVAILABLE", result: session.result } })));
  });

  it("the read: 404 ERR_ANALYSIS_NOT_FOUND is NOT_FOUND, another status or a refused body is FAILED with its code", async () => {
    const { fetcher } = scripted({
      "/api/career/analyses/ANL_MISSING": { status: 404, body: { success: false, status: "FAILED", issues: [{ code: "ERR_ANALYSIS_NOT_FOUND" }] } },
      "/api/career/analyses/ANL_BROKEN": { status: 500, body: { success: false, issues: [{ code: "ERR_SERVER_FATAL" }] } },
      [`/api/career/analyses/${ANALYSIS}`]: { status: 200, body: resultBody({ status: "PENDING" }) }
    });
    expect(await readAnalysisResult("ANL_MISSING", fetcher)).toEqual({ state: "NOT_FOUND" });
    expect(await readAnalysisResult("ANL_BROKEN", fetcher)).toEqual({ state: "FAILED", code: "ERR_SERVER_FATAL" });
    expect(await readAnalysisResult(ANALYSIS, fetcher)).toEqual({ state: "FAILED", code: "RESULT_NOT_VERIFIED" });
    expect(await readAnalysisResult("ANL_NET", async () => { throw new Error("offline"); })).toEqual({ state: "FAILED", code: null });
  });

  it("the projection's own data: the existing adapters; under PERSON × JOB no legacy orbit content", () => {
    const data = demoStateFromResult(accepted());
    expect(data.capabilities.map(capability => [capability.id, capability.projectionState])).toEqual([["CAPP_1", "PROPOSED"], ["CAPP_2", "PROPOSED"], ["CAPP_3", "PROPOSED"]]);
    expect(data.sources.map(source => [source.sourceDocumentId, source.sourceTitle])).toEqual([["DOC_001", "Synthetic profile.pdf"]]);
    expect(data.companyMatches.length + data.roleMatches.length + data.nextActions.length).toBe(3);
    const hidden = withoutLegacyOrbits(data);
    expect([hidden.companyMatches, hidden.roleMatches, hidden.capabilityGaps, hidden.nextActions]).toEqual([[], [], [], []]);
    expect(hidden.capabilities).toEqual(data.capabilities);
    expect(hidden.sources).toEqual(data.sources);
  });
});

describe("T-04 · bindings: analysis, role and mode", () => {
  it("ROLE_MISMATCH: another selected job (or none) shows neither proposals nor coverage, in the session as after a reload", () => {
    for (const other of [{ jobPoolUploadId: UPLOAD, poolRoleId: OTHER_ROLE }, { jobPoolUploadId: "JPOOL_OTHER", poolRoleId: ROLE }, null]) {
      const screen = projectPxjFirstScreen(input({ selection: other }));
      expect(screen).toEqual({ state: "ROLE_MISMATCH", analysisId: ANALYSIS, analysisSelection: { jobPoolUploadId: UPLOAD, poolRoleId: ROLE }, selection: other });
      expect("result" in screen || "proposals" in screen || "coverage" in screen).toBe(false);
      expect(firstScreenCoverageRequest(input({ selection: other }))).toBeNull();
    }
    // Back to the analysis's own job: available again.
    expect(projectPxjFirstScreen(input()).state).toBe("AVAILABLE");
  });

  it("MODE_MISMATCH names both modes and switches nothing: no proposals, no coverage, no B2 read", () => {
    const person = projectPxjFirstScreen(input({ boundary: { state: "RESOLVED", value: boundary({ mode: "PERSON", jobScopeSelection: null, investigationScopeHash: null }) } }));
    expect(person).toEqual({ state: "MODE_MISMATCH", analysisId: ANALYSIS, analysisMode: "PERSON", interfaceMode: "PERSON_X_JOB" });
    const pxjUnderPerson = projectPxjFirstScreen(input({ mode: "PERSON" }));
    expect(pxjUnderPerson).toEqual({ state: "MODE_MISMATCH", analysisId: ANALYSIS, analysisMode: "PERSON_X_JOB", interfaceMode: "PERSON" });
    expect(firstScreenCoverageRequest(input({ mode: "PERSON" }))).toBeNull();
  });

  it("a PERSON analysis under PERSON is today's screen: no coverage and no B2 read", () => {
    const value = boundary({ mode: "PERSON", jobScopeSelection: null, investigationScopeHash: null });
    const screen = projectPxjFirstScreen(input({ mode: "PERSON", boundary: { state: "RESOLVED", value }, coverage: { state: "IDLE" } }));
    expect(screen.state).toBe("PERSON_RESULT");
    expect("coverage" in screen).toBe(false);
    expect(firstScreenCoverageRequest(input({ mode: "PERSON", boundary: { state: "RESOLVED", value } }))).toBeNull();
  });

  it("B2 is requested only for the analysis's own selected job with a projection (P-01)", () => {
    expect(firstScreenCoverageRequest(input())).toEqual({ analysisId: ANALYSIS, scope: selection });
    expect(firstScreenCoverageRequest(input({ result: { state: "AVAILABLE", result: { ...accepted(), projection: null } } }))).toBeNull();
    expect(firstScreenCoverageRequest(input({ boundary: { state: "RESOLVING" } }))).toBeNull();
    expect(firstScreenCoverageRequest(input({ result: { state: "LOADING" } }))).toBeNull();
    expect(firstScreenCoverageRequest(input({ analysisId: null }))).toBeNull();
  });

  it("a result or a boundary about another analysis is never shown (a late answer stays invisible)", () => {
    const late = projectPxjFirstScreen(input({ analysisId: "ANL_NEWER" }));
    expect(late.state).toBe("RESULT_LOADING");
    expect(projectPxjFirstScreen(input({ boundary: { state: "RESOLVED", value: boundary({ analysisId: "ANL_OTHER" }) } })).state).toBe("BOUNDARY_FAILED");
  });
});

describe("T-05 · lineage L-1 … L-4", () => {
  const violated = (change: (value: ReturnType<typeof coverage>) => void) => { const value = coverage(); change(value); return projectPxjFirstScreen(input({ coverage: { state: "AVAILABLE", coverage: value } })); };
  it("each check violated alone gives LINEAGE_MISMATCH naming it; the proposals stay visible, no coverage", () => {
    const cases: Array<[string, (value: ReturnType<typeof coverage>) => void]> = [
      ["L-1", value => { value.binding.analysisId = "ANL_OTHER"; }],
      ["L-1", value => { value.binding.poolRoleId = OTHER_ROLE; }],
      ["L-1", value => { value.binding.jobPoolUploadId = "JPOOL_OTHER"; }],
      ["L-2", value => { value.binding.discoveryRunId = "RUN_B"; }],
      ["L-3", value => { value.binding.investigationScopeHash = "ffff"; }],
      ["L-4", value => { value.proposals = value.proposals.slice(0, 2); }],
      ["L-4", value => { value.proposals = [value.proposals[1], value.proposals[0], value.proposals[2]]; }]
    ];
    for (const [check, change] of cases) {
      const screen = violated(change);
      expect(screen.state).toBe("LINEAGE_MISMATCH");
      if (screen.state !== "LINEAGE_MISMATCH") continue;
      expect(screen.check).toBe(check);
      expect(screen.proposals.map(proposal => proposal.id)).toEqual(["CAPP_1", "CAPP_2", "CAPP_3"]);
      expect("coverage" in screen).toBe(false);
    }
  });

  it("L-1 also holds the persisted selection: a boundary of another job is a role mismatch before any B2", () => {
    expect(projectPxjFirstScreen(input({ boundary: { state: "RESOLVED", value: boundary({ jobScopeSelection: { jobPoolUploadId: UPLOAD, poolRoleId: OTHER_ROLE } }) } })).state).toBe("ROLE_MISMATCH");
  });
});

describe("T-06 · quote join and provenance", () => {
  const rows = (change: (value: ReturnType<typeof coverage>) => void = () => undefined, documents?: Array<{ entityId: string; title: string | null }>) => {
    const value = coverage(); change(value);
    const result = documents === undefined ? accepted() : { ...accepted(), documents };
    const screen = projectPxjFirstScreen(input({ result: { state: "AVAILABLE", result }, coverage: { state: "AVAILABLE", coverage: value } }));
    if (screen.state !== "AVAILABLE") throw new Error(screen.state);
    return screen.coverage.requirements;
  };
  const firstQuote = (requirements: ReturnType<typeof rows>) => requirements[0].quotes[0];

  it("byte-identical (docId, quote) in the same proposal: verified, with the persisted title", () => {
    const requirements = rows();
    expect(requirements.map(requirement => [requirement.poolRequirementId, requirement.coverage, requirement.matchBasis, requirement.weak])).toEqual([["req_pink_alpha_1", "COVERED", "EXACT", false], ["req_pink_alpha_2", "COVERED", "TOKEN_CONTAINMENT", true], ["req_pink_alpha_3", "NOT_COVERED", null, false]]);
    expect(firstQuote(requirements)).toEqual({ docId: "DOC_001", quote: "Architected distributed IIoT Edge Computing systems with 99.999% uptime guarantees.", inProjection: true, sourceResolved: true, sourceTitle: "Synthetic profile.pdf", verified: true });
  });

  const differing: Array<[string, string]> = [
    ["one byte", "Architected distributed IIoT Edge Computing systems with 99.998% uptime guarantees."],
    ["whitespace", "Architected distributed IIoT Edge Computing systems with 99.999% uptime guarantees. "],
    ["a double space", "Architected  distributed IIoT Edge Computing systems with 99.999% uptime guarantees."]
  ];
  for (const [name, quote] of differing) {
    it(`a quote differing in ${name} is not in the projection and carries no verification`, () => {
      const quoteView = firstQuote(rows(value => { const covered = value.requirements[0].coverage; if (covered.state === "COVERED") covered.proposal.evidence[0].quote = quote; }));
      expect(quoteView.inProjection).toBe(false);
      expect(quoteView.verified).toBe(false);
      expect(quoteView.quote).toBe(quote);
    });
  }

  it("a quote differing only in its Unicode form (NFC in the projection, NFD in B2) is not in the projection", () => {
    const nfc = "Led the Z\u00fcrich edge rollout.", nfd = nfc.normalize("NFD");
    expect(nfc === nfd).toBe(false);
    const body = resultBody();
    body.capabilityProposalProjection.capabilities[0].evidence[0].exactQuote = nfc;
    const decoded = decodeAnalysisResult(body, ANALYSIS);
    if (!decoded.ok) throw new Error(decoded.code);
    const value = coverage(); const covered = value.requirements[0].coverage; if (covered.state === "COVERED") covered.proposal.evidence[0].quote = nfd;
    const screen = projectPxjFirstScreen(input({ result: { state: "AVAILABLE", result: decoded.result }, coverage: { state: "AVAILABLE", coverage: value } }));
    if (screen.state !== "AVAILABLE") throw new Error(screen.state);
    expect(screen.coverage.requirements[0].quotes[0]).toMatchObject({ inProjection: false, verified: false, quote: nfd });
    if (covered.state === "COVERED") covered.proposal.evidence[0].quote = nfc;
    const same = projectPxjFirstScreen(input({ result: { state: "AVAILABLE", result: decoded.result }, coverage: { state: "AVAILABLE", coverage: value } }));
    if (same.state !== "AVAILABLE") throw new Error(same.state);
    expect(same.coverage.requirements[0].quotes[0]).toMatchObject({ inProjection: true, verified: true });
  });

  it("a quote from the right text but another proposal's evidence is not in this proposal's projection", () => {
    const quoteView = firstQuote(rows(value => { const covered = value.requirements[0].coverage; if (covered.state === "COVERED") covered.proposal.evidence[0].quote = "high-throughput edge automation"; }));
    expect(quoteView.inProjection).toBe(false);
  });

  it("an unknown capabilityProposalId: proposal not in this projection (no join by name), its quotes unverified", () => {
    const requirement = rows(value => { const covered = value.requirements[0].coverage; if (covered.state === "COVERED") covered.proposal.capabilityProposalId = "CAPP_UNKNOWN"; })[0];
    expect(requirement.proposal).toEqual({ id: "CAPP_UNKNOWN", name: "Distributed Systems Architecture", inProjection: false });
    expect(requirement.quotes[0].verified).toBe(false);
  });

  it("an unresolved source: no verification; a resolved source without a delivered title stays without a title", () => {
    const unresolved = firstQuote(rows(undefined, [{ entityId: "DOC_999", title: "Other" }]));
    expect([unresolved.sourceResolved, unresolved.verified, unresolved.sourceTitle]).toEqual([false, false, null]);
    const untitled = firstQuote(rows(undefined, [{ entityId: "DOC_001", title: null }]));
    expect([untitled.sourceResolved, untitled.verified, untitled.sourceTitle]).toEqual([true, true, null]);
  });

  it("documents without identity.name decode to a null title, never a placeholder", () => {
    const body = resultBody();
    (body.analysis.structured_data.analysis.documents[0] as { identity?: unknown }).identity = undefined;
    const decoded = decodeAnalysisResult(body, ANALYSIS);
    expect(decoded.ok && decoded.result.documents).toEqual([{ entityId: "DOC_001", title: null }]);
  });

  it("counts are B2's whole numbers; rows keep the pool order", () => {
    const screen = projectPxjFirstScreen(input());
    if (screen.state !== "AVAILABLE") throw new Error(screen.state);
    expect(screen.coverage.counts).toEqual({ requirements: 3, covered: 2, notCovered: 1 });
    expect(screen.coverage.requirements.map(requirement => requirement.poolRequirementId)).toEqual(coverage().requirements.map(requirement => requirement.poolRequirementId));
    expect(screen.coverage.covers).toEqual({ CAPP_1: ["req_pink_alpha_1"], CAPP_2: ["req_pink_alpha_2"], CAPP_3: [] });
  });
});
