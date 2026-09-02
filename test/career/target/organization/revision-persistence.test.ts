import { describe, expect, it } from "vitest";
import {
  InMemoryTargetOrganizationRevisionRepository,
  createBoundTargetOrganizationRevisionPersister,
  createTargetOrganizationRevision,
  type TargetOrganizationRevision
} from "../../../../lib/career/target/organization";

const revision = (input: Partial<{
  targetOrganizationEntityId: string;
  previousRevisionId: string | null;
  organizationDescriptor: string;
  descriptorKind: string;
  schemaVersion: string;
  createdAt: string;
}> = {}) => createTargetOrganizationRevision({
  targetOrganizationEntityId: "TARGET_ORGANIZATION_ENTITY_PERSISTENCE",
  previousRevisionId: null,
  organizationDescriptor: "Siemens AG",
  descriptorKind: "DECLARED_NAME",
  schemaVersion: "TARGET_ORGANIZATION_REVISION_V1",
  createdAt: "2026-09-02T00:00:00.000Z",
  ...input
});

class TrackingRepository extends InMemoryTargetOrganizationRevisionRepository {
  readonly reads: string[] = [];

  override async getRevisionById(
    targetOrganizationRevisionId: string
  ): Promise<TargetOrganizationRevision | null> {
    this.reads.push(targetOrganizationRevisionId);
    return super.getRevisionById(targetOrganizationRevisionId);
  }
}

