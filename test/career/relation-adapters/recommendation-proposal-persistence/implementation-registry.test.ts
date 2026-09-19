import { describe, expect, it } from "vitest";
import {
  deriveEvolutionInputStateId,
  InMemoryEvolutionInputStateRepository,
  stableEvolutionInput,
  type EvolutionInputState
} from "../../../../lib/career/relation/evolution-input";
import {
  deriveRecommendationPolicyRevisionId,
  InMemoryRecommendationPolicyRevisionRepository,
  InMemoryRecommendationProposalRepository,
  produceAndPersistRecommendationProposal,
  produceRecommendationProposal,
  semanticReplayRecommendationProposal
} from "../../../../lib/career/relation/recommendation-proposal";
import type { RecommendationPolicyRevision } from "../../../../lib/career/relation/recommendation-proposal";
import {
  createRecommendationPolicyImplementationRegistry,
  productionRecommendationPolicyImplementationRegistry
} from "../../../../lib/career/relation-adapters/recommendation-proposal-persistence/implementation-registry";

const stamp = "2027-01-01T00:00:00.000Z";

const evolution = (): EvolutionInputState => {
  const item = {
    evolutionInputClass: "INCREASE_DEMONSTRATED_LEVEL_INPUT" as const,
    derivationDisposition: "DERIVABLE" as const,
    tensionClassificationFamily: "STRUCTURAL_DIFFERENCE" as const,
    tensionClassificationCode: "LEVEL_BELOW_RELATION",
    subjectKind: "AGGREGATE_DIMENSION" as const,
    dimension: "EVIDENCE" as const,
    targetRequirementEntityId: "TRE_1",
    targetRequirementRevisionIds: ["TRR_1"],
    requirementRelationAggregateId: "RRA_1",
    candidateCapabilityOperandId: "CCO_1",
    capabilityRequirementRelationId: "CRREL_1",
    capabilityRequirementRelationEvaluationResultId: null,
    necessityStates: [{ targetRequirementRevisionId: "TRR_1", necessityState: "OPTIONAL" as const }]
  };
  const semantic = {
    tensionStateId: "TSN_1",
    roleRelationId: "RRL_1",
    verifiedCapabilitySnapshotId: "SNAP_1",
    targetRoleProfileRevisionId: "TRP_1",
    targetRoleRequirementInventoryId: "TRQINV_1",
    items: [item].sort((left, right) => stableEvolutionInput(left).localeCompare(stableEvolutionInput(right))),
    derivationPolicyLineage: { evolutionInputDerivationPolicyVersion: "evolution-v1" },
    proposalState: "PROPOSAL_ONLY" as const,
    authorityState: "NONE" as const,
    schemaVersion: "EVOLUTION_INPUT_STATE_V1" as const
  };
  return { evolutionInputStateId: deriveEvolutionInputStateId(semantic), ...semantic, createdAt: stamp };
};

const policy = (version = "recommendation-v1"): RecommendationPolicyRevision => {
  const semantic: Omit<RecommendationPolicyRevision, "recommendationPolicyRevisionId" | "createdAt"> = {
    provenance: { origin: "EXPLICIT_POLICY_DECLARATION" as const, actorId: "POLICY_ACTOR", authorityEvidenceRef: "evidence://policy" },
    rules: [
      ["INCREASE_DEMONSTRATED_LEVEL_INPUT", "DEMONSTRATED_LEVEL_RECOMMENDATION"],
      ["RESOLVE_SEMANTIC_UNCERTAINTY_INPUT", "SEMANTIC_UNCERTAINTY_RESOLUTION_RECOMMENDATION"],
      ["RESOLVE_TARGET_UNCERTAINTY_INPUT", "TARGET_UNCERTAINTY_RESOLUTION_RECOMMENDATION"],
      ["STRENGTHEN_EVIDENCE_INPUT", "EVIDENCE_STRENGTHENING_RECOMMENDATION"]
    ].map(([evolutionInputClass, recommendationKind]) => ({
      evolutionInputClass: evolutionInputClass as any,
      action: "PROPOSE" as const,
      recommendationKind: recommendationKind as any
    })) as RecommendationPolicyRevision["rules"],
    recommendationPolicyImplementationVersion: version,
    schemaVersion: "RECOMMENDATION_POLICY_REVISION_V1" as const
  };
  return { recommendationPolicyRevisionId: deriveRecommendationPolicyRevisionId(semantic), ...semantic, createdAt: stamp };
};

