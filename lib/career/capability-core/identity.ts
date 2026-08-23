import { createDeterministicId } from "./hashing";
import type { CapabilityScope } from "./schema";

export interface CapabilityStructuralSignature { normalizedName: string; scope: CapabilityScope; }

export function buildCapabilityStructuralSignature(name: string, scope: CapabilityScope): CapabilityStructuralSignature {
  return { normalizedName: name.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase(), scope };
}

export function buildProvisionalCapabilityId(name: string, scope: CapabilityScope): string {
  const signature = buildCapabilityStructuralSignature(name, scope);
  return createDeterministicId("PCAP", `${signature.normalizedName}|${signature.scope}`);
}
