import { pgTable, text, jsonb } from "drizzle-orm/pg-core";

/**
 * CONDYN CAREER ANALYSIS PROTOCOL v1.0
 * PGVECTOR PERSISTENCE SCHEMA (`lib/career/search/schema.ts`)
 *
 * Defines the `career_embeddings` table for storing 768-dimensional entity vectors
 * with pgvector cosine similarity index support.
 */
export const careerEmbeddings = pgTable("career_embeddings", {
  id: text("id").primaryKey(),
  analysisId: text("analysis_id"),
  entityId: text("entity_id").notNull(),
  entityType: text("entity_type").notNull(),
  text: text("text").notNull(),
  embedding: jsonb("embedding").notNull(), // Stores vector payload compatible across ORM and raw SQL vector extension
  metadata: jsonb("metadata"),
  createdAt: text("created_at").notNull()
});
