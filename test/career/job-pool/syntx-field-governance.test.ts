/**
 * SYNTX field governance (GELB; SYNTX_FIELD_CONTRACT_BINDING.md §5, the semantic subset of spec §15.3).
 *
 * Exhaustive over every observation point of a two-organization field (FIELD, each ORGANIZATION, each ROLE, each
 * REQUIREMENT, each aperture): every sign resolves its proof to the binding table §2; missing support is never a
 * failure; sweep coverage is never scored and never couples; NOT_EVALUATED prevents closure; FIELD and ORGANIZATION
 * carry no score; containment equals the canonical bindings; overlap is preserved; nothing from the §3 list or from
 * analysis.matching / analysis.recommendations reaches the field. Interaction (recenter, recede, return, motion) is
 * GRÜN's suite; the running walk is PINK's acceptance.
 */
import { describe, expect, it } from "vitest";
import {
  deriveSyntxField,
  FIELD_OBSERVATION,
  SUPPORT_DISTANCE,
  type SyntxField,
  type SyntxObservation,
  type VisualSign
} from "../../../lib/career/job-pool/syntx-field-view-model";
import { decodeAnalysisSources, type AnalysisSources } from "../../../lib/career/job-pool/analysis-sources";
import type { JobPoolMatchPresentation, JobPoolSweepProposalCoverage, JobPoolUploadView } from "../../../lib/career/job-pool/types";
import { SIL_COPY } from "../../../lib/career/view-model/sil-language";
import { kubernetesSweepCoverage, matches as baseMatches, view as baseView } from "./fixtures/match-bodies";

const clone = <T>(value: T): T => structuredClone(value);

/* ------------------------------------------------------------------------------------------------------------------
 * A two-organization world: ORG_1 ⊃ {ROLE_A, ROLE_B} (fixture), ORG_2 ⊃ {ROLE_C} with a matched + sweep-covered
 * requirement (overlap), a weak TOKEN_CONTAINMENT requirement above the threshold (weak is not only "below threshold")
 * and a missing requirement without sweep (open). The matching mislabels ROLE_C's organization and delivers a role the
 * pool does not contain: containment must follow the canonical mapping only.
 * ------------------------------------------------------------------------------------------------------------------ */

const goSweep: JobPoolSweepProposalCoverage = {
  capabilityProposalId: "PCAP_GO",
  name: "Go Service Development",
  matchBasis: "EXACT",
  matchedConstituent: null,
  evidence: [{ docId: "DOC_LETTER", quote: "Wrote the ingestion service in Go." }],
  evidenceState: "SOURCE_MATCH_VERIFIED",
  authorityState: "NONE",
  scored: false
};

const view: JobPoolUploadView = (() => {
  const next = clone(baseView);
  next.organizationCount = 2;
  next.roleCount = 3;
  next.requirementCount = 6;
  next.canonicalMapping.organizations.push({ poolOrganizationId: "ORG_2", name: "Beta Labs", targetOrganizationEntityId: "TOENT_2", targetOrganizationRevisionId: "TOREV_2" });
  next.canonicalMapping.roles.push({
    poolRoleId: "ROLE_C", title: "Backend Engineer", poolOrganizationId: "ORG_2", targetSourceRevisionId: "TSREV_1", targetRoleEntityId: "TRENT_C",
    targetRoleSourceBindingRevisionId: "TRSB_C", targetRoleOrganizationBindingRevisionId: "TROB_C", targetRoleProfileRevisionId: "TRPREV_C",
    targetRoleReconstructionBatchRunId: "TRRB_1", targetRequirementReconstructionBatchRunId: "TRQRB_1",
    requirements: [
      { poolRequirementId: "REQ_4", capabilityName: "Go", targetRequirementEntityId: "TRQENT_4", targetRequirementRevisionId: "TRQREV_4", targetRequirementReconstructionResultId: "TRQRR_4", targetRequirementEntityAdmissionId: "TRQEA_4", matchingEligibility: "MATCHING_ELIGIBLE_PROPOSAL_ONLY", necessityState: "REQUIRED" },
      { poolRequirementId: "REQ_5", capabilityName: "Rust", targetRequirementEntityId: "TRQENT_5", targetRequirementRevisionId: "TRQREV_5", targetRequirementReconstructionResultId: "TRQRR_5", targetRequirementEntityAdmissionId: "TRQEA_5", matchingEligibility: "MATCHING_ELIGIBLE_PROPOSAL_ONLY", necessityState: "PREFERRED" },
      { poolRequirementId: "REQ_6", capabilityName: "Node.js", targetRequirementEntityId: "TRQENT_6", targetRequirementRevisionId: "TRQREV_6", targetRequirementReconstructionResultId: "TRQRR_6", targetRequirementEntityAdmissionId: "TRQEA_6", matchingEligibility: "MATCHING_ELIGIBLE_PROPOSAL_ONLY", necessityState: "REQUIRED" }
    ]
  });
  return next;
})();

