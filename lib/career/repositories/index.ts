/**
 * CONDYN CAREER ANALYSIS PROTOCOL v1.0
 * REPOSITORY RESOLVER (`lib/career/repositories/index.ts`)
 * 
 * Status: Phase 11 Implemented / Zero Client Leakage / Strict Production Boundary
 * Scope: Resolves the active CareerAnalysisRepository. Enforces PostgreSQL in production.
 */

import { CareerAnalysisRepository, InMemoryCareerAnalysisRepository } from "../repository";
import { PostgresCareerAnalysisRepository } from "./postgres";

// Singleton instances for serverless reuse
let inMemoryRepoInstance: InMemoryCareerAnalysisRepository | null = null;
let postgresRepoInstance: PostgresCareerAnalysisRepository | null = null;

/**
 * Resolves the active career analysis repository based on environment configuration.
 * 
 * STRICT ARCHITECTURAL DIRECTIVE:
 * - PostgreSQL is mandatory in production/standard environments.
 * - InMemory fallback is ONLY permitted when:
 *   1) `process.env.NODE_ENV === "test"`
 *   2) Explicitly requested via `process.env.CAREER_REPOSITORY === "inmemory"`
 * - No silent fallbacks to in-memory in production.
 */
export function getCareerAnalysisRepository(): CareerAnalysisRepository {
  const isTestEnv = process.env.NODE_ENV === "test";
  const isExplicitInMemory = process.env.CAREER_REPOSITORY === "inmemory";

  if (isTestEnv || isExplicitInMemory) {
    if (!inMemoryRepoInstance) {
      inMemoryRepoInstance = new InMemoryCareerAnalysisRepository();
    }
    return inMemoryRepoInstance;
  }

  if (!postgresRepoInstance) {
    postgresRepoInstance = new PostgresCareerAnalysisRepository();
  }
  return postgresRepoInstance;
}
