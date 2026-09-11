import { createCareerExecutionAuthorityGrantRevision } from "../../../../lib/career/relation/execution-authority-grant";
import { createT12BHistoricalFixture } from "../human-commitment/t12b-historical-fixture";

export function createT12CHistoricalFixture() {
  const t12b = createT12BHistoricalFixture();
  const grant = createCareerExecutionAuthorityGrantRevision(t12b.commitment, {
    careerHumanCommitmentId: t12b.commitment.careerHumanCommitmentId,
    grantorActorId: "GRANTOR_T12C",
    authorizedExecutionActorId: "EXECUTOR_T12C",
    executionAuthorityScope: "RECOMMENDATION_OPERATION_EXECUTION",
    permittedTargetKinds: ["PERSON", "SYSTEM"],
    permittedChannelKinds: ["EMAIL", "MESSAGE"],
    authorityEvidenceRefs: ["evidence://authority/t12c/a", "evidence://authority/t12c/b"],
    declaredAt: "2027-02-03T00:00:00.000Z",
    effectiveFrom: "2027-02-03T00:00:00.000Z",
    effectiveUntil: "2027-02-04T00:00:00.000Z",
    createdAt: "2027-02-03T00:00:00.000Z",
  });
  return { ...t12b, grant };
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
