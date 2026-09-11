import { createCareerHumanCommitment } from "../../../../lib/career/relation/human-commitment";
import { createT12AHistoricalFixture } from "../action-intent/t12a-historical-fixture";

export function createT12BHistoricalFixture() {
  const t12a = createT12AHistoricalFixture();
  const commitment = createCareerHumanCommitment(t12a.actionIntent, {
    careerDecisionActionIntentId: t12a.actionIntent.careerDecisionActionIntentId,
    committedByActorId: t12a.actionIntent.declaredByActorId,
    committedAt: "2027-02-03T00:00:00.000Z",
    commitmentEvidenceRefs: ["evidence://commitment/t12b"],
    createdAt: "2027-02-03T00:00:00.000Z",
  });
  return { ...t12a, commitment };
}

export function exactRepository(value: any | null, idField: string, method: string) {
  const calls: string[] = [];
  return { calls, async [method](id: string) { calls.push(id); return value !== null && value[idField] === id ? structuredClone(value) : null; } };
}
