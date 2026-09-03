import type { TargetOrganizationRevision } from "../../../organization";
import type { TargetRoleOrganizationBindingRevision } from "../../organization-binding";
import type { TargetRoleProfileRevision } from "../../profile";
import type { TargetRequirementRevision } from "../types";
export interface BoundTargetRequirementRevisionPersister { persist(revision: TargetRequirementRevision): Promise<TargetRequirementRevision>; }
export interface TargetRequirementRevisionRepository { getRevisionById(id: string): Promise<TargetRequirementRevision | null>; createTargetRequirementRevisionPersister(): BoundTargetRequirementRevisionPersister; }
/**
 * Exact lineage operands remain owned by their canonical revision repositories.
 * This contains no current-revision selection or derived organization identity.
 */
export interface TargetRequirementLineageLookup {
  getTargetRoleProfileRevisionById(id: string): Promise<TargetRoleProfileRevision | null>;
  getTargetRoleOrganizationBindingRevisionById(id: string): Promise<TargetRoleOrganizationBindingRevision | null>;
  getTargetOrganizationRevisionById(id: string): Promise<TargetOrganizationRevision | null>;
}

/** @deprecated Use TargetRequirementLineageLookup. */
export type TargetRequirementProfileLookup = TargetRequirementLineageLookup;
