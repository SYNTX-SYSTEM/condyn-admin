import type { TargetOrganizationRevision } from "../../../organization";
import type { TargetRoleOrganizationBindingRevision } from "../../organization-binding";
import type { TargetRoleProfileRevision } from "../types";
export interface BoundTargetRoleProfileRevisionPersister { persist(revision: TargetRoleProfileRevision): Promise<TargetRoleProfileRevision>; }
export interface TargetRoleProfileRevisionRepository { getRevisionById(id: string): Promise<TargetRoleProfileRevision | null>; createTargetRoleProfileRevisionPersister(): BoundTargetRoleProfileRevisionPersister; }
/** Explicit lookups prevent Profile persistence from owning organization-binding truth. */
export interface TargetRoleProfileOperandLookup { getTargetRoleOrganizationBindingRevisionById(id: string): Promise<TargetRoleOrganizationBindingRevision | null>; getTargetOrganizationRevisionById(id: string): Promise<TargetOrganizationRevision | null>; }