describe("production RecommendationPolicyImplementationRegistry", () => {
  it("resolves only the installed historical version and returns detached values", () => {
    expect(Object.keys(productionRecommendationPolicyImplementationRegistry)).toEqual(["resolveRecommendationPolicyImplementation"]);
    const resolved = productionRecommendationPolicyImplementationRegistry.resolveRecommendationPolicyImplementation("recommendation-v1");
    expect(resolved).toEqual({ version: "recommendation-v1" });
    if (!resolved) throw new Error("test setup");
    resolved.version = "mutated";
    expect(productionRecommendationPolicyImplementationRegistry.resolveRecommendationPolicyImplementation("recommendation-v1")).toEqual({ version: "recommendation-v1" });
    expect(productionRecommendationPolicyImplementationRegistry.resolveRecommendationPolicyImplementation("recommendation-v2")).toBeNull();
    expect(productionRecommendationPolicyImplementationRegistry.resolveRecommendationPolicyImplementation(" recommendation-v1")).toBeNull();
    expect(productionRecommendationPolicyImplementationRegistry.resolveRecommendationPolicyImplementation("RECOMMENDATION-V1")).toBeNull();
  });

  it("rejects malformed and duplicate implementation ownership instead of selecting one", () => {
    expect(() => createRecommendationPolicyImplementationRegistry([{ version: "recommendation-v1" }, { version: "recommendation-v1" }])).toThrow("ERR_RECOMMENDATION_POLICY_IMPLEMENTATION_REGISTRY_DUPLICATE");
    expect(() => createRecommendationPolicyImplementationRegistry([{ version: " recommendation-v1" }])).toThrow("ERR_RECOMMENDATION_POLICY_IMPLEMENTATION_REGISTRY_INVALID");
    expect(() => createRecommendationPolicyImplementationRegistry([{ version: "recommendation-v1", extra: true } as any])).toThrow("ERR_RECOMMENDATION_POLICY_IMPLEMENTATION_REGISTRY_INVALID");
    expect(() => createRecommendationPolicyImplementationRegistry([{ get version() { throw new Error("resolver leak"); } } as any])).toThrow("ERR_RECOMMENDATION_POLICY_IMPLEMENTATION_REGISTRY_INVALID");
  });

  it("preserves exact historical derivation and replay without registry authority", async () => {
    const input = evolution();
    const evolutionInputs = new InMemoryEvolutionInputStateRepository();
    const policies = new InMemoryRecommendationPolicyRevisionRepository();
    const proposals = new InMemoryRecommendationProposalRepository();
    const historicalPolicy = policy();
    await evolutionInputs.persistEvolutionInputState(input);
    await policies.persistRecommendationPolicyRevision(historicalPolicy);
    const dependencies = {
      evolutionInputs,
      policies,
      proposals,
      implementations: productionRecommendationPolicyImplementationRegistry
    };
    const proposal = await produceAndPersistRecommendationProposal({
      evolutionInputStateId: input.evolutionInputStateId,
      recommendationPolicyRevisionId: historicalPolicy.recommendationPolicyRevisionId,
      createdAt: stamp
    }, dependencies);
    await expect(semanticReplayRecommendationProposal(proposal.recommendationProposalId, dependencies)).resolves.toEqual(proposal);
    expect(proposal.recommendationPolicyLineage).toEqual({ recommendationPolicyImplementationVersion: "recommendation-v1" });
    expect(proposal.authorityState).toBe("RECOMMENDATION_POLICY_BOUND");
  });

  it("leaves an unknown historical implementation as the sealed unavailable failure", async () => {
    const input = evolution();
    const evolutionInputs = new InMemoryEvolutionInputStateRepository();
    const policies = new InMemoryRecommendationPolicyRevisionRepository();
    const unsupportedPolicy = policy("recommendation-v404");
    await evolutionInputs.persistEvolutionInputState(input);
    await policies.persistRecommendationPolicyRevision(unsupportedPolicy);
    await expect(produceRecommendationProposal({
      evolutionInputStateId: input.evolutionInputStateId,
      recommendationPolicyRevisionId: unsupportedPolicy.recommendationPolicyRevisionId,
      createdAt: stamp
    }, {
      evolutionInputs,
      policies,
      implementations: productionRecommendationPolicyImplementationRegistry
    })).rejects.toThrow("ERR_RECOMMENDATION_PROPOSAL_POLICY_IMPLEMENTATION_UNAVAILABLE");
  });
});
