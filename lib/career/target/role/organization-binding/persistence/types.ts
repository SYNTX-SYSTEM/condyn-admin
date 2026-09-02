import type { TargetOrganizationRevision } from "../../../organization";
import type { TargetRoleSourceBindingRevision } from "../../source-binding";
import type { TargetRoleOrganizationBindingRevision } from "../types";
export interface BoundTargetRoleOrganizationBindingRevisionPersister { persist(revision: TargetRoleOrganizationBindingRevision): Promise<TargetRoleOrganizationBindingRevision>; }
export interface TargetRoleOrganizationBindingRevisionRepository { getRevisionById(id: string): Promise<TargetRoleOrganizationBindingRevision | null>; createTargetRoleOrganizationBindingRevisionPersister(): BoundTargetRoleOrganizationBindingRevisionPersister; }
/** Explicit operand composition prevents this Binding core from owning Role or Organization truth. */
export interface TargetRoleOrganizationBindingOperandLookup { getTargetRoleSourceBindingRevisionById(id: string): Promise<TargetRoleSourceBindingRevision | null>; getTargetOrganizationRevisionById(id: string): Promise<TargetOrganizationRevision | null>; }
