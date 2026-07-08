/**
 * CONDYN CAREER ANALYSIS PROTOCOL v1.0
 * SOURCE NORMALIZATION METADATA (`lib/career/loaders/source.ts`)
 * 
 * Status: Step 19c Implemented / Multi-Source Ingestion
 * Scope: Defines canonical SourceKind, SourceMetadata, deterministic SHA-256 content hashing, and metadata factory.
 */

import * as crypto from "crypto";

export type SourceKind =
  | "TEXT"
  | "MARKDOWN"
  | "PDF"
  | "WEBSITE"
  | "GITHUB_REPOSITORY"
  | "GITHUB_README"
  | "GITHUB_PACKAGE_JSON"
  | "GITHUB_DOCS";

export interface SourceMetadata {
  sourceKind: SourceKind;
  sourceUri?: string;
  sourceTitle?: string;
  sourcePath?: string;
  contentHash: string;
  loadedAt: string;
}

/**
 * Computes deterministic SHA-256 hex hash of normalized text content.
 */
export function computeContentHash(content: string): string {
  return crypto.createHash("sha256").update(content || "", "utf-8").digest("hex");
}

/**
 * Factory for creating immutable canonical SourceMetadata for ingested documents.
 */
export function createSourceMetadata(
  sourceKind: SourceKind,
  content: string,
  options?: {
    uri?: string;
    title?: string;
    path?: string;
    loadedAt?: string;
  }
): SourceMetadata {
  return {
    sourceKind,
    sourceUri: options?.uri,
    sourceTitle: options?.title,
    sourcePath: options?.path,
    contentHash: computeContentHash(content),
    loadedAt: options?.loadedAt || new Date().toISOString()
  };
}
