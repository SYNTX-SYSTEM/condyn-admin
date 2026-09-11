import { assertHumanDecisionRecord, sameHumanDecision } from "./contract";
import type { HumanDecisionRecord } from "./types";
const fail = (code: string): never => { throw new Error(code); };
export interface HumanDecisionRecordRepository { getHumanDecisionRecordById(id: string): Promise<HumanDecisionRecord | null>; persistHumanDecisionRecord(value: HumanDecisionRecord): Promise<HumanDecisionRecord>; }
export class InMemoryHumanDecisionRecordRepository implements HumanDecisionRecordRepository {
  readonly #values = new Map<string, HumanDecisionRecord>();
  async getHumanDecisionRecordById(id: string) { const value = this.#values.get(id); if (!value) return null; try { assertHumanDecisionRecord(value); return structuredClone(value); } catch { return fail("ERR_HUMAN_DECISION_PERSISTENCE_FAILED"); } }
  async persistHumanDecisionRecord(value: HumanDecisionRecord) { assertHumanDecisionRecord(value); const existing = await this.getHumanDecisionRecordById(value.humanDecisionRecordId); if (existing && !sameHumanDecision(existing, value)) fail("ERR_HUMAN_DECISION_IMMUTABLE_CONFLICT"); if (!existing) this.#values.set(value.humanDecisionRecordId, structuredClone(value)); return (await this.getHumanDecisionRecordById(value.humanDecisionRecordId))!; }
}
