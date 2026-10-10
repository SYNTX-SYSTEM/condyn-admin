/**
 * PINK proofs JP-H (HTTP contract), JP-C (canonical mapping on PostgreSQL) and JP-I (inverse walk)
 * for the Job Pool connection, written against JOB_POOL_CONNECTION.md §3-§5 and GELB's adopted
 * design decisions C1..C7 (2026-10-10). The suite reads canonical state through the existing
 * target-chain repositories only and never touches the implementation module directly.
 *
 * Runs only on the positively verified disposable database bound by the isolated runner.
 * The suite skips with a reason while the v1 routes are absent from the checkout.
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "../../lib/career/db/client";
import { CompanyPoolDataSchema } from "../../lib/career/matching/pool";
import { getCareerAnalysisRepository } from "../../lib/career/repositories";
import { PostgresTargetRequirementArtifactRepository } from "../../lib/career/target-adapters/role-requirement-artifact-persistence/postgres";
import { byteReplayTargetRequirementRevision } from "../../lib/career/target/role/requirement/replay";
import { DISPOSABLE_TEST_DATABASE_PATTERN, requireTestDatabaseUrl } from "../../lib/database-isolation/policy";
import { newDisposableTestDatabaseName } from "../../lib/database-isolation/verification";
import { careerChainRepositories } from "../decision-integration/fixtures/postgres-career-chain";
import { buildVerifiedAnalysis, validationCapabilities } from "./fixtures/analysis";
import { canonicalJson, draftPool, poolWithDuplicateRoleId, poolWithInvalidWeight, poolWithRequirementToUnknownRole, poolWithRoleToUnknownOrganization, reorderKeysDeep, validationPool } from "./fixtures/pool";

type RouteModule = { POST?: (request: Request) => Promise<Response>; GET?: (request: Request, context: { params: Promise<Record<string, string>> }) => Promise<Response> };

const routes = await (async (): Promise<{ collection: RouteModule; item: RouteModule; matches: RouteModule } | null> => {
  try {
    const [collection, item, matches] = await Promise.all([
      // @ts-ignore -- the v1 routes are owned by GELB and may be absent from this checkout
      import("../../app/api/career/job-pools/route"),
      // @ts-ignore -- the v1 routes are owned by GELB and may be absent from this checkout
      import("../../app/api/career/job-pools/[jobPoolUploadId]/route"),
      // @ts-ignore -- the v1 routes are owned by GELB and may be absent from this checkout
      import("../../app/api/career/job-pools/[jobPoolUploadId]/matches/route")
    ]);
    return { collection, item, matches } as never;
  } catch {
    return null;
  }
})();

const sha256 = (value: string) => createHash("sha256").update(value, "utf8").digest("hex");
const databaseUrl = requireTestDatabaseUrl();
const analysisId = "ANL_PINK_JOB_POOL_VALIDATION";
const post = (body: string, headers: Record<string, string> = {}) => routes!.collection.POST!(new Request("http://local/api/career/job-pools", { method: "POST", headers: { "content-type": "application/json", ...headers }, body }));
const getItem = (id: string) => routes!.item.GET!(new Request(`http://local/api/career/job-pools/${id}`), { params: Promise.resolve({ jobPoolUploadId: id }) });
const getMatches = (id: string, query: string) => routes!.matches.GET!(new Request(`http://local/api/career/job-pools/${id}/matches${query}`), { params: Promise.resolve({ jobPoolUploadId: id }) });

async function rowCensus(sql: postgres.Sql): Promise<Record<string, number>> {
  const tables = await sql<{ table_name: string }[]>`select table_name from information_schema.tables where table_schema = 'public' order by table_name`;
  const census: Record<string, number> = {};
  for (const { table_name } of tables) census[table_name] = Number((await sql.unsafe(`select count(*)::int as n from "${table_name}"`))[0].n);
  return census;
}

describe.skipIf(routes === null)("Job Pool connection: HTTP contract, canonical mapping and inverse walk (JP-H / JP-C / JP-I)", () => {
  const uploadedBytes = JSON.stringify(validationPool, null, 2);
  let sql: postgres.Sql;
  let view: any;
  const repositories = careerChainRepositories(drizzle(db.$client));
  const artifacts = new PostgresTargetRequirementArtifactRepository(drizzle(db.$client));

  beforeAll(async () => {
    sql = postgres(databaseUrl, { max: 1, onnotice: () => undefined });
    await getCareerAnalysisRepository().save(buildVerifiedAnalysis(analysisId));
  });

  afterAll(async () => { await sql?.end({ timeout: 5 }); });

  it("JP-H: POST creates the upload once (201) and reports an identical upload as 200 with the same id, also for reordered keys", async () => {
    const first = await post(uploadedBytes);
    expect(first.status).toBe(201);
    view = await first.json();
    expect(view.jobPoolUploadId).toMatch(/^JPOOL_/);
    expect(view.poolId).toBe(validationPool.pool.id);
    expect(view.poolStatus).toBe("ACTIVE");
    expect([view.organizationCount, view.roleCount, view.requirementCount]).toEqual([2, 3, 6]);
    expect(view.rawSha256).toBe(sha256(uploadedBytes));
    // A1 (amended after b782793): the canonical bytes are the key-sorted JSON of the schema-normalized pool
    // (CompanyPoolDataSchema applies `search_queries: []`), not of the raw upload object.
    const normalized = CompanyPoolDataSchema.parse(JSON.parse(uploadedBytes));
    expect(view.canonicalSha256).toBe(sha256(canonicalJson(normalized)));
    expect(view.pool).toEqual(normalized);

    const again = await post(uploadedBytes);
    expect(again.status).toBe(200);
    expect((await again.json()).jobPoolUploadId).toBe(view.jobPoolUploadId);

    const reordered = await post(JSON.stringify(reorderKeysDeep(validationPool)));
    expect(reordered.status).toBe(200);
    expect((await reordered.json()).jobPoolUploadId).toBe(view.jobPoolUploadId);
  });

  it("JP-H: the canonical mapping carries the three layer labels and one revision per pool item", () => {
    const mapping = view.canonicalMapping;
    expect(mapping).toMatchObject({ mappingState: "MAPPED", proposalState: "PROPOSAL_ONLY", authorityState: "NONE", provider: "CONDYN_JOB_POOL_JSON" });
    expect(mapping.organizations.map((o: any) => o.poolOrganizationId).sort()).toEqual(validationPool.organizations.map((o) => o.id).sort());
    expect(mapping.roles.map((r: any) => r.poolRoleId).sort()).toEqual(validationPool.roles.map((r) => r.id).sort());
    for (const role of mapping.roles) {
      const expected = validationPool.requirements.filter((req) => req.role_id === role.poolRoleId).map((req) => req.id).sort();
      expect(role.requirements.map((req: any) => req.poolRequirementId).sort()).toEqual(expected);
      for (const key of ["targetSourceRevisionId", "targetRoleEntityId", "targetRoleSourceBindingRevisionId", "targetRoleOrganizationBindingRevisionId", "targetRoleProfileRevisionId", "targetRoleReconstructionBatchRunId", "targetRequirementReconstructionBatchRunId"]) {
        expect(typeof role[key]).toBe("string");
        expect(role[key].length).toBeGreaterThan(0);
      }
    }
  });

  it("JP-C: one DOCUMENT source revision per upload (C1/C2): jobpool:// locator, rendering version, hashes over the stored canonical bytes and the rendered text", async () => {
    const sourceIds = new Set(view.canonicalMapping.roles.map((r: any) => r.targetSourceRevisionId));
    expect(sourceIds.size).toBe(1);
    const source = await repositories.source.getRevisionById([...sourceIds][0] as string);
    expect(source).not.toBeNull();
    expect(source!.sourceKind).toBe("DOCUMENT");
    expect(source!.sourceLocator).toBe(`jobpool://${view.jobPoolUploadId}`);
    expect(source!.normalizationVersion).toBe("JOB_POOL_SOURCE_RENDERING_V1");
    expect(source!.normalizedContentHash).toBe(sha256(source!.normalizedContent));
    expect(source!.rawContentHash).toBe(view.canonicalSha256);
    const text = source!.normalizedContent;
    expect(text).toBe(text.normalize("NFC"));
    expect(text).not.toMatch(/\r/);
    expect(text.split("\n").some((line) => /[ \t]$/.test(line))).toBe(false);
    for (const id of [...validationPool.organizations, ...validationPool.roles, ...validationPool.requirements].map((item) => item.id)) {
      expect(text.split("\n").some((line) => line.includes(id))).toBe(true);
    }
  });

  it("JP-C: organizations, bindings and role profiles form the canonical chain with PROPOSAL_ONLY / authority NONE", async () => {
    for (const organization of view.canonicalMapping.organizations) {
      const revision = await repositories.organization.getRevisionById(organization.targetOrganizationRevisionId);
      expect(revision).not.toBeNull();
      expect(revision!.targetOrganizationEntityId).toBe(organization.targetOrganizationEntityId);
      expect(revision!.organizationDescriptor).toBe(organization.name);
      expect(revision!.descriptorKind).toBe("DECLARED_NAME");
    }
    for (const role of view.canonicalMapping.roles) {
      const roleSource = await repositories.roleSource.getRevisionById(role.targetRoleSourceBindingRevisionId);
      expect(roleSource).toMatchObject({ targetRoleEntityId: role.targetRoleEntityId, targetSourceRevisionId: role.targetSourceRevisionId, previousRevisionId: null });
      const binding = await repositories.binding.getRevisionById(role.targetRoleOrganizationBindingRevisionId);
      const organization = view.canonicalMapping.organizations.find((o: any) => o.poolOrganizationId === role.poolOrganizationId);
      expect(binding).toMatchObject({ targetRoleEntityId: role.targetRoleEntityId, targetRoleSourceBindingRevisionId: role.targetRoleSourceBindingRevisionId, targetOrganizationRevisionId: organization.targetOrganizationRevisionId, previousRevisionId: null });
      const profile = await repositories.profile.getRevisionById(role.targetRoleProfileRevisionId);
      expect(profile).toMatchObject({ targetRoleEntityId: role.targetRoleEntityId, targetRoleOrganizationBindingRevisionId: role.targetRoleOrganizationBindingRevisionId, proposalState: "PROPOSAL_ONLY", sourceEvidenceState: "SOURCE_MATCH_VERIFIED", authorityState: "NONE", previousRevisionId: null });
      expect(profile!.profile.roleSemanticDefinition.length).toBeGreaterThan(0);
    }
  });

  it("JP-C: every requirement revision follows the C3 level table, the C7 necessity rule and the default requirement type; the batch run is persisted", async () => {
    const source = await repositories.source.getRevisionById(view.canonicalMapping.roles[0].targetSourceRevisionId);
    const lines = new Set(source!.normalizedContent.split("\n"));
    const expectations: Record<string, { type: string; level: unknown; levelState: string; necessity: unknown; necessityState: string }> = {
      req_pink_alpha_1: { type: "CAPABILITY", level: { kind: "CAPABILITY_LEVEL", level: "L5" }, levelState: "SUPPORTED", necessity: { kind: "REQUIRED" }, necessityState: "SUPPORTED" },
      req_pink_alpha_2: { type: "CAPABILITY", level: { kind: "UNKNOWN" }, levelState: "UNKNOWN", necessity: { kind: "PREFERRED" }, necessityState: "SUPPORTED" },
      req_pink_alpha_3: { type: "CAPABILITY", level: { kind: "UNKNOWN" }, levelState: "UNKNOWN", necessity: { kind: "UNKNOWN" }, necessityState: "UNKNOWN" },
      req_pink_beta_1: { type: "TOOL_TECHNOLOGY", level: { kind: "CAPABILITY_LEVEL", level: "L4" }, levelState: "SUPPORTED", necessity: { kind: "REQUIRED" }, necessityState: "SUPPORTED" },
      req_pink_beta_2: { type: "LANGUAGE", level: { kind: "LANGUAGE_PROFICIENCY", proficiency: "C1" }, levelState: "SUPPORTED", necessity: { kind: "OPTIONAL" }, necessityState: "SUPPORTED" },
      req_pink_beta_3: { type: "CAPABILITY", level: { kind: "UNKNOWN" }, levelState: "UNKNOWN", necessity: { kind: "UNKNOWN" }, necessityState: "UNKNOWN" }
    };
    const seen: string[] = [];
    for (const role of view.canonicalMapping.roles) {
      const batch = await artifacts.getBatchRunById(role.targetRequirementReconstructionBatchRunId);
      expect(batch).not.toBeNull();
      expect(batch!.status).toBe("COMPLETED");
      expect(batch!.producer.provider).toBe("CONDYN_JOB_POOL_JSON");
      const listed = await repositories.requirement.listTargetRequirementRevisionsByTargetRoleProfileRevisionId(role.targetRoleProfileRevisionId);
      expect(listed.map((item) => item.targetRequirementRevisionId).sort()).toEqual(role.requirements.map((req: any) => req.targetRequirementRevisionId).sort());
      for (const mapped of role.requirements) {
        const revision = await repositories.requirement.getRevisionById(mapped.targetRequirementRevisionId);
        expect(revision).not.toBeNull();
        const poolRequirement = validationPool.requirements.find((req) => req.id === mapped.poolRequirementId)!;
        const expected = expectations[mapped.poolRequirementId];
        seen.push(mapped.poolRequirementId);
        expect(mapped.capabilityName).toBe(poolRequirement.capability_name);
        expect(revision!.targetRequirementEntityId).toBe(mapped.targetRequirementEntityId);
        expect(revision!.targetRoleProfileRevisionId).toBe(role.targetRoleProfileRevisionId);
        expect(revision!.previousRevisionId).toBeNull();
        expect(revision!.requirement.requirementType).toBe(expected.type);
        expect(revision!.requirement.requiredLevelState).toEqual(expected.level);
        expect(revision!.requiredLevelValidationState).toBe(expected.levelState);
        expect(revision!.requirement.necessityState).toEqual(expected.necessity);
        expect(revision!.necessityValidationState).toBe(expected.necessityState);
        expect(mapped.necessityState).toBe((expected.necessity as { kind: string }).kind);
        expect(mapped.matchingEligibility).toBe(revision!.matchingEligibility);
        expect(revision!.requirement.normalizedStatement).toContain(poolRequirement.capability_name);
        expect(revision!).toMatchObject({ sourceEvidenceState: "SOURCE_MATCH_VERIFIED", proposalState: "PROPOSAL_ONLY", authorityState: "NONE" });
        expect(revision!.evidence.length).toBeGreaterThan(0);
        for (const claim of revision!.evidence) {
          expect(lines.has(claim.exactQuote)).toBe(true);
          expect(claim.exactQuote).toContain(mapped.poolRequirementId);
        }
      }
    }
    expect(seen.sort()).toEqual(Object.keys(expectations).sort());
    expect(view.canonicalMapping.roles.find((r: any) => r.poolRoleId === "role_pink_beta_empty").requirements).toEqual([]);
  });

  it("JP-C: CAPABILITY requirements with validated level and necessity are MATCHING_ELIGIBLE_PROPOSAL_ONLY", () => {
    const alpha = view.canonicalMapping.roles.find((r: any) => r.poolRoleId === "role_pink_alpha_architect");
    expect(alpha.requirements.find((req: any) => req.poolRequirementId === "req_pink_alpha_1").matchingEligibility).toBe("MATCHING_ELIGIBLE_PROPOSAL_ONLY");
  });

  it("JP-I: byte replay of every requirement revision returns the persisted revision; the stored canonical bytes reproduce the upload id", async () => {
    for (const role of view.canonicalMapping.roles) for (const mapped of role.requirements) {
      const replayed = await byteReplayTargetRequirementRevision(mapped.targetRequirementRevisionId, { ...artifacts, getRevisionById: repositories.requirement.getRevisionById.bind(repositories.requirement) } as never);
      expect(replayed.targetRequirementRevisionId).toBe(mapped.targetRequirementRevisionId);
    }
    const fromStoredBytes = await post(canonicalJson(view.pool));
    expect(fromStoredBytes.status).toBe(200);
    expect((await fromStoredBytes.json()).jobPoolUploadId).toBe(view.jobPoolUploadId);
  });

  it("JP-H: GET list and GET by id expose the upload; unknown ids are 404", async () => {
    const list = await routes!.collection.GET!(new Request("http://local/api/career/job-pools"), { params: Promise.resolve({}) });
    expect(list.status).toBe(200);
    const body = await list.json();
    expect(body.jobPools.some((item: any) => item.jobPoolUploadId === view.jobPoolUploadId)).toBe(true);
    expect(body.jobPools.every((item: any) => !("canonicalMapping" in item))).toBe(true);
    const item = await getItem(view.jobPoolUploadId);
    expect(item.status).toBe(200);
    expect((await item.json()).jobPoolUploadId).toBe(view.jobPoolUploadId);
    expect((await getItem("JPOOL_DOES_NOT_EXIST")).status).toBe(404);
  });

  it("JP-H + JP-I: presentation matching follows CP-I1..I4 and Step 23, states its basis, quotes the analysis evidence verbatim and persists nothing", async () => {
    const before = await rowCensus(sql);
    const response = await getMatches(view.jobPoolUploadId, `?analysisId=${analysisId}`);
    expect(response.status).toBe(200);
    const presentation = await response.json();
    expect(await rowCensus(sql)).toEqual(before);
    expect(presentation.presentation).toEqual({ kind: "DETERMINISTIC_RESONANCE_PRESENTATION", policyVersion: "JOB_POOL_PRESENTATION_MATCHING_V1", authorityState: "NONE", canonicalEvaluation: false, decision: false, weakEvidenceThreshold: 0.7 });
    expect(presentation.analysisId).toBe(analysisId);
    expect(presentation.jobPoolUploadId).toBe(view.jobPoolUploadId);
    expect(presentation.candidateCapabilityCount).toBe(validationCapabilities.length);

    const roles: any[] = presentation.roleMatches;
    expect(roles.map((r) => r.poolRoleId).sort()).toEqual(validationPool.roles.map((r) => r.id).sort());
    for (let i = 1; i < roles.length; i += 1) expect(roles[i - 1].resonanceScore).toBeGreaterThanOrEqual(roles[i].resonanceScore);
    for (const role of roles) {
      expect(role.resonanceScore).toBeGreaterThanOrEqual(0);
      expect(role.resonanceScore).toBeLessThanOrEqual(1);
      const requirements = validationPool.requirements.filter((req) => req.role_id === role.poolRoleId);
      const total = requirements.reduce((sum, req) => sum + req.weight, 0);
      const earned = [...role.matched, ...role.weakEvidence].reduce((sum: number, item: any) => sum + item.contribution, 0);
      expect(role.resonanceScore).toBeCloseTo(total === 0 ? 0 : earned / total, 3);
      expect([...role.matched, ...role.weakEvidence, ...role.missing].map((item: any) => item.poolRequirementId).sort()).toEqual(requirements.map((req) => req.id).sort());
      for (const item of [...role.matched, ...role.weakEvidence]) {
        expect(["EXACT", "ALIAS", "COMPOSITE_CONSTITUENT", "TOKEN_CONTAINMENT"]).toContain(item.matchBasis);
        expect("matchedConstituent" in item).toBe(true);
        if (item.matchBasis !== "COMPOSITE_CONSTITUENT") expect(item.matchedConstituent).toBeNull();
        const capability = validationCapabilities.find((spec) => spec.entityId === item.matchedCapabilityEntityId)!;
        expect(capability).toBeDefined();
        expect(item.matchedCapabilityName).toBe(capability.name);
        expect(item.confidence).toBe(capability.confidence);
        expect(item.evidence.length).toBeGreaterThan(0);
        for (const quote of item.evidence) expect(quote).toEqual({ docId: "DOC_001", quote: capability.quote });
      }
      for (const item of role.matched) expect(item.contribution).toBeCloseTo(item.weight * item.confidence, 3);
      for (const item of role.weakEvidence) {
        expect(item.confidence).toBeLessThan(0.7);
        expect(item.contribution).toBeCloseTo(item.weight * item.confidence * 0.5, 3);
        expect(item.reason.length).toBeGreaterThan(0);
      }
      const mapping = view.canonicalMapping.roles.find((r: any) => r.poolRoleId === role.poolRoleId);
      expect(role.canonical).toEqual({ targetRoleProfileRevisionId: mapping.targetRoleProfileRevisionId, targetRequirementRevisionIds: mapping.requirements.map((req: any) => req.targetRequirementRevisionId), capabilityRequirementRelationState: "NOT_EVALUATED", reason: "VERIFIED_CAPABILITY_SNAPSHOT_ABSENT" });
    }

    const alpha = roles.find((r) => r.poolRoleId === "role_pink_alpha_architect");
    expect(alpha.matched.map((item: any) => [item.poolRequirementId, item.matchBasis, item.necessity])).toEqual([["req_pink_alpha_1", "EXACT", "REQUIRED"]]);
    expect(alpha.weakEvidence.map((item: any) => [item.poolRequirementId, item.matchBasis, item.necessity])).toEqual([["req_pink_alpha_2", "EXACT", "PREFERRED"]]);
    expect(alpha.missing).toEqual([{ poolRequirementId: "req_pink_alpha_3", capabilityName: "Industrial IoT Protocol Design", requiredLevel: "", weight: 0.4, necessity: "UNDECLARED", evidenceHint: null }]);
    expect(alpha.resonanceScore).toBeCloseTo((1.0 * 0.95 + 0.6 * 0.45 * 0.5) / 2.0, 3);

    const beta = roles.find((r) => r.poolRoleId === "role_pink_beta_platform");
    // COMPOSITE_CONSTITUENT (contract addition b6986ff): a conjunction states each part; full match under the 0.7 rule.
    expect(beta.matched.map((item: any) => [item.poolRequirementId, item.matchBasis, item.matchedCapabilityName, item.matchedConstituent])).toEqual([
      ["req_pink_beta_1", "ALIAS", "k8s", null],
      ["req_pink_beta_3", "COMPOSITE_CONSTITUENT", "TypeScript and Node.js", "Node.js"]
    ]);
    expect(beta.missing.map((item: any) => [item.poolRequirementId, item.necessity])).toEqual([["req_pink_beta_2", "OPTIONAL"]]);
    expect(beta.resonanceScore).toBeCloseTo((0.9 * 0.9 + 0.3 * 0.8) / 1.4, 3);

    const empty = roles.find((r) => r.poolRoleId === "role_pink_beta_empty");
    expect([empty.resonanceScore, empty.matched, empty.weakEvidence, empty.missing]).toEqual([0, [], [], []]);
    expect(JSON.stringify(presentation)).not.toContain("CAP_PINK_UNRELATED");

    const organizations: any[] = presentation.organizationMatches;
    expect(organizations.map((o) => o.poolOrganizationId)).toEqual(["org_pink_beta", "org_pink_alpha"]);
    expect(organizations[0]).toMatchObject({ aggregateScore: beta.resonanceScore, roleCount: 2, topRoleTitle: "Platform Engineer" });
    expect(organizations[1]).toMatchObject({ aggregateScore: alpha.resonanceScore, roleCount: 1, topRoleTitle: "Distributed Systems Architect" });
  });

  it("JP-H: the presentation layer owns no table", async () => {
    const tables = await sql<{ table_name: string }[]>`select table_name from information_schema.tables where table_schema = 'public'`;
    expect(tables.map((t) => t.table_name).filter((name) => /match|presentation|resonance/i.test(name))).toEqual([]);
  });

  it("JP-H: matches refuse unknown analyses and pools (404) and inactive pools (409)", async () => {
    expect((await getMatches(view.jobPoolUploadId, "?analysisId=ANL_DOES_NOT_EXIST")).status).toBe(404);
    expect((await getMatches("JPOOL_DOES_NOT_EXIST", `?analysisId=${analysisId}`)).status).toBe(404);
    const noAnalysis = await getMatches(view.jobPoolUploadId, "");
    expect(noAnalysis.status).toBe(400);
    expect((await noAnalysis.json()).error.code).toBe("ERR_ANALYSIS_ID_REQUIRED");
    const draft = await post(JSON.stringify(draftPool()));
    expect(draft.status).toBe(201);
    const draftId = (await draft.json()).jobPoolUploadId;
    const inactive = await getMatches(draftId, `?analysisId=${analysisId}`);
    expect(inactive.status).toBe(409);
    expect((await inactive.json()).error.code).toBe("ERR_INACTIVE_COMPANY_POOL");
  });

  it("JP-H: upload errors carry the documented codes (400 / 413 / 422 with issues)", async () => {
    const invalidJson = await post("{ not json");
    expect(invalidJson.status).toBe(400);
    expect((await invalidJson.json()).error.code).toBe("ERR_JOB_POOL_JSON_INVALID");

    const large = JSON.parse(JSON.stringify(validationPool));
    large.pool.description = "x".repeat(1024 * 1024 + 16);
    const tooLarge = await post(JSON.stringify(large));
    expect(tooLarge.status).toBe(413);
    expect((await tooLarge.json()).error.code).toBe("ERR_JOB_POOL_TOO_LARGE");

    const schema = await post(JSON.stringify(poolWithInvalidWeight()));
    expect(schema.status).toBe(422);
    const schemaBody = await schema.json();
    expect(schemaBody.error.code).toBe("ERR_JOB_POOL_SCHEMA_INVALID");
    expect(Array.isArray(schemaBody.error.issues)).toBe(true);
    expect(schemaBody.error.issues.length).toBeGreaterThan(0);

    for (const variant of [poolWithRoleToUnknownOrganization(), poolWithRequirementToUnknownRole(), poolWithDuplicateRoleId()]) {
      const response = await post(JSON.stringify(variant));
      expect(response.status).toBe(422);
      expect((await response.json()).error.code).toBe("ERR_JOB_POOL_REFERENCE_INVALID");
    }
    const list = await routes!.collection.GET!(new Request("http://local/api/career/job-pools"), { params: Promise.resolve({}) });
    const summaries = (await list.json()).jobPools;
    // The rejected uploads left no record; the ACTIVE pool exists once (the DRAFT variant is a separate upload).
    expect(summaries.filter((item: any) => item.poolId === validationPool.pool.id && item.poolStatus === "ACTIVE").length).toBe(1);
  });

  it("JP-H: an unmarked database in the disposable name pattern receives no DDL and the upload answers 503", async () => {
    const adminUrl = process.env.TEST_DATABASE_ADMIN_URL;
    if (!adminUrl) throw new Error("TEST_DATABASE_ADMIN_URL is required for the unmarked database probe");
    const name = newDisposableTestDatabaseName();
    expect(name).toMatch(DISPOSABLE_TEST_DATABASE_PATTERN);
    const admin = postgres(adminUrl, { max: 1, onnotice: () => undefined });
    await admin.unsafe(`CREATE DATABASE "${name}"`);
    const unmarkedUrl = new URL(databaseUrl);
    unmarkedUrl.pathname = `/${name}`;
    try {
      const output = execFileSync("npx", ["tsx", resolve(__dirname, "support/unmarked-database-probe.ts")], { cwd: process.cwd(), env: { ...process.env, DATABASE_URL: unmarkedUrl.toString(), NODE_ENV: "test" }, encoding: "utf8", timeout: 120_000 });
      const verdict = JSON.parse(output.trim().split("\n").pop()!);
      expect(verdict).toEqual({ status: 503, code: "ERR_JOB_POOL_PERSISTENCE_NOT_PROVISIONED" });
      const probe = postgres(unmarkedUrl.toString(), { max: 1, onnotice: () => undefined });
      try {
        const tables = await probe<{ n: number }[]>`select count(*)::int as n from information_schema.tables where table_schema = 'public'`;
        expect(tables[0].n).toBe(0);
      } finally { await probe.end({ timeout: 5 }); }
    } finally {
      await admin.unsafe(`DROP DATABASE "${name}"`);
      await admin.end({ timeout: 5 });
    }
  });
});
