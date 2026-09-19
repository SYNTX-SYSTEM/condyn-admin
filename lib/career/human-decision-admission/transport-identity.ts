export interface AuthenticatedPrincipal {
  issuer: string;
  subject: string;
}

export interface AuthenticatedPrincipalResolver {
  resolveAuthenticatedPrincipal(request: Request): Promise<AuthenticatedPrincipal | null>;
}

export interface ActorIdentityBindingResolver {
  resolveCanonicalActorId(principal: AuthenticatedPrincipal): Promise<string | null>;
}

export interface HumanDecisionTransportIdentityDependencies {
  principals: AuthenticatedPrincipalResolver;
  bindings: ActorIdentityBindingResolver;
}

export interface AdmittedHumanDecisionTransportIdentity {
  principal: AuthenticatedPrincipal;
  authenticatedActorId: string;
}

const failure = (): never => {
  throw new Error("ERR_HUMAN_DECISION_TRANSPORT_IDENTITY_RESOLUTION_FAILED");
};

function canonicalText(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.trim().length > 0 && value.trim() === value;
}

function exactPrincipal(value: unknown): AuthenticatedPrincipal {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return failure();
  const candidate = value as Record<string, unknown>;
  const keys = Object.getOwnPropertyNames(candidate);
  if (
    keys.length !== 2 ||
    !Object.prototype.hasOwnProperty.call(candidate, "issuer") ||
    !Object.prototype.hasOwnProperty.call(candidate, "subject") ||
    Object.getOwnPropertySymbols(candidate).length !== 0 ||
    !canonicalText(candidate.issuer) ||
    !canonicalText(candidate.subject)
  ) return failure();
  return { issuer: candidate.issuer, subject: candidate.subject };
}

function dependencies(value: HumanDecisionTransportIdentityDependencies): HumanDecisionTransportIdentityDependencies {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    typeof value.principals !== "object" ||
    value.principals === null ||
    typeof value.bindings !== "object" ||
    value.bindings === null ||
    typeof value.principals.resolveAuthenticatedPrincipal !== "function" ||
    typeof value.bindings.resolveCanonicalActorId !== "function"
  ) return failure();
  return value;
}

export async function admitHumanDecisionTransportIdentity(
  request: Request,
  declarantActorId: string,
  input: HumanDecisionTransportIdentityDependencies
): Promise<AdmittedHumanDecisionTransportIdentity> {
  let value: HumanDecisionTransportIdentityDependencies;
  try {
    value = dependencies(input);
    if (!canonicalText(declarantActorId)) return failure();
  } catch {
    return failure();
  }

  let resolved: AuthenticatedPrincipal | null;
  try {
    resolved = await value.principals.resolveAuthenticatedPrincipal(request);
  } catch {
    return failure();
  }
  if (resolved === null) throw new Error("ERR_HUMAN_DECISION_TRANSPORT_UNAUTHENTICATED");

  let principal: AuthenticatedPrincipal;
  try {
    principal = exactPrincipal(resolved);
  } catch {
    return failure();
  }

  let authenticatedActorId: string | null;
  try {
    authenticatedActorId = await value.bindings.resolveCanonicalActorId(principal);
  } catch {
    return failure();
  }
  if (authenticatedActorId === null) throw new Error("ERR_HUMAN_DECISION_TRANSPORT_PRINCIPAL_UNMAPPED");
  if (!canonicalText(authenticatedActorId)) return failure();
  if (authenticatedActorId !== declarantActorId) throw new Error("ERR_HUMAN_DECISION_TRANSPORT_DECLARANT_PRINCIPAL_MISMATCH");

  return {
    principal: { issuer: principal.issuer, subject: principal.subject },
    authenticatedActorId
  };
}
