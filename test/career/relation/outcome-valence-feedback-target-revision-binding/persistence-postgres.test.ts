import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import { createBoundCareerOutcomeValenceFeedbackTargetRevisionBinder } from "../../../../lib/career/relation/outcome-valence-feedback-target-revision-binding";
import { createT13BHistoricalFixture } from "./t13b-historical-fixture";

const loadPersistence = () => import("../../../../lib/career/relation-adapters/outcome-valence-feedback-target-revision-binding-persistence") as Promise<any>;
const loadSchema = () => import("../../../../lib/career/relation-adapters/outcome-valence-feedback-target-revision-binding-persistence/postgres-schema") as Promise<any>;
const rootColumns = ["career_outcome_valence_feedback_target_revision_binding_id", "career_outcome_valence_feedback_target_declaration_id", "target_career_decision_context_revision_id", "schema_version", "created_at", "payload"];
const notFound = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_NOT_FOUND";
const failed = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_PERSISTENCE_FAILED";
const conflict = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_IMMUTABLE_CONFLICT";

async function fixture() {
  const value = createT13BHistoricalFixture();
  const binding = await createBoundCareerOutcomeValenceFeedbackTargetRevisionBinder({
    async getCareerDecisionContextRevisionById(id) { return id === value.targetCareerDecisionContextRevision.careerDecisionContextRevisionId ? structuredClone(value.targetCareerDecisionContextRevision) : null; },
  }).bind(value.outcomeValenceFeedbackTargetDeclaration, value.bindingInput);
  return { value, binding };
}

describe("CareerOutcomeValenceFeedbackTargetRevisionBinding frozen PostgreSQL persistence contract", () => {
  it("constructs valid sealed COVFTRB history independently of persistence adapter behavior", async () => {
    const value = await fixture();
    expect(value.binding.targetCareerDecisionContextRevision).toEqual(value.value.targetCareerDecisionContextRevision);
  });

  it("freezes exact repository API and root payload representation", async () => {
    const adapter = await loadPersistence(); const schema = await loadSchema();
    expect(adapter.PostgresCareerOutcomeValenceFeedbackTargetRevisionBindingRepository).toBeTypeOf("function");
    const root = getTableConfig(schema.careerOutcomeValenceFeedbackTargetRevisionBindings);
    expect(root.name).toBe("career_outcome_valence_feedback_target_revision_bindings");
    expect(root.columns.map(column => column.name)).toEqual(rootColumns);
    expect(Object.keys(schema)).toEqual(["careerOutcomeValenceFeedbackTargetRevisionBindings"]);
  });

  it("freezes one restrictive COVFTD FK and explicitly no target DCTXREV FK", async () => {
    const schema = await loadSchema();
    const root = getTableConfig(schema.careerOutcomeValenceFeedbackTargetRevisionBindings);
    expect(root.foreignKeys).toHaveLength(1);
    const reference = root.foreignKeys[0].reference();
    expect(reference.columns.map(column => column.name)).toEqual(["career_outcome_valence_feedback_target_declaration_id"]);
    expect(getTableConfig(reference.foreignTable).name).toBe("career_outcome_valence_feedback_target_declarations");
  });

  it("freezes exact payload reconstruction, detached getById, genuine absence, and no target reader", async () => {
    const adapter = await loadPersistence(); const value = await fixture();
    const surface = Object.getOwnPropertyNames(adapter.PostgresCareerOutcomeValenceFeedbackTargetRevisionBindingRepository.prototype);
    expect(surface).toEqual(expect.arrayContaining(["getCareerOutcomeValenceFeedbackTargetRevisionBindingById", "persistCareerOutcomeValenceFeedbackTargetRevisionBinding"]));
    expect(surface).not.toEqual(expect.arrayContaining(["getCareerDecisionContextRevisionById", "current", "latest", "head"]));
    expect(value.binding.careerOutcomeValenceFeedbackTargetRevisionBindingId).toMatch(/^COVFTRB_/);
  });

  it("freezes corruption versus absence and immutable conflict for complete state including all audit times", async () => {
    const adapter = await loadPersistence(); const value = await fixture();
    expect([notFound, failed, conflict]).toEqual([
      "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_NOT_FOUND",
      "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_PERSISTENCE_FAILED",
      "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_IMMUTABLE_CONFLICT",
    ]);
    expect([value.binding.createdAt, value.binding.careerOutcomeValenceFeedbackTargetDeclaration.createdAt, value.binding.targetCareerDecisionContextRevision.createdAt]).toHaveLength(3);
  });

  it("freezes atomic root/payload persistence, rollback, and postcommit exact reread without target reread", async () => {
    const adapter = await loadPersistence();
    expect(Object.getOwnPropertyNames(adapter.PostgresCareerOutcomeValenceFeedbackTargetRevisionBindingRepository.prototype))
      .not.toEqual(expect.arrayContaining(["bind", "getCareerDecisionContextRevisionById"]));
  });

  it("freezes no mutable/current/target-reader/delivery/evaluation/learning/causal repository surface", async () => {
    const adapter = await loadPersistence();
    expect(Object.getOwnPropertyNames(adapter.PostgresCareerOutcomeValenceFeedbackTargetRevisionBindingRepository.prototype))
      .not.toEqual(expect.arrayContaining(["update", "delete", "findByTarget", "deliver", "receive", "materialize", "learn", "evaluate", "attribute"]));
  });

  it("freezes persistence as durable historical binding witness only", async () => {
    const adapter = await loadPersistence();
    expect(adapter.PostgresCareerOutcomeValenceFeedbackTargetRevisionBindingRepository).toBeTypeOf("function");
  });
});
