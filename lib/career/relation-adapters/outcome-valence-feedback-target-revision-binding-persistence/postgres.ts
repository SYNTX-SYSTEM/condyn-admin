import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  assertCareerOutcomeValenceFeedbackTargetRevisionBinding,
  stableCareerOutcomeValenceFeedbackTargetRevisionBinding,
  type CareerOutcomeValenceFeedbackTargetRevisionBinding,
} from "../../relation/outcome-valence-feedback-target-revision-binding";
import { careerOutcomeValenceFeedbackTargetRevisionBindings } from "./postgres-schema";

const failed = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_PERSISTENCE_FAILED";
const conflict = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_IMMUTABLE_CONFLICT";
const fail = (code: string): never => { throw new Error(code); };
const same = (left: unknown, right: unknown) =>
  stableCareerOutcomeValenceFeedbackTargetRevisionBinding(left) === stableCareerOutcomeValenceFeedbackTargetRevisionBinding(right);

export interface CareerOutcomeValenceFeedbackTargetRevisionBindingRepository {
  getCareerOutcomeValenceFeedbackTargetRevisionBindingById(
    careerOutcomeValenceFeedbackTargetRevisionBindingId: string,
  ): Promise<CareerOutcomeValenceFeedbackTargetRevisionBinding | null>;
  persistCareerOutcomeValenceFeedbackTargetRevisionBinding(
    binding: CareerOutcomeValenceFeedbackTargetRevisionBinding,
  ): Promise<CareerOutcomeValenceFeedbackTargetRevisionBinding>;
}

/** Durable captured binding witness only; it neither resolves nor refreshes the prospective target. */
export class PostgresCareerOutcomeValenceFeedbackTargetRevisionBindingRepository
implements CareerOutcomeValenceFeedbackTargetRevisionBindingRepository {
  constructor(private readonly database: PostgresJsDatabase<any>) {}

  private async existing(id: string): Promise<CareerOutcomeValenceFeedbackTargetRevisionBinding | null> {
    const rows = await this.database.select().from(careerOutcomeValenceFeedbackTargetRevisionBindings)
      .where(eq(careerOutcomeValenceFeedbackTargetRevisionBindings.careerOutcomeValenceFeedbackTargetRevisionBindingId, id)).limit(1);
    if (rows.length === 0) return null;
    const row = rows[0];
    const value = structuredClone(row.payload);
    assertCareerOutcomeValenceFeedbackTargetRevisionBinding(value);
    if (
      row.careerOutcomeValenceFeedbackTargetRevisionBindingId !== id ||
      row.careerOutcomeValenceFeedbackTargetRevisionBindingId !== value.careerOutcomeValenceFeedbackTargetRevisionBindingId ||
      row.careerOutcomeValenceFeedbackTargetDeclarationId !== value.careerOutcomeValenceFeedbackTargetDeclaration.careerOutcomeValenceFeedbackTargetDeclarationId ||
      row.targetCareerDecisionContextRevisionId !== value.targetCareerDecisionContextRevision.careerDecisionContextRevisionId ||
      row.schemaVersion !== value.schemaVersion || row.createdAt !== value.createdAt
    ) fail(failed);
    return structuredClone(value);
  }

  async getCareerOutcomeValenceFeedbackTargetRevisionBindingById(id: string): Promise<CareerOutcomeValenceFeedbackTargetRevisionBinding | null> {
    try { return await this.existing(id); } catch { return fail(failed); }
  }

  async persistCareerOutcomeValenceFeedbackTargetRevisionBinding(value: CareerOutcomeValenceFeedbackTargetRevisionBinding): Promise<CareerOutcomeValenceFeedbackTargetRevisionBinding> {
    try { assertCareerOutcomeValenceFeedbackTargetRevisionBinding(value); } catch { return fail(failed); }
    try {
      const stored = await this.existing(value.careerOutcomeValenceFeedbackTargetRevisionBindingId);
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
        await transaction.insert(careerOutcomeValenceFeedbackTargetRevisionBindings).values({
          careerOutcomeValenceFeedbackTargetRevisionBindingId: value.careerOutcomeValenceFeedbackTargetRevisionBindingId,
          careerOutcomeValenceFeedbackTargetDeclarationId: value.careerOutcomeValenceFeedbackTargetDeclaration.careerOutcomeValenceFeedbackTargetDeclarationId,
          targetCareerDecisionContextRevisionId: value.targetCareerDecisionContextRevision.careerDecisionContextRevisionId,
          schemaVersion: value.schemaVersion,
          createdAt: value.createdAt,
          payload: structuredClone(value),
        }).onConflictDoNothing();
      });
    } catch { return fail(failed); }
    let reread: CareerOutcomeValenceFeedbackTargetRevisionBinding | null;
    try { reread = await this.existing(value.careerOutcomeValenceFeedbackTargetRevisionBindingId); } catch { return fail(failed); }
    if (!reread || !same(reread, value)) fail(failed);
    return reread;
  }
}
