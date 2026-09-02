import { describe, expect, it } from "vitest";
import * as targetRole from "../../../../lib/career/target/role";
import { assertTargetRoleOrganizationBindingRevision, createTargetRoleOrganizationBindingRevision } from "../../../../lib/career/target/role";

const revision = (input: Partial<{ targetRoleEntityId: string; targetRoleSourceBindingRevisionId: string; targetOrganizationRevisionId: string; previousRevisionId: string | null; schemaVersion: string; createdAt: string }> = {}) => createTargetRoleOrganizationBindingRevision({
  targetRoleEntityId: "TARGET_ROLE_ENTITY_ALPHA",
  targetRoleSourceBindingRevisionId: "TRSBREV_ROLE_SOURCE_ALPHA",
  targetOrganizationRevisionId: "TOREV_ORGANIZATION_ALPHA",
  previousRevisionId: null,
  schemaVersion: "TARGET_ROLE_ORGANIZATION_BINDING_REVISION_V1",
  createdAt: "2026-09-02T00:00:00.000Z",
  ...input
});

describe("Target Role Organization Binding Revision contract T3B", () => {
  it("creates a detached root with deterministic identity inputs", () => {
    const root = revision();
    expect(root).toMatchObject({ targetRoleEntityId: "TARGET_ROLE_ENTITY_ALPHA", previousRevisionId: null });
    expect(root.targetRoleOrganizationBindingRevisionId).toMatch(/^TROBREV_[A-F0-9]{32}$/);
    root.targetOrganizationRevisionId = "mutated";
    expect(revision().targetOrganizationRevisionId).toBe("TOREV_ORGANIZATION_ALPHA");
  });

  it("excludes createdAt but includes each operand and predecessor in revision identity", () => {
    const root = revision();
    expect(revision({ createdAt: "2030-01-01T00:00:00.000Z" }).targetRoleOrganizationBindingRevisionId).toBe(root.targetRoleOrganizationBindingRevisionId);
    expect(revision({ targetRoleSourceBindingRevisionId: "TRSBREV_OTHER" }).targetRoleOrganizationBindingRevisionId).not.toBe(root.targetRoleOrganizationBindingRevisionId);
    expect(revision({ targetOrganizationRevisionId: "TOREV_OTHER" }).targetRoleOrganizationBindingRevisionId).not.toBe(root.targetRoleOrganizationBindingRevisionId);
    expect(revision({ previousRevisionId: root.targetRoleOrganizationBindingRevisionId }).targetRoleOrganizationBindingRevisionId).not.toBe(root.targetRoleOrganizationBindingRevisionId);
  });

  it("rejects malformed inputs, authority fields, and identity tampering", () => {
    const value = revision();
    for (const malformed of [
      { ...value, schemaVersion: "OTHER" },
      { ...value, createdAt: "invalid" },
      { ...value, targetRoleEntityId: "" },
      { ...value, verified: true },
      { ...value, targetRoleOrganizationBindingRevisionId: "TROBREV_TAMPERED" }
    ]) expect(() => assertTargetRoleOrganizationBindingRevision(malformed)).toThrow("ERR_TARGET_ROLE_ORGANIZATION_BINDING_REVISION_INVALID");
  });

  it("exposes no binding entity, lifecycle, authority, matching, or descriptor resolution surface", () => {
    expect(Object.keys(targetRole).filter((name) => /current|latest|head|active|supersed|match|recommend|authority|resolve|OrganizationBindingEntity/i.test(name))).toEqual([]);
    expect(Object.keys(revision()).filter((name) => /targetOrganizationEntityId|descriptor|verified|provider|sourceLocator|confidence/i.test(name))).toEqual([]);
  });
});
