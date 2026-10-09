import type { CanonicalSilReadModel, CanonicalSilRegionState } from "./canonical-read-model";

export type CanonicalSilFrontendRegionName = "identity" | "capability" | "resonance" | "role" | "tension" | "evolution";

export interface CanonicalSilFrontendRegion {
  state: CanonicalSilRegionState;
  count: number;
  artifactIds: readonly string[];
  failureCode?: string;
}

export interface CanonicalSilFrontendPresentation {
  mode: "CANONICAL_TARGET_BOUND_SIL";
  regions: Readonly<Record<CanonicalSilFrontendRegionName, CanonicalSilFrontendRegion>>;
}

function presentRegion(region: CanonicalSilReadModel[CanonicalSilFrontendRegionName]): CanonicalSilFrontendRegion {
  if (region.state === "AVAILABLE") {
    return { state: region.state, count: region.artifacts.length, artifactIds: [...region.artifactIds] };
  }
  return {
    state: region.state,
    count: 0,
    artifactIds: [],
    ...(region.state === "FAILED" ? { failureCode: region.failureCode } : {}),
  };
}

/** Pure display projection. It only labels exact artifacts already read by SIL. */
export function presentCanonicalSilForFrontend(model: CanonicalSilReadModel): CanonicalSilFrontendPresentation {
  const regions: Record<CanonicalSilFrontendRegionName, CanonicalSilFrontendRegion> = {
    identity: presentRegion(model.identity),
    capability: presentRegion(model.capability),
    resonance: presentRegion(model.resonance),
    role: presentRegion(model.role),
    tension: presentRegion(model.tension),
    evolution: presentRegion(model.evolution),
  };
  return { mode: "CANONICAL_TARGET_BOUND_SIL", regions };
}

const states: readonly CanonicalSilRegionState[] = ["AVAILABLE", "EMPTY", "NOT_PRODUCED", "UNKNOWN", "FAILED"];
const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const isState = (value: unknown): value is CanonicalSilRegionState => typeof value === "string" && states.some(state => state === value);

/** Decodes only the visual state/identity envelope received from the active API. */
export function decodeCanonicalSilFrontendPresentation(value: unknown): CanonicalSilFrontendPresentation | null {
  if (!isRecord(value) || value.schemaVersion !== "CANONICAL_SIL_READ_MODEL_V1") return null;
  const regions: Partial<Record<CanonicalSilFrontendRegionName, CanonicalSilFrontendRegion>> = {};
  for (const name of ["identity", "capability", "resonance", "role", "tension", "evolution"] as const) {
    const region = value[name];
    if (!isRecord(region) || !isState(region.state)) return null;
    if (region.state === "AVAILABLE") {
      if (!Array.isArray(region.artifactIds) || region.artifactIds.some(id => typeof id !== "string")) return null;
      regions[name] = { state: "AVAILABLE", count: region.artifactIds.length, artifactIds: [...region.artifactIds] };
      continue;
    }
    if (region.state === "FAILED") {
      if (typeof region.failureCode !== "string") return null;
      regions[name] = { state: "FAILED", count: 0, artifactIds: [], failureCode: region.failureCode };
      continue;
    }
    regions[name] = { state: region.state, count: 0, artifactIds: [] };
  }
  if (!regions.identity || !regions.capability || !regions.resonance || !regions.role || !regions.tension || !regions.evolution) return null;
  return {
    mode: "CANONICAL_TARGET_BOUND_SIL",
    regions: {
      identity: regions.identity,
      capability: regions.capability,
      resonance: regions.resonance,
      role: regions.role,
      tension: regions.tension,
      evolution: regions.evolution,
    },
  };
}
