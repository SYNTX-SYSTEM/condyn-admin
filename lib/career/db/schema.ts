/**
 * CONDYN CAREER ANALYSIS PROTOCOL v1.0
 * DRIZZLE ORM SCHEMA FOR POSTGRESQL PERSISTENCE (`lib/career/db/schema.ts`)
 * 
 * Status: Phase 10 Implemented / Server Boundary Only
 * Scope: Defines the `career_analyses` table with JSONB payload column for canonical DAG storage.
 */

import { pgTable, text, real, jsonb } from "drizzle-orm/pg-core";

/**
 * Table definition for stored career analysis graphs.
 * Storing full CanonicalCareerAnalysis structure inside `payload` JSONB
 * preserves 100% structural fidelity without schema mapping friction or UI contamination.
 */
export const careerAnalyses = pgTable("career_analyses", {
  analysisId: text("analysis_id").primaryKey(),
  createdAt: text("created_at").notNull(),
  validationState: text("validation_state").notNull(),
  overallConfidence: real("overall_confidence").notNull(),
  payload: jsonb("payload").notNull()
});
