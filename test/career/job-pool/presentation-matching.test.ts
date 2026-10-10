import { describe, expect, it } from "vitest";
import { JobPoolError } from "../../../lib/career/job-pool/errors";
import { findCandidateMatch, matchAnalysisAgainstJobPool, normalizeCapabilityName, WEAK_EVIDENCE_THRESHOLD } from "../../../lib/career/job-pool/presentation-matching";
import type { JobPoolCanonicalMapping } from "../../../lib/career/job-pool/types";
import { parseJobPoolUpload } from "../../../lib/career/job-pool/upload";
import { extractAnalysisCapabilities } from "../../../lib/career/matching/capability-extraction";
import { capabilityEntity, FIXTURE_ANALYSIS_ID, fixtureCapabilities, samplePoolText, verifiedAnalysis } from "./fixtures";

const pool = () => parseJobPoolUpload(samplePoolText()).pool;
const mappingFor = (p: ReturnType<typeof pool>): JobPoolCanonicalMapping => ({
  mappingState: "MAPPED", proposalState: "PROPOSAL_ONLY", authorityState: "NONE", provider: "CONDYN_JOB_POOL_JSON",
  organizations: [],
  roles: p.roles.map(role => ({
    poolRoleId: role.id, title: role.title, poolOrganizationId: role.organization_id, targetSourceRevisionId: "TSREV_X",
    targetRoleEntityId: `TROLEENT_${role.id}`, targetRoleSourceBindingRevisionId: "TRSB_X", targetRoleOrganizationBindingRevisionId: "TROB_X",
    targetRoleProfileRevisionId: `TRPREV_${role.id}`, targetRoleReconstructionBatchRunId: "TRRBATCH_X", targetRequirementReconstructionBatchRunId: "TRQRUN_X",
    requirements: p.requirements.filter(r => r.role_id === role.id).map(r => ({ poolRequirementId: r.id, capabilityName: r.capability_name, targetRequirementEntityId: `TRQENT_${r.id}`, targetRequirementRevisionId: `TRQREV_${r.id}`, targetRequirementReconstructionResultId: "TRQRES_X", targetRequirementEntityAdmissionId: "TRQADM_X", matchingEligibility: "MATCHING_ELIGIBLE_PROPOSAL_ONLY" as const, necessityState: "REQUIRED" as const }))
  }))
});
const run = (capabilities: unknown[], p = pool()) => matchAnalysisAgainstJobPool({ analysis: verifiedAnalysis(FIXTURE_ANALYSIS_ID, capabilities), analysisId: FIXTURE_ANALYSIS_ID, jobPoolUploadId: "JPOOL_X", pool: p, canonicalMapping: mappingFor(p) });

