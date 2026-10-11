import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { roleProfileEnvelopeFor, requirementProposalFor } from "../../../lib/career/job-pool/provider";
import { matchAnalysisAgainstJobPool } from "../../../lib/career/job-pool/presentation-matching";
import type { JobPoolCanonicalMapping } from "../../../lib/career/job-pool/types";
import { parseJobPoolUpload } from "../../../lib/career/job-pool/upload";
import { FIXTURE_ANALYSIS_ID, fixtureCapabilities, samplePoolText, verifiedAnalysis } from "./fixtures";

/**
 * Job Field semantic governance (owner mandate "SFE — JOB FIELD SEMANTIC GOVERNANCE", 2026-10-11).
 * The job pool field may read canonical target revisions and present deterministic matching; it must never
 * produce or reference canonical relations (CRR, RRA, RRL, TSN, EIS, RPR, RCP), decision artifacts or authority.
 * The file set includes GRÜN's Job Field files by path pattern, present or future.
 */
const ROOT = process.cwd();
const walk = (dir: string): string[] => !existsSync(dir) ? [] : readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : /\.(ts|tsx)$/.test(name) ? [path] : [];
});
const JOB_FIELD_FILES = [
  ...walk(join(ROOT, "lib/career/job-pool")),
  ...walk(join(ROOT, "lib/career/job-field")),
  ...walk(join(ROOT, "app/api/career/job-pools")),
  ...walk(join(ROOT, "app/components/career/demo")).filter(path => /JobPool|JobField/.test(path)),
  ...walk(join(ROOT, "lib/career/ui")).filter(path => /JobPool|JobField|useJob/.test(path))
].map(path => relative(ROOT, path)).sort();

const FORBIDDEN_IMPORTS = [
  /\/career\/relation\//, /\/career\/relation-adapters\//, /\/decision-core\b/, /\/decision-runtime\b/, /\/decision-adapters\b/,
  /\/human-decision-admission\b/, /\/hr-decision-loop\//, /\/career\/decisions\b/, /-admission\//
];
const importsOf = (file: string) => [...readFileSync(join(ROOT, file), "utf8").matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)].map(match => match[1]);

describe("Job Field semantic governance", () => {
  it("covers the job pool and job field files", () => {
    expect(JOB_FIELD_FILES).toEqual(expect.arrayContaining(["lib/career/job-pool/presentation-matching.ts", "app/components/career/demo/JobPoolMatchPanel.tsx", "lib/career/ui/useJobPool.ts"]));
  });

  it("never imports canonical relation producers, relation persistence, decision fields or the HR loop", () => {
    const violations = JOB_FIELD_FILES.flatMap(file => importsOf(file).filter(path => FORBIDDEN_IMPORTS.some(pattern => pattern.test(path))).map(path => `${file} -> ${path}`));
    expect(violations).toEqual([]);
  });

  it("presents matching with authority NONE and carries no canonical relation or decision identity", () => {
    const p = parseJobPoolUpload(samplePoolText()).pool;
    const mapping: JobPoolCanonicalMapping = {
      mappingState: "MAPPED", proposalState: "PROPOSAL_ONLY", authorityState: "NONE", provider: "CONDYN_JOB_POOL_JSON", organizations: [],
      roles: p.roles.map(role => ({ poolRoleId: role.id, title: role.title, poolOrganizationId: role.organization_id, targetSourceRevisionId: "TSREV_X", targetRoleEntityId: "TROLEENT_X", targetRoleSourceBindingRevisionId: "TRSB_X", targetRoleOrganizationBindingRevisionId: "TROB_X", targetRoleProfileRevisionId: `TRPREV_${role.id}`, targetRoleReconstructionBatchRunId: "TRRBATCH_X", targetRequirementReconstructionBatchRunId: "TRQRUN_X", requirements: [] }))
    };
    const body = matchAnalysisAgainstJobPool({
      analysis: verifiedAnalysis(FIXTURE_ANALYSIS_ID, fixtureCapabilities()), analysisId: FIXTURE_ANALYSIS_ID, jobPoolUploadId: "JPOOL_X", pool: p, canonicalMapping: mapping,
      capabilitySweep: { state: "AVAILABLE", proposals: [{ id: "PCAP_TDD", name: "Test-Driven Development (TDD)", evidence: [{ sourceDocumentId: "DOC_001", exactQuote: "Introduced test-driven development." }] }] }
    });
    const text = JSON.stringify(body);
    expect(text).not.toMatch(/\b(CRR|CRREL|CRRES|RRA|RRL|TSN|EIS|RPR|RCP|DAR|DCTXREV|DCR|DREV|DCDRB)_[0-9A-F]/);
    expect(text).not.toMatch(/"authorityState":"(?!NONE)/);
    expect(text).not.toMatch(/VERIFIED_CAPABILITY"|PHASE4_VERIFIED|AUTHORITATIVE/);
    expect(body.presentation).toMatchObject({ authorityState: "NONE", canonicalEvaluation: false, decision: false });
    for (const role of body.roleMatches) {
      expect(role.canonical).toMatchObject({ capabilityRequirementRelationState: "NOT_EVALUATED", reason: "VERIFIED_CAPABILITY_SNAPSHOT_ABSENT" });
      for (const item of [...role.matched, ...role.weakEvidence, ...role.missing]) if (item.sweepProposal) expect(item.sweepProposal).toMatchObject({ scored: false, authorityState: "NONE" });
    }
  });

  it("keeps presentation vocabulary out of the canonical payloads the job pool proposes", () => {
    const p = parseJobPoolUpload(samplePoolText()).pool;
    const keys = (value: unknown): string[] => value && typeof value === "object" ? Object.entries(value as Record<string, unknown>).flatMap(([key, item]) => [key, ...keys(item)]) : [];
    const payloads = [...p.roles.map(role => roleProfileEnvelopeFor(role, "TROB_X")), ...p.requirements.map(requirementProposalFor)];
    const presentationKeys = payloads.flatMap(keys).filter(key => /resonance|score|weight|fit|match|gap|rank|recommend/i.test(key));
    expect(presentationKeys).toEqual([]);
  });
});
