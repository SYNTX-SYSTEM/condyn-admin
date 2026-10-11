import { describe, expect, it } from "vitest";
import {
  CAMERA_SCALE,
  deriveSyntxField,
  FIELD_OBSERVATION,
  inspectSign,
  observationFromParams,
  observeOrganization,
  observeRequirement,
  observeRole,
  resolveObservation,
  returnFrom,
  summarySentence,
  SUPPORT_DISTANCE,
  SYNTX_FIELD_GRAMMAR,
  type SyntxObservation
} from "../../../lib/career/job-pool/syntx-field-view-model";
import { decodeAnalysisSources, type AnalysisSources } from "../../../lib/career/job-pool/analysis-sources";
import { SIL_COPY } from "../../../lib/career/view-model/sil-language";
import { kubernetesSweepCoverage, matches, UPLOAD_ID, view } from "./fixtures/match-bodies";

const clone = <T>(value: T): T => structuredClone(value);
const at = (kind: SyntxObservation["kind"], ids: Partial<SyntxObservation> = {}): SyntxObservation => ({ ...FIELD_OBSERVATION, kind, ...ids });
const ROLE_A = at("ROLE", { organizationId: "ORG_1", roleId: "ROLE_A" });
const REQ_1 = at("REQUIREMENT", { organizationId: "ORG_1", roleId: "ROLE_A", requirementId: "REQ_1" });

const SOURCES: AnalysisSources = {
  analysisId: "ANL_TEST",
  documents: [{ docId: "DOC_CV", title: "cv.synthetic.pdf" }],
  capabilityEvidence: [{ capabilityEntityId: "CAP_TS", docId: "DOC_CV", quote: "Built services in TypeScript for six years.", location: "page 2" }],
  proposalEvidence: [{ capabilityProposalId: "PCAP_K8S", evidenceId: "EVD_K8S_1", docId: "DOC_CV", quote: "Operated the Kubernetes test cluster for the platform team." }]
};

const SIGN_VALUES = {
  source: ["canonical_entity", "matching_contribution", "gemini_sweep", "evidence", "provenance", "authority_state", "evaluation_state"],
  relation: ["contains", "requires", "supports", "weakly_supports", "covers_unscored", "missing_support", "pending_evaluation"],
  state: ["field", "organization_selected", "role_selected", "requirement_selected", "receded", "inspectable"],
  manifestation: ["carrier", "region", "anchor", "trace_stable", "trace_thin", "trace_dotted", "open_boundary", "suspended_boundary", "temporary_aperture"],
  interaction: ["select", "inspect", "return", "none"],
  transition: ["recenter", "unfold", "recede", "trace_rise", "boundary_suspend", "restore"]
};

