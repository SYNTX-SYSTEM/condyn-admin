/**
 * PINK proof for the unscored Gemini Capability Sweep coverage in presentation matching (GELB 7134952):
 * - the resonance scores and every scored field are byte-identical with and without sweep proposals;
 * - a sweep proposal covering a missing requirement is shown as `sweepProposal` and counted in
 *   `sweepOnlyCoverageCount`, with `scored: false`, `evidenceState: SOURCE_MATCH_VERIFIED`, `authorityState: NONE`;
 * - FAILED and NOT_PRODUCED leave the body identical except for `capabilitySweep.state`.
 */
import { describe, expect, it } from "vitest";
import { matchAnalysisAgainstJobPool, type CapabilitySweepInput } from "../../lib/career/job-pool/presentation-matching";
import type { JobPoolCanonicalMapping } from "../../lib/career/job-pool/types";
import { CompanyPoolDataSchema } from "../../lib/career/matching/pool";
import { buildVerifiedAnalysis } from "./fixtures/analysis";
import { validationPool } from "./fixtures/pool";

const pool = CompanyPoolDataSchema.parse(validationPool);
const canonicalMapping: JobPoolCanonicalMapping = {
  mappingState: "MAPPED", proposalState: "PROPOSAL_ONLY", authorityState: "NONE", provider: "CONDYN_JOB_POOL_JSON",
  organizations: [],
  roles: pool.roles.map((role) => ({
    poolRoleId: role.id, title: role.title, poolOrganizationId: role.organization_id, targetSourceRevisionId: "TSREV_X", targetRoleEntityId: `TROLEENT_${role.id}`,
    targetRoleSourceBindingRevisionId: "TRSB_X", targetRoleOrganizationBindingRevisionId: "TROB_X", targetRoleProfileRevisionId: `TRPREV_${role.id}`,
    targetRoleReconstructionBatchRunId: "TRRUN_X", targetRequirementReconstructionBatchRunId: "TRQRUN_X",
    requirements: pool.requirements.filter((req) => req.role_id === role.id).map((req) => ({
      poolRequirementId: req.id, capabilityName: req.capability_name, targetRequirementEntityId: `TRQENT_${req.id}`, targetRequirementRevisionId: `TRQREV_${req.id}`,
      targetRequirementReconstructionResultId: "TRQRES_X", targetRequirementEntityAdmissionId: "TRQADM_X", matchingEligibility: "MATCHING_ELIGIBLE_PROPOSAL_ONLY", necessityState: "UNKNOWN"
    }))
  }))
};

const analysis = buildVerifiedAnalysis("ANL_PINK_SWEEP");
const match = (capabilitySweep?: CapabilitySweepInput) => matchAnalysisAgainstJobPool({ analysis, analysisId: "ANL_PINK_SWEEP", jobPoolUploadId: "JPOOL_PINK", pool, canonicalMapping, capabilitySweep });

/** Everything that is scored or ranked, with the sweep fields removed. */
function scoredView(presentation: ReturnType<typeof match>) {
  return {
    roleMatches: presentation.roleMatches.map(({ sweepOnlyCoverageCount: _count, ...role }) => ({
      ...role,
      matched: role.matched.map(({ sweepProposal: _p, ...item }) => item),
      weakEvidence: role.weakEvidence.map(({ sweepProposal: _p, ...item }) => item),
      missing: role.missing.map(({ sweepProposal: _p, ...item }) => item)
    })),
    organizationMatches: presentation.organizationMatches,
    candidateCapabilityCount: presentation.candidateCapabilityCount
  };
}

describe("Job Pool presentation: unscored capability sweep coverage", () => {
  const proposals = [
    { id: "CAPP_PINK_IOT", name: "Industrial IoT Protocol Design", evidence: [{ sourceDocumentId: "DOC_001", exactQuote: "Designed the OPC UA based protocol stack for the plant" }] },
    { id: "CAPP_PINK_TS", name: "TypeScript and Node.js", evidence: [{ sourceDocumentId: "DOC_001", exactQuote: "Built payment services in TypeScript and Node.js with full test coverage" }] },
    { id: "CAPP_PINK_NOISE", name: "Public Speaking", evidence: [{ sourceDocumentId: "DOC_002", exactQuote: "Spoke at three conferences" }] }
  ];
  const without = match();
  const withSweep = match({ state: "AVAILABLE", proposals });
  const failed = match({ state: "FAILED" });

  it("keeps every scored and ranked field byte-identical with and without the sweep", () => {
    expect(JSON.stringify(scoredView(withSweep))).toBe(JSON.stringify(scoredView(without)));
    expect(JSON.stringify(scoredView(failed))).toBe(JSON.stringify(scoredView(without)));
  });

  it("reports the sweep state and proposal count without scoring", () => {
    expect(without.capabilitySweep).toEqual({ state: "NOT_PRODUCED", proposalCount: 0, scored: false });
    expect(failed.capabilitySweep).toEqual({ state: "FAILED", proposalCount: 0, scored: false });
    expect(withSweep.capabilitySweep).toEqual({ state: "AVAILABLE", proposalCount: 3, scored: false });
    for (const presentation of [without, failed]) for (const role of presentation.roleMatches) {
      expect(role.sweepOnlyCoverageCount).toBe(0);
      for (const item of [...role.matched, ...role.weakEvidence, ...role.missing]) expect(item.sweepProposal).toBeNull();
    }
  });

  it("shows a sweep proposal covering a missing requirement, unscored and with verified source quotes, and counts it", () => {
    const alpha = withSweep.roleMatches.find((role) => role.poolRoleId === "role_pink_alpha_architect")!;
    const covered = alpha.missing.find((item) => item.poolRequirementId === "req_pink_alpha_3")!;
    expect(covered.sweepProposal).toEqual({
      capabilityProposalId: "CAPP_PINK_IOT", name: "Industrial IoT Protocol Design", matchBasis: "EXACT", matchedConstituent: null,
      evidence: [{ docId: "DOC_001", quote: "Designed the OPC UA based protocol stack for the plant" }],
      evidenceState: "SOURCE_MATCH_VERIFIED", authorityState: "NONE", scored: false
    });
    expect(alpha.sweepOnlyCoverageCount).toBe(1);
    expect(alpha.resonanceScore).toBe(without.roleMatches.find((role) => role.poolRoleId === "role_pink_alpha_architect")!.resonanceScore);

    const beta = withSweep.roleMatches.find((role) => role.poolRoleId === "role_pink_beta_platform")!;
    const node = beta.matched.find((item) => item.poolRequirementId === "req_pink_beta_3")!;
    expect(node.matchBasis).toBe("COMPOSITE_CONSTITUENT");
    expect(node.sweepProposal).toMatchObject({ capabilityProposalId: "CAPP_PINK_TS", matchBasis: "COMPOSITE_CONSTITUENT", matchedConstituent: "Node.js", scored: false });
    expect(beta.sweepOnlyCoverageCount).toBe(0);
    expect(JSON.stringify(withSweep)).not.toContain("CAPP_PINK_NOISE");
  });
});
