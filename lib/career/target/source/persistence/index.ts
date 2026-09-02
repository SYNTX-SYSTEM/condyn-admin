export type {
  BoundTargetSourceRevisionPersister,
  TargetSourceRevisionRepository
} from "./types";
export { InMemoryTargetSourceRevisionRepository } from "./in-memory";
export {
  createBoundTargetSourceRevisionPersister,
  sameTargetSourceRevisionData
} from "./persister";
