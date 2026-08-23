import { describe, expect, it } from "vitest";
import { buildCapabilityDiscoveryPrompt, createSourceDocument } from "../../../../lib/career/capability-core";
const kernel = { kernelVersion: "v", templateId: "T", versionId: "V", checksum: "C", plainTextContent: "FAKE_KERNEL" };
describe("discovery prompt", () => { it("sorts documents and pages without duplicating paged document text", () => { const b = createSourceDocument({ docId: "B", title: "B!", rawContent: "not emitted", pages: [{ pageNumber: 2, text: "Second." }, { pageNumber: 1, text: "First, Case." }] }); const a = createSourceDocument({ docId: "A", title: "A", rawContent: "Once." }); const prompt = buildCapabilityDiscoveryPrompt([b, a], kernel); expect(prompt.systemPrompt).toBe("FAKE_KERNEL"); expect(prompt.userPrompt.indexOf("DOC_ID: A")).toBeLessThan(prompt.userPrompt.indexOf("DOC_ID: B")); expect(prompt.userPrompt.indexOf("First, Case.")).toBeLessThan(prompt.userPrompt.indexOf("Second.")); expect(prompt.userPrompt).not.toContain("not emitted"); expect(buildCapabilityDiscoveryPrompt([a,b], kernel).userPrompt).toBe(prompt.userPrompt); }); });

it("emits normalized document text exactly once when pages is empty", () => {
  const uniqueSource = "Unique empty-page source content.";
  const document = createSourceDocument({ docId: "EMPTY", title: "Empty pages", rawContent: uniqueSource, pages: [] });

  const prompt = buildCapabilityDiscoveryPrompt([document], kernel).userPrompt;

  expect(prompt.split(uniqueSource)).toHaveLength(2);
});
