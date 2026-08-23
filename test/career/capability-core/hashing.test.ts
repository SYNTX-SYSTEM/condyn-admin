import { describe, expect, it } from "vitest";
import { computeSourceBundleHash, createSourceDocument } from "../../../lib/career/capability-core";

describe("Capability Core hashing", () => {
  it("is stable across arrival order and changes with source text", () => {
    const first = createSourceDocument({ docId: "B", title: "B", rawContent: "second" });
    const second = createSourceDocument({ docId: "A", title: "A", rawContent: "first" });
    expect(computeSourceBundleHash([first, second])).toBe(computeSourceBundleHash([second, first]));
    expect(computeSourceBundleHash([first])).not.toBe(computeSourceBundleHash([createSourceDocument({ docId: "B", title: "B", rawContent: "changed" })]));
  });
});
