# ADR 001: Model output is proposal, not truth

## Status

Implemented for Discovery and Convergence proposal handling. Verification-judgment production/origin remains outside the current module because no in-repo VFY judging runtime is implemented.

## Decision

Discovery and Convergence providers return strict structured proposal payloads. Their output is untrusted proposal **content** and carries no publication authority. Model-proposed semantic content may nevertheless survive the governed chain and appear in a final snapshot, including canonical name, scope, structural definition, primary domain, and convergence relation type/reason.

The governing invariant is therefore:

```text
MODEL MAY PROPOSE CONTENT
MODEL PROPOSAL DOES NOT CARRY TRUTH/PUBLICATION AUTHORITY
```

In this ADR, “truth” means authority to govern Phase-4 publication, not proof that semantic content is epistemically correct.

CONDYN owns parsing, deterministic identity, literal-evidence verification, validation, reconstruction, chain authentication, persisted-authority establishment, and publication. Within the supported Capability Core API of the shipped concrete repositories, final publication is constructed only after deterministic authentication and exact equality against persisted RUN, CONV, and VFY repository artifacts. The resulting `AuthoritativeCapabilityVerificationChain` is descriptive of that result, not a caller-supplied publication capability. Authenticated is not Authoritative.

## Evidence

- `discovery/runtime.ts` parses `CapabilityKernelOutputSchema`, replays coverage, and calls `verifyCandidateEvidence`.
- `convergence/validator.ts` requires complete eligible-candidate coverage and validates proposed relations.
- `verification/authenticator.ts` re-parses supplied Discovery and Convergence structured outputs; deterministically reconstructs candidate/evidence and canonical convergence-derived artifacts; re-verifies evidence against supplied source documents; checks hashes, identities, coverage, reconciliation, and bindings; and requires exact reconstructed artifact equality. It does not independently regenerate provider semantic proposals from source documents.
- The supplied VFY is checked for exact structural shape, deterministic identity and payload hash, exact coverage, Source/CONV lineage bindings, and deterministically re-derived publication eligibility. It must exactly equal its immutable persisted repository artifact before it can authorize final publication.
- `repository.ts` derives CAP/evidence/REL/SNAP state inside the bound publisher.

## Consequence

Discovery/Convergence provider output cannot directly choose final CAP IDs, choose final EVD inventory as authoritative evidence, choose final REL IDs, choose Phase-4 publication metadata, invoke the private Phase-4 writer, or bypass persisted authority. Deterministic IDs and final graph construction remain CONDYN-owned even when semantic proposal content originated with a provider.

No in-repo verification provider or semantic judge currently produces semantic-definition, demonstrated-level, or relation-disposition outcomes. The module proves VFY integrity, chain binding, coverage, persisted authority, and publication use; it does not prove from code alone the epistemic origin or independence of those judgments. Persistence does not itself prove semantic correctness.

```text
PROVIDER: DISCOVER / PROPOSE
CONDYN:   PARSE / IDENTIFY / VERIFY EVIDENCE / VALIDATE / RECONSTRUCT /
          AUTHENTICATE / ESTABLISH PERSISTED AUTHORITY / PUBLISH

Current VFY limitation: judgment production is not yet implemented in-repo.
```
