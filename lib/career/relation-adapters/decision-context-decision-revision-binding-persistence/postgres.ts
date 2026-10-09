import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  assertCareerDecisionContextDecisionRevisionBinding,
  stableCareerDecisionContextDecisionRevisionBinding,
  type CareerDecisionContextDecisionRevisionBinding,
} from "../../relation/decision-context-decision-revision-binding";
import { careerDecisionContextDecisionRevisionBindings } from "./postgres-schema";

const failed = "ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_PERSISTENCE_FAILED";
const conflict = "ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_IMMUTABLE_CONFLICT";
const fail = (code: string): never => { throw new Error(code); };
const same = (left: unknown, right: unknown) =>
  stableCareerDecisionContextDecisionRevisionBinding(left) === stableCareerDecisionContextDecisionRevisionBinding(right);

export interface CareerDecisionContextDecisionRevisionBindingRepository {
  getCareerDecisionContextDecisionRevisionBindingById(id: string): Promise<CareerDecisionContextDecisionRevisionBinding | null>;
  persistCareerDecisionContextDecisionRevisionBinding(
    binding: CareerDecisionContextDecisionRevisionBinding,
  ): Promise<CareerDecisionContextDecisionRevisionBinding>;
}

/** Durable captured binding witness only; it neither resolves nor refreshes either bound side. */
export class PostgresCareerDecisionContextDecisionRevisionBindingRepository
implements CareerDecisionContextDecisionRevisionBindingRepository {
  constructor(private readonly database: PostgresJsDatabase<any>) {}

  private async existing(id: string): Promise<CareerDecisionContextDecisionRevisionBinding | null> {
    const rows = await this.database.select().from(careerDecisionContextDecisionRevisionBindings)
      .where(eq(careerDecisionContextDecisionRevisionBindings.careerDecisionContextDecisionRevisionBindingId, id)).limit(1);
    if (rows.length === 0) return null;
    const row = rows[0];
    const value = structuredClone(row.payload);
    assertCareerDecisionContextDecisionRevisionBinding(value);
    if (
      row.careerDecisionContextDecisionRevisionBindingId !== id ||
      row.careerDecisionContextDecisionRevisionBindingId !== value.careerDecisionContextDecisionRevisionBindingId ||
      row.careerDecisionContextRevisionId !== value.careerDecisionContextRevision.careerDecisionContextRevisionId ||
      row.decisionContextRevisionId !== value.decisionContextRevision.revisionId ||
      row.recommendationProposalId !== value.recommendationProposalWitness.artifactId ||
      row.schemaVersion !== value.schemaVersion || row.createdAt !== value.createdAt
    ) fail(failed);
    return structuredClone(value);
  }

  async getCareerDecisionContextDecisionRevisionBindingById(id: string): Promise<CareerDecisionContextDecisionRevisionBinding | null> {
    try { return await this.existing(id); } catch { return fail(failed); }
  }

  async persistCareerDecisionContextDecisionRevisionBinding(
    value: CareerDecisionContextDecisionRevisionBinding,
  ): Promise<CareerDecisionContextDecisionRevisionBinding> {
    try { assertCareerDecisionContextDecisionRevisionBinding(value); } catch { return fail(failed); }
    try {
      const stored = await this.existing(value.careerDecisionContextDecisionRevisionBindingId);
      if (stored) {
        if (!same(stored, value)) fail(conflict);
        return stored;
      }
    } catch (error) {
      if (error instanceof Error && error.message === conflict) throw error;
      return fail(failed);
    }
    try {
      await this.database.transaction(async transaction => {
        await transaction.insert(careerDecisionContextDecisionRevisionBindings).values({
          careerDecisionContextDecisionRevisionBindingId: value.careerDecisionContextDecisionRevisionBindingId,
          careerDecisionContextRevisionId: value.careerDecisionContextRevision.careerDecisionContextRevisionId,
          decisionContextRevisionId: value.decisionContextRevision.revisionId,
          recommendationProposalId: value.recommendationProposalWitness.artifactId,
          schemaVersion: value.schemaVersion,
          createdAt: value.createdAt,
          payload: structuredClone(value),
        }).onConflictDoNothing();
      });
    } catch { return fail(failed); }
    let reread: CareerDecisionContextDecisionRevisionBinding | null;
    try { reread = await this.existing(value.careerDecisionContextDecisionRevisionBindingId); } catch { return fail(failed); }
    const persisted = reread ?? fail(failed);
    if (!same(persisted, value)) fail(conflict);
    return persisted;
  }
}
