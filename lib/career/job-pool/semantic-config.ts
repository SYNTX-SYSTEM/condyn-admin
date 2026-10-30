import { createHash } from "node:crypto";
import { DEFAULT_GEMINI_MODEL_CASCADE } from "../providers/gemini";
import type { RelationEngineIdentity } from "./relation-cache";
import { GEMINI_SEMANTIC_PROMPT } from "./semantic-prompt";

/**
 * The ONE configuration source of the semantic investigation (PINK O-LED-3): read from the process environment in this module only.
 * The labelled stand-in is always executable. The real provider ("gemini") is READY only with a key AND a call budget of plain
 * digits >= 1 (`ROLE_DISCOVERY_DAY_LIMIT`, fails closed): the budget is the owner's release (D-RD-3). Without configuration nothing
 * can start. The same configuration gates the automatic run after an analysis.
 */
export const SEMANTIC_ROLES_DEFAULT = 10;
export const SEMANTIC_ROLES_HARD_CAP = 25;
export type SemanticConfig =
  | { state: "NOT_CONFIGURED" }
  | { state: "PROVIDER_NOT_AUTHORIZED"; provider: string }
  | { state: "READY"; engine: RelationEngineIdentity; dayLimit: number; maxRoles: number };

const int = (value: string | undefined, fallback: number, max: number) => { const n = Number(value); return Number.isInteger(n) && n >= 0 ? Math.min(n, max) : fallback; };
/** The day limit fails CLOSED (PINK O-START-3): only plain decimal digits count; missing, empty or malformed means 0, so nothing runs. */
const dayLimit = (value: string | undefined) => (value !== undefined && /^[0-9]{1,6}$/.test(value.trim()) ? Math.min(Number(value.trim()), 100000) : 0);

export function readSemanticConfig(env: Record<string, string | undefined> = process.env): SemanticConfig {
  const provider = env.ROLE_DISCOVERY_SEMANTIC_PROVIDER?.trim();
  if (!provider) return { state: "NOT_CONFIGURED" };
  if (provider === "gemini") {
    const budget = dayLimit(env.ROLE_DISCOVERY_DAY_LIMIT);
    if (!env.GEMINI_API_KEY?.trim() || budget < 1) return { state: "PROVIDER_NOT_AUTHORIZED", provider };
    const model = env.ROLE_DISCOVERY_GEMINI_MODEL?.trim() || env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL_CASCADE[0];
    return {
      state: "READY",
      engine: { contractVersion: "PROPOSAL_REQUIREMENT_RELATION_V1", promptChecksum: createHash("sha256").update(GEMINI_SEMANTIC_PROMPT, "utf8").digest("hex"), provider: "gemini", model },
      dayLimit: budget,
      maxRoles: Math.max(1, int(env.ROLE_DISCOVERY_MAX_ROLES, SEMANTIC_ROLES_DEFAULT, SEMANTIC_ROLES_HARD_CAP))
    };
  }
  if (provider !== "stand-in") return { state: "PROVIDER_NOT_AUTHORIZED", provider };
  return {
    state: "READY",
    engine: { contractVersion: "PROPOSAL_REQUIREMENT_RELATION_V1", promptChecksum: "ROLE_RELATION_STANDIN_V1", provider: "stand-in", model: "stand-in" },
    dayLimit: dayLimit(env.ROLE_DISCOVERY_DAY_LIMIT),
    maxRoles: Math.max(1, int(env.ROLE_DISCOVERY_MAX_ROLES, SEMANTIC_ROLES_DEFAULT, SEMANTIC_ROLES_HARD_CAP))
  };
}

/** The class of a stored provider: the labelled stand-in or a real Gemini answer; anything else is not claimed. */
export const evidenceClassOfProvider = (provider: string) => (provider === "stand-in" ? "STAND_IN" : provider === "gemini" ? "REAL_GEMINI" : "UNKNOWN");
