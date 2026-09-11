import { createCareerExecutionContextRevision } from "../../../../lib/career/relation/execution-context-revision";
import { createT12CHistoricalFixture } from "../execution-authority-grant/t12c-historical-fixture";

/** Canonical T12D history is constructed through the committed T12C EAGR only. */
export function createT12DHistoricalFixture() {
  const t12c = createT12CHistoricalFixture();
  const executionContext = createCareerExecutionContextRevision(t12c.grant, {
    careerExecutionAuthorityGrantRevisionId:
      t12c.grant.careerExecutionAuthorityGrantRevisionId,
    declaredByActorId: t12c.grant.authorizedExecutionActorId,
    executionTarget: { targetKind: "PERSON", targetRef: "target://person/t12d/1" },
    executionChannel: { channelKind: "EMAIL", channelRef: "channel://email/t12d/1" },
    declaredAt: t12c.grant.effectiveFrom,
    contextEvidenceRefs: ["evidence://context/t12d/b", "evidence://context/t12d/a"],
    createdAt: "2027-02-03T00:00:00.000Z",
  });
  return { ...t12c, executionContext };
}

export function exactRepository(value: any | null, idField: string, method: string) {
  const calls: string[] = [];
  return {
    calls,
    async [method](id: string) {
      calls.push(id);
      return value !== null && value[idField] === id ? structuredClone(value) : null;
    },
  };
}