describe("Target Organization Revision repository-bound persistence T2", () => {
  it("exposes only exact reads and a repository-bound persister, never a public raw writer", () => {
    const repository =
      new InMemoryTargetOrganizationRevisionRepository() as unknown as Record<string, unknown>;

    for (const name of [
      "writeRevision", "saveRevision", "putRevision", "replaceRevision",
      "updateRevision", "deleteRevision", "setCurrentRevision",
      "getCurrentRevision", "getLatestRevision", "getHeadRevision"
    ]) {
      expect(name in repository).toBe(false);
      expect(typeof repository[name]).not.toBe("function");
    }

    expect(typeof repository.getRevisionById).toBe("function");
    expect(typeof repository.createTargetOrganizationRevisionPersister).toBe("function");
  });

  it("persists a root through one bound persister, exact-rereads it, and detaches values", async () => {
    const repository = new InMemoryTargetOrganizationRevisionRepository();
    const value = revision();
    const persisted =
      await repository.createTargetOrganizationRevisionPersister().persist(value);

    expect(persisted).toEqual(value);

    persisted.organizationDescriptor = "Caller-mutated persisted return.";
    expect(
      (await repository.getRevisionById(value.targetOrganizationRevisionId))
        ?.organizationDescriptor
    ).toBe("Siemens AG");

    const read = await repository.getRevisionById(value.targetOrganizationRevisionId);
    if (read === null) throw new Error("expected durable root");

    read.organizationDescriptor = "Caller-mutated repository read.";
    expect(
      (await repository.getRevisionById(value.targetOrganizationRevisionId))
        ?.organizationDescriptor
    ).toBe("Siemens AG");
  });

  it("replays an exact revision idempotently but rejects divergent complete payload at one revision id", async () => {
    const repository = new InMemoryTargetOrganizationRevisionRepository();
    const persister = repository.createTargetOrganizationRevisionPersister();

    const first = revision();
    const divergent = revision({ createdAt: "2030-01-01T00:00:00.000Z" });

    expect(divergent.targetOrganizationRevisionId)
      .toBe(first.targetOrganizationRevisionId);
    expect(divergent).not.toEqual(first);

    await expect(persister.persist(first)).resolves.toEqual(first);
    await expect(persister.persist(structuredClone(first))).resolves.toEqual(first);
    await expect(persister.persist(divergent))
      .rejects.toThrow("ERR_TARGET_ORGANIZATION_REVISION_IMMUTABLE_CONFLICT");
  });

  it("requires exactly the immediate parent and permits multiple immutable children of one organization entity", async () => {
    const repository = new TrackingRepository();
    const persister = repository.createTargetOrganizationRevisionPersister();

    const root = revision();
    const childA = revision({
      previousRevisionId: root.targetOrganizationRevisionId,
      organizationDescriptor: "Siemens"
    });
    const childB = revision({
      previousRevisionId: root.targetOrganizationRevisionId,
      organizationDescriptor: "Siemens Aktiengesellschaft"
    });

    await expect(persister.persist(childA))
      .rejects.toThrow("ERR_TARGET_ORGANIZATION_REVISION_PARENT_NOT_FOUND");

    await persister.persist(root);

    repository.reads.length = 0;

    await expect(persister.persist(childA)).resolves.toEqual(childA);
    await expect(persister.persist(childB)).resolves.toEqual(childB);

    expect(
      repository.reads.filter((id) => id === root.targetOrganizationRevisionId)
    ).toHaveLength(2);

    expect(childA.targetOrganizationEntityId).toBe(root.targetOrganizationEntityId);
    expect(childB.targetOrganizationEntityId).toBe(root.targetOrganizationEntityId);
  });

  it("rejects a valid immediate parent belonging to another organization entity before writing", async () => {
    const requestedParent = revision();
    const child = revision({
      previousRevisionId: requestedParent.targetOrganizationRevisionId,
      organizationDescriptor: "Child descriptor"
    });

    let writes = 0;

    const mismatched = revision({
      targetOrganizationEntityId: "TARGET_ORGANIZATION_ENTITY_OTHER",
      organizationDescriptor: "Other Organization"
    });

    const persister = createBoundTargetOrganizationRevisionPersister({
      getRevisionById: async () => structuredClone(mismatched),
      writeRevision: async () => {
        writes += 1;
      }
    });

    await expect(persister.persist(child))
      .rejects.toThrow("ERR_TARGET_ORGANIZATION_REVISION_PARENT_INVALID");

    expect(writes).toBe(0);
  });

  it("rejects malformed immediate parent state before writing", async () => {
    const requestedParent = revision();
    const child = revision({
      previousRevisionId: requestedParent.targetOrganizationRevisionId,
      organizationDescriptor: "Child descriptor"
    });

    let writes = 0;

    const persister = createBoundTargetOrganizationRevisionPersister({
      getRevisionById: async () => ({}) as TargetOrganizationRevision,
      writeRevision: async () => {
        writes += 1;
      }
    });

    await expect(persister.persist(child))
      .rejects.toThrow("ERR_TARGET_ORGANIZATION_REVISION_PARENT_INVALID");

    expect(writes).toBe(0);
  });

  it("requires an exact final reread and rejects storage mutation", async () => {
    const value = revision();

    await expect(createBoundTargetOrganizationRevisionPersister({
      getRevisionById: async () => null,
      writeRevision: async () => undefined
    }).persist(value))
      .rejects.toThrow("ERR_TARGET_ORGANIZATION_REVISION_PERSISTENCE_INVALID");

    const divergent = {
      ...value,
      organizationDescriptor: "Mutated after write."
    };

    await expect(createBoundTargetOrganizationRevisionPersister({
      getRevisionById: async () => structuredClone(divergent),
      writeRevision: async () => undefined
    }).persist(value))
      .rejects.toThrow("ERR_TARGET_ORGANIZATION_REVISION_PERSISTENCE_INVALID");
  });

  it("preserves unexpected underlying storage failures", async () => {
    const value = revision();

    await expect(createBoundTargetOrganizationRevisionPersister({
      getRevisionById: async () => null,
      writeRevision: async () => {
        throw new Error("UNDERLYING_TARGET_ORGANIZATION_STORAGE_FAILURE");
      }
    }).persist(value))
      .rejects.toThrow("UNDERLYING_TARGET_ORGANIZATION_STORAGE_FAILURE");
  });
});