const matches: JobPoolMatchPresentation = (() => {
  const next = clone(baseMatches);
  next.roleMatches.push({
    // Mislabelled on purpose: the matching names ORG_1 / "Acme"; the canonical binding (TROB_C) places ROLE_C in ORG_2.
    poolRoleId: "ROLE_C", title: "Backend Engineer", seniority: "Senior", domainFocus: "Backend", poolOrganizationId: "ORG_1", organizationName: "Acme", resonanceScore: 0.61,
    matched: [{ poolRequirementId: "REQ_4", capabilityName: "Go", requiredLevel: "L3", weight: 1, necessity: "REQUIRED", matchBasis: "EXACT", matchedCapabilityName: "Go", matchedCapabilityEntityId: "CAP_GO", matchedConstituent: null, confidence: 0.85, contribution: 0.85, evidence: [{ docId: "DOC_CV", quote: "Maintained Go microservices." }, { docId: "DOC_LETTER", quote: "Wrote the ingestion service in Go." }], sweepProposal: goSweep }],
    weakEvidence: [{ poolRequirementId: "REQ_6", capabilityName: "Node.js", requiredLevel: "L2", weight: 0.8, necessity: "REQUIRED", matchBasis: "TOKEN_CONTAINMENT", matchedCapabilityName: "Node.js Tooling", matchedCapabilityEntityId: "CAP_NODE", matchedConstituent: null, confidence: 0.6, contribution: 0.336, evidence: [{ docId: "DOC_CV", quote: "Built Node.js tooling." }], reason: "basis TOKEN_CONTAINMENT is always weak", sweepProposal: null }],
    missing: [{ poolRequirementId: "REQ_5", capabilityName: "Rust", requiredLevel: "L2", weight: 0.4, necessity: "PREFERRED", evidenceHint: "systems programming", sweepProposal: null }],
    sweepOnlyCoverageCount: 0,
    canonical: { targetRoleProfileRevisionId: "TRPREV_C", targetRequirementRevisionIds: ["TRQREV_4", "TRQREV_5", "TRQREV_6"], capabilityRequirementRelationState: "NOT_EVALUATED", reason: "VERIFIED_CAPABILITY_SNAPSHOT_ABSENT" }
  });
  // A delivered role the pool does not contain: it must not become a carrier.
  next.roleMatches.push({ ...clone(next.roleMatches[0]), poolRoleId: "ROLE_GHOST", title: "Ghost Role", resonanceScore: 0.99 });
  next.organizationMatches = [
    { poolOrganizationId: "ORG_1", name: "Acme", industry: "Software", aggregateScore: 0.525, roleCount: 2, topRoleTitle: "Platform Engineer" },
    { poolOrganizationId: "ORG_2", name: "Beta Labs", industry: "Data", aggregateScore: 0.61, roleCount: 1, topRoleTitle: "Backend Engineer" }
  ];
  return next;
})();

// Sentinels that must never reach the field: foreign role sets, recommendations, inferred organizations and roles.
const FORBIDDEN = "SENTINEL_NOT_BOUND";
const analysisBody = {
  analysis: {
    matching: { role_matches: [{ role_id: `${FORBIDDEN}_ROLE`, score: 0.97 }], organization_matches: [{ name: `${FORBIDDEN}_ORG` }] },
    recommendations: { capabilityGaps: [`${FORBIDDEN}_GAP`], nextActions: [`Acquire capability ${FORBIDDEN}`] },
    structured_data: {
      analysis: {
        documents: [
          { entity_id: "DOC_CV", identity: { name: "cv.synthetic.pdf" } },
          { entity_id: "DOC_LETTER", identity: { name: "letter.synthetic.pdf" } }
        ],
        capabilities: [
          { entity_id: "CAP_TS", evidence: [{ doc_id: "DOC_CV", context_quote: "Built services in TypeScript for six years.", location: "page 2" }] },
          // Not exact: the quote differs by a trailing space, so no location may be joined.
          { entity_id: "CAP_GO", evidence: [{ doc_id: "DOC_CV", context_quote: "Maintained Go microservices. ", location: "page 3" }] },
          { entity_id: "CAP_NODE", evidence: [{ doc_id: "DOC_CV", context_quote: "Built Node.js tooling.", location: "page 4" }] }
        ],
        organizations: [{ entity_id: "ORG_INFERRED", identity: { name: `${FORBIDDEN}_INFERRED_ORG` } }],
        roles: [{ entity_id: "ROLE_INFERRED", identity: { name: `${FORBIDDEN}_INFERRED_ROLE` } }],
        matching: { role_matches: [{ role_id: `${FORBIDDEN}_NESTED_ROLE` }] },
        recommendations: [`${FORBIDDEN}_NESTED_RECOMMENDATION`]
      }
    }
  },
  matching: { role_matches: [{ role_id: `${FORBIDDEN}_TOP_ROLE` }] },
  recommendations: [`${FORBIDDEN}_TOP_RECOMMENDATION`],
  capabilityProposalProjection: {
    capabilities: [
      { id: "PCAP_K8S", evidence: [{ evidenceId: "EVD_K8S_1", sourceDocumentId: "DOC_CV", exactQuote: "Operated the Kubernetes test cluster for the platform team." }] },
      // A proposal id that is delivered nowhere in the matching: it must not surface.
      { id: "PCAP_UNDELIVERED", evidence: [{ evidenceId: "EVD_UNDELIVERED", sourceDocumentId: "DOC_CV", exactQuote: "Nothing delivered." }] }
    ]
  }
};
const sources: AnalysisSources = decodeAnalysisSources(matches.analysisId, analysisBody);

