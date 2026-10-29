import type { RelationEngineIdentity } from "./relation-cache";

/**
 * The ONE configuration source of the semantic investigation (PINK O-LED-3): read from the process environment in this module only.
 * In this build only the labelled stand-in is executable; a real provider is refused until the owner has named a call budget and
 * a real provider adapter exists (D-RD-3: real Gemini needs a separate owner GO). Without configuration nothing can start.
 */
export const SEMANTIC_ROLES_DEFAULT = 10;
export const SEMANTIC_ROLES_HARD_CAP = 25;
export type SemanticConfig =
  | { state: "NOT_CONFIGURED" }
  | { state: "PROVIDER_NOT_AUTHORIZED"; provider: string }
  | { state: "READY"; engine: RelationEngineIdentity; dayLimit: number; maxRoles: number };

const int = (value: string | undefined, fallback: number, max: number) => { const n = Number(value); return Number.isInteger(n) && n >= 0 ? Math.min(n, max) : fallback; };

export function readSemanticConfig(env: Record<string, string | undefined> = process.env): SemanticConfig {
  const provider = env.ROLE_DISCOVERY_SEMANTIC_PROVIDER?.trim();
  if (!provider) return { state: "NOT_CONFIGURED" };
  if (provider !== "stand-in") return { state: "PROVIDER_NOT_AUTHORIZED", provider };
  return {
    state: "READY",
    engine: { contractVersion: "PROPOSAL_REQUIREMENT_RELATION_V1", promptChecksum: "ROLE_RELATION_STANDIN_V1", provider: "stand-in", model: "stand-in" },
    dayLimit: int(env.ROLE_DISCOVERY_DAY_LIMIT, 1000, 100000),
    maxRoles: Math.max(1, int(env.ROLE_DISCOVERY_MAX_ROLES, SEMANTIC_ROLES_DEFAULT, SEMANTIC_ROLES_HARD_CAP))
  };
}
