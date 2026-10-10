/**
 * PINK regression proof for defect D-JP-1 (JOB_POOL_CONNECTION.md §1, Case 1):
 * `matchCareerAnalysisAgainstPool` and `mapCapabilitiesToJobs` read `capability.name`, but a
 * canonical Gemini analysis carries the name at `identity.name`. Against every real analysis
 * every requirement was reported missing. GELB's C6 fix reads `identity.name` first and keeps
 * the flat `name` / `capability_name` fixture shapes working. Both directions are proven here,
 * plus the live analyses route that serves the legacy demo matching.
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { initDbSchema } from "../../lib/career/db/client";
import { requireTestDatabaseUrl } from "../../lib/database-isolation/policy";
import { GET as getAnalysis } from "../../app/api/career/analyses/[analysisId]/route";
import { DEMO_COMPANY_POOL } from "../../lib/career/matching/demo-pool";
import { matchCareerAnalysisAgainstPool } from "../../lib/career/matching/engine";
import { mapCapabilitiesToJobs } from "../../lib/career/matching/job-mapping";
import { getCareerAnalysisRepository } from "../../lib/career/repositories";
import { buildVerifiedAnalysis, validationCapabilities } from "./fixtures/analysis";
import { validationPool } from "./fixtures/pool";

describe("D-JP-1: legacy matchers read the canonical capability name", () => {
  it("matchCareerAnalysisAgainstPool matches a canonical analysis whose names live at identity.name", () => {
    const analysis = buildVerifiedAnalysis("ANL_PINK_D_JP_1_ENGINE");
    const result = matchCareerAnalysisAgainstPool(analysis, validationPool as never);
    const architect = result.role_matches.find((role) => role.roleId === "role_pink_alpha_architect");
    expect(architect).toBeDefined();
    expect(architect!.matchedCapabilities.map((item) => item.capabilityName).sort()).toEqual(["Distributed Systems Architecture", "Edge Computing"]);
    expect(architect!.missingCapabilities.map((item) => item.capabilityName)).toEqual(["Industrial IoT Protocol Design"]);
    // weight 1.0 * 0.95 + 0.6 * 0.45 over total weight 2.0 (engine has no weak-evidence rule)
    expect(architect!.resonanceScore).toBeCloseTo((0.95 + 0.27) / 2.0, 6);
    expect(result.role_matches.every((role) => role.resonanceScore >= 0 && role.resonanceScore <= 1)).toBe(true);
  });

  it("mapCapabilitiesToJobs matches identity.name capabilities and still accepts the flat fixture shape", () => {
    const analysis = buildVerifiedAnalysis("ANL_PINK_D_JP_1_MAPPING");
    const job = { jobId: "job_pink", title: "Platform Engineer", company: "Beta Cloud GmbH", description: "", requirements: [
      { capability_name: "Kubernetes Orchestration", weight: 0.9, required_level: "L4", aliases: ["k8s"] },
      { capability_name: "Edge Computing", weight: 0.6, required_level: "advanced" }
    ] };
    const canonical = mapCapabilitiesToJobs(analysis.structured_data.analysis.capabilities as never[], [job as never])[0];
    expect(canonical.matchedCapabilities.map((item) => item.capabilityName)).toEqual(["Kubernetes Orchestration"]);
    expect(canonical.weakEvidenceCapabilities.map((item) => item.capabilityName)).toEqual(["Edge Computing"]);
    expect(canonical.missingCapabilities).toEqual([]);

    const flat = mapCapabilitiesToJobs(validationCapabilities.map((spec) => ({ name: spec.name, confidence: spec.confidence })), [job as never])[0];
    expect(flat.fitScore).toBe(canonical.fitScore);
    expect(flat.matchedCapabilities).toEqual(canonical.matchedCapabilities);
    expect(flat.weakEvidenceCapabilities).toEqual(canonical.weakEvidenceCapabilities);
  });

  it("the flat name / capability_name shapes used by the Step 16 and Step 23 suites keep their scores", () => {
    const flatAnalysis = { structured_data: { analysis: { metadata: { analysis_id: "ANL_FLAT" }, capabilities: [
      { name: "Distributed Systems Architecture", confidence: 1.0 },
      { capability_name: "Edge Computing", confidence: 1.0 }
    ] } } };
    const result = matchCareerAnalysisAgainstPool(flatAnalysis as never, validationPool as never);
    const architect = result.role_matches.find((role) => role.roleId === "role_pink_alpha_architect")!;
    expect(architect.resonanceScore).toBeCloseTo(1.6 / 2.0, 6);
  });
});

describe("D-JP-1: the live analyses route serves demo matching for a canonical analysis", () => {
  const analysisId = "ANL_PINK_D_JP_1_ROUTE";
  const demoRequirement = DEMO_COMPANY_POOL.requirements[0];

  beforeEach(async () => {
    const analysis = buildVerifiedAnalysis(analysisId, [
      { entityId: "CAP_PINK_DEMO", name: demoRequirement.capability_name, confidence: 0.9, quote: "Delivered the demo requirement capability in production systems" }
    ]);
    await getCareerAnalysisRepository().save(analysis);
  });

  beforeAll(async () => {
    // The route reads the capability proposal projection sidecar from Postgres; the legacy career
    // schema is registered on the positively verified disposable database only.
    requireTestDatabaseUrl();
    await initDbSchema();
  });

  it("GET /api/career/analyses/{id} reports the matched demo requirement instead of all-missing", async () => {
    const response = await getAnalysis(new Request(`http://local/api/career/analyses/${analysisId}`), { params: Promise.resolve({ analysisId }) });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.matching.analysis_id).toBe(analysisId);
    const role = body.matching.role_matches.find((item: { roleId: string }) => item.roleId === demoRequirement.role_id);
    expect(role.matchedCapabilities.map((item: { capabilityName: string }) => item.capabilityName)).toEqual([demoRequirement.capability_name]);
    expect(role.resonanceScore).toBeGreaterThan(0);
    expect(Array.isArray(body.recommendations)).toBe(true);
  });
});
