import type {
  AuthoritativeStateReference,
  AuthoritativeStateResolution,
  AuthoritativeStateResolver,
  BoundAuthoritativeStateReader
} from "./types";

const fail = (code: string): never => { throw new Error(code); };
const referenceKeys = ["producerId", "authorityContractId", "artifactId", "locator"] as const;

const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

function resolverBindingKey(producerId: string, authorityContractId: string): string {
  return JSON.stringify([producerId, authorityContractId]);
}

/**
 * Reflectively validates a caller object and captures its data-property values once.
 * No original caller object is consulted after this boundary, including across awaits.
 */
function validateAndCaptureReference(reference: unknown): AuthoritativeStateReference {
  try {
    if (typeof reference !== "object" || reference === null || Array.isArray(reference)) {
      return fail("ERR_DECISION_AUTHORITY_REFERENCE_INVALID");
    }
    const objectReference = reference;
    const ownKeys = Reflect.ownKeys(objectReference);
    if (ownKeys.length !== referenceKeys.length || ownKeys.some((key) => typeof key !== "string" || !referenceKeys.some((expected) => expected === key))) {
      return fail("ERR_DECISION_AUTHORITY_REFERENCE_INVALID");
    }
    const values: Record<typeof referenceKeys[number], string> = {
      producerId: "",
      authorityContractId: "",
      artifactId: "",
      locator: ""
    };
    for (const key of referenceKeys) {
      const descriptor = Object.getOwnPropertyDescriptor(objectReference, key);
      if (descriptor === undefined || !descriptor.enumerable || !("value" in descriptor)) {
        return fail("ERR_DECISION_AUTHORITY_REFERENCE_INVALID");
      }
      const value = descriptor.value;
      if (!isNonEmptyString(value)) return fail("ERR_DECISION_AUTHORITY_REFERENCE_INVALID");
      values[key] = value;
    }
    return {
      producerId: values.producerId,
      authorityContractId: values.authorityContractId,
      artifactId: values.artifactId,
      locator: values.locator
    };
  } catch {
    return fail("ERR_DECISION_AUTHORITY_REFERENCE_INVALID");
  }
}

function assertResolverBinding(resolver: AuthoritativeStateResolver): void {
  if (!isNonEmptyString(resolver.producerId) || !isNonEmptyString(resolver.authorityContractId) || typeof resolver.resolve !== "function") {
    fail("ERR_DECISION_AUTHORITY_RESOLVER_CONFLICT");
  }
}

/**
 * Registers authority dependencies once. Per-call data is limited to an opaque reference,
 * so resolution cannot be redirected by caller-supplied repositories or resolvers.
 */
export function createBoundAuthoritativeStateReader(
  resolvers: readonly AuthoritativeStateResolver[]
): BoundAuthoritativeStateReader {
  const resolverByBinding = new Map<string, (reference: AuthoritativeStateReference) => Promise<unknown>>();
  for (const resolver of resolvers) {
    assertResolverBinding(resolver);
    const binding = resolverBindingKey(resolver.producerId, resolver.authorityContractId);
    if (resolverByBinding.has(binding)) fail("ERR_DECISION_AUTHORITY_RESOLVER_CONFLICT");
    // Capture the method and receiver now so later mutation cannot redirect this reader.
    resolverByBinding.set(binding, resolver.resolve.bind(resolver));
  }

  return {
    async resolve(reference: AuthoritativeStateReference): Promise<AuthoritativeStateResolution> {
      const capturedReference = validateAndCaptureReference(reference);
      const resolveBoundState = resolverByBinding.get(resolverBindingKey(capturedReference.producerId, capturedReference.authorityContractId));
      if (resolveBoundState === undefined) throw new Error("ERR_DECISION_AUTHORITY_RESOLVER_NOT_FOUND");
      const payload = await resolveBoundState({ ...capturedReference });
      return { reference: { ...capturedReference }, payload };
    }
  };
}
