import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

type AuthenticatedPrincipal = { issuer: string; subject: string };
type Admission = { principal: AuthenticatedPrincipal; authenticatedActorId: string };
type Contract = {
  admitHumanDecisionTransportIdentity(
    request: Request,
    declarantActorId: string,
    dependencies: {
      principals: { resolveAuthenticatedPrincipal(request: Request): Promise<AuthenticatedPrincipal | null> };
      bindings: { resolveCanonicalActorId(principal: AuthenticatedPrincipal): Promise<string | null> };
    }
  ): Promise<Admission>;
};

const modulePath = "../../../lib/career/human-decision-admission/transport-identity.ts";
const sourcePath = resolve(process.cwd(), "lib/career/human-decision-admission/transport-identity.ts");

async function subject(): Promise<Contract> {
  return await import(/* @vite-ignore */ new URL(modulePath, import.meta.url).href) as Contract;
}

function dependencies(
  principal: AuthenticatedPrincipal | null = { issuer: "issuer://condyn", subject: "subject-1" },
  actorId: string | null = "ACTOR_DECIDER"
) {
  return {
    principals: { resolveAuthenticatedPrincipal: vi.fn(async () => principal) },
    bindings: { resolveCanonicalActorId: vi.fn(async () => actorId) }
  };
}

