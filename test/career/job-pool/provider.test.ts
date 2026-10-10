import { describe, expect, it } from "vitest";
import { createJobPoolRequirementProvider, requiredLevelStateFor, requirementProposalFor, roleProfileEnvelopeFor } from "../../../lib/career/job-pool/provider";
import { renderPoolSourceContent } from "../../../lib/career/job-pool/source-content";
import { parseJobPoolUpload } from "../../../lib/career/job-pool/upload";
import { canonicalizeRequirementEvidence, canonicalizeTargetRequirementPayload } from "../../../lib/career/target/role/requirement/canonicalize";
import { canonicalizeTargetRoleProfilePayload } from "../../../lib/career/target/role/profile/canonicalize";
import { samplePoolText } from "./fixtures";

const pool = () => parseJobPoolUpload(samplePoolText()).pool;
const requirement = (overrides: Record<string, unknown>) => ({ id: "r1", role_id: "x", capability_name: "Rust", domain: "Systems", weight: 0.5, required_level: "L4 - Advanced", ...overrides }) as never;

describe("deterministic JSON pool providers (JP-U)", () => {
  it("renders one LF-joined, id-scoped source without trailing spaces, identical across runs", () => {
    const text = renderPoolSourceContent(pool());
    expect(text).toBe(renderPoolSourceContent(pool()));
    expect(text).not.toMatch(/\r|[ \t]\n|[ \t]$/);
    expect(text.split("\n")[0]).toBe("CONDYN JOB POOL SOURCE V1");
  });

  it("emits only evidence quotes that are exact lines of the source and payloads the canonical target contracts accept", () => {
    const p = pool();
    const lines = new Set(renderPoolSourceContent(p).split("\n"));
    for (const role of p.roles) {
      const envelope = roleProfileEnvelopeFor(role, "TROB_X");
      for (const claim of envelope.evidence as Array<{ exactQuote: string }>) expect(lines.has(claim.exactQuote), claim.exactQuote).toBe(true);
      expect(() => canonicalizeTargetRoleProfilePayload(envelope.profile)).not.toThrow();
    }
    for (const item of p.requirements) {
      const proposal = requirementProposalFor(item);
      for (const claim of proposal.evidence) expect(lines.has(claim.exactQuote), claim.exactQuote).toBe(true);
      expect(() => canonicalizeTargetRequirementPayload(proposal.requirement)).not.toThrow();
      expect(() => canonicalizeRequirementEvidence(proposal.evidence)).not.toThrow();
    }
  });

  it("applies the level mapping table JOB_POOL_REQUIRED_LEVEL_MAPPING_V1", () => {
    expect(requiredLevelStateFor(requirement({ required_level: "L4 - Advanced" }))).toEqual({ kind: "CAPABILITY_LEVEL", level: "L4" });
    expect(requiredLevelStateFor(requirement({ required_level: "l6" }))).toEqual({ kind: "CAPABILITY_LEVEL", level: "L6" });
    expect(requiredLevelStateFor(requirement({ required_level: "L7" }))).toEqual({ kind: "UNKNOWN" });
    expect(requiredLevelStateFor(requirement({ required_level: "L10" }))).toEqual({ kind: "UNKNOWN" });
    expect(requiredLevelStateFor(requirement({ required_level: "Senior" }))).toEqual({ kind: "UNKNOWN" });
    expect(requiredLevelStateFor(requirement({ required_level: "" }))).toEqual({ kind: "UNKNOWN" });
    expect(requiredLevelStateFor(requirement({ required_level: "C1", requirement_type: "LANGUAGE" }))).toEqual({ kind: "LANGUAGE_PROFICIENCY", proficiency: "C1" });
    expect(requiredLevelStateFor(requirement({ required_level: "5 years", requirement_type: "EXPERIENCE" }))).toEqual({ kind: "EXPERIENCE_DURATION", minimumDuration: "5 years" });
    expect(requiredLevelStateFor(requirement({ required_level: "x", requirement_type: "LOCATION" }))).toEqual({ kind: "UNKNOWN" });
  });

  it("marks undeclared necessity and unmapped levels as UNKNOWN in both state and validation (C3, C7), and never maps weight", () => {
    const undeclared = requirementProposalFor(requirement({ required_level: "Senior" }));
    expect(undeclared.requirement.necessityState).toEqual({ kind: "UNKNOWN" });
    expect(undeclared.validation.necessityValidationState).toBe("UNKNOWN");
    expect(undeclared.validation.requiredLevelValidationState).toBe("UNKNOWN");
    const declared = requirementProposalFor(requirement({ necessity: "REQUIRED" }));
    expect(declared.requirement.necessityState).toEqual({ kind: "REQUIRED" });
    expect(declared.validation.necessityValidationState).toBe("SUPPORTED");
    expect(JSON.stringify(declared)).not.toContain("0.5");
  });

  it("returns identical raw output for identical requests and refuses profiles it does not own", async () => {
    const p = pool();
    const map = new Map([["TRPREV_A", p.roles[0]]]);
    const provider = createJobPoolRequirementProvider(p, map);
    const request = { profiles: [{ targetRoleProfileRevisionId: "TRPREV_A", normalizedContent: "" }] };
    expect((await provider.execute(request)).rawOutput).toBe((await provider.execute(request)).rawOutput);
    await expect(provider.execute({ profiles: [{ targetRoleProfileRevisionId: "TRPREV_B", normalizedContent: "" }] })).rejects.toThrow("ERR_JOB_POOL_PROVIDER_PROFILE_UNBOUND");
  });
});
