import { describe, expect, it } from "vitest";
import { DEMO_COMPANY_POOL } from "../../lib/career/matching/demo-pool";
import { matchCareerAnalysisAgainstPool } from "../../lib/career/matching/engine";
import { mapCapabilitiesToJobs } from "../../lib/career/matching/job-mapping";
import { capabilityEntity, verifiedAnalysis } from "./job-pool/fixtures";

/** D-JP-1: real CanonicalCareerAnalysis capabilities carry their name at identity.name. */
describe("legacy matchers read canonical capability names (D-JP-1)", () => {
  it("matchCareerAnalysisAgainstPool scores a canonical-shape analysis instead of reporting every requirement missing", () => {
    const requirement = DEMO_COMPANY_POOL.requirements[0];
    const analysis = verifiedAnalysis("ANL_DJP1", [capabilityEntity("CAP_1", requirement.capability_name, 0.9, "Evidence quote long enough.")]);
    const result = matchCareerAnalysisAgainstPool(analysis as never, DEMO_COMPANY_POOL);
    const role = result.role_matches.find(item => item.roleId === requirement.role_id)!;
    expect(role.matchedCapabilities.map(item => item.capabilityName)).toEqual([requirement.capability_name]);
    expect(role.resonanceScore).toBeGreaterThan(0);
  });

  it("mapCapabilitiesToJobs accepts canonical entities as well as flat items", () => {
    const job = { jobId: "J1", title: "T", company: "C", requirements: [{ capability_name: "Rust", weight: 1, required_level: "L4" }] };
    const canonical = mapCapabilitiesToJobs([capabilityEntity("CAP_1", "Rust", 0.9, "Evidence quote long enough.")], [job as never]);
    const flat = mapCapabilitiesToJobs([{ name: "Rust", confidence: 0.9 }], [job as never]);
    expect(canonical[0].fitScore).toBe(0.9);
    expect(flat[0].fitScore).toBe(0.9);
  });
});
