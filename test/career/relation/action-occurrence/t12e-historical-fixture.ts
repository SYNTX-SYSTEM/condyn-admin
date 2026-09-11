import { createCareerActionOccurrence } from "../../../../lib/career/relation/action-occurrence";
import { createT12DHistoricalFixture } from "../execution-context-revision/t12d-historical-fixture";

/** Builds history only through the canonical T12D context and explicit T12E occurrence declaration. */
export function createT12EHistoricalFixture() {
  const t12d = createT12DHistoricalFixture();
  const occurrence = createCareerActionOccurrence(t12d.executionContext, {
    careerExecutionContextRevisionId:
      t12d.executionContext.careerExecutionContextRevisionId,
    performedByActorId: t12d.executionContext.declaredByActorId,
    occurredAt: "2027-02-03T01:00:00.000Z",
    occurrenceEvidenceRefs: ["evidence://occurrence/t12e/b", "evidence://occurrence/t12e/a"],
    externalOccurrenceRef: "external://occurrence/t12e/1",
    createdAt: "2027-02-03T01:00:01.000Z",
  });
  return { ...t12d, occurrence };
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
