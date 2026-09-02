import { describe, expect, it } from "vitest";
import {
  createTargetRoleProfileRevision,
  assertTargetRoleProfileRevision,
  InMemoryTargetRoleProfileRevisionRepository,
  createTargetRoleOrganizationBindingRevision
} from "../../../../lib/career/target/role";
import { createTargetOrganizationRevision } from "../../../../lib/career/target/organization";

const payload = (overrides: Partial<Record<string, string | null>> = {}) => ({
  roleDescriptor: " Principal\r\n Architect ",
  roleSemanticDefinition: " Owns   distributed platform   architecture ",
  responsibilityScope: " Platform   design ",
  seniorityInterpretation: "Principal",
  domainContext: "Distributed Systems",
  ...overrides
});
const revision = (overrides: Record<string, unknown> = {}) => createTargetRoleProfileRevision({
  targetRoleEntityId: "ROLE_A",
  targetRoleOrganizationBindingRevisionId: "TROBREV_A",
  previousRevisionId: null,
  profile: payload(),
  proposalState: "PROPOSAL_ONLY",
  sourceEvidenceState: "SOURCE_MATCH_VERIFIED",
  semanticValidationState: "NOT_RUN",
  authorityState: "NONE",
  schemaVersion: "TARGET_ROLE_PROFILE_REVISION_V1",
  createdAt: "2026-09-02T00:00:00.000Z",
  ...overrides
});

describe("Target Role Profile Revision T4", () => {
  it("canonicalizes semantic state and excludes createdAt and reconstruction artifacts from identity", () => {
    const first = revision();
    const same = revision({ createdAt: "2030-01-01T00:00:00.000Z", profile: payload({ roleDescriptor: "Principal\nArchitect" }) });
    expect(first.targetRoleProfileRevisionId).toMatch(/^TRPREV_[A-F0-9]{32}$/);
    expect(same.targetRoleProfileRevisionId).toBe(first.targetRoleProfileRevisionId);
    expect(first.profile).toEqual({ roleDescriptor: "Principal Architect", roleSemanticDefinition: "Owns distributed platform architecture", responsibilityScope: "Platform design", seniorityInterpretation: "Principal", domainContext: "Distributed Systems" });
    expect(Object.keys(first)).not.toContain("reconstructionResultRef");
  });

  it("preserves null, normalizes Unicode NFC, and rejects missing, empty, extra, or authority state", () => {
    expect(revision({ profile: payload({ roleDescriptor: null, domainContext: "Cafe\u0301" }) }).profile.domainContext).toBe("Café");
    for (const invalid of [
      { ...revision(), profile: { ...payload(), domainContext: undefined } },
      { ...revision(), profile: payload({ roleSemanticDefinition: "  " }) },
      { ...revision(), profile: { ...payload(), provider: "x" } },
      { ...revision(), proposalState: "VERIFIED" },
      { ...revision(), targetRoleProfileRevisionId: "TRPREV_TAMPERED" }
    ]) expect(() => assertTargetRoleProfileRevision(invalid)).toThrow("ERR_TARGET_ROLE_PROFILE_REVISION_INVALID");
  });

  it("enforces exact immutable parent continuity while allowing same role and organization forks", async () => {
    const orgA = createTargetOrganizationRevision({ targetOrganizationEntityId: "ORG_A", previousRevisionId: null, organizationDescriptor: "A", descriptorKind: "DECLARED_NAME", schemaVersion: "TARGET_ORGANIZATION_REVISION_V1", createdAt: "2026-09-02T00:00:00.000Z" });
    const orgA2 = createTargetOrganizationRevision({ targetOrganizationEntityId: "ORG_A", previousRevisionId: orgA.targetOrganizationRevisionId, organizationDescriptor: "A2", descriptorKind: "DECLARED_NAME", schemaVersion: "TARGET_ORGANIZATION_REVISION_V1", createdAt: "2026-09-02T00:00:00.000Z" });
    const orgB = createTargetOrganizationRevision({ targetOrganizationEntityId: "ORG_B", previousRevisionId: null, organizationDescriptor: "B", descriptorKind: "DECLARED_NAME", schemaVersion: "TARGET_ORGANIZATION_REVISION_V1", createdAt: "2026-09-02T00:00:00.000Z" });
    const makeBinding = (id: string, role = "ROLE_A") => createTargetRoleOrganizationBindingRevision({ targetRoleEntityId: role, targetRoleSourceBindingRevisionId: "TRSBREV_A", targetOrganizationRevisionId: id, previousRevisionId: null, schemaVersion: "TARGET_ROLE_ORGANIZATION_BINDING_REVISION_V1", createdAt: "2026-09-02T00:00:00.000Z" });
    const bindingA = makeBinding(orgA.targetOrganizationRevisionId), bindingA2 = makeBinding(orgA2.targetOrganizationRevisionId), bindingB = makeBinding(orgB.targetOrganizationRevisionId), bindingRoleB = makeBinding(orgA.targetOrganizationRevisionId, "ROLE_B");
    const bindings: Record<string, any> = { [bindingA.targetRoleOrganizationBindingRevisionId]: bindingA, [bindingA2.targetRoleOrganizationBindingRevisionId]: bindingA2, [bindingB.targetRoleOrganizationBindingRevisionId]: bindingB, [bindingRoleB.targetRoleOrganizationBindingRevisionId]: bindingRoleB };
    const organizations: Record<string, any> = { [orgA.targetOrganizationRevisionId]: orgA, [orgA2.targetOrganizationRevisionId]: orgA2, [orgB.targetOrganizationRevisionId]: orgB };
    const repository = new InMemoryTargetRoleProfileRevisionRepository({
      getTargetRoleOrganizationBindingRevisionById: async (id: string) => structuredClone(bindings[id] ?? null),
      getTargetOrganizationRevisionById: async (id: string) => structuredClone(organizations[id] ?? null)
    });
    const persister = repository.createTargetRoleProfileRevisionPersister();
    const root = revision({ targetRoleOrganizationBindingRevisionId: bindingA.targetRoleOrganizationBindingRevisionId });
    await expect(persister.persist(root)).resolves.toEqual(root);
    const child = revision({ targetRoleOrganizationBindingRevisionId: bindingA2.targetRoleOrganizationBindingRevisionId, previousRevisionId: root.targetRoleProfileRevisionId });
    await expect(persister.persist(child)).resolves.toEqual(child);
    await expect(persister.persist(revision({ targetRoleOrganizationBindingRevisionId: bindingB.targetRoleOrganizationBindingRevisionId, previousRevisionId: root.targetRoleProfileRevisionId }))).rejects.toThrow("ERR_TARGET_ROLE_PROFILE_REVISION_PARENT_INVALID");
    await expect(persister.persist(revision({ targetRoleEntityId: "ROLE_B", targetRoleOrganizationBindingRevisionId: bindingRoleB.targetRoleOrganizationBindingRevisionId, previousRevisionId: root.targetRoleProfileRevisionId }))).rejects.toThrow("ERR_TARGET_ROLE_PROFILE_REVISION_PARENT_INVALID");
    await expect(persister.persist(structuredClone(root))).resolves.toEqual(root);
  });
});
