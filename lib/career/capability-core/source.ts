import { sha256Utf8 } from "./hashing";

export interface SourcePage {
  pageNumber: number;
  text: string;
  normalizedText: string;
}

export interface SourceDocument {
  docId: string;
  title: string;
  mimeType?: string;
  rawContentHash: string;
  normalizedText: string;
  normalizedTextHash: string;
  pages?: SourcePage[];
  metadata?: Record<string, string | number | boolean | null>;
}

/** Stored, readable normalization. It deliberately preserves all text semantics. */
export function normalizeSourceText(input: string): string {
  return input.replace(/\r\n?/g, "\n").normalize("NFKC");
}

/** Matching-only normalization for harmless extraction whitespace differences. */
export function normalizeEvidenceMatchText(input: string): string {
  return input.normalize("NFKC").replace(/\s+/g, " ").trim();
}

export function createSourcePage(pageNumber: number, text: string): SourcePage {
  return { pageNumber, text, normalizedText: normalizeSourceText(text) };
}

export function createSourceDocument(input: Omit<SourceDocument, "rawContentHash" | "normalizedText" | "normalizedTextHash" | "pages"> & {
  rawContent: string;
  pages?: Array<{ pageNumber: number; text: string }>;
}): SourceDocument {
  const normalizedText = normalizeSourceText(input.rawContent);
  return {
    docId: input.docId,
    title: input.title,
    ...(input.mimeType ? { mimeType: input.mimeType } : {}),
    rawContentHash: sha256Utf8(input.rawContent),
    normalizedText,
    normalizedTextHash: sha256Utf8(normalizedText),
    ...(input.pages ? { pages: input.pages.map(({ pageNumber, text }) => createSourcePage(pageNumber, text)) } : {}),
    ...(input.metadata ? { metadata: input.metadata } : {})
  };
}
