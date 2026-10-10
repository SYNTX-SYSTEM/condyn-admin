import { createHash } from "node:crypto";
import { CompanyPoolDataSchema, type CompanyPoolData } from "../matching/pool";
import { JobPoolError } from "./errors";

export const JOB_POOL_MAX_UPLOAD_BYTES = 1024 * 1024;

const sha256 = (value: string) => createHash("sha256").update(value, "utf8").digest("hex");

/** Key-sorted JSON; the canonical byte form of a validated pool. */
export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).filter(key => record[key] !== undefined).sort().map(key => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export interface ParsedJobPoolUpload {
  jobPoolUploadId: string;
  pool: CompanyPoolData;
  canonicalJson: string;
  canonicalSha256: string;
  rawSha256: string;
}

export const jobPoolUploadIdFor = (canonicalSha256: string) => `JPOOL_${canonicalSha256.slice(0, 32).toUpperCase()}`;

function duplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const value of values) (seen.has(value) ? repeated : seen).add(value);
  return [...repeated].sort();
}

/** Referential integrity beyond the Zod shape: unique ids, pool membership and resolvable references. */
export function assertJobPoolReferences(pool: CompanyPoolData): void {
  const issues: Array<{ path: string; message: string }> = [];
  for (const [kind, values] of [
    ["organizations", pool.organizations.map(item => item.id)],
    ["roles", pool.roles.map(item => item.id)],
    ["requirements", pool.requirements.map(item => item.id)]
  ] as const) {
    for (const id of duplicates([...values])) issues.push({ path: kind, message: `duplicate id ${id}` });
  }
  const organizations = new Set(pool.organizations.map(item => item.id));
  const roles = new Set(pool.roles.map(item => item.id));
  pool.organizations.forEach((item, index) => {
    if (item.pool_id !== pool.pool.id) issues.push({ path: `organizations.${index}.pool_id`, message: `must equal pool.id ${pool.pool.id}` });
  });
  pool.roles.forEach((item, index) => {
    if (item.pool_id !== pool.pool.id) issues.push({ path: `roles.${index}.pool_id`, message: `must equal pool.id ${pool.pool.id}` });
    if (!organizations.has(item.organization_id)) issues.push({ path: `roles.${index}.organization_id`, message: `unknown organization ${item.organization_id}` });
  });
  pool.requirements.forEach((item, index) => {
    if (!roles.has(item.role_id)) issues.push({ path: `requirements.${index}.role_id`, message: `unknown role ${item.role_id}` });
  });
  if (issues.length > 0) throw new JobPoolError("ERR_JOB_POOL_REFERENCE_INVALID", 422, "The job pool references are inconsistent.", issues);
}

/** Parses, validates and canonicalizes one uploaded JSON Job Pool. It performs no I/O. */
export function parseJobPoolUpload(rawText: string): ParsedJobPoolUpload {
  if (Buffer.byteLength(rawText, "utf8") > JOB_POOL_MAX_UPLOAD_BYTES) {
    throw new JobPoolError("ERR_JOB_POOL_TOO_LARGE", 413, `The job pool exceeds ${JOB_POOL_MAX_UPLOAD_BYTES} bytes.`);
  }
  let json: unknown;
  try {
    json = JSON.parse(rawText);
  } catch {
    throw new JobPoolError("ERR_JOB_POOL_JSON_INVALID", 400, "The upload is not valid JSON.");
  }
  const parsed = CompanyPoolDataSchema.safeParse(json);
  if (!parsed.success) {
    throw new JobPoolError(
      "ERR_JOB_POOL_SCHEMA_INVALID",
      422,
      "The upload does not match the CompanyPoolData schema.",
      parsed.error.issues.map(issue => ({ path: issue.path.join("."), message: issue.message }))
    );
  }
  assertJobPoolReferences(parsed.data);
  const canonicalJson = stableJson(parsed.data);
  const canonicalSha256 = sha256(canonicalJson);
  return {
    jobPoolUploadId: jobPoolUploadIdFor(canonicalSha256),
    pool: JSON.parse(canonicalJson) as CompanyPoolData,
    canonicalJson,
    canonicalSha256,
    rawSha256: sha256(rawText)
  };
}
