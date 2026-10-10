import { describe, expect, it } from "vitest";
import { InMemoryDecisionAuthorityGrantRevisionRepository } from "../../../lib/career/relation/decision-authority";
import { InMemoryCareerDecisionContextRevisionRepository } from "../../../lib/career/relation/decision-context";
import { InMemoryHumanDecisionRecordRepository } from "../../../lib/career/relation/decision-record";
import { InMemoryRecommendationProposalRepository } from "../../../lib/career/relation/recommendation-proposal";
import { createBoundCareerDecisionContextDecisionRevisionBinder } from "../../../lib/career/relation/decision-context-decision-revision-binding";
import { HR_DECISION_LOOP_FORBIDDEN_CLAIM_KEYS, HR_DECISION_LOOP_REGION_NAMES } from "../../../lib/career/hr-decision-loop/read-model";
import { createHrDecisionLoopReadService, type HrDecisionLoopReadDependencies } from "../../../lib/career/hr-decision-loop/server-read-service";
import { boundDecisionContextRevisionIds, decodeHrDecisionLoopPresentation } from "../../../lib/career/hr-decision-loop/frontend-presentation";
import { createDcdrbHistoricalFixture } from "../relation/decision-context-decision-revision-binding/dcdrb-historical-fixture";

const none = { indexIds: async () => [] as string[], readById: async () => null };

async function world(bindingReader: HrDecisionLoopReadDependencies["decisionRevisionBindings"] | null = null) {
  const fixture = createDcdrbHistoricalFixture();
  const binding = await createBoundCareerDecisionContextDecisionRevisionBinder(fixture.contexts, fixture.revisions).bind(fixture.bindingInput);
  const authorities = new InMemoryDecisionAuthorityGrantRevisionRepository();
  const proposals = new InMemoryRecommendationProposalRepository();
  const contexts = new InMemoryCareerDecisionContextRevisionRepository();
  const records = new InMemoryHumanDecisionRecordRepository();
  await authorities.persistDecisionAuthorityGrantRevision(fixture.authority);
  await proposals.persistRecommendationProposal(fixture.proposal);
  await contexts.persistCareerDecisionContextRevision(fixture.context);
  const indexed: string[] = [];
  const dependencies = {
    authorities, proposals, contexts, records,
    ...Object.fromEntries(HR_DECISION_LOOP_REGION_NAMES.map(name => [name === "decisions" ? "decisionIndex" : name, none])),
    decisionRevisionBindings: bindingReader ?? {
      indexIds: async (exact: string) => { indexed.push(exact); return exact === binding.careerDecisionContextRevision.careerDecisionContextRevisionId ? [binding.careerDecisionContextDecisionRevisionBindingId] : []; },
      readById: async (id: string) => id === binding.careerDecisionContextDecisionRevisionBindingId ? structuredClone(binding) : null,
    },
  } as unknown as HrDecisionLoopReadDependencies;
  return { fixture, binding, dependencies, indexed };
}

describe("HR Decision Loop DCDRB region (R4 in the frontend field)", () => {
  it("indexes bindings by the exact DCTXREV and rereads each binding exactly, without a current marker", async () => {
    const { fixture, binding, dependencies, indexed } = await world();
    const model = await createHrDecisionLoopReadService(dependencies).read(fixture.context.careerDecisionContextRevisionId);
    expect(indexed).toEqual([fixture.context.careerDecisionContextRevisionId]);
    expect(model.decisionRevisionBindings).toEqual({ state: "AVAILABLE", artifactIds: [binding.careerDecisionContextDecisionRevisionBindingId], artifacts: [binding] });
    for (const key of HR_DECISION_LOOP_FORBIDDEN_CLAIM_KEYS) expect(model.decisionRevisionBindings).not.toHaveProperty(key);
  });

  it("decodes the region and offers each bound DREV id as an exact entry point, never selecting one", async () => {
    const { fixture, binding, dependencies } = await world();
    const model = await createHrDecisionLoopReadService(dependencies).read(fixture.context.careerDecisionContextRevisionId);
    const presentation = decodeHrDecisionLoopPresentation(JSON.parse(JSON.stringify(model)));
    expect(presentation).not.toBeNull();
    const region = presentation!.regions.find(candidate => candidate.name === "decisionRevisionBindings")!;
    expect(region.state).toBe("AVAILABLE");
    expect(region.rows[0].facts).toEqual(expect.arrayContaining([
      { label: "decisionContextRevisionId", value: binding.decisionContextRevision.revisionId },
      { label: "recommendationProposalWitness", value: fixture.proposal.recommendationProposalId },
      { label: "createdAt", value: binding.createdAt },
    ]));
    expect(boundDecisionContextRevisionIds(presentation!)).toEqual([binding.decisionContextRevision.revisionId]);
    expect(presentation!.regions.map(candidate => candidate.name)).toEqual([...HR_DECISION_LOOP_REGION_NAMES]);
  });

  it("offers no entry point when the binding table is not provisioned or the reread fails closed", async () => {
    class UndefinedTable extends Error { code = "42P01"; }
    const unprovisioned = await world({ indexIds: async () => { throw new UndefinedTable("relation does not exist"); }, readById: async () => null });
    const model = await createHrDecisionLoopReadService(unprovisioned.dependencies).read(unprovisioned.fixture.context.careerDecisionContextRevisionId);
    expect(model.decisionRevisionBindings).toEqual({ state: "NOT_PROVISIONED", artifactIds: [], artifacts: [] });
    expect(boundDecisionContextRevisionIds(decodeHrDecisionLoopPresentation(JSON.parse(JSON.stringify(model)))!)).toEqual([]);
    const failing = await world({ indexIds: async () => [`DCDRB_${"0".repeat(32)}`], readById: async () => { throw new Error("ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_PERSISTENCE_FAILED"); } });
    const failed = await createHrDecisionLoopReadService(failing.dependencies).read(failing.fixture.context.careerDecisionContextRevisionId);
    expect(failed.decisionRevisionBindings.state).toBe("FAILED");
    expect(failed.decisionRevisionBindings.failureCode).toBe("ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_PERSISTENCE_FAILED");
    expect(boundDecisionContextRevisionIds(decodeHrDecisionLoopPresentation(JSON.parse(JSON.stringify(failed)))!)).toEqual([]);
  });
});
