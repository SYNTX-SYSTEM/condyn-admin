import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { computeSourceBundleHash, createSourceDocument, type SourceDocument, type VerifiedCapabilitySnapshot } from "../../../lib/career/capability-core";
import type { OrganizationRelation } from "../../../lib/career/relation/organization-relation";
import type { RoleRelation } from "../../../lib/career/relation/role-relation";
import type { TensionState } from "../../../lib/career/relation/tension-state";
import type { EvolutionInputState } from "../../../lib/career/relation/evolution-input";
import {
  composeCanonicalSilReadModel,
  type CanonicalSilProjectionInput,
} from "../../../lib/career/sil-projection/canonical-read-model";

function source(): SourceDocument {
  return createSourceDocument({ docId: "SRC_CANDIDATE_1", title: "candidate.md", rawContent: "Canonical candidate source." });
}

function graph(document: SourceDocument): CanonicalSilProjectionInput {
  const snapshot = {
    snapshotId: "SNAP_CANDIDATE_1",
    sourceBundleHash: computeSourceBundleHash([document]),
  } as VerifiedCapabilitySnapshot;
  const role = {
    roleRelationId: "RREL_1",
    verifiedCapabilitySnapshotId: snapshot.snapshotId,
    targetRoleProfileRevisionId: "TRPROF_1",
    targetRoleRequirementInventoryId: "TRINV_1",
    proposalState: "PROPOSAL_ONLY",
    authorityState: "NONE",
  } as RoleRelation;
  const organization = {
    organizationRelationId: "OREL_1",
    verifiedCapabilitySnapshotId: snapshot.snapshotId,
    roleRelationMemberships: [{ roleRelation: role }],
  } as OrganizationRelation;
  const tension = {
    tensionStateId: "TNS_1",
    roleRelationId: role.roleRelationId,
    verifiedCapabilitySnapshotId: role.verifiedCapabilitySnapshotId,
    targetRoleProfileRevisionId: role.targetRoleProfileRevisionId,
    targetRoleRequirementInventoryId: role.targetRoleRequirementInventoryId,
    proposalState: "PROPOSAL_ONLY",
    authorityState: "NONE",
  } as TensionState;
  const evolution = {
    evolutionInputStateId: "EIS_1",
    tensionStateId: tension.tensionStateId,
    roleRelationId: tension.roleRelationId,
    verifiedCapabilitySnapshotId: tension.verifiedCapabilitySnapshotId,
    targetRoleProfileRevisionId: tension.targetRoleProfileRevisionId,
    targetRoleRequirementInventoryId: tension.targetRoleRequirementInventoryId,
    proposalState: "PROPOSAL_ONLY",
    authorityState: "NONE",
  } as EvolutionInputState;
  return {
    identity: { state: "AVAILABLE", artifacts: [document] },
    capability: { state: "AVAILABLE", artifacts: [snapshot] },
    resonance: { state: "AVAILABLE", artifacts: [organization] },
    role: { state: "AVAILABLE", artifacts: [role] },
    tension: { state: "AVAILABLE", artifacts: [tension] },
    evolution: { state: "AVAILABLE", artifacts: [evolution] },
  };
}

describe("canonical SIL read-model projection", () => {
  it("projects only supplied exact artifacts, preserves their lineage, proposal ceiling, and detaches presentation values", () => {
    const document = source();
    const input = graph(document);
    const model = composeCanonicalSilReadModel(input);

    expect(model.schemaVersion).toBe("CANONICAL_SIL_READ_MODEL_V1");
    expect(model.identity).toMatchObject({ state: "AVAILABLE", artifactIds: ["SRC_CANDIDATE_1"] });
    expect(model.capability).toMatchObject({ state: "AVAILABLE", artifactIds: ["SNAP_CANDIDATE_1"] });
    expect(model.resonance).toMatchObject({ state: "AVAILABLE", artifactIds: ["OREL_1"] });
    expect(model.role).toMatchObject({ state: "AVAILABLE", artifactIds: ["RREL_1"] });
    expect(model.tension).toMatchObject({ state: "AVAILABLE", artifactIds: ["TNS_1"] });
    expect(model.evolution).toMatchObject({ state: "AVAILABLE", artifactIds: ["EIS_1"] });
    expect((model.role as any).artifacts[0].proposalState).toBe("PROPOSAL_ONLY");
    expect((model.evolution as any).artifacts[0].authorityState).toBe("NONE");

    document.title = "mutated after projection";
    expect((model.identity as any).artifacts[0].title).toBe("candidate.md");
  });

  it("preserves EMPTY, NOT_PRODUCED, UNKNOWN, and FAILED without inventing an available artifact", () => {
    const model = composeCanonicalSilReadModel({
      identity: { state: "EMPTY" },
      capability: { state: "NOT_PRODUCED" },
      resonance: { state: "UNKNOWN" },
      role: { state: "FAILED", failureCode: "READ_FAILED" },
      tension: { state: "NOT_PRODUCED" },
      evolution: { state: "EMPTY" },
    });

    expect(model.identity).toEqual({ state: "EMPTY" });
    expect(model.capability).toEqual({ state: "NOT_PRODUCED" });
    expect(model.resonance).toEqual({ state: "UNKNOWN" });
    expect(model.role).toEqual({ state: "FAILED", failureCode: "READ_FAILED" });
    expect(model.tension).toEqual({ state: "NOT_PRODUCED" });
    expect(model.evolution).toEqual({ state: "EMPTY" });
  });

  it("rejects source-to-snapshot, organization-to-role, and tension-to-role lineage substitution", () => {
    const sourceToSnapshot = graph(source());
    (sourceToSnapshot.capability as any).artifacts[0].sourceBundleHash = "not-the-supplied-source-bundle";
    expect(() => composeCanonicalSilReadModel(sourceToSnapshot)).toThrow("ERR_CANONICAL_SIL_PROJECTION_LINEAGE_INVALID");

    const organizationToRole = graph(source());
    (organizationToRole.role as any).artifacts[0].roleRelationId = "RREL_SUBSTITUTED";
    expect(() => composeCanonicalSilReadModel(organizationToRole)).toThrow("ERR_CANONICAL_SIL_PROJECTION_LINEAGE_INVALID");

    const tensionToRole = graph(source());
    (tensionToRole.tension as any).artifacts[0].targetRoleProfileRevisionId = "TRPROF_SUBSTITUTED";
    expect(() => composeCanonicalSilReadModel(tensionToRole)).toThrow("ERR_CANONICAL_SIL_PROJECTION_LINEAGE_INVALID");
  });

  it("has no legacy demo, currentness, time, persistence, or domain-producer coupling", () => {
    const source = readFileSync(new URL("../../../lib/career/sil-projection/canonical-read-model.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/ui-adapter|demo-data|analysis\.roles|analysis\.organizations|analysis\.strategies|nextActions|CompanyPoolData|DEMO_COMPANY_POOL/);
    expect(source).not.toMatch(/Date\.now|new Date|current|latest|head|RecommendationProposal|HumanDecisionRecord|repository|postgres/i);
  });
});
