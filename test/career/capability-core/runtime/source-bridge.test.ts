import { describe, expect, it } from "vitest";
import type { DocumentInput } from "../../../../lib/career/adapter";
import {
  createSourceDocument,
  normalizeSourceText,
  sha256Utf8,
  type SourceDocument
} from "../../../../lib/career/capability-core";
import * as capabilityCore from "../../../../lib/career/capability-core";

type CapabilitySourceBridge = (documents: DocumentInput[]) => SourceDocument[];

function getSourceBridge(): CapabilitySourceBridge {
  const bridge = (
    capabilityCore as unknown as { toCapabilitySourceDocuments?: CapabilitySourceBridge }
  ).toCapabilitySourceDocuments;

  expect(bridge).toBeTypeOf("function");
  if (typeof bridge !== "function") {
    throw new Error("F10A source bridge is not available.");
  }

  return bridge;
}

describe("F10A Capability Proposal Runtime source bridge", () => {
  it("converts Career DocumentInput values through the canonical SourceDocument constructor", () => {
    const input: DocumentInput[] = [
      {
        docId: "career-pdf-01",
        title: "  Career Profile  ",
        content: "Alpha\r\nＢeta",
        metadata: {
          sourceKind: "PDF",
          sourceUri: "file:///career-profile.pdf",
          contentHash: "career-loader-hash",
          loadedAt: "2026-08-31T10:00:00.000Z"
        }
      }
    ];
    const original = structuredClone(input);

    const [document] = getSourceBridge()(input);
    const expected = createSourceDocument({
      docId: "career-pdf-01",
      title: "Career Profile",
      rawContent: "Alpha\r\nＢeta"
    });

    expect(document.docId).toBe("career-pdf-01");
    expect(document.title).toBe("Career Profile");
    expect(document.normalizedText).toBe(normalizeSourceText(input[0].content));
    expect(document.rawContentHash).toBe(sha256Utf8(input[0].content));
    expect(document.normalizedTextHash).toBe(expected.normalizedTextHash);
    expect(document.pages).toBeUndefined();
    expect(document.metadata).toMatchObject({
      sourceKind: "PDF",
      sourceUri: "file:///career-profile.pdf"
    });
    expect(input).toEqual(original);
  });

  it("uses docId as the deterministic title fallback without fabricating pages", () => {
    const input: DocumentInput[] = [
      { docId: "untitled-01", title: "   ", content: "First source." },
      { docId: "untitled-02", content: "Second source." }
    ];

    const documents = getSourceBridge()(input);

    expect(documents.map((document) => document.docId)).toEqual([
      "untitled-01",
      "untitled-02"
    ]);
    expect(documents.map((document) => document.title)).toEqual([
      "untitled-01",
      "untitled-02"
    ]);
    expect(documents.map((document) => document.pages)).toEqual([undefined, undefined]);
    expect(documents.map((document) => document.normalizedText)).toEqual([
      "First source.",
      "Second source."
    ]);
  });
});