describe("T20 authenticated principal transport identity contract", () => {
  it("exports the intended admission function and admits one exact request/principal/actor equality without retaining resolver-owned principal state", async () => {
    const implementation = await subject();
    expect(Object.keys(implementation)).toEqual(["admitHumanDecisionTransportIdentity"]);
    const request = new Request("https://example.test/api/career/human-decisions", { method: "POST", body: "opaque" });
    const principal = { issuer: "issuer://condyn", subject: "subject-1" };
    const values = dependencies(principal, "ACTOR_DECIDER");

    const result = await implementation.admitHumanDecisionTransportIdentity(request, "ACTOR_DECIDER", values);

    expect(values.principals.resolveAuthenticatedPrincipal).toHaveBeenCalledTimes(1);
    expect(values.principals.resolveAuthenticatedPrincipal).toHaveBeenCalledWith(request);
    expect(values.bindings.resolveCanonicalActorId).toHaveBeenCalledTimes(1);
    expect(values.bindings.resolveCanonicalActorId).toHaveBeenCalledWith({ issuer: "issuer://condyn", subject: "subject-1" });
    expect(Object.keys(result)).toEqual(["principal", "authenticatedActorId"]);
    expect(result).toEqual({ principal: { issuer: "issuer://condyn", subject: "subject-1" }, authenticatedActorId: "ACTOR_DECIDER" });
    principal.subject = "mutated-after-admission";
    expect(result.principal).toEqual({ issuer: "issuer://condyn", subject: "subject-1" });
  });

  it("rejects null principal as unauthenticated and does not call the binding resolver", async () => {
    const implementation = await subject();
    const values = dependencies(null);

    await expect(implementation.admitHumanDecisionTransportIdentity(new Request("https://example.test"), "ACTOR_DECIDER", values))
      .rejects.toThrow("ERR_HUMAN_DECISION_TRANSPORT_UNAUTHENTICATED");
    expect(values.bindings.resolveCanonicalActorId).not.toHaveBeenCalled();
  });

  it("normalizes resolver throws and malformed principal values to the sole resolution-failure error without calling binding", async () => {
    const implementation = await subject();
    const malformed: unknown[] = [
      { issuer: "", subject: "subject" },
      { issuer: " issuer", subject: "subject" },
      { issuer: "issuer", subject: "subject " },
      { issuer: "issuer" },
      { subject: "subject" },
      { issuer: 1, subject: "subject" },
      { issuer: "issuer", subject: 1 },
      { issuer: "issuer", subject: "subject", extra: true }
    ];
    for (const principal of malformed) {
      const values = dependencies(principal as AuthenticatedPrincipal);
      await expect(implementation.admitHumanDecisionTransportIdentity(new Request("https://example.test"), "ACTOR_DECIDER", values))
        .rejects.toThrow("ERR_HUMAN_DECISION_TRANSPORT_IDENTITY_RESOLUTION_FAILED");
      expect(values.bindings.resolveCanonicalActorId).not.toHaveBeenCalled();
    }
    const values = dependencies();
    values.principals.resolveAuthenticatedPrincipal.mockRejectedValueOnce(new Error("provider secret"));
    await expect(implementation.admitHumanDecisionTransportIdentity(new Request("https://example.test"), "ACTOR_DECIDER", values))
      .rejects.toThrow("ERR_HUMAN_DECISION_TRANSPORT_IDENTITY_RESOLUTION_FAILED");
  });

  it("distinguishes unmapped principal from binding failure or malformed bound actor", async () => {
    const implementation = await subject();
    const unmapped = dependencies(undefined, null);
    await expect(implementation.admitHumanDecisionTransportIdentity(new Request("https://example.test"), "ACTOR_DECIDER", unmapped))
      .rejects.toThrow("ERR_HUMAN_DECISION_TRANSPORT_PRINCIPAL_UNMAPPED");

    for (const actorId of ["", " ACTOR_DECIDER", "ACTOR_DECIDER ", 3, {}, []] as unknown[]) {
      const values = dependencies(undefined, actorId as string);
      await expect(implementation.admitHumanDecisionTransportIdentity(new Request("https://example.test"), "ACTOR_DECIDER", values))
        .rejects.toThrow("ERR_HUMAN_DECISION_TRANSPORT_IDENTITY_RESOLUTION_FAILED");
    }
    const values = dependencies();
    values.bindings.resolveCanonicalActorId.mockRejectedValueOnce(new Error("binding secret"));
    await expect(implementation.admitHumanDecisionTransportIdentity(new Request("https://example.test"), "ACTOR_DECIDER", values))
      .rejects.toThrow("ERR_HUMAN_DECISION_TRANSPORT_IDENTITY_RESOLUTION_FAILED");
  });

  it("compares exact actor strings without correction, case folding, or trimming and rejects malformed declarants as resolution failures", async () => {
    const implementation = await subject();
    for (const declarantActorId of ["actor_decider"]) {
      const values = dependencies(undefined, "ACTOR_DECIDER");
      await expect(implementation.admitHumanDecisionTransportIdentity(new Request("https://example.test"), declarantActorId, values))
        .rejects.toThrow("ERR_HUMAN_DECISION_TRANSPORT_DECLARANT_PRINCIPAL_MISMATCH");
    }
    for (const declarantActorId of ["", " actor", "actor ", 1, null, undefined, {}] as unknown[]) {
      const values = dependencies();
      await expect(implementation.admitHumanDecisionTransportIdentity(new Request("https://example.test"), declarantActorId as string, values))
        .rejects.toThrow("ERR_HUMAN_DECISION_TRANSPORT_IDENTITY_RESOLUTION_FAILED");
    }
  });

  it("keeps the frozen module transport-only: no request parsing, time/currentness, providers, persistence, replay, T11 domain construction, or HTTP route", async () => {
    await subject();
    const source = readFileSync(sourcePath, "utf8");
    expect(source).toMatch(/export interface AuthenticatedPrincipal\s*\{\s*issuer: string;\s*subject: string;/s);
    expect(source).toMatch(/export async function admitHumanDecisionTransportIdentity/);
    expect(source).not.toMatch(/\.json\(|headers\.|cookies\(|Authorization|Date\.now|new Date|createdAt|declaredAt|effectiveFrom|effectiveUntil|current|latest|active|head|postgres|drizzle|repository|persist|replay|DecisionAuthorityGrantRevision|CareerDecisionContextRevision|RecommendationProposal|HumanDecisionRecord|HumanDecisionDeclarationInput|commitment|execution|action|outcome|feedback|Auth\.js|NextAuth|Clerk|Keycloak|jose|OAuth|OIDC|Supabase|Firebase|Cognito|Entra/i);
    expect(source).not.toMatch(/declarantActorId\s*=|\.toLowerCase\(/);
    expect(source).not.toMatch(/app\/api|NextResponse|Response\.json/);
  });
});
