import { describe, expect, it } from "vitest";
import {
  initT11ProductionPersistenceSchema,
  t11ProductionPersistenceTableNames
} from "../../../lib/career/db/t11-persistence-schema";

describe("T11 production persistence bootstrap", () => {
  it("provisions the complete canonical graph in parent-before-child order", async () => {
    const statements: string[] = [];
    await initT11ProductionPersistenceSchema({
      unsafe: async (statement: string) => { statements.push(statement); }
    } as any);

    expect(statements).toHaveLength(t11ProductionPersistenceTableNames.length);
    expect(t11ProductionPersistenceTableNames).toContain("decision_authority_grant_revisions");
    expect(t11ProductionPersistenceTableNames).toContain("career_decision_context_revisions");
    expect(t11ProductionPersistenceTableNames).toContain("human_decision_records");
    expect(t11ProductionPersistenceTableNames).toContain("evolution_input_states");
    expect(t11ProductionPersistenceTableNames).toContain("tension_states");
    expect(t11ProductionPersistenceTableNames).toContain("recommendation_proposals");
    expect(t11ProductionPersistenceTableNames).not.toContain("career_decisions");
    expect(t11ProductionPersistenceTableNames).not.toContain("career_commitments");
    expect(t11ProductionPersistenceTableNames).not.toContain("career_actions");

    const position = (name: string) => t11ProductionPersistenceTableNames.indexOf(name);
    expect(position("tension_states")).toBeLessThan(position("evolution_input_states"));
    expect(position("evolution_input_states")).toBeLessThan(position("recommendation_proposals"));
    expect(position("recommendation_proposals")).toBeLessThan(position("career_decision_context_revisions"));
    expect(position("decision_authority_grant_revisions")).toBeLessThan(position("career_decision_context_revisions"));
    expect(position("career_decision_context_revisions")).toBeLessThan(position("human_decision_records"));
    expect(position("recommendation_proposals")).toBeLessThan(position("human_decision_records"));

    const recordStatement = statements.find(statement => statement.includes('"human_decision_records"'));
    expect(recordStatement).toContain('REFERENCES "career_decision_context_revisions"');
    expect(recordStatement).toContain('REFERENCES "decision_authority_grant_revisions"');
    expect(recordStatement).toContain('REFERENCES "recommendation_proposals"');
  });
});
