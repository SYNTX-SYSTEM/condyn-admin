import { describe, expect, it } from "vitest";
import {
  InMemoryTargetRoleSourceBindingRevisionRepository,
  createBoundTargetRoleSourceBindingRevisionPersister,
  createTargetRoleSourceBindingRevision,
  type TargetRoleSourceBindingRevision
} from "../../../../lib/career/target/role";
import { createTargetSourceRevision, type TargetSourceRevision } from "../../../../lib/career/target/source";

const source = (input: Partial<{ targetSourceEntityId: string; previousRevisionId: string | null; sourceLocator: string }> = {}) => createTargetSourceRevision({
  targetSourceEntityId: "TARGET_SOURCE_ENTITY_ALPHA",
  previousRevisionId: null,
  sourceKind: "DOCUMENT",
  sourceLocator: "source://target-role/root",
  rawContentHash: "a".repeat(64),
  normalizedContentHash: "b".repeat(64),
  normalizedContent: "Target Role binding source.",
  normalizationVersion: "target-normalization-v1",
  schemaVersion: "TARGET_SOURCE_REVISION_V1",
  createdAt: "2026-09-02T00:00:00.000Z",
  ...input
});

const binding = (input: Partial<{
  targetRoleEntityId: string;
  targetSourceRevisionId: string;
  previousRevisionId: string | null;
  createdAt: string;
}> = {}) => createTargetRoleSourceBindingRevision({
  targetRoleEntityId: "TARGET_ROLE_ENTITY_ALPHA",
  targetSourceRevisionId: "TSREV_UNSET",
  previousRevisionId: null,
  schemaVersion: "TARGET_ROLE_SOURCE_BINDING_REVISION_V1",
  createdAt: "2026-09-02T00:00:00.000Z",
  ...input
});

const sourceLookup = (sources: TargetSourceRevision[]) => async (id: string) =>
  structuredClone(sources.find((value) => value.targetSourceRevisionId === id) ?? null);

