import { describe, expect, it } from "vitest";
import {
  InMemoryTargetRoleOrganizationBindingRevisionRepository,
  createBoundTargetRoleOrganizationBindingRevisionPersister,
  createTargetRoleOrganizationBindingRevision,
  createTargetRoleSourceBindingRevision
} from "../../../../lib/career/target/role";
import { createTargetOrganizationRevision, type TargetOrganizationRevision } from "../../../../lib/career/target/organization";

const organization = (input: Partial<{ targetOrganizationEntityId: string; previousRevisionId: string | null; organizationDescriptor: string }> = {}) => createTargetOrganizationRevision({
  targetOrganizationEntityId: "TARGET_ORGANIZATION_ENTITY_ALPHA", previousRevisionId: null,
  organizationDescriptor: "Declared Organization", descriptorKind: "DECLARED_NAME",
  schemaVersion: "TARGET_ORGANIZATION_REVISION_V1", createdAt: "2026-09-02T00:00:00.000Z", ...input
});
const roleSource = (targetRoleEntityId = "TARGET_ROLE_ENTITY_ALPHA") => createTargetRoleSourceBindingRevision({
  targetRoleEntityId, targetSourceRevisionId: "TSREV_OPERAND", previousRevisionId: null,
  schemaVersion: "TARGET_ROLE_SOURCE_BINDING_REVISION_V1", createdAt: "2026-09-02T00:00:00.000Z"
});
const binding = (input: Partial<{ targetRoleEntityId: string; targetRoleSourceBindingRevisionId: string; targetOrganizationRevisionId: string; previousRevisionId: string | null; createdAt: string }> = {}) => createTargetRoleOrganizationBindingRevision({
  targetRoleEntityId: "TARGET_ROLE_ENTITY_ALPHA", targetRoleSourceBindingRevisionId: "TRSBREV_UNSET", targetOrganizationRevisionId: "TOREV_UNSET", previousRevisionId: null,
  schemaVersion: "TARGET_ROLE_ORGANIZATION_BINDING_REVISION_V1", createdAt: "2026-09-02T00:00:00.000Z", ...input
});

