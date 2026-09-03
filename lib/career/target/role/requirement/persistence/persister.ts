import { assertTargetOrganizationRevision, type TargetOrganizationRevision } from "../../../organization";
import { assertTargetRoleOrganizationBindingRevision, type TargetRoleOrganizationBindingRevision } from "../../organization-binding";
import { assertTargetRoleProfileRevision, type TargetRoleProfileRevision } from "../../profile";
import { stableTargetRequirementJson } from "../canonicalize";
import { assertTargetRequirementRevision, captureTargetRequirementRevision } from "../contract";
import type { TargetRequirementRevision } from "../types";
import type { BoundTargetRequirementRevisionPersister } from "./types";
const fail = (code: string): never => { throw new Error(code); };
/** Full canonical payload equality includes audit fields such as createdAt. */
export const sameTargetRequirementRevisionData = (a: unknown, b: unknown): boolean => stableTargetRequirementJson(a) === stableTargetRequirementJson(b);
export interface TargetRequirementRevisionPersistenceDependencies {
  getRevisionById(id: string): Promise<TargetRequirementRevision | null>;
  getTargetRoleProfileRevisionById(id: string): Promise<TargetRoleProfileRevision | null>;
  getTargetRoleOrganizationBindingRevisionById(id: string): Promise<TargetRoleOrganizationBindingRevision | null>;
  getTargetOrganizationRevisionById(id: string): Promise<TargetOrganizationRevision | null>;
  writeRevision(value: TargetRequirementRevision): Promise<void>;
  getSourceContentByProfileRevisionId?(id: string): Promise<string | null>;
}

type LineageFailures = { notFound: "ERR_TARGET_REQUIREMENT_REVISION_OPERAND_NOT_FOUND" | "ERR_TARGET_REQUIREMENT_REVISION_PARENT_INVALID"; invalid: "ERR_TARGET_REQUIREMENT_REVISION_OPERAND_INVALID" | "ERR_TARGET_REQUIREMENT_REVISION_PARENT_INVALID" };

async function resolveLineage(deps: TargetRequirementRevisionPersistenceDependencies, profileRevisionId: string, failures: LineageFailures): Promise<{ profile: TargetRoleProfileRevision; organization: TargetOrganizationRevision }> {
  let rawProfile: TargetRoleProfileRevision | null;
  try { rawProfile = await deps.getTargetRoleProfileRevisionById(profileRevisionId); } catch { return fail(failures.invalid); }
  if (rawProfile === null) return fail(failures.notFound);
  try { assertTargetRoleProfileRevision(rawProfile); } catch { return fail(failures.invalid); }
  if (rawProfile.targetRoleProfileRevisionId !== profileRevisionId) return fail(failures.invalid);
  let rawBinding: TargetRoleOrganizationBindingRevision | null;
  try { rawBinding = await deps.getTargetRoleOrganizationBindingRevisionById(rawProfile.targetRoleOrganizationBindingRevisionId); } catch { return fail(failures.invalid); }
  if (rawBinding === null) return fail(failures.notFound);
  try { assertTargetRoleOrganizationBindingRevision(rawBinding); } catch { return fail(failures.invalid); }
  if (rawBinding.targetRoleOrganizationBindingRevisionId !== rawProfile.targetRoleOrganizationBindingRevisionId || rawBinding.targetRoleEntityId !== rawProfile.targetRoleEntityId) return fail(failures.invalid);
  let rawOrganization: TargetOrganizationRevision | null;
  try { rawOrganization = await deps.getTargetOrganizationRevisionById(rawBinding.targetOrganizationRevisionId); } catch { return fail(failures.invalid); }
  if (rawOrganization === null) return fail(failures.notFound);
  try { assertTargetOrganizationRevision(rawOrganization); } catch { return fail(failures.invalid); }
  if (rawOrganization.targetOrganizationRevisionId !== rawBinding.targetOrganizationRevisionId) return fail(failures.invalid);
  return { profile: structuredClone(rawProfile), organization: structuredClone(rawOrganization) };
}
/** Exact reread checks storage integrity, not semantic equivalence or authority. */
export function createBoundTargetRequirementRevisionPersister(deps: TargetRequirementRevisionPersistenceDependencies): BoundTargetRequirementRevisionPersister { return { async persist(value) { const expected = captureTargetRequirementRevision(value); const child = await resolveLineage(deps, expected.targetRoleProfileRevisionId, { notFound: "ERR_TARGET_REQUIREMENT_REVISION_OPERAND_NOT_FOUND", invalid: "ERR_TARGET_REQUIREMENT_REVISION_OPERAND_INVALID" }); if (deps.getSourceContentByProfileRevisionId) { const source = await deps.getSourceContentByProfileRevisionId(expected.targetRoleProfileRevisionId); if (source === null || expected.evidence.some(claim => !source.includes(claim.exactQuote))) fail("ERR_TARGET_REQUIREMENT_REVISION_EVIDENCE_INVALID"); } if (expected.previousRevisionId !== null) { const raw = await deps.getRevisionById(expected.previousRevisionId); if (raw === null) fail("ERR_TARGET_REQUIREMENT_REVISION_PARENT_NOT_FOUND"); let parent: TargetRequirementRevision; try { parent = captureTargetRequirementRevision(raw); } catch { return fail("ERR_TARGET_REQUIREMENT_REVISION_PARENT_INVALID"); } if (parent.targetRequirementEntityId !== expected.targetRequirementEntityId) fail("ERR_TARGET_REQUIREMENT_REVISION_PARENT_INVALID"); const parentLineage = await resolveLineage(deps, parent.targetRoleProfileRevisionId, { notFound: "ERR_TARGET_REQUIREMENT_REVISION_PARENT_INVALID", invalid: "ERR_TARGET_REQUIREMENT_REVISION_PARENT_INVALID" }); if (child.profile.targetRoleEntityId !== parentLineage.profile.targetRoleEntityId || child.organization.targetOrganizationEntityId !== parentLineage.organization.targetOrganizationEntityId) fail("ERR_TARGET_REQUIREMENT_REVISION_PARENT_INVALID"); } await deps.writeRevision(structuredClone(expected)); let reread: TargetRequirementRevision | null; try { reread = await deps.getRevisionById(expected.targetRequirementRevisionId); } catch (error) { if (error instanceof Error && error.message === "ERR_TARGET_REQUIREMENT_REVISION_POSTGRES_RECORD_INVALID") return fail("ERR_TARGET_REQUIREMENT_REVISION_PERSISTENCE_INVALID"); throw error; } try { if (reread === null) fail("ERR_TARGET_REQUIREMENT_REVISION_PERSISTENCE_INVALID"); assertTargetRequirementRevision(reread); if (!sameTargetRequirementRevisionData(reread, expected)) fail("ERR_TARGET_REQUIREMENT_REVISION_PERSISTENCE_INVALID"); return structuredClone(reread); } catch { return fail("ERR_TARGET_REQUIREMENT_REVISION_PERSISTENCE_INVALID"); } } }; }