/* ------------------------------------------------------------------------------------------------------------------
 * The walk: every observation point the field offers, including every aperture it can open.
 * ------------------------------------------------------------------------------------------------------------------ */

function observationPoints(input: { view: JobPoolUploadView; matching: JobPoolMatchPresentation | null; sources: AnalysisSources | null }): Array<{ name: string; field: SyntxField }> {
  const derive = (observation: SyntxObservation) => deriveSyntxField(input.view, input.matching, input.sources, observation)!;
  const points: Array<{ name: string; field: SyntxField }> = [{ name: "FIELD", field: derive(FIELD_OBSERVATION) }];
  for (const organization of input.view.canonicalMapping.organizations) {
    points.push({ name: `ORGANIZATION ${organization.poolOrganizationId}`, field: derive({ ...FIELD_OBSERVATION, kind: "ORGANIZATION", organizationId: organization.poolOrganizationId }) });
  }
  for (const role of input.view.canonicalMapping.roles) {
    const roleObservation: SyntxObservation = { ...FIELD_OBSERVATION, kind: "ROLE", organizationId: role.poolOrganizationId, roleId: role.poolRoleId };
    const roleField = derive(roleObservation);
    points.push({ name: `ROLE ${role.poolRoleId}`, field: roleField });
    if (roleField.pendingBoundary !== null) points.push({ name: `ROLE ${role.poolRoleId} pending aperture`, field: derive({ ...roleObservation, apertureSignId: roleField.pendingBoundary.sign.id }) });
    for (const requirement of role.requirements) {
      const requirementObservation: SyntxObservation = { kind: "REQUIREMENT", organizationId: role.poolOrganizationId, roleId: role.poolRoleId, requirementId: requirement.poolRequirementId, apertureSignId: null };
      const requirementField = derive(requirementObservation);
      points.push({ name: `REQUIREMENT ${requirement.poolRequirementId}`, field: requirementField });
      const observed = requirementField.requirements.find(item => item.id === requirement.poolRequirementId)!;
      const inspectable = [...observed.traces.map(trace => trace.sign.id), ...(observed.openBoundary !== null ? [observed.openBoundary.id] : []), ...(requirementField.pendingBoundary !== null ? [requirementField.pendingBoundary.sign.id] : [])];
      for (const signId of inspectable) points.push({ name: `REQUIREMENT ${requirement.poolRequirementId} aperture ${signId}`, field: derive({ ...requirementObservation, apertureSignId: signId }) });
    }
  }
  return points;
}

const WORLD = { view, matching: matches, sources };
const POINTS = observationPoints(WORLD);

/* ------------------------------------------------------------------------------------------------------------------
 * Proof resolution against binding §2 (the only place a sign's referent may come from).
 * ------------------------------------------------------------------------------------------------------------------ */

const SIGN_VALUES: Record<"source" | "relation" | "state" | "manifestation" | "interaction" | "transition", readonly string[]> = {
  source: ["canonical_entity", "matching_contribution", "gemini_sweep", "evidence", "provenance", "authority_state", "evaluation_state"],
  relation: ["contains", "requires", "supports", "weakly_supports", "covers_unscored", "missing_support", "pending_evaluation"],
  state: ["field", "organization_selected", "role_selected", "requirement_selected", "receded", "inspectable"],
  manifestation: ["carrier", "region", "anchor", "trace_stable", "trace_thin", "trace_dotted", "open_boundary", "suspended_boundary", "temporary_aperture"],
  interaction: ["select", "inspect", "return", "none"],
  transition: ["recenter", "unfold", "recede", "trace_rise", "boundary_suspend", "restore"]
};