describe("Target Role Organization Binding immutable persistence T3B", () => {
  it("persists a root only when exact valid operands exist and detaches reads", async () => {
    const role = roleSource(); const org = organization();
    const repository = new InMemoryTargetRoleOrganizationBindingRevisionRepository({
      getTargetRoleSourceBindingRevisionById: async (id) => structuredClone(id === role.targetRoleSourceBindingRevisionId ? role : null),
      getTargetOrganizationRevisionById: async (id) => structuredClone(id === org.targetOrganizationRevisionId ? org : null)
    });
    const root = binding({ targetRoleSourceBindingRevisionId: role.targetRoleSourceBindingRevisionId, targetOrganizationRevisionId: org.targetOrganizationRevisionId });
    const persisted = await repository.createTargetRoleOrganizationBindingRevisionPersister().persist(root);
    persisted.targetOrganizationRevisionId = "mutated";
    expect(await repository.getRevisionById(root.targetRoleOrganizationBindingRevisionId)).toEqual(root);
  });

  it("rejects missing operands and role mismatch before writing", async () => {
    const role = roleSource("TARGET_ROLE_ENTITY_OTHER"); const org = organization(); let writes = 0;
    const persister = createBoundTargetRoleOrganizationBindingRevisionPersister({
      getRevisionById: async () => null,
      getTargetRoleSourceBindingRevisionById: async () => structuredClone(role),
      getTargetOrganizationRevisionById: async () => structuredClone(org),
      writeRevision: async () => { writes += 1; }
    });
    await expect(persister.persist(binding({ targetRoleSourceBindingRevisionId: role.targetRoleSourceBindingRevisionId, targetOrganizationRevisionId: org.targetOrganizationRevisionId }))).rejects.toThrow("ERR_TARGET_ROLE_ORGANIZATION_BINDING_REVISION_ROLE_OPERAND_INVALID");
    expect(writes).toBe(0);
  });

  it("allows same-organization revision continuity and forks, but rejects different role or organization entity continuation", async () => {
    const role = roleSource(); const roleOther = roleSource("TARGET_ROLE_ENTITY_BETA"); const orgA1 = organization(); const orgA2 = organization({ previousRevisionId: orgA1.targetOrganizationRevisionId, organizationDescriptor: "Declared Organization Changed" }); const orgB = organization({ targetOrganizationEntityId: "TARGET_ORGANIZATION_ENTITY_BETA", organizationDescriptor: "Other" });
    const organizations = [orgA1, orgA2, orgB] as TargetOrganizationRevision[];
    const repository = new InMemoryTargetRoleOrganizationBindingRevisionRepository({
      getTargetRoleSourceBindingRevisionById: async (id) => structuredClone(id === role.targetRoleSourceBindingRevisionId ? role : id === roleOther.targetRoleSourceBindingRevisionId ? roleOther : null),
      getTargetOrganizationRevisionById: async (id) => structuredClone(organizations.find((value) => value.targetOrganizationRevisionId === id) ?? null)
    });
    const root = binding({ targetRoleSourceBindingRevisionId: role.targetRoleSourceBindingRevisionId, targetOrganizationRevisionId: orgA1.targetOrganizationRevisionId });
    await repository.createTargetRoleOrganizationBindingRevisionPersister().persist(root);
    const child = binding({ targetRoleSourceBindingRevisionId: role.targetRoleSourceBindingRevisionId, targetOrganizationRevisionId: orgA2.targetOrganizationRevisionId, previousRevisionId: root.targetRoleOrganizationBindingRevisionId });
    await expect(repository.createTargetRoleOrganizationBindingRevisionPersister().persist(child)).resolves.toEqual(child);
    await expect(repository.createTargetRoleOrganizationBindingRevisionPersister().persist(binding({ targetRoleSourceBindingRevisionId: role.targetRoleSourceBindingRevisionId, targetOrganizationRevisionId: orgB.targetOrganizationRevisionId, previousRevisionId: root.targetRoleOrganizationBindingRevisionId }))).rejects.toThrow("ERR_TARGET_ROLE_ORGANIZATION_BINDING_REVISION_PARENT_INVALID");
    await expect(repository.createTargetRoleOrganizationBindingRevisionPersister().persist(binding({ targetRoleEntityId: "TARGET_ROLE_ENTITY_BETA", targetRoleSourceBindingRevisionId: roleOther.targetRoleSourceBindingRevisionId, targetOrganizationRevisionId: orgA2.targetOrganizationRevisionId, previousRevisionId: root.targetRoleOrganizationBindingRevisionId }))).rejects.toThrow("ERR_TARGET_ROLE_ORGANIZATION_BINDING_REVISION_PARENT_INVALID");
  });

  it("is idempotent for exact replay and detects divergent final rereads", async () => {
    const role = roleSource(); const org = organization(); const root = binding({ targetRoleSourceBindingRevisionId: role.targetRoleSourceBindingRevisionId, targetOrganizationRevisionId: org.targetOrganizationRevisionId });
    const repository = new InMemoryTargetRoleOrganizationBindingRevisionRepository({ getTargetRoleSourceBindingRevisionById: async () => structuredClone(role), getTargetOrganizationRevisionById: async () => structuredClone(org) });
    const persister = repository.createTargetRoleOrganizationBindingRevisionPersister();
    await expect(persister.persist(root)).resolves.toEqual(root);
    await expect(persister.persist(structuredClone(root))).resolves.toEqual(root);
    await expect(persister.persist(binding({ targetRoleSourceBindingRevisionId: role.targetRoleSourceBindingRevisionId, targetOrganizationRevisionId: org.targetOrganizationRevisionId, createdAt: "2030-01-01T00:00:00.000Z" }))).rejects.toThrow("ERR_TARGET_ROLE_ORGANIZATION_BINDING_REVISION_IMMUTABLE_CONFLICT");
  });
});
