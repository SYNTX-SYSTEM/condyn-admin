import { describe, expect, it } from "vitest";
import { derivePoolStructure, describePoolListState, POOL_FIELD_LAYOUT, reversedArcPath, uploadOrbit } from "../../../lib/career/job-pool/pool-field-presentation";
import { matches, summary, view, UPLOAD_ID } from "./fixtures/match-bodies";

/** P-PF-U: the Pool Field is a pure derivation; selection is geometry, light is delivered resonance, nothing is inferred. */
describe("Pool Field presentation (pure derivation)", () => {
  const second = { ...summary, jobPoolUploadId: "JPOOL_SECOND", poolVersion: 2 };
  const third = { ...summary, jobPoolUploadId: "JPOOL_DRAFT", poolStatus: "DRAFT" as const };

  it("places uploads on the outer ring in delivered order and only the explicitly selected one at the core", () => {
    const none = uploadOrbit([summary, second, third], null);
    expect(none.map(node => node.deliveredIndex)).toEqual([1, 2, 3]);
    expect(none.every(node => !node.selected && node.angle !== null)).toBe(true);
    expect(none.map(node => node.angle)).toEqual([60, 180, 300]);
    const selected = uploadOrbit([summary, second, third], "JPOOL_SECOND");
    expect(selected[1]).toMatchObject({ selected: true, angle: null, x: POOL_FIELD_LAYOUT.center, y: POOL_FIELD_LAYOUT.center });
    // The ring keeps its slots: nothing shifts when one upload is drawn to the core.
    expect(selected[0].angle).toBe(60);
    expect(selected[2].angle).toBe(300);
    expect(selected[2].poolStatus).toBe("DRAFT");
    // A selection that is not among the persisted uploads moves nothing (NOT_LISTED is named elsewhere).
    expect(uploadOrbit([summary], "JPOOL_STALE").every(node => !node.selected)).toBe(true);
    expect(uploadOrbit([], null)).toEqual([]);
  });

  it("manifests the selected pool's organisations and roles from its canonical mapping, grouped in delivered order, unlit without a matching", () => {
    const structure = derivePoolStructure(view, null);
    expect(structure).toMatchObject({ jobPoolUploadId: UPLOAD_ID, poolName: "Sample Pool", requirementCount: 3, matchingDelivered: false, mapping: { mappingState: "MAPPED", proposalState: "PROPOSAL_ONLY", authorityState: "NONE" } });
    expect(structure.organizations.map(organization => [organization.poolOrganizationId, organization.name, organization.roleIds])).toEqual([["ORG_1", "Acme", ["ROLE_A", "ROLE_B"]]]);
    expect(structure.roles.map(role => role.angle)).toEqual([90, 270]);
    expect(structure.roles.every(role => role.resonanceScore === null && role.hasScoredMatch === null && role.deliveredRank === null)).toBe(true);
    expect(structure.roles[0].requirements.map(requirement => [requirement.capabilityName, requirement.necessityState, requirement.targetRequirementRevisionId])).toEqual([["TypeScript", "REQUIRED", "TRQREV_1"], ["Kubernetes", "UNKNOWN", "TRQREV_2"]]);
    expect(structure.organizations[0].arc.startsWith("M ")).toBe(true);
    // One organisation spans the whole circle (mid 180°, lower half): its label arc runs counter-clockwise so the name reads upright.
    expect(structure.organizations[0].labelArc).toMatch(/A \d+(\.\d+)? \d+(\.\d+)? 0 1 0 /);
    expect(reversedArcPath(0, 0, 10, 0, 0)).toBe("");
  });

  it("lights roles only from a delivered matching of the exact same upload, with the delivered score and rank", () => {
    const lit = derivePoolStructure(view, matches);
    expect(lit.matchingDelivered).toBe(true);
    expect(lit.roles.find(role => role.poolRoleId === "ROLE_A")).toMatchObject({ resonanceScore: 0.75, hasScoredMatch: true, deliveredRank: 1 });
    expect(lit.roles.find(role => role.poolRoleId === "ROLE_B")).toMatchObject({ resonanceScore: 0.3, hasScoredMatch: false, deliveredRank: 2 });
    expect(lit.organizations[0]).toMatchObject({ aggregateScore: matches.organizationMatches[0].aggregateScore, hueIndex: 0 });
    expect(derivePoolStructure(view, null).organizations[0].aggregateScore).toBeNull();
    const foreign = derivePoolStructure(view, { ...matches, jobPoolUploadId: "JPOOL_OTHER" });
    expect(foreign.matchingDelivered).toBe(false);
    expect(foreign.roles.every(role => role.resonanceScore === null)).toBe(true);
  });

  it("names the list state without inventing availability", () => {
    expect(["IDLE", "LOADING"].map(state => describePoolListState({ state }))).toEqual(["LOADING", "LOADING"]);
    expect(describePoolListState({ state: "EMPTY" })).toBe("EMPTY");
    expect(describePoolListState({ state: "NOT_PROVISIONED" })).toBe("NOT_PROVISIONED");
    expect(describePoolListState({ state: "FAILED" })).toBe("FAILED");
    expect(describePoolListState({ state: "AVAILABLE" })).toBe("AVAILABLE");
  });

  it("carries no canonical relation, decision or verified-capability claim", () => {
    const text = JSON.stringify([uploadOrbit([summary], UPLOAD_ID), derivePoolStructure(view, matches)]);
    expect(text).not.toMatch(/\b(RRL|TSN|EIS|RCP|DCTXREV|DCR|DREV)_[0-9A-Z]/);
    expect(text).not.toMatch(/recommend|chosen|decision|verified capability/i);
  });
});
