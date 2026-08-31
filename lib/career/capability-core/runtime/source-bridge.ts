import type { DocumentInput } from "../../adapter";
import { createSourceDocument, type SourceDocument } from "../source";

type SourceDocumentMetadata = NonNullable<SourceDocument["metadata"]>;

function toCompatibleMetadata(
  metadata: DocumentInput["metadata"]
): SourceDocumentMetadata | undefined {
  if (!metadata) {
    return undefined;
  }

  const compatible = Object.entries(metadata).filter(
    (entry): entry is [string, string | number | boolean | null] =>
      entry[1] === null ||
      typeof entry[1] === "string" ||
      typeof entry[1] === "number" ||
      typeof entry[1] === "boolean"
  );

  return compatible.length > 0 ? Object.fromEntries(compatible) : undefined;
}

/**
 * Adapts Career document input to the sealed Capability Core source contract.
 * This bridge deliberately contributes no authority, page, or capability semantics.
 */
export function toCapabilitySourceDocuments(documents: DocumentInput[]): SourceDocument[] {
  return documents.map((document) => {
    const metadata = toCompatibleMetadata(document.metadata);

    return {
      ...createSourceDocument({
      docId: document.docId,
      title: document.title?.trim() || document.docId,
      rawContent: document.content,
      ...(metadata ? { metadata } : {})
      }),
      pages: undefined
    };
  });
}
