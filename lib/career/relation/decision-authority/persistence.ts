import { assertDecisionAuthorityGrantRevision, sameDecisionAuthorityGrant } from "./contract";
import type { DecisionAuthorityGrantRevision } from "./types";

const fail = (code: string): never => { throw new Error(code); };

export interface DecisionAuthorityGrantRevisionRepository {
  getDecisionAuthorityGrantRevisionById(id: string): Promise<DecisionAuthorityGrantRevision | null>;
  persistDecisionAuthorityGrantRevision(value: DecisionAuthorityGrantRevision): Promise<DecisionAuthorityGrantRevision>;
}

export class InMemoryDecisionAuthorityGrantRevisionRepository implements DecisionAuthorityGrantRevisionRepository {
  readonly #values = new Map<string, DecisionAuthorityGrantRevision>();

  async getDecisionAuthorityGrantRevisionById(id: string): Promise<DecisionAuthorityGrantRevision | null> {
    const value = this.#values.get(id);
    if (!value) return null;
    try {
      assertDecisionAuthorityGrantRevision(value);
      return structuredClone(value);
    } catch {
      return fail("ERR_DECISION_AUTHORITY_GRANT_PERSISTENCE_FAILED");
    }
  }

  async persistDecisionAuthorityGrantRevision(value: DecisionAuthorityGrantRevision): Promise<DecisionAuthorityGrantRevision> {
    assertDecisionAuthorityGrantRevision(value);
    const existing = await this.getDecisionAuthorityGrantRevisionById(value.decisionAuthorityGrantRevisionId);
    if (existing && !sameDecisionAuthorityGrant(existing, value)) fail("ERR_DECISION_AUTHORITY_GRANT_IMMUTABLE_CONFLICT");
    if (!existing) this.#values.set(value.decisionAuthorityGrantRevisionId, structuredClone(value));
    return (await this.getDecisionAuthorityGrantRevisionById(value.decisionAuthorityGrantRevisionId))!;
  }
}
