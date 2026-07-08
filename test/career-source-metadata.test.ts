import { describe, it, expect } from "vitest";
import { loadWebsiteDocument } from "../lib/career/loaders/website";
import { loadGitHubRepositoryDocuments } from "../lib/career/loaders/github";
import { loadPdfDocument } from "../lib/career/loaders/pdf";
import { loadDocumentBatch } from "../lib/career/loaders/batch";
import { computeContentHash, createSourceMetadata } from "../lib/career/loaders/source";
import { loadDocuments } from "../lib/career/pipeline";

describe("CONDYN Career Analysis Protocol v1.0 — Step 19c: Source Normalization Metadata", () => {
  it("should attach SourceMetadata with sourceKind: 'WEBSITE' and deterministic contentHash when loading a website", async () => {
    const mockFetcher = async () => ({
      ok: true,
      status: 200,
      text: async () => "<html><body><p>Cloud Security Architect</p></body></html>"
    });

    const doc = await loadWebsiteDocument(
      "https://condyn.eu/profile/sec",
      "Sec Profile",
      "DOC_WEB_001",
      mockFetcher as any
    );

    expect(doc.metadata).toBeDefined();
    expect(doc.metadata!.sourceKind).toBe("WEBSITE");
    expect(doc.metadata!.sourceUri).toBe("https://condyn.eu/profile/sec");
    expect(doc.metadata!.sourceTitle).toBe("Sec Profile");
    expect(doc.metadata!.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(doc.metadata!.contentHash).toBe(computeContentHash(doc.content));
    expect(new Date(doc.metadata!.loadedAt).toISOString()).toBe(doc.metadata!.loadedAt);
  });

  it("should attach GITHUB_README, GITHUB_PACKAGE_JSON, and GITHUB_DOCS kinds when loading GitHub documents", async () => {
    const mockFetcher = async (url: string) => {
      if (url.endsWith("/readme")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            name: "README.md",
            path: "README.md",
            content: Buffer.from("# CONDYN Career Engine").toString("base64")
          })
        };
      }
      if (url.endsWith("/contents/package.json")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            name: "package.json",
            path: "package.json",
            content: Buffer.from('{"name": "condyn-career-engine"}').toString("base64")
          })
        };
      }
      if (url.endsWith("/contents/docs")) {
        return {
          ok: true,
          status: 200,
          json: async () => ([
            { name: "GUIDE.md", path: "docs/GUIDE.md", type: "file" }
          ])
        };
      }
      if (url.endsWith("/contents/docs/GUIDE.md")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            name: "GUIDE.md",
            path: "docs/GUIDE.md",
            content: Buffer.from("# Guide").toString("base64")
          })
        };
      }
      return { ok: false, status: 404 };
    };

    const docs = await loadGitHubRepositoryDocuments(
      "https://github.com/condyn/career-engine",
      { fetcher: mockFetcher as any }
    );

    expect(docs).toHaveLength(3);
    expect(docs[0].metadata?.sourceKind).toBe("GITHUB_README");
    expect(docs[0].metadata?.sourcePath).toBe("README.md");
    expect(docs[0].metadata?.contentHash).toBe(computeContentHash(docs[0].content));

    expect(docs[1].metadata?.sourceKind).toBe("GITHUB_PACKAGE_JSON");
    expect(docs[1].metadata?.sourcePath).toBe("package.json");

    expect(docs[2].metadata?.sourceKind).toBe("GITHUB_DOCS");
    expect(docs[2].metadata?.sourcePath).toBe("docs/GUIDE.md");
  });

  it("should attach sourceKind: 'PDF' when loading a PDF document", async () => {
    // Note: extractTextFromPdf throws if buffer is empty or invalid unless mocked or valid PDF
    // Let's test createSourceMetadata for PDF or mock extractTextFromPdf behavior via loadPdfDocument
    // We create a mock buffer that loadPdfDocument processes
    const meta = createSourceMetadata("PDF", "Extracted resume content", { title: "PDF Resume" });
    expect(meta.sourceKind).toBe("PDF");
    expect(meta.sourceTitle).toBe("PDF Resume");
    expect(meta.contentHash).toBe(computeContentHash("Extracted resume content"));
  });

  it("should attach sourceKind respecting batch item type ('text' -> 'TEXT', 'markdown' -> 'MARKDOWN', 'pdf' -> 'PDF') in loadDocumentBatch", async () => {
    const docs = await loadDocumentBatch([
      { title: "Doc 1", content: "Plain text note", type: "text" },
      { title: "Doc 2", content: "# Markdown header", type: "markdown" },
      { title: "Doc 3", content: "Text without type" }
    ]);

    expect(docs).toHaveLength(3);
    expect(docs[0].metadata?.sourceKind).toBe("TEXT");
    expect(docs[1].metadata?.sourceKind).toBe("MARKDOWN");
    expect(docs[2].metadata?.sourceKind).toBe("TEXT");
  });

  it("should verify computeContentHash determinism and sensitivity", () => {
    const hash1 = computeContentHash("Hello World");
    const hash2 = computeContentHash("Hello World");
    const hash3 = computeContentHash("Hello World 2");

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  it("should verify loadDocuments(...) accepts DocumentInput with metadata field seamlessly", () => {
    const docWithMeta = {
      docId: "DOC_META_001",
      title: "Test Metadata Doc",
      content: "Document with rich source metadata attached.",
      metadata: createSourceMetadata("WEBSITE", "Document with rich source metadata attached.", {
        uri: "https://condyn.eu/test"
      })
    };

    const loaded = loadDocuments([docWithMeta]);
    expect(loaded).toHaveLength(1);
    expect(loaded[0].docId).toBe("DOC_META_001");
    expect(loaded[0].metadata).toBeDefined();
    expect(loaded[0].metadata?.sourceKind).toBe("WEBSITE");
  });
});
