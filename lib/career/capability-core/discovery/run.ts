import { sha256Utf8 } from "../hashing";
import type { CapabilityDiscoveryIdentityInput } from "./types";
export function computeCapabilityDiscoveryRunKey(input: CapabilityDiscoveryIdentityInput): string { return sha256Utf8(JSON.stringify([input.sourceBundleHash, input.kernelVersion, input.promptChecksum, input.provider, input.model, input.schemaVersion])); }
export function buildCapabilityDiscoveryRunId(input: CapabilityDiscoveryIdentityInput): string { return `RUN_${computeCapabilityDiscoveryRunKey(input).slice(0, 24).toUpperCase()}`; }
export function stableJsonStringify(value: unknown): string { if (Array.isArray(value)) return `[${value.map(stableJsonStringify).join(",")}]`; if (value && typeof value === "object") { const item = value as Record<string, unknown>; return `{${Object.keys(item).sort((a,b) => a < b ? -1 : a > b ? 1 : 0).map((key) => `${JSON.stringify(key)}:${stableJsonStringify(item[key])}`).join(",")}}`; } return JSON.stringify(value); }
