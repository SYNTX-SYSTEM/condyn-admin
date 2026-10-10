import { createHash } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import postgres, { type Sql } from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { verifyDisposableTestDatabase } from "../../../lib/database-isolation/verification";
import { listRegisteredTables } from "../../../lib/persistence/unified-schema-registration";
import { getCareerAnalysisRepository } from "../../../lib/career/repositories";
import { JOB_POOL_PERSISTENCE_TABLE_NAMES } from "../../../lib/career/job-pool/persistence-schema";
import { createTargetRepositories, mapJobPoolToCanonicalTargets } from "../../../lib/career/job-pool/canonical-mapping";
import { handleJobPoolMatchesRequest, handleListJobPoolsRequest, handleReadJobPoolRequest, handleUploadJobPoolRequest } from "../../../lib/career/job-pool/http";
import type { JobPoolUploadView } from "../../../lib/career/job-pool/types";
import { stableJson } from "../../../lib/career/job-pool/upload";
import { byteReplayTargetRequirementRevision, providerAuditTargetRequirementBatch, semanticReplayTargetRequirementRevision } from "../../../lib/career/target/role/requirement/replay";
import { FIXTURE_ANALYSIS_ID, fixtureCapabilities, samplePool, samplePoolText, verifiedAnalysis } from "./fixtures";

/**
 * JP-C, JP-I and JP-H on the runner's verified disposable database. The routes' own composition root performs
 * the gated registration; this file never issues DDL itself.
 */
const sha256 = (value: string) => createHash("sha256").update(value, "utf8").digest("hex");
let sql: Sql;
let factory: typeof import("../../../lib/career/job-pool/local-composition").createLocalJobPoolApplication;

const post = (body: string, headers: Record<string, string> = {}) =>
  handleUploadJobPoolRequest(new Request("http://local/api/career/job-pools", { method: "POST", body, headers: { "content-type": "application/json", ...headers } }), factory);
const countRows = async (tables: readonly string[]) =>
  Object.fromEntries(await Promise.all(tables.map(async table => [table, Number((await sql.unsafe(`SELECT count(*)::int AS n FROM "${table}"`))[0].n)])));
const CANONICAL_TABLES = ["target_source_revisions", "target_organization_revisions", "target_role_source_binding_revisions", "target_role_organization_binding_revisions", "target_role_profile_revisions", "target_requirement_revisions"];

beforeAll(async () => {
  const verified = await verifyDisposableTestDatabase(process.env.DATABASE_URL);
  sql = postgres(verified.url, { max: 1, onnotice: () => undefined });
  ({ createLocalJobPoolApplication: factory } = await import("../../../lib/career/job-pool/local-composition"));
}, 60_000);

afterAll(async () => { if (sql) await sql.end({ timeout: 5 }); });

