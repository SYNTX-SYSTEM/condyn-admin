import { jsonb, pgTable, text } from "drizzle-orm/pg-core";
import type { CandidateSourceBundle } from "./source-bundle";

/** Immutable source provenance container; the caller-selected ID is distinct from its integrity hash. */
export const candidateSourceBundles = pgTable("candidate_source_bundles", {
  candidateSourceBundleId: text("candidate_source_bundle_id").primaryKey(),
  sourceBundleHash: text("source_bundle_hash").notNull(),
  payload: jsonb("payload").$type<CandidateSourceBundle>().notNull(),
  createdAt: text("created_at").notNull(),
});

export const candidateSourceBundleDocumentReferences = pgTable("candidate_source_bundle_document_references", {
  referenceId: text("reference_id").primaryKey(),
  candidateSourceBundleId: text("candidate_source_bundle_id").notNull().references(() => candidateSourceBundles.candidateSourceBundleId, { onDelete: "restrict" }),
  documentId: text("document_id").notNull(),
  normalizedTextHash: text("normalized_text_hash").notNull(),
});