describe("SYNTX field view model (read-only adapter over the delivered Job Pool truth)", () => {
  it("FIELD: containment only — organizations as regions, roles as carriers inside them, no score, no coupling, no delivered-order position", () => {
    const field = deriveSyntxField(view, matches, null, FIELD_OBSERVATION)!;
    expect(field.grammar).toBe(SYNTX_FIELD_GRAMMAR);
    expect(field.observation).toEqual(FIELD_OBSERVATION);
    expect(field.organizations.map(organization => [organization.id, organization.name, organization.roleIds, organization.targetEntityId])).toEqual([["ORG_1", "Acme", ["ROLE_A", "ROLE_B"], "TOENT_1"]]);
    // One organization sits at the centre; its two roles share its region (containment, not resonance distance).
    expect(field.organizations[0]).toMatchObject({ x: 500, y: 500 });
    for (const role of field.roles) {
      const organization = field.organizations[0];
      expect(Math.hypot(role.x - organization.x, role.y - organization.y)).toBeLessThan(organization.radius);
      expect(role.sign).toMatchObject({ source: "canonical_entity", relation: "contains", manifestation: "carrier", state: "field", interaction: "select", transition: "recenter" });
      expect(role.sign.proof).toEqual({ uploadId: UPLOAD_ID, organizationId: "ORG_1", roleId: role.id, targetId: role.bindingRevisionId });
    }
    expect(field.roles.map(role => [role.id, role.requirementCount, role.matching?.resonanceScore])).toEqual([["ROLE_A", 2, 0.75], ["ROLE_B", 1, 0.3]]);
    expect(field.requirements).toEqual([]);
    expect(field.sources).toEqual([]);
    expect(field.pendingBoundary).toBeNull();
    expect(field.aperture).toBeNull();
    expect(field.camera).toEqual({ x: 500, y: 500, scale: CAMERA_SCALE.FIELD });
    // No sign of the FIELD state carries a score, a coupling or a rank (R4/R14): only containment signs exist.
    expect(new Set(field.signs.map(sign => sign.relation))).toEqual(new Set(["contains"]));
    expect(field.signs.map(sign => sign.id)).toEqual([`field:${UPLOAD_ID}`, "org:ORG_1", "role:ROLE_A", "role:ROLE_B"]);
    expect(field.summary).toEqual({ kind: "FIELD", poolName: "Sample Pool", poolVersion: 1, poolStatus: "ACTIVE", organizationCount: 1, roleCount: 2, matchingDelivered: true });
  });

  it("ORGANIZATION: the selected region recenters and unfolds, the pool recedes behind it", () => {
    const field = deriveSyntxField(view, matches, null, at("ORGANIZATION", { organizationId: "ORG_1" }))!;
    expect(field.organizations[0].sign).toMatchObject({ state: "organization_selected", interaction: "return", transition: "unfold" });
    expect(field.pool.sign).toMatchObject({ state: "receded", interaction: "return", transition: "restore" });
    expect(field.roles.every(role => role.sign.state === "field")).toBe(true);
    expect(field.camera).toMatchObject({ x: field.organizations[0].x, y: field.organizations[0].y });
    expect(field.camera.scale).toBeGreaterThan(1);
    expect(field.summary).toEqual({ kind: "ORGANIZATION", organizationName: "Acme", roleTitles: ["Platform Engineer", "Data Analyst"] });
  });

  it("ROLE: relation-state geometry — anchors by support category, traces per delivered quote, one suspended boundary, source carriers; no closure", () => {
    const field = deriveSyntxField(view, matches, null, ROLE_A)!;
    const roleA = field.roles.find(role => role.id === "ROLE_A")!;
    expect(roleA.sign).toMatchObject({ state: "role_selected", interaction: "return", transition: "unfold" });
    expect(field.roles.find(role => role.id === "ROLE_B")!.sign.state).toBe("receded");
    expect(field.camera).toEqual({ x: roleA.x, y: roleA.y, scale: CAMERA_SCALE.ROLE });
    expect(field.requirements.map(requirement => [requirement.id, requirement.support, requirement.distance, requirement.evaluationState])).toEqual([
      ["REQ_1", "SUPPORTED", SUPPORT_DISTANCE.SUPPORTED, "NOT_EVALUATED"],
      ["REQ_2", "SWEEP_ONLY", SUPPORT_DISTANCE.SWEEP_ONLY, "NOT_EVALUATED"]
    ]);
    for (const requirement of field.requirements) expect(Math.hypot(requirement.x - roleA.x, requirement.y - roleA.y)).toBeCloseTo(requirement.distance, 1);
    const [supported, sweepOnly] = field.requirements;
    expect(supported.sign).toMatchObject({ source: "canonical_entity", relation: "requires", manifestation: "anchor", state: "field", proof: { uploadId: UPLOAD_ID, roleId: "ROLE_A", requirementId: "REQ_1", trqrevId: "TRQREV_1" } });
    expect(supported.traces).toHaveLength(1);
    expect(supported.traces[0]).toMatchObject({ kind: "supports", docId: "DOC_CV", quote: "Built services in TypeScript for six years.", capabilityId: "CAP_TS", contribution: 0.75, confidence: 0.9, weight: 2.2, sourceTitleState: "NOT_READ", sourceTitle: null, location: null, evidenceId: null });
    expect(supported.traces[0].sign).toMatchObject({ source: "evidence", relation: "supports", manifestation: "trace_stable", interaction: "inspect", transition: "trace_rise", proof: { uploadId: UPLOAD_ID, roleId: "ROLE_A", requirementId: "REQ_1", analysisId: "ANL_TEST", capabilityId: "CAP_TS", docId: "DOC_CV" } });
    expect(supported.traces[0].sign.proof.evidenceId).toBeUndefined();
    expect(supported.openBoundary).toBeNull();
    // Sweep coverage: dotted, never scored, no coupling, no confidence (binding §3); the missing requirement is covered, not open.
    expect(sweepOnly.traces).toHaveLength(1);
    expect(sweepOnly.traces[0]).toMatchObject({ kind: "covers_unscored", capabilityId: "PCAP_K8S", capabilityName: kubernetesSweepCoverage.name, contribution: null, confidence: null, weight: 1 });
    expect(sweepOnly.traces[0].sign).toMatchObject({ source: "gemini_sweep", relation: "covers_unscored", manifestation: "trace_dotted" });
    expect(sweepOnly.openBoundary).toBeNull();
    // One source carrier per delivered docId; its relation is the strongest delivered relation among its traces.
    expect(field.sources.map(source => [source.docId, source.traceCount, source.sign.relation, source.titleState])).toEqual([["DOC_CV", 2, "supports", "NOT_READ"]]);
    // The one suspended boundary of the ecology (R2): pending evaluation with TRPREV and every TRQREV as proof.
    expect(field.pendingBoundary).toMatchObject({ roleId: "ROLE_A", targetRoleProfileRevisionId: "TRPREV_A", targetRequirementRevisionIds: ["TRQREV_1", "TRQREV_2"] });
    expect(field.pendingBoundary!.sign).toMatchObject({ source: "evaluation_state", relation: "pending_evaluation", manifestation: "suspended_boundary", interaction: "inspect", transition: "boundary_suspend", proof: { uploadId: UPLOAD_ID, roleId: "ROLE_A", analysisId: "ANL_TEST", targetId: "TRPREV_A", trqrevId: "TRQREV_1 TRQREV_2" } });
    expect(field.signs.filter(sign => sign.relation === "pending_evaluation")).toHaveLength(1);
    expect(field.summary).toEqual({ kind: "ROLE", roleTitle: "Platform Engineer", organizationName: "Acme", requirementCount: 2, supported: 1, weak: 0, sweepOnly: 1, open: 0, unread: 0, pendingEvaluation: true });
  });

  it("weak support scores but never closes; a requirement with weak evidence and a sweep proposal keeps both traces (overlap, F-LF-1)", () => {
    const body = clone(matches);
    body.roleMatches[1].weakEvidence[0].sweepProposal = kubernetesSweepCoverage;
    const field = deriveSyntxField(view, body, null, at("ROLE", { organizationId: "ORG_1", roleId: "ROLE_B" }))!;
    const [weak] = field.requirements;
    expect(weak).toMatchObject({ id: "REQ_3", support: "WEAK", distance: SUPPORT_DISTANCE.WEAK });
    expect(weak.traces.map(trace => [trace.kind, trace.sign.manifestation, trace.contribution, trace.weight])).toEqual([["weakly_supports", "trace_thin", 0.18, 1.2], ["covers_unscored", "trace_dotted", null, 1]]);
    expect(weak.traces[0].weakReason).toBe("confidence 0.3 below weakEvidenceThreshold 0.4");
    expect(field.signs.map(sign => sign.manifestation)).not.toContain("closed");
  });

  it("missing support is a neutral open boundary computed from the delivered missing set, never a failure", () => {
    const body = clone(matches);
    body.roleMatches[0].missing[0].sweepProposal = null;
    body.roleMatches[0].sweepOnlyCoverageCount = 0;
    const field = deriveSyntxField(view, body, null, ROLE_A)!;
    const open = field.requirements.find(requirement => requirement.id === "REQ_2")!;
    expect(open).toMatchObject({ support: "OPEN", distance: SUPPORT_DISTANCE.OPEN, traces: [], evidenceHint: "cluster operations" });
    expect(open.openBoundary).toMatchObject({ source: "matching_contribution", relation: "missing_support", manifestation: "open_boundary", interaction: "inspect", proof: { uploadId: UPLOAD_ID, roleId: "ROLE_A", requirementId: "REQ_2", analysisId: "ANL_TEST" } });
    expect(JSON.stringify(field)).not.toMatch(/fail|incompet|disqualif|zero capability/i);
    const aperture = deriveSyntxField(view, body, null, inspectSign({ ...REQ_1, requirementId: "REQ_2" }, "open:REQ_2"))!.aperture!;
    expect(aperture.inspects.kind).toBe("open");
    expect(aperture.sign).toMatchObject({ id: "aperture:open:REQ_2", manifestation: "temporary_aperture", interaction: "return", transition: "restore", relation: "missing_support" });
  });

  it("REQUIREMENT: the observed anchor is selected, its traces inspectable, everything else recedes; the aperture opens only on inspection", () => {
    const field = deriveSyntxField(view, matches, null, REQ_1)!;
    expect(field.requirements.find(requirement => requirement.id === "REQ_1")!.sign.state).toBe("requirement_selected");
    expect(field.requirements.find(requirement => requirement.id === "REQ_1")!.traces[0].sign.state).toBe("inspectable");
    expect(field.requirements.find(requirement => requirement.id === "REQ_2")!.sign.state).toBe("receded");
    expect(field.requirements.find(requirement => requirement.id === "REQ_2")!.traces[0].sign.state).toBe("receded");
    expect(field.camera.scale).toBe(CAMERA_SCALE.REQUIREMENT);
    expect(field.aperture).toBeNull();
    expect(field.summary).toEqual({ kind: "REQUIREMENT", requirementName: "TypeScript", roleTitle: "Platform Engineer", support: "SUPPORTED", traceCount: 1, sourceCount: 1, apertureOpen: false });
    const traceId = field.requirements[0].traces[0].sign.id;
    const inspected = deriveSyntxField(view, matches, null, inspectSign(REQ_1, traceId))!;
    expect(inspected.aperture).not.toBeNull();
    expect(inspected.aperture!.inspects).toMatchObject({ kind: "trace", trace: { sign: { id: traceId } } });
    expect(inspected.aperture!.sign).toMatchObject({ id: `aperture:${traceId}`, source: "evidence", relation: "supports", manifestation: "temporary_aperture", state: "inspectable", interaction: "return", transition: "restore" });
    expect(inspected.summary).toMatchObject({ kind: "REQUIREMENT", apertureOpen: true });
    // The pending boundary is inspectable at ROLE level as well (where authority prevents closure, spec STATE C).
    const pending = deriveSyntxField(view, matches, null, inspectSign(ROLE_A, "pending:ROLE_A"))!;
    expect(pending.aperture!.inspects.kind).toBe("pending");
    expect(pending.aperture!.sign.relation).toBe("pending_evaluation");
  });

  it("joins source title, evidence location and sweep evidence id only by exact match inside the same analysis; a miss omits the field", () => {
    const resolved = deriveSyntxField(view, matches, SOURCES, REQ_1)!;
    const stable = resolved.requirements[0].traces[0];
    expect(stable).toMatchObject({ sourceTitle: "cv.synthetic.pdf", sourceTitleState: "RESOLVED", location: "page 2", evidenceId: null });
    const dotted = resolved.requirements[1].traces[0];
    expect(dotted).toMatchObject({ sourceTitle: "cv.synthetic.pdf", sourceTitleState: "RESOLVED", location: null, evidenceId: "EVD_K8S_1" });
    expect(dotted.sign.proof.evidenceId).toBe("EVD_K8S_1");
    expect(resolved.sources[0]).toMatchObject({ title: "cv.synthetic.pdf", titleState: "RESOLVED" });
    // A different quote, capability or document never joins; no fuzzy fallback.
    const mismatched: AnalysisSources = { ...SOURCES, documents: [], capabilityEvidence: [{ ...SOURCES.capabilityEvidence[0], quote: "Built services in TypeScript." }], proposalEvidence: [{ ...SOURCES.proposalEvidence[0], capabilityProposalId: "PCAP_OTHER" }] };
    const missed = deriveSyntxField(view, matches, mismatched, REQ_1)!;
    expect(missed.requirements[0].traces[0]).toMatchObject({ sourceTitle: null, sourceTitleState: "UNRESOLVED", location: null });
    expect(missed.requirements[1].traces[0]).toMatchObject({ evidenceId: null });
    expect(missed.requirements[1].traces[0].sign.proof.evidenceId).toBeUndefined();
    // Sources of another analysis are not an input for this matching (same analysis only, SG-1).
    const foreign = deriveSyntxField(view, matches, { ...SOURCES, analysisId: "ANL_OTHER" }, REQ_1)!;
    expect(foreign.requirements[0].traces[0].sourceTitleState).toBe("NOT_READ");
  });

  it("without a delivered matching of this exact upload the field is containment only: anchors UNREAD, no traces, no boundary, no score", () => {
    const other = clone(matches);
    other.jobPoolUploadId = "JPOOL_OTHER";
    const field = deriveSyntxField(view, other, SOURCES, ROLE_A)!;
    expect(field.matchingDelivered).toBe(false);
    expect(field.analysisId).toBeNull();
    expect(field.boundary).toBeNull();
    expect(field.roles.every(role => role.matching === null)).toBe(true);
    expect(field.requirements.map(requirement => [requirement.support, requirement.evaluationState, requirement.traces.length, requirement.openBoundary])).toEqual([["UNREAD", null, 0, null], ["UNREAD", null, 0, null]]);
    expect(field.pendingBoundary).toBeNull();
    expect(field.sources).toEqual([]);
    expect(deriveSyntxField(null, matches, null, FIELD_OBSERVATION)).toBeNull();
  });

  it("every sign uses only the §14.3 values the binding produces and carries its proof; no closure, no canonical relation id, no verified claim", () => {
    const fields = [FIELD_OBSERVATION, at("ORGANIZATION", { organizationId: "ORG_1" }), ROLE_A, REQ_1, inspectSign(REQ_1, "trace:REQ_1:supports:DOC_CV:0")].map(observation => deriveSyntxField(view, matches, SOURCES, observation)!);
    for (const field of fields) {
      for (const sign of field.signs) {
        expect(SIGN_VALUES.source).toContain(sign.source);
        expect(SIGN_VALUES.relation).toContain(sign.relation);
        expect(SIGN_VALUES.state).toContain(sign.state);
        expect(SIGN_VALUES.manifestation).toContain(sign.manifestation);
        expect(SIGN_VALUES.interaction).toContain(sign.interaction);
        expect(SIGN_VALUES.transition).toContain(sign.transition);
        expect(sign.proof.uploadId).toBe(UPLOAD_ID);
        if (sign.manifestation.startsWith("trace_")) expect(sign.proof).toMatchObject({ analysisId: "ANL_TEST", capabilityId: expect.stringMatching(/^(CAP|PCAP)_/), docId: expect.any(String), requirementId: expect.any(String) });
      }
      expect(new Set(field.signs.map(sign => sign.id)).size).toBe(field.signs.length);
      const text = JSON.stringify(field);
      expect(text).not.toMatch(/\b(CRR|RRA|RRL|TSN|EIS|RPR|RCP|DAR|DCTXREV|DCR|DREV|DCDRB)_[0-9A-Z]/);
      expect(text).not.toMatch(/PHASE4_VERIFIED|VERIFIED_CAPABILITY"|AUTHORITATIVE|"decision":true|"scored":true|closed_boundary|"closure"/);
    }
  });

  it("resolves stale observation ids to their parent level and names them; transitions are reversible and never mutate the inputs", () => {
    expect(resolveObservation(view, at("ROLE", { organizationId: "ORG_1", roleId: "ROLE_X" }))).toEqual({ observation: FIELD_OBSERVATION, stale: { kind: "ROLE", id: "ROLE_X" } });
    expect(resolveObservation(view, { ...REQ_1, requirementId: "REQ_X" })).toEqual({ observation: ROLE_A, stale: { kind: "REQUIREMENT", id: "REQ_X" } });
    expect(resolveObservation(view, at("ORGANIZATION", { organizationId: "ORG_X" }))).toEqual({ observation: FIELD_OBSERVATION, stale: { kind: "ORGANIZATION", id: "ORG_X" } });
    expect(resolveObservation(view, at("ROLE", { roleId: "ROLE_B" })).observation).toEqual(at("ROLE", { organizationId: "ORG_1", roleId: "ROLE_B" }));
    const snapshot = JSON.stringify([view, matches]);
    const organization = observeOrganization(FIELD_OBSERVATION, "ORG_1");
    expect(organization).toEqual(at("ORGANIZATION", { organizationId: "ORG_1" }));
    expect(observeOrganization(organization, "ORG_1")).toEqual(FIELD_OBSERVATION);
    const role = observeRole(organization, "ORG_1", "ROLE_A");
    expect(role).toEqual(ROLE_A);
    expect(observeRole(role, "ORG_1", "ROLE_A")).toEqual(organization);
    const requirement = observeRequirement(role, "REQ_1");
    expect(requirement).toEqual(REQ_1);
    expect(observeRequirement(requirement, "REQ_1")).toEqual(ROLE_A);
    const opened = inspectSign(requirement, "trace:REQ_1:supports:DOC_CV:0");
    expect(opened.apertureSignId).toBe("trace:REQ_1:supports:DOC_CV:0");
    expect(returnFrom(opened)).toEqual(REQ_1);
    expect(returnFrom(REQ_1)).toEqual(ROLE_A);
    expect(returnFrom(ROLE_A)).toEqual(organization);
    expect(returnFrom(organization)).toEqual(FIELD_OBSERVATION);
    expect(returnFrom(FIELD_OBSERVATION)).toEqual(FIELD_OBSERVATION);
    expect(inspectSign(FIELD_OBSERVATION, "x")).toEqual(FIELD_OBSERVATION);
    expect(observationFromParams("ORG_1", "ROLE_A", "REQ_1")).toEqual(REQ_1);
    expect(observationFromParams(null, "ROLE_A", null)).toEqual(at("ROLE", { roleId: "ROLE_A" }));
    expect(observationFromParams("ORG_1", undefined, undefined)).toEqual(at("ORGANIZATION", { organizationId: "ORG_1" }));
    expect(observationFromParams("", "", "")).toEqual(FIELD_OBSERVATION);
    expect(JSON.stringify([view, matches])).toBe(snapshot);
  });

  it("generates the screen-reader summary from the same facts as the signs, in the SIL locale", () => {
    const en = SIL_COPY.en.syntx.summary;
    expect(summarySentence(deriveSyntxField(view, matches, null, FIELD_OBSERVATION)!.summary, en)).toBe("Job pool Sample Pool, version 1, ACTIVE: 1 organizations containing 2 roles. A presentation matching was read for this pool.");
    expect(summarySentence(deriveSyntxField(view, matches, null, ROLE_A)!.summary, en)).toBe("Role Platform Engineer at Acme requires 2 requirements: 1 with scored support, 0 with weak support, 1 covered only by an unscored sweep proposal, 0 without delivered support, 0 without a matching read. Canonical evaluation is pending for every requirement of this role.");
    expect(summarySentence(deriveSyntxField(view, matches, null, REQ_1)!.summary, en)).toBe("Requirement TypeScript of role Platform Engineer: supported by scored evidence; 1 evidence traces from 1 sources.");
    expect(summarySentence(deriveSyntxField(view, matches, null, at("ORGANIZATION", { organizationId: "ORG_1" }))!.summary, SIL_COPY.de.syntx.summary)).toBe("Organisation Acme enthält 2 Rollen: Platform Engineer, Data Analyst.");
  });
});

describe("analysis sources (the permitted second read, binding §1/§2.3)", () => {
  const body = {
    success: true,
    analysisId: "ANL_TEST",
    matching: { role_matches: [{ role: "Inferred Role" }] },
    recommendations: { capabilityGaps: ["Acquire capability X"] },
    capabilityProposalProjection: { capabilities: [{ id: "PCAP_K8S", name: "Kubernetes Cluster Operations", evidence: [{ evidenceId: "EVD_K8S_1", sourceDocumentId: "DOC_CV", exactQuote: "Operated the Kubernetes test cluster for the platform team.", verificationState: "SOURCE_MATCH_VERIFIED" }] }] },
    analysis: { structured_data: { analysis: {
      documents: [{ entity_id: "DOC_CV", identity: { type: "DOCUMENT", name: "cv.synthetic.pdf" } }, { entity_id: "DOC_BROKEN" }],
      capabilities: [{ entity_id: "CAP_TS", identity: { type: "CAPABILITY", name: "TypeScript" }, evidence: [{ doc_id: "DOC_CV", location: "page 2", context_quote: "Built services in TypeScript for six years." }] }],
      organizations: [{ entity_id: "ORG_INFERRED", identity: { name: "Inferred Org" } }],
      roles: [{ entity_id: "ROLE_INFERRED", identity: { name: "Inferred Role" } }]
    } } }
  };

  it("decodes documents, capability evidence and proposal evidence, and nothing else", () => {
    const sources = decodeAnalysisSources("ANL_TEST", body);
    expect(sources).toEqual({
      analysisId: "ANL_TEST",
      documents: [{ docId: "DOC_CV", title: "cv.synthetic.pdf" }],
      capabilityEvidence: [{ capabilityEntityId: "CAP_TS", docId: "DOC_CV", quote: "Built services in TypeScript for six years.", location: "page 2" }],
      proposalEvidence: [{ capabilityProposalId: "PCAP_K8S", evidenceId: "EVD_K8S_1", docId: "DOC_CV", quote: "Operated the Kubernetes test cluster for the platform team." }]
    });
    expect(JSON.stringify(sources)).not.toMatch(/Inferred|Acquire|role_matches|recommendations/);
  });

  it("decodes malformed or absent parts to empty lists, never to a guess", () => {
    expect(decodeAnalysisSources("ANL_X", null)).toEqual({ analysisId: "ANL_X", documents: [], capabilityEvidence: [], proposalEvidence: [] });
    expect(decodeAnalysisSources("ANL_X", { analysis: { structured_data: { analysis: { documents: "nope", capabilities: [{ entity_id: "CAP", evidence: [{ doc_id: "D" }] }] } } }, capabilityProposalProjection: { capabilities: [{ id: "PCAP", evidence: [{ evidenceId: "E" }] }] } })).toEqual({ analysisId: "ANL_X", documents: [], capabilityEvidence: [], proposalEvidence: [] });
  });
});
