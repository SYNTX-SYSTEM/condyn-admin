import { describe, expect, it } from "vitest";
import * as targetRole from "../../../../lib/career/target/role";
import {
  assertTargetRoleSourceBindingRevision,
  createTargetRoleEntity,
  createTargetRoleSourceBindingRevision
} from "../../../../lib/career/target/role";

const revision = (input: Partial<{
  targetRoleEntityId: string;
  targetSourceRevisionId: string;
  previousRevisionId: string | null;
  schemaVersion: string;
  createdAt: string;
}> = {}) => createTargetRoleSourceBindingRevision({
  targetRoleEntityId: "TARGET_ROLE_ENTITY_ALPHA",
  targetSourceRevisionId: "TSREV_SOURCE_ALPHA",
  previousRevisionId: null,
  schemaVersion: "TARGET_ROLE_SOURCE_BINDING_REVISION_V1",
  createdAt: "2026-09-02T00:00:00.000Z",
  ...input
});

describe("Target Role Source Binding Revision contract T3A", () => {
  it("keeps caller-supplied role identity exact and free of descriptive fields", () => {
    expect(createTargetRoleEntity({ targetRoleEntityId: "TARGET_ROLE_ENTITY_ALPHA" }))
      .toEqual({ targetRoleEntityId: "TARGET_ROLE_ENTITY_ALPHA" });
    expect(() => createTargetRoleEntity({ targetRoleEntityId: "" })).toThrow("ERR_TARGET_ROLE_ENTITY_INVALID");
    expect(() => createTargetRoleEntity({ targetRoleEntityId: "TARGET_ROLE_ENTITY_ALPHA", title: "Architect" } as never))
      .toThrow("ERR_TARGET_ROLE_ENTITY_INVALID");
  });

  it("creates a detached root binding revision with deterministic canonical identity", () => {
    const value = revision();
    expect(value.previousRevisionId).toBeNull();
    expect(value.targetRoleSourceBindingRevisionId).toMatch(/^TRSBREV_[A-F0-9]{32}$/);
    value.targetSourceRevisionId = "mutated";
    expect(revision().targetSourceRevisionId).toBe("TSREV_SOURCE_ALPHA");
  });

  it("excludes createdAt but includes source and previous revision identity inputs", () => {
    const root = revision();
    expect(revision({ createdAt: "2030-01-01T00:00:00.000Z" }).targetRoleSourceBindingRevisionId)
      .toBe(root.targetRoleSourceBindingRevisionId);
    expect(revision({ targetSourceRevisionId: "TSREV_SOURCE_BETA" }).targetRoleSourceBindingRevisionId)
      .not.toBe(root.targetRoleSourceBindingRevisionId);
    expect(revision({ previousRevisionId: root.targetRoleSourceBindingRevisionId }).targetRoleSourceBindingRevisionId)
      .not.toBe(root.targetRoleSourceBindingRevisionId);
  });

  it("rejects malformed schema, timestamp, extra authority state, and identity tampering", () => {
    const value = revision();
    expect(() => createTargetRoleSourceBindingRevision({ ...value, targetRoleSourceBindingRevisionId: "unexpected" } as never))
      .toThrow("ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_INVALID");
    expect(() => createTargetRoleSourceBindingRevision({ ...value, schemaVersion: "OTHER" } as never))
      .toThrow("ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_INVALID");
    expect(() => createTargetRoleSourceBindingRevision({ ...value, createdAt: "not-a-timestamp" } as never))
      .toThrow("ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_INVALID");
    expect(() => assertTargetRoleSourceBindingRevision({ ...value, confidence: 1 }))
      .toThrow("ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_INVALID");
    expect(() => assertTargetRoleSourceBindingRevision({ ...value, targetRoleSourceBindingRevisionId: "TRSBREV_TAMPERED" }))
      .toThrow("ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_INVALID");
  });

  it("exports no role description, legacy, provider, authority, or mutable-current operation", () => {
    const forbidden = [
      "getCurrentRevision", "getLatestRevision", "getHeadRevision", "setCurrentRevision",
      "mergeRoles", "resolveRoleIdentity", "matchRole", "RoleRelation", "OrganizationRelation",
      "verified", "verificationState", "matchingEligibility", "provider", "legacyRoleId"
    ];
    expect(Object.keys(targetRole).filter((name) => forbidden.includes(name))).toEqual([]);
    expect(Object.keys(revision()).filter((key) => [
      "title", "name", "organization", "targetSourceEntityId", "confidence", "provider", "model"
    ].includes(key))).toEqual([]);
  });
});
