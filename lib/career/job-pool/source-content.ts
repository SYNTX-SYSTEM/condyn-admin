import type { CompanyPoolData, PoolCapabilityRequirement, PoolOrganization, PoolRole } from "../matching/pool";

/**
 * Deterministic, line-based rendering of one uploaded pool as ONE Target Source document (sourceKind DOCUMENT).
 * Every line is scoped by a declared pool id; values are normalized like canonical target text (NFC, whitespace
 * collapsed), lines are joined with LF and carry no trailing spaces. Evidence quotes are exact lines of this text.
 */
export const JOB_POOL_SOURCE_NORMALIZATION_VERSION = "JOB_POOL_SOURCE_RENDERING_V1";
export const JOB_POOL_SOURCE_KIND = "DOCUMENT";

export const normalizeValue = (value: string): string => value.normalize("NFC").replace(/\r\n?/g, "\n").replace(/\s+/gu, " ").trim();

const line = (prefix: string, value: string) => `${prefix}: ${normalizeValue(value)}`.trimEnd();

export const roleLine = (role: PoolRole) => line(`ROLE ${role.id}`, role.title);
export const roleFieldLine = (role: PoolRole, field: string, value: string) => line(`ROLE ${role.id} ${field}`, value);
export const requirementLine = (requirement: PoolCapabilityRequirement) => line(`REQUIREMENT ${requirement.id}`, requirement.capability_name);
export const requirementFieldLine = (requirement: PoolCapabilityRequirement, field: string, value: string) =>
  line(`REQUIREMENT ${requirement.id} ${field}`, value);

export const requirementsOfRole = (pool: CompanyPoolData, role: PoolRole): PoolCapabilityRequirement[] =>
  pool.requirements.filter(requirement => requirement.role_id === role.id);

export const organizationOfRole = (pool: CompanyPoolData, role: PoolRole): PoolOrganization => {
  const organization = pool.organizations.find(item => item.id === role.organization_id);
  if (!organization) throw new Error(`ERR_JOB_POOL_REFERENCE_INVALID: unknown organization ${role.organization_id}`);
  return organization;
};

export function renderPoolSourceContent(pool: CompanyPoolData): string {
  const lines = [
    "CONDYN JOB POOL SOURCE V1",
    `POOL ${pool.pool.id}: ${normalizeValue(pool.pool.name)} | VERSION: ${pool.pool.version} | STATUS: ${pool.pool.status}`,
    line(`POOL ${pool.pool.id} DESCRIPTION`, pool.pool.description)
  ];
  for (const organization of pool.organizations) {
    lines.push(`ORGANIZATION ${organization.id}: ${normalizeValue(organization.name)} | INDUSTRY: ${normalizeValue(organization.industry)} | COUNTRY: ${normalizeValue(organization.country_iso)} | REGION: ${normalizeValue(organization.region)} | SCALE: ${normalizeValue(organization.scale)}`.trimEnd());
    lines.push(line(`ORGANIZATION ${organization.id} DESCRIPTION`, organization.description));
  }
  for (const role of pool.roles) {
    lines.push(roleLine(role));
    lines.push(roleFieldLine(role, "ORGANIZATION", role.organization_id));
    lines.push(roleFieldLine(role, "SENIORITY", role.seniority));
    lines.push(roleFieldLine(role, "DOMAIN FOCUS", role.domain_focus));
    lines.push(roleFieldLine(role, "DESCRIPTION", role.description));
    for (const requirement of requirementsOfRole(pool, role)) {
      lines.push(requirementLine(requirement));
      lines.push(requirementFieldLine(requirement, "ROLE", requirement.role_id));
      lines.push(requirementFieldLine(requirement, "DOMAIN", requirement.domain));
      lines.push(requirementFieldLine(requirement, "REQUIRED LEVEL", requirement.required_level));
      lines.push(requirementFieldLine(requirement, "NECESSITY", requirement.necessity ?? "UNDECLARED"));
      lines.push(requirementFieldLine(requirement, "TYPE", requirement.requirement_type ?? "CAPABILITY"));
      lines.push(requirementFieldLine(requirement, "WEIGHT", String(requirement.weight)));
      lines.push(requirementFieldLine(requirement, "ALIASES", (requirement.aliases ?? []).map(normalizeValue).join("; ")));
      lines.push(requirementFieldLine(requirement, "EVIDENCE HINT", requirement.evidence_hint ?? ""));
    }
  }
  return lines.join("\n");
}