/** Returns the binding row a sign resolves to, or throws naming the unresolved reference. */
function resolveProof(sign: VisualSign, world: typeof WORLD): string {
  const { proof } = sign;
  const mapping = world.view.canonicalMapping;
  const fail = (reason: string): never => { throw new Error(`${sign.id}: ${reason} (${JSON.stringify(proof)})`); };
  if (proof.uploadId !== world.view.jobPoolUploadId) fail("uploadId is not the read upload");
  const organization = proof.organizationId === undefined ? null : mapping.organizations.find(item => item.poolOrganizationId === proof.organizationId) ?? fail("organization not in the canonical mapping");
  const role = proof.roleId === undefined ? null : mapping.roles.find(item => item.poolRoleId === proof.roleId) ?? fail("role not in the canonical mapping");
  if (organization !== null && role !== null && role.poolOrganizationId !== organization.poolOrganizationId) fail("role not contained in the named organization");
  const requirement = proof.requirementId === undefined ? null : (role ?? fail("requirement without role")).requirements.find(item => item.poolRequirementId === proof.requirementId) ?? fail("requirement not in the role's canonical requirements");
  if (proof.analysisId !== undefined && proof.analysisId !== world.matching.analysisId) fail("analysisId is not the matching's analysis");
  const delivered = role === null ? null : world.matching.roleMatches.find(item => item.poolRoleId === role.poolRoleId) ?? null;
  const relation = sign.manifestation === "temporary_aperture" ? sign.relation : null;
  const kind = relation ?? sign.relation;

  switch (sign.manifestation === "temporary_aperture" ? kind : sign.manifestation) {
    case "region":
      if (organization === null) { if (Object.keys(proof).join() !== "uploadId") fail("pool region carries more than its upload id"); return "pool"; }
      if (proof.targetId !== organization.targetOrganizationEntityId) fail("organization region without its target organization entity");
      return "organization";
    case "carrier":
      if (sign.id.startsWith("role:")) {
        if (role === null || proof.targetId !== role.targetRoleOrganizationBindingRevisionId) fail("role carrier without its organization binding revision");
        return "role";
      }
      if (proof.docId === undefined || delivered === null) fail("source carrier without a delivered docId");
      if (![...delivered!.matched, ...delivered!.weakEvidence, ...delivered!.missing].some(item => [...("evidence" in item ? item.evidence : []), ...(item.sweepProposal?.evidence ?? [])].some(quote => quote.docId === proof.docId))) fail("source docId not delivered for this role");
      return "source";
    case "anchor":
      if (requirement === null || proof.trqrevId !== requirement.targetRequirementRevisionId) fail("requirement anchor without its TRQREV");
      return "requirement";
    case "trace_stable": case "trace_thin": case "trace_dotted": case "supports": case "weakly_supports": case "covers_unscored": {
      if (requirement === null || delivered === null) fail("trace without a delivered requirement");
      const scored = delivered!.matched.find(item => item.poolRequirementId === requirement!.poolRequirementId) ?? delivered!.weakEvidence.find(item => item.poolRequirementId === requirement!.poolRequirementId) ?? null;
      const sweep = [...delivered!.matched, ...delivered!.weakEvidence, ...delivered!.missing].find(item => item.poolRequirementId === requirement!.poolRequirementId)?.sweepProposal ?? null;
      if (proof.analysisId === undefined) fail("trace without analysisId");
      if (kind === "covers_unscored") {
        if (sweep === null || proof.capabilityId !== sweep.capabilityProposalId || !sweep.evidence.some(quote => quote.docId === proof.docId)) fail("dotted trace not a delivered sweep quote");
        if (proof.evidenceId !== undefined && !world.sources.proposalEvidence.some(item => item.evidenceId === proof.evidenceId && item.capabilityProposalId === sweep!.capabilityProposalId && item.docId === proof.docId && sweep!.evidence.some(quote => quote.quote === item.quote))) fail("EVD_ without an exact join");
        return "covers_unscored";
      }
      if (proof.evidenceId !== undefined) fail("scored trace carries a synthesised evidence id (binding §3)");
      if (scored === null || proof.capabilityId !== scored.matchedCapabilityEntityId || !scored.evidence.some(quote => quote.docId === proof.docId)) fail("scored trace not a delivered quote");
      return kind;
    }
    case "open_boundary": case "missing_support": {
      const missing = delivered?.missing.find(item => item.poolRequirementId === requirement?.poolRequirementId) ?? null;
      if (missing === null || missing.sweepProposal !== null) fail("open boundary not computed from missing[] without sweep");
      return "missing_support";
    }
    case "suspended_boundary": case "pending_evaluation":
      if (delivered === null || delivered.canonical.capabilityRequirementRelationState !== "NOT_EVALUATED") fail("pending boundary without a delivered NOT_EVALUATED role");
      if (proof.targetId !== delivered!.canonical.targetRoleProfileRevisionId) fail("pending boundary without its TRPREV");
      if (proof.trqrevId !== delivered!.canonical.targetRequirementRevisionIds.join(" ")) fail("pending boundary does not carry every TRQREV");
      if (proof.trqrevId!.split(" ").some(id => !role!.requirements.some(item => item.targetRequirementRevisionId === id))) fail("pending TRQREV outside the role's canonical requirements");
      return "pending_evaluation";
    default:
      return fail(`manifestation ${sign.manifestation} has no binding row`);
  }
}

