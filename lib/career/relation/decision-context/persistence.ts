import { assertCareerDecisionContextRevision, sameCareerDecisionContext } from "./contract";
import type { CareerDecisionContextRevision } from "./types";

const fail = (code: string): never => { throw new Error(code); };

export interface CareerDecisionContextRevisionRepository {
  getCareerDecisionContextRevisionById(id: string): Promise<CareerDecisionContextRevision | null>;
  persistCareerDecisionContextRevision(value: CareerDecisionContextRevision): Promise<CareerDecisionContextRevision>;
}

export class InMemoryCareerDecisionContextRevisionRepository implements CareerDecisionContextRevisionRepository {
  readonly #values = new Map<string, CareerDecisionContextRevision>();

  async getCareerDecisionContextRevisionById(id: string): Promise<CareerDecisionContextRevision | null> {
    const value = this.#values.get(id);
    if (!value) return null;
    try {
      assertCareerDecisionContextRevision(value);
      return structuredClone(value);
    } catch {
      return fail("ERR_CAREER_DECISION_CONTEXT_PERSISTENCE_FAILED");
    }
  }

  async persistCareerDecisionContextRevision(value: CareerDecisionContextRevision): Promise<CareerDecisionContextRevision> {
    assertCareerDecisionContextRevision(value);
    const existing = await this.getCareerDecisionContextRevisionById(value.careerDecisionContextRevisionId);
    if (existing && !sameCareerDecisionContext(existing, value)) fail("ERR_CAREER_DECISION_CONTEXT_IMMUTABLE_CONFLICT");
    if (!existing) this.#values.set(value.careerDecisionContextRevisionId, structuredClone(value));
    return (await this.getCareerDecisionContextRevisionById(value.careerDecisionContextRevisionId))!;
  }
}
