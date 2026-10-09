import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import {
  careerDecisionContextDecisionRevisionBindingTableName,
  careerDecisionContextDecisionRevisionBindings,
  PostgresCareerDecisionContextDecisionRevisionBindingRepository,
} from "../../../../lib/career/relation-adapters/decision-context-decision-revision-binding-persistence";

describe("CareerDecisionContextDecisionRevisionBinding frozen PostgreSQL schema (R4, R7)", () => {
  it("freezes the root table name and column representation", () => {
    const root = getTableConfig(careerDecisionContextDecisionRevisionBindings);
    expect(root.name).toBe("career_decision_context_decision_revision_bindings");
    expect(careerDecisionContextDecisionRevisionBindingTableName).toBe(root.name);
    expect(root.columns.map(column => column.name)).toEqual([
      "career_decision_context_decision_revision_binding_id",
      "career_decision_context_revision_id",
      "decision_context_revision_id",
      "recommendation_proposal_id",
      "schema_version",
      "created_at",
      "payload",
    ]);
  });

  it("freezes exactly one restrictive Career FK and no foreign key to the generic decision_context_revisions table", () => {
    const root = getTableConfig(careerDecisionContextDecisionRevisionBindings);
    expect(root.foreignKeys).toHaveLength(1);
    const reference = root.foreignKeys[0].reference();
    expect(reference.columns.map(column => column.name)).toEqual(["career_decision_context_revision_id"]);
    expect(getTableConfig(reference.foreignTable).name).toBe("career_decision_context_revisions");
    expect(root.foreignKeys[0].onDelete).toBe("restrict");
    const referencedTables = root.foreignKeys.map(key => getTableConfig(key.reference().foreignTable).name);
    expect(referencedTables).not.toContain("decision_context_revisions");
  });

  it("freezes the repository surface: exact-id read and persist only", () => {
    const surface = Object.getOwnPropertyNames(PostgresCareerDecisionContextDecisionRevisionBindingRepository.prototype);
    expect(surface).toEqual(expect.arrayContaining([
      "getCareerDecisionContextDecisionRevisionBindingById",
      "persistCareerDecisionContextDecisionRevisionBinding",
    ]));
    expect(surface).not.toEqual(expect.arrayContaining(["update", "delete", "findByContext", "findByRevision", "current", "latest", "head", "bind"]));
  });
});
