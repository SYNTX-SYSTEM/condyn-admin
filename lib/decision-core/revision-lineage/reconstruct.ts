import { assertDecisionContextRevision, type DecisionContextRevision } from "../revisions";
import type { BoundDecisionContextRevisionLineageReconstructor, DecisionContextRevisionLineage } from "./types";

const fail = (code: string): never => { throw new Error(code); };
const DREV = /^DREV_[0-9A-F]{24}$/;
type Captured = null | boolean | number | string | Captured[] | { [key: string]: Captured };

function capture(value: unknown, code: string, ancestors: WeakSet<object> = new WeakSet<object>()): Captured {
  try {
    if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
    if (typeof value !== "object" || ancestors.has(value)) return fail(code);
    ancestors.add(value);
    try {
      if (Array.isArray(value)) {
        const keys = Reflect.ownKeys(value); const descriptor = Reflect.getOwnPropertyDescriptor(value, "length");
        const length = descriptor !== undefined && "value" in descriptor ? descriptor.value : undefined;
        if (typeof length !== "number" || !Number.isSafeInteger(length) || length < 0 || keys.length !== length + 1 || !keys.includes("length") || keys.some((key) => typeof key === "symbol" || (key !== "length" && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= length)))) return fail(code);
        const result: Captured[] = [];
        for (let index = 0; index < length; index += 1) {
          const item = Reflect.getOwnPropertyDescriptor(value, String(index));
          if (item === undefined || item.enumerable !== true || !("value" in item)) return fail(code);
          result.push(capture(item.value, code, ancestors));
        }
        return result;
      }
      const result: { [key: string]: Captured } = {};
      for (const key of Reflect.ownKeys(value)) {
        if (typeof key !== "string") return fail(code);
        const descriptor = Reflect.getOwnPropertyDescriptor(value, key);
        if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail(code);
        Object.defineProperty(result, key, { value: capture(descriptor.value, code, ancestors), enumerable: true, writable: true, configurable: true });
      }
      return result;
    } finally { ancestors.delete(value); }
  } catch { return fail(code); }
}

function captureReader(value: unknown): (revisionId: string) => Promise<DecisionContextRevision | null> {
  try {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return fail("ERR_DECISION_CONTEXT_REVISION_LINEAGE_READER_INVALID");
    const keys = Reflect.ownKeys(value);
    if (keys.length !== 1 || keys[0] !== "getRevisionById") return fail("ERR_DECISION_CONTEXT_REVISION_LINEAGE_READER_INVALID");
    const descriptor = Reflect.getOwnPropertyDescriptor(value, "getRevisionById");
    if (descriptor === undefined || !("value" in descriptor) || typeof descriptor.value !== "function") return fail("ERR_DECISION_CONTEXT_REVISION_LINEAGE_READER_INVALID");
    return descriptor.value.bind(value) as (revisionId: string) => Promise<DecisionContextRevision | null>;
  } catch { return fail("ERR_DECISION_CONTEXT_REVISION_LINEAGE_READER_INVALID"); }
}

function captureRevision(value: unknown, requestedRevisionId: string): DecisionContextRevision {
  try {
    const revision = capture(value, "ERR_DECISION_CONTEXT_REVISION_LINEAGE_REVISION_INVALID") as unknown as DecisionContextRevision;
    assertDecisionContextRevision(revision);
    if (revision.revisionId !== requestedRevisionId) return fail("ERR_DECISION_CONTEXT_REVISION_LINEAGE_REVISION_INVALID");
    return revision;
  } catch { return fail("ERR_DECISION_CONTEXT_REVISION_LINEAGE_REVISION_INVALID"); }
}

/** Binds one exact read capability for complete-or-error explicit predecessor-chain reconstruction. */
export function createBoundDecisionContextRevisionLineageReconstructor(reader: { getRevisionById(revisionId: string): Promise<DecisionContextRevision | null> }): BoundDecisionContextRevisionLineageReconstructor {
  const getRevisionById = captureReader(reader);
  return {
    async reconstruct(startRevisionId: string): Promise<DecisionContextRevisionLineage> {
      if (typeof startRevisionId !== "string" || !DREV.test(startRevisionId)) fail("ERR_DECISION_CONTEXT_REVISION_LINEAGE_START_ID_INVALID");
      const visited = new Set<string>();
      const reverse: DecisionContextRevision[] = [];
      let currentRevisionId = startRevisionId;
      let first = true;
      while (true) {
        if (visited.has(currentRevisionId)) fail("ERR_DECISION_CONTEXT_REVISION_LINEAGE_CYCLE");
        visited.add(currentRevisionId);
        const returned = await getRevisionById(currentRevisionId);
        if (returned === null) fail(first ? "ERR_DECISION_CONTEXT_REVISION_LINEAGE_START_NOT_FOUND" : "ERR_DECISION_CONTEXT_REVISION_LINEAGE_PREDECESSOR_NOT_FOUND");
        const revision = captureRevision(returned, currentRevisionId);
        reverse.push(revision);
        if (revision.previousRevisionId === null) break;
        currentRevisionId = revision.previousRevisionId;
        first = false;
      }
      const revisions = reverse.reverse();
      return structuredClone({ startRevisionId, rootRevisionId: revisions[0].revisionId, revisions });
    }
  };
}