describe("presentation matching JOB_POOL_PRESENTATION_MATCHING_V1 (JP-U)", () => {
  it("reads canonical analysis capabilities at identity.name (D-JP-1) and keeps flat items readable", () => {
    const items = extractAnalysisCapabilities(verifiedAnalysis("ANL_X", [capabilityEntity("CAP_A", "TypeScript", 0.9, "Typed services in TypeScript.")]));
    expect(items).toEqual([{ entityId: "CAP_A", name: "TypeScript", domain: "Engineering", confidence: 0.9, evidence: [{ docId: "DOC_001", quote: "Typed services in TypeScript." }] }]);
    const flat = extractAnalysisCapabilities({ structured_data: { analysis: { capabilities: [{ name: "Rust", confidence: 0.7 }] } } });
    expect(flat[0]).toMatchObject({ name: "Rust", confidence: 0.7 });
  });

  it("labels the result as presentation with authority NONE, not canonical evaluation and not a decision", () => {
    const result = run(fixtureCapabilities());
    expect(result.presentation).toEqual({ kind: "DETERMINISTIC_RESONANCE_PRESENTATION", policyVersion: "JOB_POOL_PRESENTATION_MATCHING_V1", authorityState: "NONE", canonicalEvaluation: false, decision: false, weakEvidenceThreshold: 0.7 });
    for (const role of result.roleMatches) expect(role.canonical).toMatchObject({ capabilityRequirementRelationState: "NOT_EVALUATED", reason: "VERIFIED_CAPABILITY_SNAPSHOT_ABSENT", targetRoleProfileRevisionId: `TRPREV_${role.poolRoleId}` });
  });

  it("ranks the full-stack role first for a TypeScript/React/Node profile and explains every requirement with basis and evidence", () => {
    const result = run(fixtureCapabilities());
    const top = result.roleMatches[0];
    expect(top.poolRoleId).toBe("role_fullstack");
    const basis = Object.fromEntries([...top.matched, ...top.weakEvidence].map(item => [item.capabilityName, item.matchBasis]));
    expect(basis).toEqual({ TypeScript: "EXACT", React: "ALIAS", PostgreSQL: "EXACT", "Node.js": "TOKEN_CONTAINMENT" });
    expect(top.weakEvidence.find(item => item.capabilityName === "Node.js")?.reason).toMatch(/token containment/);
    expect(top.missing.map(item => item.capabilityName)).toEqual(["Automated Testing"]);
    expect(top.matched.find(item => item.capabilityName === "TypeScript")?.evidence).toEqual([{ docId: "DOC_001", quote: "Built the billing service in TypeScript with strict typing." }]);
  });

  it("partitions every requirement exactly once into matched, weak evidence or missing (CP-I3) and keeps scores in [0, 1] (CP-I2)", () => {
    const p = pool();
    const result = run(fixtureCapabilities(), p);
    for (const role of result.roleMatches) {
      const ids = [...role.matched, ...role.weakEvidence, ...role.missing].map(item => item.poolRequirementId).sort();
      expect(ids).toEqual(p.requirements.filter(r => r.role_id === role.poolRoleId).map(r => r.id).sort());
      expect(role.resonanceScore).toBeGreaterThanOrEqual(0);
      expect(role.resonanceScore).toBeLessThanOrEqual(1);
    }
  });

  it("treats confidence below the threshold as weak evidence contributing weight × confidence × 0.5 (Step 23)", () => {
    const result = run(fixtureCapabilities());
    const platform = result.roleMatches.find(role => role.poolRoleId === "role_platform")!;
    const k8s = platform.weakEvidence.find(item => item.capabilityName === "Kubernetes")!;
    expect(k8s.confidence).toBeLessThan(WEAK_EVIDENCE_THRESHOLD);
    expect(k8s.contribution).toBe(Number((0.9 * 0.55 * 0.5).toFixed(4)));
  });

  it("raises the score of a role when a matched requirement gains weight (CP-I4)", () => {
    const base = pool();
    const heavier = pool();
    heavier.requirements.find(r => r.id === "req_001")!.weight = 1.0;
    const before = run(fixtureCapabilities(), base).roleMatches.find(r => r.poolRoleId === "role_fullstack")!.resonanceScore;
    const after = run(fixtureCapabilities(), heavier).roleMatches.find(r => r.poolRoleId === "role_fullstack")!.resonanceScore;
    expect(after).toBeGreaterThan(before);
  });

  it("refuses non-ACTIVE pools with 409 ERR_INACTIVE_COMPANY_POOL (CP-I1)", () => {
    const p = pool();
    p.pool.status = "DRAFT";
    try { run(fixtureCapabilities(), p); throw new Error("expected refusal"); } catch (error) {
      expect(error).toBeInstanceOf(JobPoolError);
      expect((error as JobPoolError).status).toBe(409);
      expect((error as JobPoolError).code).toBe("ERR_INACTIVE_COMPANY_POOL");
    }
  });

  it("is deterministic: equal input gives byte-equal output, and match priority is EXACT > ALIAS > TOKEN_CONTAINMENT", () => {
    expect(JSON.stringify(run(fixtureCapabilities()))).toBe(JSON.stringify(run(fixtureCapabilities())));
    const requirement = { id: "r", role_id: "x", capability_name: "React", domain: "", weight: 1, required_level: "", aliases: ["ReactJS"] } as never;
    const items = extractAnalysisCapabilities(verifiedAnalysis("ANL", [
      capabilityEntity("C3", "React Native", 0.99, "x".repeat(12)),
      capabilityEntity("C2", "ReactJS", 0.99, "x".repeat(12)),
      capabilityEntity("C1", "react", 0.5, "x".repeat(12))
    ]));
    expect(findCandidateMatch(requirement, items)).toMatchObject({ basis: "EXACT", capability: { entityId: "C1" } });
    expect(normalizeCapabilityName("Node.js")).toBe(normalizeCapabilityName("NodeJS"));
    expect(normalizeCapabilityName("C++")).not.toBe(normalizeCapabilityName("C#"));
  });

  it("does not match a requirement whose tokens the capability name does not contain", () => {
    const requirement = { id: "r", role_id: "x", capability_name: "Java", domain: "", weight: 1, required_level: "" } as never;
    const items = extractAnalysisCapabilities(verifiedAnalysis("ANL", [capabilityEntity("C1", "JavaScript", 0.9, "x".repeat(12))]));
    expect(findCandidateMatch(requirement, items)).toBeNull();
  });
});
