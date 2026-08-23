import { createHash } from "crypto";
import type { SourceDocument } from "./source";

export function sha256Utf8(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function computeSourceDocumentHash(normalizedText: string): string {
  return sha256Utf8(normalizedText);
}

/** Stable serializer for the small, explicitly ordered source bundle identity contract. */
export function computeSourceBundleHash(documents: SourceDocument[]): string {
  const items = documents
    .map(({ docId, normalizedTextHash }) => ({ docId, normalizedTextHash }))
    .sort((left, right) => left.docId < right.docId ? -1 : left.docId > right.docId ? 1 : 0);
  return sha256Utf8(JSON.stringify(items));
}

export function createDeterministicId(prefix: string, value: string): string {
  return `${prefix}_${sha256Utf8(value).slice(0, 24).toUpperCase()}`;
}
