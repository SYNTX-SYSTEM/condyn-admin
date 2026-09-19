import { describe, expect, it } from "vitest";
import { PostgresDecisionAuthorityGrantRevisionRepository } from "../../../lib/career/relation-adapters/decision-authority-persistence";
import { PostgresCareerDecisionContextRevisionRepository } from "../../../lib/career/relation-adapters/decision-context-persistence";
import { PostgresHumanDecisionRecordRepository } from "../../../lib/career/relation-adapters/decision-record-persistence";
import { PostgresRecommendationProposalRepository, productionRecommendationPolicyImplementationRegistry } from "../../../lib/career/relation-adapters/recommendation-proposal-persistence";
import { createProductionHumanDecisionRecordDependencies } from "../../../lib/career/human-decision-admission/application";

describe("T11 production HumanDecisionRecord composition", () => {
  it("constructs only the sealed four producer dependencies from one database", () => {
    const database = new Proxy({}, {
      get() { throw new Error("factory must not perform database or bootstrap I/O"); }
    }) as any;
    const dependencies = createProductionHumanDecisionRecordDependencies(database);

    expect(Object.keys(dependencies).sort()).toEqual(["authorities", "contexts", "proposals", "records"]);
    expect(Object.isFrozen(dependencies)).toBe(true);
    expect(dependencies.authorities).toBeInstanceOf(PostgresDecisionAuthorityGrantRevisionRepository);
    expect(dependencies.proposals).toBeInstanceOf(PostgresRecommendationProposalRepository);
    expect(dependencies.contexts).toBeInstanceOf(PostgresCareerDecisionContextRevisionRepository);
    expect(dependencies.records).toBeInstanceOf(PostgresHumanDecisionRecordRepository);
    expect((dependencies.proposals as any).implementations).toBe(productionRecommendationPolicyImplementationRegistry);
  });
});
