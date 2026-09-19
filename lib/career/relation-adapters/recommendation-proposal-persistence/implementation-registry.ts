import type {
  RecommendationPolicyImplementation,
  RecommendationPolicyImplementationRegistry
} from "../../relation/recommendation-proposal/producer";

const fail = (code: string): never => { throw new Error(code); };

const isCanonicalVersion = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value.trim().length > 0 && value.trim() === value;

const assertImplementation: (value: unknown) => asserts value is RecommendationPolicyImplementation = (value: unknown) => {
  if (
    !value ||
    typeof value !== "object" ||
    Object.keys(value).length !== 1 ||
    Object.keys(value)[0] !== "version" ||
    Object.getOwnPropertySymbols(value).length !== 0 ||
    !isCanonicalVersion((value as { version?: unknown }).version)
  ) fail("ERR_RECOMMENDATION_POLICY_IMPLEMENTATION_REGISTRY_INVALID");
};

/**
 * Resolves only explicitly installed executable implementations. It does not
 * select, authorize, or reinterpret RecommendationPolicyRevision values.
 */
export function createRecommendationPolicyImplementationRegistry(
  implementations: readonly RecommendationPolicyImplementation[]
): RecommendationPolicyImplementationRegistry {
  if (!Array.isArray(implementations)) fail("ERR_RECOMMENDATION_POLICY_IMPLEMENTATION_REGISTRY_INVALID");

  const byVersion = new Map<string, Readonly<RecommendationPolicyImplementation>>();
  try {
    for (const implementation of implementations) {
      assertImplementation(implementation);
      if (byVersion.has(implementation.version)) {
        fail("ERR_RECOMMENDATION_POLICY_IMPLEMENTATION_REGISTRY_DUPLICATE");
      }
      byVersion.set(implementation.version, Object.freeze({ version: implementation.version }));
    }
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "ERR_RECOMMENDATION_POLICY_IMPLEMENTATION_REGISTRY_INVALID" ||
        error.message === "ERR_RECOMMENDATION_POLICY_IMPLEMENTATION_REGISTRY_DUPLICATE")
    ) throw error;
    fail("ERR_RECOMMENDATION_POLICY_IMPLEMENTATION_REGISTRY_INVALID");
  }

  return Object.freeze({
    resolveRecommendationPolicyImplementation(version: string): RecommendationPolicyImplementation | null {
      if (!isCanonicalVersion(version)) return null;
      const implementation = byVersion.get(version);
      return implementation ? { version: implementation.version } : null;
    }
  });
}

export const productionRecommendationPolicyImplementationRegistry =
  createRecommendationPolicyImplementationRegistry([{ version: "recommendation-v1" }]);
