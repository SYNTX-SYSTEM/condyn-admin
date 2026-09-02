export type {
  BoundTargetRoleSourceBindingRevisionPersister,
  TargetRoleSourceBindingRevisionRepository,
  TargetRoleSourceBindingSourceRevisionLookup
} from "./types";
export { InMemoryTargetRoleSourceBindingRevisionRepository } from "./in-memory";
export {
  createBoundTargetRoleSourceBindingRevisionPersister,
  sameTargetRoleSourceBindingRevisionData
} from "./persister";