describe("Target Role Source Binding repository-bound persistence T3A", () => {
  it("persists a root only when its exact canonical source revision exists and detaches values", async () => {
    const rootSource = source();
    const repository = new InMemoryTargetRoleSourceBindingRevisionRepository({ getTargetSourceRevisionById: sourceLookup([rootSource]) });
    const root = binding({ targetSourceRevisionId: rootSource.targetSourceRevisionId });
    const persisted = await repository.createTargetRoleSourceBindingRevisionPersister().persist(root);
    expect(persisted).toEqual(root);
    persisted.targetSourceRevisionId = "mutated";
    expect(await repository.getRevisionById(root.targetRoleSourceBindingRevisionId)).toEqual(root);
    await expect(repository.createTargetRoleSourceBindingRevisionPersister().persist(binding()))
      .rejects.toThrow("ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_SOURCE_NOT_FOUND");
  });

  it("allows a child only for the same role and source entity continuity", async () => {
    const sourceA1 = source();
    const sourceA2 = source({ previousRevisionId: sourceA1.targetSourceRevisionId, sourceLocator: "source://target-role/newer" });
    const sourceB = source({ targetSourceEntityId: "TARGET_SOURCE_ENTITY_BETA", sourceLocator: "source://target-role/other" });
    const repository = new InMemoryTargetRoleSourceBindingRevisionRepository({ getTargetSourceRevisionById: sourceLookup([sourceA1, sourceA2, sourceB]) });
    const root = binding({ targetSourceRevisionId: sourceA1.targetSourceRevisionId });
    await repository.createTargetRoleSourceBindingRevisionPersister().persist(root);
    await expect(repository.createTargetRoleSourceBindingRevisionPersister().persist(binding({
      previousRevisionId: root.targetRoleSourceBindingRevisionId,
      targetSourceRevisionId: sourceA2.targetSourceRevisionId
    }))).resolves.toBeTruthy();
    await expect(repository.createTargetRoleSourceBindingRevisionPersister().persist(binding({
      previousRevisionId: root.targetRoleSourceBindingRevisionId,
      targetRoleEntityId: "TARGET_ROLE_ENTITY_BETA",
      targetSourceRevisionId: sourceA2.targetSourceRevisionId
    }))).rejects.toThrow("ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_PARENT_INVALID");
    await expect(repository.createTargetRoleSourceBindingRevisionPersister().persist(binding({
      previousRevisionId: root.targetRoleSourceBindingRevisionId,
      targetSourceRevisionId: sourceB.targetSourceRevisionId
    }))).rejects.toThrow("ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_PARENT_INVALID");
  });

  it("allows independent role by source chains, idempotent replay, and rejects divergent payloads", async () => {
    const sourceA = source();
    const sourceB = source({ targetSourceEntityId: "TARGET_SOURCE_ENTITY_BETA", sourceLocator: "source://target-role/independent" });
    const repository = new InMemoryTargetRoleSourceBindingRevisionRepository({ getTargetSourceRevisionById: sourceLookup([sourceA, sourceB]) });
    const persister = repository.createTargetRoleSourceBindingRevisionPersister();
    const first = binding({ targetSourceRevisionId: sourceA.targetSourceRevisionId });
    const second = binding({ targetSourceRevisionId: sourceB.targetSourceRevisionId });
    await expect(persister.persist(first)).resolves.toEqual(first);
    await expect(persister.persist(second)).resolves.toEqual(second);
    await expect(persister.persist(structuredClone(first))).resolves.toEqual(first);
    await expect(persister.persist(binding({ targetSourceRevisionId: sourceA.targetSourceRevisionId, createdAt: "2030-01-01T00:00:00.000Z" })))
      .rejects.toThrow("ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_IMMUTABLE_CONFLICT");
  });

  it("rejects missing parent binding and detects final reread divergence", async () => {
    const sourceA = source();
    const child = binding({ previousRevisionId: "TRSBREV_MISSING", targetSourceRevisionId: sourceA.targetSourceRevisionId });
    const missing = createBoundTargetRoleSourceBindingRevisionPersister({
      getRevisionById: async () => null,
      getTargetSourceRevisionById: sourceLookup([sourceA]),
      writeRevision: async () => undefined
    });
    await expect(missing.persist(child)).rejects.toThrow("ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_PARENT_NOT_FOUND");
    const root = binding({ targetSourceRevisionId: sourceA.targetSourceRevisionId });
    const divergent = { ...root, targetSourceRevisionId: "TSREV_MUTATED" } as TargetRoleSourceBindingRevision;
    await expect(createBoundTargetRoleSourceBindingRevisionPersister({
      getRevisionById: async () => structuredClone(divergent),
      getTargetSourceRevisionById: sourceLookup([sourceA]),
      writeRevision: async () => undefined
    }).persist(root)).rejects.toThrow("ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_PERSISTENCE_INVALID");
  });

  it("rejects a child when its parent binding survives but its exact parent source revision does not", async () => {
    const sourceA1 = source();
    const sourceA2 = source({ previousRevisionId: sourceA1.targetSourceRevisionId, sourceLocator: "source://target-role/parent-source-missing" });
    const available = new Map([
      [sourceA1.targetSourceRevisionId, sourceA1],
      [sourceA2.targetSourceRevisionId, sourceA2]
    ]);
    const repository = new InMemoryTargetRoleSourceBindingRevisionRepository({
      getTargetSourceRevisionById: async (id) => structuredClone(available.get(id) ?? null)
    });
    const root = binding({ targetSourceRevisionId: sourceA1.targetSourceRevisionId });
    await repository.createTargetRoleSourceBindingRevisionPersister().persist(root);
    available.delete(sourceA1.targetSourceRevisionId);
    await expect(repository.createTargetRoleSourceBindingRevisionPersister().persist(binding({
      previousRevisionId: root.targetRoleSourceBindingRevisionId,
      targetSourceRevisionId: sourceA2.targetSourceRevisionId
    }))).rejects.toThrow("ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_PARENT_SOURCE_NOT_FOUND");
  });
});
