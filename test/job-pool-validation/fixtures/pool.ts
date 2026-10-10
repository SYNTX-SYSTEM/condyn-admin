/**
 * PINK validation fixtures for the Job Pool connection (JOB_POOL_CONNECTION.md §3).
 *
 * The pool is written against the documented upload format only: `CompanyPoolData`
 * (`lib/career/matching/pool.ts`) plus the three additive requirement fields
 * `aliases`, `necessity` and `requirement_type`. Nothing here depends on the
 * implementation module; every expectation derives from the contract document and
 * from GELB's adopted design decisions C1..C7 (2026-10-10).
 */

export const VALIDATION_POOL_ID = "pool_pink_validation_v1";

/** Requirements chosen so that one analysis exercises EXACT, ALIAS, weak evidence and missing. */
export const validationPool = {
  pool: {
    id: VALIDATION_POOL_ID,
    name: "PINK validation pool",
    description: "Deterministic pool for the independent Job Pool validation field.",
    version: 1,
    status: "ACTIVE",
    created_at: "2026-10-10T00:00:00.000Z"
  },
  organizations: [
    {
      id: "org_pink_alpha",
      pool_id: VALIDATION_POOL_ID,
      org_id: "ALPHA",
      name: "Alpha Industrial Systems",
      country_iso: "DE",
      region: "Bavaria",
      industry: "Industrial automation",
      scale: "ENTERPRISE",
      description: "Edge and automation platforms."
    },
    {
      id: "org_pink_beta",
      pool_id: VALIDATION_POOL_ID,
      org_id: "BETA",
      name: "Beta Cloud GmbH",
      country_iso: "DE",
      region: "Berlin",
      industry: "Cloud software",
      scale: "SCALEUP",
      description: "Cloud platform engineering."
    }
  ],
  roles: [
    {
      id: "role_pink_alpha_architect",
      pool_id: VALIDATION_POOL_ID,
      organization_id: "org_pink_alpha",
      title: "Distributed Systems Architect",
      seniority: "SENIOR",
      domain_focus: "Industrial edge platforms",
      description: "Designs resilient distributed control platforms."
    },
    {
      id: "role_pink_beta_platform",
      pool_id: VALIDATION_POOL_ID,
      organization_id: "org_pink_beta",
      title: "Platform Engineer",
      seniority: "MID",
      domain_focus: "Cloud infrastructure",
      description: "Operates Kubernetes based platforms."
    },
    {
      id: "role_pink_beta_empty",
      pool_id: VALIDATION_POOL_ID,
      organization_id: "org_pink_beta",
      title: "Role Without Requirements",
      seniority: "JUNIOR",
      domain_focus: "Unspecified",
      description: "A role that declares no requirement at all."
    }
  ],
  requirements: [
    {
      id: "req_pink_alpha_1",
      role_id: "role_pink_alpha_architect",
      capability_name: "Distributed Systems Architecture",
      domain: "Architecture",
      weight: 1.0,
      required_level: "L5 expert",
      evidence_hint: "Reference architectures delivered to production.",
      necessity: "REQUIRED",
      requirement_type: "CAPABILITY"
    },
    {
      id: "req_pink_alpha_2",
      role_id: "role_pink_alpha_architect",
      capability_name: "Edge Computing",
      domain: "Infrastructure",
      weight: 0.6,
      required_level: "advanced",
      necessity: "PREFERRED"
    },
    {
      id: "req_pink_alpha_3",
      role_id: "role_pink_alpha_architect",
      capability_name: "Industrial IoT Protocol Design",
      domain: "Protocols",
      weight: 0.4,
      required_level: ""
    },
    {
      id: "req_pink_beta_1",
      role_id: "role_pink_beta_platform",
      capability_name: "Kubernetes Orchestration",
      domain: "Infrastructure",
      weight: 0.9,
      required_level: "L4",
      aliases: ["k8s", "Kubernetes"],
      necessity: "REQUIRED",
      requirement_type: "TOOL_TECHNOLOGY"
    },
    {
      id: "req_pink_beta_2",
      role_id: "role_pink_beta_platform",
      capability_name: "German Language",
      domain: "Language",
      weight: 0.2,
      required_level: "C1",
      necessity: "OPTIONAL",
      requirement_type: "LANGUAGE"
    }
  ]
} as const;

export type ValidationPool = typeof validationPool;

/** Deep-clone with mutable types for negative variants. */
export function clonePool(): {
  pool: Record<string, unknown>;
  organizations: Array<Record<string, unknown>>;
  roles: Array<Record<string, unknown>>;
  requirements: Array<Record<string, unknown>>;
} {
  return JSON.parse(JSON.stringify(validationPool));
}

export function draftPool() {
  const pool = clonePool();
  pool.pool.id = "pool_pink_validation_draft";
  pool.pool.status = "DRAFT";
  return pool;
}

export function poolWithRoleToUnknownOrganization() {
  const pool = clonePool();
  pool.roles[0].organization_id = "org_does_not_exist";
  return pool;
}

export function poolWithRequirementToUnknownRole() {
  const pool = clonePool();
  pool.requirements[0].role_id = "role_does_not_exist";
  return pool;
}

export function poolWithDuplicateRoleId() {
  const pool = clonePool();
  pool.roles[1].id = pool.roles[0].id;
  return pool;
}

export function poolWithInvalidWeight() {
  const pool = clonePool();
  pool.requirements[0].weight = 1.5;
  return pool;
}

/** Same semantic content as `validationPool`, but with every object's keys in reverse order. */
export function reorderKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(reorderKeysDeep);
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).reverse();
    return Object.fromEntries(entries.map(([key, inner]) => [key, reorderKeysDeep(inner)]));
  }
  return value;
}

/** Key-sorted JSON without whitespace: the canonical byte form PINK assumes for `canonicalSha256`. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalJson((value as Record<string, unknown>)[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
