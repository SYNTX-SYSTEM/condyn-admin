export type {
  TargetSourceEntity,
  TargetSourceRevision,
  TargetSourceRevisionInput
} from "./types";
export {
  createTargetSourceEntity,
  createTargetSourceRevision,
  assertTargetSourceRevision
} from "./contract";
export { deriveTargetSourceRevisionId } from "./identity";
export * from "./persistence";
