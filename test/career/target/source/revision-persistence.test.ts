import { describe, expect, it } from "vitest";
import {
  InMemoryTargetSourceRevisionRepository,
  createBoundTargetSourceRevisionPersister,
  createTargetSourceRevision,
  type TargetSourceRevision
} from "../../../../lib/career/target/source";

const revision = (input: Partial<{
  targetSourceEntityId: string;
  previousRevisionId: string | null;
  sourceLocator: string;
  rawContentHash: string;
  normalizedContentHash: string;
  normalizedContent: string;
  createdAt: string;
}> = {}) => createTargetSourceRevision({
  targetSourceEntityId: "TARGET_SOURCE_ENTITY_PERSISTENCE",
  previousRevisionId: null,
  sourceKind: "DOCUMENT",
  sourceLocator: "source://persistence/root",
  rawContentHash: "1".repeat(64),
  normalizedContentHash: "2".repeat(64),
  normalizedContent: "Persisted normalized source content.",
  normalizationVersion: "target-normalization-v1",
  schemaVersion: "TARGET_SOURCE_REVISION_V1",
  createdAt: "2026-09-02T00:00:00.000Z",
  ...input
});

class TrackingRepository extends InMemoryTargetSourceRevisionRepository {
  readonly reads: string[] = [];

  override async getRevisionById(targetSourceRevisionId: string): Promise<TargetSourceRevision | null> {
    this.reads.push(targetSourceRevisionId);
    return super.getRevisionById(targetSourceRevisionId);
  }
}

describe("Target Source Revision repository-bound persistence T1", () => {
  it("exposes only exact reads and a repository-bound persister, never a public raw writer", async () => {
    const repository = new InMemoryTargetSourceRevisionRepository() as unknown as Record<string, unknown>;
    for (const name of ["writeRevision", "saveRevision", "putRevision", "replaceRevision", "updateRevision", "deleteRevision", "setCurrentRevision"]) {
      expect(name in repository).toBe(false);
      expect(typeof repository[name]).not.toBe("function");
    }
    expect(typeof repository.getRevisionById).toBe("function");
    expect(typeof repository.createTargetSourceRevisionPersister).toBe("function");
  });

  it("persists a root through one bound persister, exact-rereads it, and detaches values", async () => {
    const repository = new InMemoryTargetSourceRevisionRepository();
    const value = revision();
    const persisted = await repository.createTargetSourceRevisionPersister().persist(value);

    expect(persisted).toEqual(value);
    persisted.normalizedContent = "Caller-mutated persisted return.";
    expect((await repository.getRevisionById(value.targetSourceRevisionId))?.normalizedContent).toBe("Persisted normalized source content.");

    const read = await repository.getRevisionById(value.targetSourceRevisionId);
    if (read === null) throw new Error("expected durable root");
    read.normalizedContent = "Caller-mutated repository read.";
    expect((await repository.getRevisionById(value.targetSourceRevisionId))?.normalizedContent).toBe("Persisted normalized source content.");
  });

  it("replays an exact revision idempotently but rejects divergent complete payload at one revision id", async () => {
    const repository = new InMemoryTargetSourceRevisionRepository();
    const persister = repository.createTargetSourceRevisionPersister();
    const first = revision();
    const divergent = revision({ createdAt: "2030-01-01T00:00:00.000Z" });
    expect(divergent.targetSourceRevisionId).toBe(first.targetSourceRevisionId);
    expect(divergent).not.toEqual(first);

    await expect(persister.persist(first)).resolves.toEqual(first);
    await expect(persister.persist(structuredClone(first))).resolves.toEqual(first);
    await expect(persister.persist(divergent)).rejects.toThrow("ERR_TARGET_SOURCE_REVISION_IMMUTABLE_CONFLICT");
  });

  it("requires exactly the immediate parent and permits more than one immutable child of that entity", async () => {
    const repository = new TrackingRepository();
    const persister = repository.createTargetSourceRevisionPersister();
    const root = revision();
    const childA = revision({
      previousRevisionId: root.targetSourceRevisionId,
      sourceLocator: "source://persistence/child-a",
      rawContentHash: "3".repeat(64),
      normalizedContentHash: "4".repeat(64),
      normalizedContent: "First immutable child source state."
    });
    const childB = revision({
      previousRevisionId: root.targetSourceRevisionId,
      sourceLocator: "source://persistence/child-b",
      rawContentHash: "5".repeat(64),
      normalizedContentHash: "6".repeat(64),
      normalizedContent: "Second immutable child source state."
    });

    await expect(persister.persist(childA)).rejects.toThrow("ERR_TARGET_SOURCE_REVISION_PARENT_NOT_FOUND");
    await persister.persist(root);
    repository.reads.length = 0;
    await expect(persister.persist(childA)).resolves.toEqual(childA);
    await expect(persister.persist(childB)).resolves.toEqual(childB);
    expect(repository.reads.filter((id) => id === root.targetSourceRevisionId)).toHaveLength(2);
    expect(childA.targetSourceEntityId).toBe(root.targetSourceEntityId);
    expect(childB.targetSourceEntityId).toBe(root.targetSourceEntityId);
  });

  it("rejects malformed or mismatched immediate parents before writing", async () => {
    const requestedParent = revision();
    const child = revision({
      previousRevisionId: requestedParent.targetSourceRevisionId,
      sourceLocator: "source://persistence/child",
      rawContentHash: "7".repeat(64),
      normalizedContentHash: "8".repeat(64),
      normalizedContent: "Child requiring exact parent."
    });
    let writes = 0;
    const mismatched = revision({
      targetSourceEntityId: "TARGET_SOURCE_ENTITY_OTHER",
      sourceLocator: "source://other",
      rawContentHash: "9".repeat(64),
      normalizedContentHash: "a".repeat(64),
      normalizedContent: "Unrelated parent payload."
    });

    const mismatchPersister = createBoundTargetSourceRevisionPersister({
      getRevisionById: async () => structuredClone(mismatched),
      writeRevision: async () => { writes += 1; }
    });
    await expect(mismatchPersister.persist(child)).rejects.toThrow("ERR_TARGET_SOURCE_REVISION_PARENT_INVALID");
    expect(writes).toBe(0);

    const malformedPersister = createBoundTargetSourceRevisionPersister({
      getRevisionById: async () => ({}) as TargetSourceRevision,
      writeRevision: async () => { writes += 1; }
    });
    await expect(malformedPersister.persist(child)).rejects.toThrow("ERR_TARGET_SOURCE_REVISION_PARENT_INVALID");
    expect(writes).toBe(0);
  });

  it("requires an exact final reread and preserves unexpected storage failures", async () => {
    const value = revision();
    await expect(createBoundTargetSourceRevisionPersister({
      getRevisionById: async () => null,
      writeRevision: async () => undefined
    }).persist(value)).rejects.toThrow("ERR_TARGET_SOURCE_REVISION_PERSISTENCE_INVALID");

    const divergent = { ...value, normalizedContent: "Mutated after write." };
    await expect(createBoundTargetSourceRevisionPersister({
      getRevisionById: async () => structuredClone(divergent),
      writeRevision: async () => undefined
    }).persist(value)).rejects.toThrow("ERR_TARGET_SOURCE_REVISION_PERSISTENCE_INVALID");

    await expect(createBoundTargetSourceRevisionPersister({
      getRevisionById: async () => null,
      writeRevision: async () => { throw new Error("UNDERLYING_TARGET_STORAGE_FAILURE"); }
    }).persist(value)).rejects.toThrow("UNDERLYING_TARGET_STORAGE_FAILURE");
  });
});
