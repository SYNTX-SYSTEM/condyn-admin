export type {
  TargetOrganizationEntity,
  TargetOrganizationRevision,
  TargetOrganizationRevisionInput
} from "./types";
export {
  createTargetOrganizationEntity,
  createTargetOrganizationRevision,
  assertTargetOrganizationRevision
} from "./contract";
export { deriveTargetOrganizationRevisionId } from "./identity";
export * from "./persistence";