describe("JSON Job Pool on PostgreSQL (JP-C, JP-I, JP-H)", () => {
  let view: JobPoolUploadView;

  it("registers its tables through the gate and maps the sample pool onto canonical target revisions (201)", async () => {
    const response = await post(samplePoolText(), { "x-condyn-principal-actor-id": "hr.operator@local" });
    expect(response.status).toBe(201);
    view = await response.json();
    const tables = await listRegisteredTables(sql);
    for (const name of JOB_POOL_PERSISTENCE_TABLE_NAMES) expect(tables, name).toContain(name);
    expect(view.uploadedByActorRef).toBe("JOB_POOL_UPLOADER:hr.operator@local");
    expect(view.canonicalMapping).toMatchObject({ mappingState: "MAPPED", proposalState: "PROPOSAL_ONLY", authorityState: "NONE", provider: "CONDYN_JOB_POOL_JSON" });
    expect(view.canonicalMapping.organizations).toHaveLength(3);
    expect(view.canonicalMapping.roles).toHaveLength(6);
    expect(view.canonicalMapping.roles.flatMap(role => role.requirements)).toHaveLength(28);
    expect(new Set(view.canonicalMapping.roles.map(role => role.targetSourceRevisionId)).size).toBe(1);
  }, 120_000);

  it("persists every canonical revision as PROPOSAL_ONLY with authority NONE and replays each requirement byte- and semantically", async () => {
    const repos = createTargetRepositories(drizzle(sql) as never);
    const replay = Object.assign(Object.create(repos.requirementArtifacts), { getRevisionById: repos.requirement.getRevisionById.bind(repos.requirement) });
    for (const role of view.canonicalMapping.roles) {
      const profile = await repos.profile.getRevisionById(role.targetRoleProfileRevisionId);
      expect(profile).toMatchObject({ proposalState: "PROPOSAL_ONLY", authorityState: "NONE", sourceEvidenceState: "SOURCE_MATCH_VERIFIED", semanticValidationState: "NOT_RUN" });
      expect(profile!.profile.roleDescriptor).toBe(role.title);
      for (const item of role.requirements) {
        const revision = await byteReplayTargetRequirementRevision(item.targetRequirementRevisionId, replay);
        expect(revision).toMatchObject({ targetRoleProfileRevisionId: role.targetRoleProfileRevisionId, proposalState: "PROPOSAL_ONLY", authorityState: "NONE" });
        expect(revision.requirement.capabilityExpression).toBe(item.capabilityName);
        const recomposed = await semanticReplayTargetRequirementRevision({ historicalRevisionId: item.targetRequirementRevisionId, targetRequirementReconstructionResultId: item.targetRequirementReconstructionResultId, targetRequirementEntityAdmissionId: item.targetRequirementEntityAdmissionId }, replay);
        expect(recomposed).toEqual(revision);
        const admission = await repos.requirementArtifacts.getAdmissionById(item.targetRequirementEntityAdmissionId);
        expect(admission).toMatchObject({ admissionState: "NEW_ENTITY_ADMITTED", admissionPolicyVersion: "JOB_POOL_UPLOAD_SCOPED_ENTITY_V1", previousRevisionId: null, admittedByActorRef: "JOB_POOL_UPLOADER:hr.operator@local" });
      }
      const raw = await providerAuditTargetRequirementBatch(role.targetRequirementReconstructionBatchRunId, replay);
      expect(JSON.parse(raw).provider).toBe("CONDYN_JOB_POOL_JSON");
      expect(await repos.roleArtifacts.getBatchRunById(role.targetRoleReconstructionBatchRunId)).toMatchObject({ status: "COMPLETED", producer: { provider: "CONDYN_JOB_POOL_JSON" } });
    }
  }, 120_000);

  it("walks every requirement revision back to the stored canonical bytes and the declared pool requirement (JP-I)", async () => {
    const repos = createTargetRepositories(drizzle(sql) as never);
    const [upload] = await sql`SELECT canonical_json, canonical_sha256 FROM career_job_pool_uploads WHERE job_pool_upload_id = ${view.jobPoolUploadId}`;
    expect(sha256(upload.canonical_json)).toBe(upload.canonical_sha256);
    const pool = JSON.parse(upload.canonical_json);
    for (const role of view.canonicalMapping.roles) for (const item of role.requirements) {
      const revision = (await repos.requirement.getRevisionById(item.targetRequirementRevisionId))!;
      const profile = (await repos.profile.getRevisionById(revision.targetRoleProfileRevisionId))!;
      const binding = (await repos.binding.getRevisionById(profile.targetRoleOrganizationBindingRevisionId))!;
      const roleSource = (await repos.roleSource.getRevisionById(binding.targetRoleSourceBindingRevisionId))!;
      const source = (await repos.source.getRevisionById(roleSource.targetSourceRevisionId))!;
      expect(source.sourceLocator).toBe(`jobpool://${view.jobPoolUploadId}`);
      expect(source.rawContentHash).toBe(upload.canonical_sha256);
      expect(sha256(source.normalizedContent)).toBe(source.normalizedContentHash);
      for (const claim of revision.evidence) expect(source.normalizedContent.split("\n")).toContain(claim.exactQuote);
      const declared = pool.requirements.find((requirement: { id: string }) => requirement.id === item.poolRequirementId);
      expect(revision.evidence.map(claim => claim.exactQuote)).toContain(`REQUIREMENT ${declared.id}: ${declared.capability_name}`);
      expect(declared.role_id).toBe(role.poolRoleId);
    }
  }, 120_000);

  it("is idempotent: an equivalent re-upload answers 200 with the same id and adds no row, and a re-run of the mapping is byte-identical", async () => {
    const before = await countRows([...CANONICAL_TABLES, ...JOB_POOL_PERSISTENCE_TABLE_NAMES]);
    const pool = samplePool();
    const again = await post(JSON.stringify({ roles: pool.roles, pool: pool.pool, requirements: pool.requirements, organizations: pool.organizations }));
    expect(again.status).toBe(200);
    const second: JobPoolUploadView = await again.json();
    expect(second.jobPoolUploadId).toBe(view.jobPoolUploadId);
    expect(second.rawSha256).toBe(view.rawSha256);
    const remapped = await mapJobPoolToCanonicalTargets({ jobPoolUploadId: view.jobPoolUploadId, pool: second.pool as never, canonicalSha256: view.canonicalSha256, uploadedByActorRef: view.uploadedByActorRef, createdAt: view.uploadedAt }, drizzle(sql) as never);
    expect(stableJson(remapped)).toBe(stableJson(view.canonicalMapping));
    expect(await countRows([...CANONICAL_TABLES, ...JOB_POOL_PERSISTENCE_TABLE_NAMES])).toEqual(before);
  }, 120_000);

  it("serves list, read and presentation matches; the match evidence is verbatim analysis evidence (JP-H, JP-I)", async () => {
    // Same read path as the analyses route: the repository factory (in-memory under NODE_ENV=test, PostgreSQL otherwise).
    await getCareerAnalysisRepository().save(verifiedAnalysis(FIXTURE_ANALYSIS_ID, fixtureCapabilities()) as never);
    const list = await (await handleListJobPoolsRequest(factory)).json();
    expect(list.jobPools.map((item: { jobPoolUploadId: string }) => item.jobPoolUploadId)).toContain(view.jobPoolUploadId);
    expect((await handleReadJobPoolRequest(view.jobPoolUploadId, factory)).status).toBe(200);
    const response = await handleJobPoolMatchesRequest(view.jobPoolUploadId, new Request(`http://local/x?analysisId=${FIXTURE_ANALYSIS_ID}`), factory);
    expect(response.status).toBe(200);
    const matches = await response.json();
    expect(matches.presentation).toMatchObject({ authorityState: "NONE", canonicalEvaluation: false, decision: false });
    expect(matches.roleMatches[0].poolRoleId).toBe("role_fullstack");
    const top = matches.roleMatches[0];
    const mappedRole = view.canonicalMapping.roles.find(role => role.poolRoleId === "role_fullstack")!;
    expect(top.canonical).toEqual({ targetRoleProfileRevisionId: mappedRole.targetRoleProfileRevisionId, targetRequirementRevisionIds: mappedRole.requirements.map(item => item.targetRequirementRevisionId), capabilityRequirementRelationState: "NOT_EVALUATED", reason: "VERIFIED_CAPABILITY_SNAPSHOT_ABSENT" });
    const stored = JSON.stringify(await getCareerAnalysisRepository().load(FIXTURE_ANALYSIS_ID));
    for (const item of [...top.matched, ...top.weakEvidence]) for (const evidence of item.evidence) expect(stored).toContain(evidence.quote);
  }, 120_000);

  it("answers the documented error statuses", async () => {
    const statusOf = async (response: Promise<Response>) => { const r = await response; return [r.status, (await r.json()).error?.code]; };
    expect(await statusOf(post("{nope"))).toEqual([400, "ERR_JOB_POOL_JSON_INVALID"]);
    expect(await statusOf(post(JSON.stringify({ pool: {} })))).toEqual([422, "ERR_JOB_POOL_SCHEMA_INVALID"]);
    expect(await statusOf(post("x", { "content-length": String(2 * 1024 * 1024) }))).toEqual([413, "ERR_JOB_POOL_TOO_LARGE"]);
    expect(await statusOf(post(samplePoolText(), { "x-condyn-principal-actor-id": "bad actor!" }))).toEqual([400, "ERR_JOB_POOL_ACTOR_INVALID"]);
    expect(await statusOf(handleReadJobPoolRequest("JPOOL_" + "0".repeat(32), factory))).toEqual([404, "ERR_JOB_POOL_NOT_FOUND"]);
    expect(await statusOf(handleJobPoolMatchesRequest(view.jobPoolUploadId, new Request("http://local/x"), factory))).toEqual([400, "ERR_ANALYSIS_ID_REQUIRED"]);
    expect(await statusOf(handleJobPoolMatchesRequest(view.jobPoolUploadId, new Request("http://local/x?analysisId=ANL_UNKNOWN"), factory))).toEqual([404, "ERR_ANALYSIS_NOT_FOUND"]);
    const draft = samplePool();
    draft.pool.status = "DRAFT";
    draft.pool.id = "pool_condyn_sample_draft";
    for (const item of [...draft.organizations, ...draft.roles]) item.pool_id = draft.pool.id;
    const created = await post(JSON.stringify(draft));
    expect(created.status).toBe(201);
    const draftView: JobPoolUploadView = await created.json();
    expect(await statusOf(handleJobPoolMatchesRequest(draftView.jobPoolUploadId, new Request(`http://local/x?analysisId=${FIXTURE_ANALYSIS_ID}`), factory))).toEqual([409, "ERR_INACTIVE_COMPANY_POOL"]);
  }, 120_000);
});