describe("SYNTX field governance (binding §5)", () => {
  it("walks every observation point the field offers", () => {
    // 1 field + 2 organizations + 3 roles (+3 pending apertures) + 6 requirements (+ their apertures).
    expect(POINTS.filter(point => /^(FIELD|ORGANIZATION ORG_\d|ROLE ROLE_[A-C]|REQUIREMENT REQ_\d)$/.test(point.name)).length).toBe(1 + 2 + 3 + 6);
    expect(POINTS.filter(point => point.name.includes("aperture")).length).toBeGreaterThanOrEqual(3 + 6);
    expect(POINTS.every(point => point.field.observation.kind === point.name.split(" ")[0])).toBe(true);
  });

  it("every visual sign uses only §14.3 values and carries a proof reference that resolves to the binding table §2", () => {
    const rows = new Set<string>();
    for (const { name, field } of POINTS) {
      const ids = field.signs.map(sign => sign.id);
      expect(new Set(ids).size, `${name}: sign ids unique`).toBe(ids.length);
      for (const sign of field.signs) {
        for (const key of Object.keys(SIGN_VALUES) as Array<keyof typeof SIGN_VALUES>) expect(SIGN_VALUES[key], `${name} ${sign.id} ${key}`).toContain(sign[key]);
        rows.add(resolveProof(sign, WORLD));
      }
      // Entity-level signs are the signs the renderer places: nothing is drawn that the signs list does not carry.
      const placed = [field.pool.sign, ...field.organizations.map(item => item.sign), ...field.roles.map(item => item.sign), ...field.requirements.flatMap(item => [item.sign, ...item.traces.map(trace => trace.sign), ...(item.openBoundary === null ? [] : [item.openBoundary])]), ...field.sources.map(item => item.sign), ...(field.pendingBoundary === null ? [] : [field.pendingBoundary.sign]), ...(field.aperture === null ? [] : [field.aperture.sign])];
      expect(placed.map(sign => sign.id).sort(), name).toEqual([...ids].sort());
    }
    expect([...rows].sort()).toEqual(["covers_unscored", "missing_support", "organization", "pending_evaluation", "pool", "requirement", "role", "source", "supports", "weakly_supports"]);
  });

  it("organization ⊃ role and role ⊃ requirement equal the canonical bindings, never the matching's labels; every pool carrier exists, no foreign role does", () => {
    for (const { name, field } of POINTS) {
      expect(field.organizations.map(item => [item.id, item.targetEntityId, item.roleIds]), name).toEqual(view.canonicalMapping.organizations.map(item => [item.poolOrganizationId, item.targetOrganizationEntityId, view.canonicalMapping.roles.filter(role => role.poolOrganizationId === item.poolOrganizationId).map(role => role.poolRoleId)]));
      expect(field.roles.map(item => [item.id, item.organizationId, item.targetEntityId, item.bindingRevisionId]), name).toEqual(view.canonicalMapping.roles.map(item => [item.poolRoleId, item.poolOrganizationId, item.targetRoleEntityId, item.targetRoleOrganizationBindingRevisionId]));
      for (const role of field.roles) {
        const region = field.organizations.find(item => item.id === role.organizationId)!;
        expect(Math.hypot(role.x - region.x, role.y - region.y), `${name} ${role.id} inside ${region.id}`).toBeLessThan(region.radius);
      }
      if (field.observation.roleId !== null) {
        const mapped = view.canonicalMapping.roles.find(item => item.poolRoleId === field.observation.roleId)!;
        expect(field.requirements.map(item => [item.id, item.targetRequirementRevisionId]).sort(), name).toEqual(mapped.requirements.map(item => [item.poolRequirementId, item.targetRequirementRevisionId]).sort());
        expect(field.requirements.every(item => item.roleId === mapped.poolRoleId)).toBe(true);
      }
    }
    // The matching names ROLE_C under ORG_1 / "Acme"; the canonical binding (TROB_C) wins.
    const roleC = POINTS[0].field.roles.find(item => item.id === "ROLE_C")!;
    expect([roleC.organizationId, roleC.organizationName]).toEqual(["ORG_2", "Beta Labs"]);
    expect(JSON.stringify(POINTS.map(point => point.field))).not.toContain("ROLE_GHOST");
    // Zero support is still a carrier: without any matching every role and every requirement is present.
    const unread = observationPoints({ view, matching: null, sources: null });
    expect(unread.find(point => point.name === "FIELD")!.field.roles).toHaveLength(3);
    expect(unread.find(point => point.name === "ROLE ROLE_C")!.field.requirements.map(item => item.support)).toEqual(["UNREAD", "UNREAD", "UNREAD"]);
  });

  it("FIELD and ORGANIZATION carry no score: geometry and signs are invariant under resonance, aggregate, delivered order and the presence of a matching", () => {
    const rescored = clone(matches);
    rescored.roleMatches.forEach((role, index) => { role.resonanceScore = [0.01, 0.99, 0.5, 0.2][index]; });
    rescored.organizationMatches.forEach(item => { item.aggregateScore = 1 - (item.aggregateScore ?? 0); });
    const reordered = clone(matches);
    reordered.roleMatches.reverse();
    reordered.organizationMatches.reverse();
    const geometry = (field: SyntxField) => ({ signs: field.signs, organizations: field.organizations.map(({ id, x, y, radius, roleIds }) => ({ id, x, y, radius, roleIds })), roles: field.roles.map(({ id, x, y, radius }) => ({ id, x, y, radius })), camera: field.camera });
    const observations: SyntxObservation[] = [FIELD_OBSERVATION, ...view.canonicalMapping.organizations.map(item => ({ ...FIELD_OBSERVATION, kind: "ORGANIZATION" as const, organizationId: item.poolOrganizationId }))];
    for (const observation of observations) {
      const reference = geometry(deriveSyntxField(view, matches, sources, observation)!);
      for (const variant of [rescored, reordered, null]) expect(geometry(deriveSyntxField(view, variant, variant === null ? null : sources, observation)!), observation.kind).toEqual(reference);
      // Only containment relations exist before a role is observed (R4, R14): no coupling, no support preview.
      expect(new Set(reference.signs.map(sign => sign.relation))).toEqual(new Set(["contains"]));
      expect(JSON.stringify(reference.signs)).not.toMatch(/0\.(75|3|61|525)\b|resonance|aggregate|rank/i);
    }
  });

  it("missing support is a neutral open boundary computed from missing[] without sweep, never a failure manifestation", () => {
    const field = POINTS.find(point => point.name === "ROLE ROLE_C")!.field;
    const open = field.requirements.find(item => item.id === "REQ_5")!;
    expect(open).toMatchObject({ support: "OPEN", distance: SUPPORT_DISTANCE.OPEN, traces: [] });
    expect(open.openBoundary).toMatchObject({ source: "matching_contribution", relation: "missing_support", manifestation: "open_boundary", interaction: "inspect" });
    // The open requirement is an anchor like every other requirement: same source, relation, manifestation and interaction.
    const shape = (sign: VisualSign) => [sign.source, sign.relation, sign.manifestation, sign.interaction, sign.state];
    for (const requirement of field.requirements) expect(shape(requirement.sign)).toEqual(shape(open.sign));
    // Only missing[] without a sweep proposal opens a boundary; a sweep-covered missing requirement is covered, not open.
    for (const { field: walked } of POINTS) for (const requirement of walked.requirements) expect(requirement.openBoundary !== null, requirement.id).toBe(requirement.support === "OPEN");
    const vocabulary = JSON.stringify(POINTS.map(point => point.field.signs));
    expect(vocabulary).not.toMatch(/fail|error|reject|disqualif|incompet|insufficient|deficien|gap|\bred\b/i);
    for (const locale of ["en", "de"] as const) {
      const copy = SIL_COPY[locale].syntx;
      for (const text of [copy.texts.missing, copy.support.OPEN, copy.relation.missing_support, copy.summary.support.OPEN]) expect(text).not.toMatch(/fail|gap|lack|reject|insufficient|disqualif|incompet|fehl|lücke|mangel|ungeeignet|unzureichend/i);
    }
  });

  it("sweep coverage never carries a scored manifestation or a coupling, wherever it appears", () => {
    let dotted = 0;
    for (const { name, field } of POINTS) {
      for (const trace of field.requirements.flatMap(item => item.traces)) {
        const isSweep = trace.kind === "covers_unscored";
        expect(isSweep, `${name} ${trace.sign.id}`).toBe(trace.sign.manifestation === "trace_dotted");
        expect(isSweep).toBe(trace.sign.source === "gemini_sweep");
        expect(isSweep).toBe(trace.capabilityId.startsWith("PCAP_"));
        if (!isSweep) continue;
        dotted += 1;
        expect([trace.contribution, trace.confidence, trace.weight, trace.location, trace.weakReason]).toEqual([null, null, 1, null, null]);
      }
      if (field.boundary !== null) expect(field.boundary.capabilitySweep.scored).toBe(false);
    }
    expect(dotted).toBeGreaterThan(0);
    // The dotted weight is constant: doubling every scored contribution changes no sweep trace and no sweep-only anchor.
    const doubled = clone(matches);
    for (const role of doubled.roleMatches) for (const item of [...role.matched, ...role.weakEvidence]) item.contribution *= 2;
    for (const role of view.canonicalMapping.roles) {
      const observation: SyntxObservation = { ...FIELD_OBSERVATION, kind: "ROLE", organizationId: role.poolOrganizationId, roleId: role.poolRoleId };
      const sweepPart = (field: SyntxField) => field.requirements.map(item => ({ id: item.id, support: item.support, distance: item.distance, sweep: item.traces.filter(trace => trace.kind === "covers_unscored") }));
      expect(sweepPart(deriveSyntxField(view, doubled, sources, observation)!)).toEqual(sweepPart(deriveSyntxField(view, matches, sources, observation)!));
    }
  });

  it("NOT_EVALUATED prevents closure: one suspended boundary per role ecology, every requirement NOT_EVALUATED, even when every requirement is supported", () => {
    const allSupported = clone(matches);
    for (const role of allSupported.roleMatches) {
      const moved = [...role.weakEvidence, ...role.missing].map(item => ({ poolRequirementId: item.poolRequirementId, capabilityName: item.capabilityName, requiredLevel: item.requiredLevel, weight: item.weight, necessity: item.necessity, matchBasis: "EXACT" as const, matchedCapabilityName: item.capabilityName, matchedCapabilityEntityId: `CAP_${item.poolRequirementId}`, matchedConstituent: null, confidence: 1, contribution: item.weight, evidence: [{ docId: "DOC_CV", quote: `${item.capabilityName} delivered.` }], sweepProposal: item.sweepProposal }));
      role.matched.push(...moved);
      role.weakEvidence = [];
      role.missing = [];
    }
    for (const world of [WORLD, { view, matching: allSupported, sources }]) {
      for (const { name, field } of observationPoints(world)) {
        const manifestations = new Set(field.signs.map(sign => sign.manifestation));
        expect([...manifestations].filter(item => /clos|seal|verif|check|complete|lock/i.test(item)), name).toEqual([]);
        if (field.observation.roleId === null) { expect(field.pendingBoundary, name).toBeNull(); continue; }
        expect(field.signs.filter(sign => sign.relation === "pending_evaluation" && sign.manifestation === "suspended_boundary"), name).toHaveLength(1);
        expect(field.requirements.every(item => item.evaluationState === "NOT_EVALUATED"), name).toBe(true);
        expect(field.pendingBoundary!.targetRequirementRevisionIds.slice().sort(), name).toEqual(field.requirements.map(item => item.targetRequirementRevisionId).sort());
        expect(field.requirements.every(item => item.sign.manifestation === "anchor"), name).toBe(true);
      }
    }
    const supportedRole = deriveSyntxField(view, allSupported, sources, { ...FIELD_OBSERVATION, kind: "ROLE", organizationId: "ORG_2", roleId: "ROLE_C" })!;
    expect(supportedRole.requirements.map(item => item.support)).toEqual(["SUPPORTED", "SUPPORTED", "SUPPORTED"]);
    expect(supportedRole.pendingBoundary!.sign).toMatchObject({ manifestation: "suspended_boundary", relation: "pending_evaluation", source: "evaluation_state" });
  });

  it("overlap is preserved: a requirement renders every delivered relation and every delivered quote, scored and swept", () => {
    for (const { name, field } of POINTS) {
      const delivered = matches.roleMatches.find(item => item.poolRoleId === field.observation.roleId) ?? null;
      for (const requirement of field.requirements) {
        const scored = delivered?.matched.find(item => item.poolRequirementId === requirement.id) ?? delivered?.weakEvidence.find(item => item.poolRequirementId === requirement.id) ?? null;
        const sweep = [...(delivered?.matched ?? []), ...(delivered?.weakEvidence ?? []), ...(delivered?.missing ?? [])].find(item => item.poolRequirementId === requirement.id)?.sweepProposal ?? null;
        expect(requirement.traces.map(trace => [trace.kind, trace.docId, trace.quote]), `${name} ${requirement.id}`).toEqual([
          ...(scored?.evidence ?? []).map(quote => [delivered!.matched.includes(scored as never) ? "supports" : "weakly_supports", quote.docId, quote.quote]),
          ...(sweep?.evidence ?? []).map(quote => ["covers_unscored", quote.docId, quote.quote])
        ]);
      }
    }
    const roleC = POINTS.find(point => point.name === "ROLE ROLE_C")!.field;
    expect(roleC.requirements.map(item => [item.id, item.support, item.traces.map(trace => trace.sign.manifestation)])).toEqual([
      ["REQ_4", "SUPPORTED", ["trace_stable", "trace_stable", "trace_dotted"]],
      ["REQ_6", "WEAK", ["trace_thin"]],
      ["REQ_5", "OPEN", []]
    ]);
    // Weak is not only "below threshold": TOKEN_CONTAINMENT at confidence 0.6 (threshold 0.4) stays weak and keeps its contribution.
    expect(roleC.requirements[1].traces[0]).toMatchObject({ confidence: 0.6, contribution: 0.336, weakReason: "basis TOKEN_CONTAINMENT is always weak" });
    // Weak with a sweep proposal keeps thin + dotted (F-LF-1 dual membership).
    const weakSwept = clone(matches);
    weakSwept.roleMatches[1].weakEvidence[0].sweepProposal = kubernetesSweepCoverage;
    const roleB = deriveSyntxField(view, weakSwept, sources, { ...FIELD_OBSERVATION, kind: "ROLE", organizationId: "ORG_1", roleId: "ROLE_B" })!;
    expect(roleB.requirements[0].traces.map(trace => trace.sign.manifestation)).toEqual(["trace_thin", "trace_dotted"]);
  });

  it("joins aperture content only exactly inside the same analysis; a miss omits, a foreign analysis is not read", () => {
    const traces = POINTS.flatMap(point => point.field.requirements.flatMap(item => item.traces));
    const byId = (id: string) => traces.find(trace => trace.sign.id === id)!;
    expect(byId("trace:REQ_1:supports:DOC_CV:0")).toMatchObject({ location: "page 2", sourceTitle: "cv.synthetic.pdf", sourceTitleState: "RESOLVED" });
    expect(byId("trace:REQ_4:supports:DOC_CV:0").location).toBeNull(); // quote differs by a trailing space
    expect(byId("trace:REQ_4:covers_unscored:DOC_LETTER:0")).toMatchObject({ evidenceId: null, sourceTitle: "letter.synthetic.pdf" });
    expect(byId("trace:REQ_2:covers_unscored:DOC_CV:0").evidenceId).toBe("EVD_K8S_1");
    expect(JSON.stringify(POINTS.map(point => point.field))).not.toContain("EVD_UNDELIVERED");
    const foreign = observationPoints({ view, matching: matches, sources: { ...sources, analysisId: "ANL_OTHER" } });
    const foreignTraces = foreign.flatMap(point => point.field.requirements.flatMap(item => item.traces));
    expect(foreignTraces.length).toBe(traces.length);
    expect(foreignTraces.every(trace => trace.sourceTitleState === "NOT_READ" && trace.sourceTitle === null && trace.location === null && trace.evidenceId === null)).toBe(true);
  });

  it("nothing from the §3 list or from analysis.matching / analysis.recommendations / inferred organizations and roles reaches the field", () => {
    expect(JSON.stringify(sources)).not.toContain(FORBIDDEN);
    expect(Object.keys(sources).sort()).toEqual(["analysisId", "capabilityEvidence", "documents", "proposalEvidence"]);
    const everything = JSON.stringify(POINTS.map(point => point.field));
    expect(everything).not.toContain(FORBIDDEN);
    // §3: no canonical relation / decision / recommendation ids, no verified or certified claim, no URI, no synthesised contribution id.
    expect(everything).not.toMatch(/\b(CRR|RRA|RRL|TSN|EIS|RPR|RCP|DAR|DCTXREV|DCR|DREV|DCDRB)_[0-9A-Z]/);
    expect(everything).not.toMatch(/PHASE4_VERIFIED|VERIFIED_CAPABILITY"|"AUTHORITATIVE|"decision":true|"canonicalEvaluation":true|"scored":true|https?:\/\/|recommend|"fit"|endorse/i);
    for (const { field } of POINTS) {
      expect(field.boundary).toMatchObject({ authorityState: "NONE", canonicalEvaluation: false, decision: false });
      for (const sign of field.signs) expect(Object.keys(sign.proof).every(key => ["uploadId", "organizationId", "roleId", "requirementId", "targetId", "trqrevId", "analysisId", "capabilityId", "docId", "evidenceId"].includes(key))).toBe(true);
    }
  });
});
