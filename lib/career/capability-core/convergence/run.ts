import { sha256Utf8 } from "../hashing";
import type { CapabilityConvergenceIdentityInput } from "./types";
import { compareCapabilityConvergenceStrings } from "./ordering";

export function stableConvergenceJsonStringify(value: unknown): string { if (Array.isArray(value)) return `[${value.map(stableConvergenceJsonStringify).join(",")}]`; if (value && typeof value === "object") { const item = value as Record<string, unknown>; return `{${Object.keys(item).sort(compareCapabilityConvergenceStrings).map((key) => `${JSON.stringify(key)}:${stableConvergenceJsonStringify(item[key])}`).join(",")}}`; } return JSON.stringify(value); }
export function computeCapabilityConvergenceRunKey(input: CapabilityConvergenceIdentityInput): string { return sha256Utf8(stableConvergenceJsonStringify([input.discoveryRunId, input.discoveryRawOutputHash, input.kernelVersion, input.promptChecksum, input.provider, input.model, input.schemaVersion, input.algorithmVersion])); }
export function buildCapabilityConvergenceRunId(input: CapabilityConvergenceIdentityInput): string { return `CONV_${computeCapabilityConvergenceRunKey(input).slice(0, 24).toUpperCase()}`; }
