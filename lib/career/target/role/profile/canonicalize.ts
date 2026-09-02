import type { TargetRoleProfileSemanticPayload } from "./types";

const fields = ["roleDescriptor", "roleSemanticDefinition", "responsibilityScope", "seniorityInterpretation", "domainContext"] as const;
const fail = (): never => { throw new Error("ERR_TARGET_ROLE_PROFILE_REVISION_INVALID"); };
export const stableTargetRoleProfileJson = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stableTargetRoleProfileJson).join(",")}]`;
  if (value !== null && typeof value === "object") { const item = value as Record<string, unknown>; return `{${Object.keys(item).sort().map((key) => `${JSON.stringify(key)}:${stableTargetRoleProfileJson(item[key])}`).join(",")}}`; }
  return JSON.stringify(value);
};
const normalize = (value: string): string => value.normalize("NFC").replace(/\r\n?/g, "\n").replace(/\s+/gu, " ").trim();
export function canonicalizeTargetRoleProfilePayload(value: unknown): TargetRoleProfileSemanticPayload {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return fail();
  const item = value as Record<string, unknown>; const keys = Object.keys(item).sort(); const expected = [...fields].sort();
  if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index])) return fail();
  const result: Record<string, string | null> = {};
  for (const field of fields) {
    const raw = item[field];
    if (raw !== null && typeof raw !== "string") return fail();
    result[field] = raw === null ? null : normalize(raw);
    if (raw !== null && result[field] === "") return fail();
  }
  if (!result.roleSemanticDefinition) return fail();
  return result as unknown as TargetRoleProfileSemanticPayload;
}
