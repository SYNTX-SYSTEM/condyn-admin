import type { TargetRoleEntity } from "./types";

const fail = (): never => {
  throw new Error("ERR_TARGET_ROLE_ENTITY_INVALID");
};

function capture(value: unknown): Record<string, unknown> {
  try {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return fail();
    const result: Record<string, unknown> = {};
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== "string") return fail();
      const descriptor = Reflect.getOwnPropertyDescriptor(value, key);
      if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail();
      result[key] = descriptor.value;
    }
    return result;
  } catch {
    return fail();
  }
}

export function createTargetRoleEntity(input: TargetRoleEntity): TargetRoleEntity {
  // Never derive identity from legacy roles, analysis.roles, document IDs, provider output, matching, or DEMO_COMPANY_POOL.
  const captured = capture(input);
  if (Object.keys(captured).length !== 1 || typeof captured.targetRoleEntityId !== "string" || captured.targetRoleEntityId.length === 0) fail();
  return structuredClone(captured) as unknown as TargetRoleEntity;
}
