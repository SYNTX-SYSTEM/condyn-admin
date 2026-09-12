import { createCareerStateChangeDeclaration } from "../../../../lib/career/relation/state-change-declaration";
import { createT12EHistoricalFixture } from "../action-occurrence/t12e-historical-fixture";

/** Builds canonical history through the explicit T12F state-change declaration. */
export function createT12FHistoricalFixture() {
  const t12e = createT12EHistoricalFixture();
  const stateChangeDeclaration = createCareerStateChangeDeclaration(t12e.occurrence, {
    careerActionOccurrenceId: t12e.occurrence.careerActionOccurrenceId,
    observedByActorId: "OBSERVER_T12F",
    stateSubject: { subjectKind: "EXTERNAL_RESOURCE", subjectRef: "state://application/t12f/1" },
    stateDimension: "application-status",
    beforeObservation: { observationState: "OBSERVED", value: "applied" },
    afterObservation: { observationState: "OBSERVED", value: "interview-invited" },
    // Observation is deliberately after EAGR expiry: SCD observes history;
    // EAGR authority is evaluated at the predecessor AOC occurrence time.
    observedAt: "2027-02-04T01:00:00.000Z",
    stateChangeEvidenceRefs: ["evidence://state-change/t12f/b", "evidence://state-change/t12f/a"],
    externalStateRef: {
      producerId: "producer-t12f",
      authorityContractId: "contract-t12f",
      artifactId: "artifact-t12f",
      locator: "locator-t12f",
    },
    createdAt: "2027-02-04T01:00:01.000Z",
  });
  return { ...t12e, stateChangeDeclaration };
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
