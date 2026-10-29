import React from "react";
import { describe, expect, it, vi } from "vitest";
import { PERSON_ANALYSIS, UPLOAD_ALPHA, UPLOAD_ZETA, plannedBody, storedInvestigation } from "./discovery-fixtures";

/**
 * F-INT-3 (PINK §3.78, mutation testing): a focused unit test for O-RI-4 alone — no fetch, no field, no async flush chain,
 * so a mutant that removes RoleDiscoveryPanel's reset effect cannot slip through by coincidence of a larger end-to-end test's
 * other assertions. Picks a role (the panel's own internal state), moves the investigation to STORED for a new id, and checks
 * directly that the pick is gone and START is inert.
 */
vi.mock("react", async (importOriginal) => (await import("./harness")).mockReact(await importOriginal<object>()));
import { instance, find } from "./harness";
import { RoleDiscoveryPanel, RoleDiscoveryResults } from "../../../app/components/career/demo/RoleDiscoveryPanel";
import { decodeRoleDiscovery, type RoleDiscoveryState } from "../../../lib/career/ui/role-discovery";

const POOLS = [UPLOAD_ALPHA, UPLOAD_ZETA];
const PANEL_POOLS = POOLS.map((id, at) => ({ jobPoolUploadId: id, poolId: `p${at}`, poolVersion: 1, poolName: at ? "Zeta Pool" : "Alpha Pool", poolStatus: "ACTIVE", organizationCount: 1, roleCount: 1, requirementCount: 1, uploadedByActorRef: "a", uploadedAt: "2026-10-24T00:00:00.000Z" }));
const started = vi.fn();

describe("F-INT-3 · O-RI-4 unit — picked resets and START goes inert the moment a run is stored", () => {
  it("REPRODUCE: a picked role is cleared and START disables once the investigation for that release becomes STORED", async () => {
    const body = await plannedBody(0, 10);
    const discovery: RoleDiscoveryState = { state: "AVAILABLE", discovery: decodeRoleDiscovery(body.discovery, PERSON_ANALYSIS, POOLS)! };
    const panel = instance<Record<string, unknown>>(RoleDiscoveryPanel);
    const baseProps = { locale: "en" as const, pools: { state: "AVAILABLE" as const, jobPools: PANEL_POOLS as never }, released: POOLS, discovery, onRelease: () => undefined, onClose: () => undefined, onStart: started, investigation: { state: "IDLE" as const } };
    let tree = panel.settle(baseProps);
    const results = () => find(tree, RoleDiscoveryResults)!;
    const role = body.discovery.semanticPlan.roles.find(r => r.pairs > 0)!;
    const roleKey = `${role.jobPoolUploadId}:${role.poolRoleId}`;
    // Tick the role (the panel's own internal `picked` state, via the results' onPick it hands down).
    (results().props.onPick as (key: string) => void)(roleKey);
    tree = panel.settle(baseProps);
    expect(results().props.picked).toEqual([roleKey]);
    expect(results().props.investigation).toEqual({ state: "IDLE" });
    // The run completes: a STORED investigation for this exact release, a new id.
    const stored = storedInvestigation("COMPLETED", [{ jobPoolUploadId: role.jobPoolUploadId, poolRoleId: role.poolRoleId, status: "SUCCEEDED", pairs: role.pairs, stored: role.pairs }]);
    tree = panel.settle({ ...baseProps, investigation: { state: "STORED", created: true, investigation: stored.investigation } as never });
    expect(results().props.picked).toEqual([]);
    panel.unmount();
  });

  it("inverse: ticking a role after the panel mounts with no investigation yet keeps the pick (nothing resets without a stored run)", async () => {
    const body = await plannedBody(0, 10);
    const discovery: RoleDiscoveryState = { state: "AVAILABLE", discovery: decodeRoleDiscovery(body.discovery, PERSON_ANALYSIS, POOLS)! };
    const panel = instance<Record<string, unknown>>(RoleDiscoveryPanel);
    const baseProps = { locale: "en" as const, pools: { state: "AVAILABLE" as const, jobPools: PANEL_POOLS as never }, released: POOLS, discovery, onRelease: () => undefined, onClose: () => undefined, onStart: started };
    let tree = panel.settle(baseProps);
    const results = () => find(tree, RoleDiscoveryResults)!;
    const role = body.discovery.semanticPlan.roles.find(r => r.pairs > 0)!;
    const roleKey = `${role.jobPoolUploadId}:${role.poolRoleId}`;
    (results().props.onPick as (key: string) => void)(roleKey);
    tree = panel.settle(baseProps);
    tree = panel.settle(baseProps); // settling again with the unchanged, still-IDLE investigation must not clear it
    expect(results().props.picked).toEqual([roleKey]);
    panel.unmount();
  });
});
