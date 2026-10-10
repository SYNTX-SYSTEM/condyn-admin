import { describe, expect, it } from "vitest";
import { DEMO_COMPANY_POOL } from "../../../lib/career/matching/demo-pool";
import { CompanyPoolDataSchema } from "../../../lib/career/matching/pool";
import { JobPoolError } from "../../../lib/career/job-pool/errors";
import { JOB_POOL_MAX_UPLOAD_BYTES, parseJobPoolUpload, stableJson } from "../../../lib/career/job-pool/upload";
import { samplePool, samplePoolText } from "./fixtures";

const failure = (run: () => unknown): JobPoolError => {
  try { run(); } catch (error) { if (error instanceof JobPoolError) return error; throw error; }
  throw new Error("expected a JobPoolError");
};

describe("JSON Job Pool upload parsing (JP-U)", () => {
  it("accepts the sample pool and derives the upload id from the canonical bytes", () => {
    const parsed = parseJobPoolUpload(samplePoolText());
    expect(parsed.jobPoolUploadId).toMatch(/^JPOOL_[0-9A-F]{32}$/);
    expect(parsed.jobPoolUploadId).toBe(`JPOOL_${parsed.canonicalSha256.slice(0, 32).toUpperCase()}`);
    expect(parsed.canonicalJson).toBe(stableJson(JSON.parse(parsed.canonicalJson)));
    expect(parsed.pool.roles).toHaveLength(6);
  });

  it("maps byte-different but equivalent uploads (whitespace, key order) onto one upload id and keeps their raw hashes apart", () => {
    const pool = samplePool();
    const compact = JSON.stringify(pool);
    const reordered = JSON.stringify({ requirements: pool.requirements, roles: pool.roles, organizations: pool.organizations, pool: pool.pool });
    const a = parseJobPoolUpload(compact);
    const b = parseJobPoolUpload(reordered);
    const c = parseJobPoolUpload(samplePoolText());
    expect(new Set([a.jobPoolUploadId, b.jobPoolUploadId, c.jobPoolUploadId]).size).toBe(1);
    expect(new Set([a.rawSha256, b.rawSha256, c.rawSha256]).size).toBe(3);
  });

  it("keeps every existing pool valid: the three requirement fields are optional and additive", () => {
    expect(CompanyPoolDataSchema.parse(DEMO_COMPANY_POOL).requirements[0]).not.toHaveProperty("aliases");
    expect(parseJobPoolUpload(JSON.stringify(DEMO_COMPANY_POOL)).pool.requirements.length).toBe(DEMO_COMPANY_POOL.requirements.length);
  });

  it("rejects invalid JSON with 400, schema violations with 422 and issues, oversize with 413", () => {
    expect(failure(() => parseJobPoolUpload("{not json")).status).toBe(400);
    const pool = samplePool();
    pool.requirements[0].weight = 1.5;
    pool.requirements[1].necessity = "MANDATORY";
    const schema = failure(() => parseJobPoolUpload(JSON.stringify(pool)));
    expect(schema.code).toBe("ERR_JOB_POOL_SCHEMA_INVALID");
    expect(schema.status).toBe(422);
    expect(schema.issues.map(issue => issue.path)).toEqual(expect.arrayContaining(["requirements.0.weight", "requirements.1.necessity"]));
    expect(failure(() => parseJobPoolUpload(" ".repeat(JOB_POOL_MAX_UPLOAD_BYTES + 1))).status).toBe(413);
  });

  it("rejects duplicate ids, foreign pool ids and dangling references with 422 ERR_JOB_POOL_REFERENCE_INVALID", () => {
    const pool = samplePool();
    pool.roles.push({ ...pool.roles[0] });
    pool.requirements[0].role_id = "role_unknown";
    pool.organizations[0].pool_id = "other_pool";
    pool.roles[1].organization_id = "org_unknown";
    const error = failure(() => parseJobPoolUpload(JSON.stringify(pool)));
    expect(error.code).toBe("ERR_JOB_POOL_REFERENCE_INVALID");
    expect(error.status).toBe(422);
    expect(error.issues.map(issue => issue.message).join("|")).toMatch(/duplicate id role_fullstack/);
    expect(error.issues.map(issue => issue.path)).toEqual(expect.arrayContaining(["requirements.0.role_id", "organizations.0.pool_id", "roles.1.organization_id"]));
  });
});
