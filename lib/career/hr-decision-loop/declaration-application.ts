import {
  admitHumanDecisionTransportIdentity,
  type AuthenticatedPrincipal,
  type HumanDecisionTransportIdentityDependencies
} from "../human-decision-admission/transport-identity";
import {
  produceAndPersistHumanDecisionRecord,
  type HumanDecisionDeclarationClass,
  type HumanDecisionDeclarationInput,
  type HumanDecisionProducerDependencies,
  type HumanDecisionRecord
} from "../relation/decision-record";

/**
 * The frontend declares one human decision over one exact DCTXREV. The
 * transport carries the declaration as represented; the sealed T11C producer
 * owns identity, witnesses, admissibility and immutability. `createdAt` is the
 * record creation instant supplied by the server clock; it is outside the
 * record identity. `declaredAt` is the human's declaration instant.
 */
export const HR_DECISION_DECLARATION_KEYS = [
  "careerDecisionContextRevisionId",
  "declarantActorId",
  "declarationClass",
  "declaredAt",
  "declarationEvidenceRefs"
] as const;

export const HR_DECISION_DECLARATION_CLASSES: readonly HumanDecisionDeclarationClass[] = [
  "ACCEPT_RECOMMENDATION",
  "REJECT_RECOMMENDATION",
  "DEFER_DECISION",
  "REQUEST_FURTHER_EVIDENCE",
  "REQUEST_TARGET_CLARIFICATION"
];

export interface HrDecisionDeclarationRequest {
  careerDecisionContextRevisionId: string;
  declarantActorId: string;
  declarationClass: HumanDecisionDeclarationClass;
  declaredAt: string;
  declarationEvidenceRefs: readonly string[];
}

export const HR_DECISION_DECLARATION_INVALID = "ERR_HR_DECISION_LOOP_DECLARATION_INVALID";

const fail = (code: string): never => { throw new Error(code); };
const text = (value: unknown): value is string => typeof value === "string" && value.length > 0 && value.trim() === value;

/** Captures exactly the five declaration fields; nothing is trimmed, defaulted or inferred. */
export function captureHrDecisionDeclarationRequest(value: unknown): HrDecisionDeclarationRequest {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return fail(HR_DECISION_DECLARATION_INVALID);
  const keys = Object.keys(value as Record<string, unknown>);
  if (keys.length !== HR_DECISION_DECLARATION_KEYS.length || HR_DECISION_DECLARATION_KEYS.some(key => !Object.prototype.hasOwnProperty.call(value, key))) {
    return fail(HR_DECISION_DECLARATION_INVALID);
  }
  const candidate = value as Record<string, unknown>;
  if (!text(candidate.careerDecisionContextRevisionId) || !text(candidate.declarantActorId) || !text(candidate.declaredAt)) return fail(HR_DECISION_DECLARATION_INVALID);
  if (!HR_DECISION_DECLARATION_CLASSES.includes(candidate.declarationClass as HumanDecisionDeclarationClass)) return fail(HR_DECISION_DECLARATION_INVALID);
  if (!Array.isArray(candidate.declarationEvidenceRefs) || candidate.declarationEvidenceRefs.some(item => !text(item))) return fail(HR_DECISION_DECLARATION_INVALID);
  return {
    careerDecisionContextRevisionId: candidate.careerDecisionContextRevisionId,
    declarantActorId: candidate.declarantActorId,
    declarationClass: candidate.declarationClass as HumanDecisionDeclarationClass,
    declaredAt: candidate.declaredAt,
    declarationEvidenceRefs: [...(candidate.declarationEvidenceRefs as string[])]
  };
}

/**
 * Local development transport identity. There is no authentication provider in
 * the local frontend integration; the browser declares its principal through
 * two explicit headers. The binding admits only the local self-declared issuer
 * and maps the subject to the canonical actor id unchanged. This is a
 * LOCAL_DEVELOPMENT boundary, not authentication, and it never widens the DAR
 * gate: the sealed producer still rejects a declarant the grant does not name.
 */
export const LOCAL_SELF_DECLARED_PRINCIPAL_ISSUER = "LOCAL_DEVELOPMENT_SELF_DECLARED";
export const PRINCIPAL_ISSUER_HEADER = "x-condyn-principal-issuer";
export const PRINCIPAL_SUBJECT_HEADER = "x-condyn-principal-subject";

export function createLocalSelfDeclaredTransportIdentity(): HumanDecisionTransportIdentityDependencies {
  return {
    principals: {
      async resolveAuthenticatedPrincipal(request: Request): Promise<AuthenticatedPrincipal | null> {
        const issuer = request.headers.get(PRINCIPAL_ISSUER_HEADER);
        const subject = request.headers.get(PRINCIPAL_SUBJECT_HEADER);
        if (issuer === null || subject === null) return null;
        return { issuer, subject };
      }
    },
    bindings: {
      async resolveCanonicalActorId(principal: AuthenticatedPrincipal): Promise<string | null> {
        return principal.issuer === LOCAL_SELF_DECLARED_PRINCIPAL_ISSUER ? principal.subject : null;
      }
    }
  };
}

export interface HrDecisionDeclarationApplicationDependencies {
  producer: HumanDecisionProducerDependencies;
  identity: HumanDecisionTransportIdentityDependencies;
  now: () => string;
}

export interface HrDecisionDeclarationApplication {
  declare(request: Request, body: unknown): Promise<HumanDecisionRecord>;
}

/** Transport identity is admitted first, then the sealed producer runs unchanged. */
export function createHrDecisionDeclarationApplication(dependencies: HrDecisionDeclarationApplicationDependencies): HrDecisionDeclarationApplication {
  return {
    async declare(request, body) {
      const declaration = captureHrDecisionDeclarationRequest(body);
      await admitHumanDecisionTransportIdentity(request, declaration.declarantActorId, dependencies.identity);
      const createdAt = dependencies.now();
      const input: HumanDecisionDeclarationInput = {
        careerDecisionContextRevisionId: declaration.careerDecisionContextRevisionId,
        declarantActorId: declaration.declarantActorId,
        declarationClass: declaration.declarationClass,
        declaredAt: declaration.declaredAt,
        declarationEvidenceRefs: declaration.declarationEvidenceRefs,
        createdAt
      };
      return produceAndPersistHumanDecisionRecord(input, dependencies.producer);
    }
  };
}
