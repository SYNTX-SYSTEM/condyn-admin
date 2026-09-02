export type {
  BoundTargetOrganizationRevisionPersister,
  TargetOrganizationRevisionRepository
} from "./types";
export { InMemoryTargetOrganizationRevisionRepository } from "./in-memory";
export {
  createBoundTargetOrganizationRevisionPersister,
  sameTargetOrganizationRevisionData
} from "./persister";
