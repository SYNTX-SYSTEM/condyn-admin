# ADR 003: Source evidence representation has a Phase-4 hash

## Status

Implemented.

## Decision

Phase 4 supplements, rather than replaces, the backwards-compatible Phase-1–3 `sourceBundleHash` contract:

```text
SHA256(JSON.stringify(
  SourceDocuments
    -> map { docId, normalizedTextHash }
    -> sort by docId
))
```

Phase-4 authentication recomputes and authenticates both `sourceBundleHash` and `sourceEvidenceRepresentationHash`.

`computeSourceEvidenceRepresentationHash` canonicalizes documents by `docId`, canonicalizes pages by `pageNumber`, serializes with `stableVerificationJsonStringify`, and hashes the representation with SHA-256. Its representation is equivalent to:

```text
[
  {
    docId,
    title,
    normalizedTextHash,
    pagesPresent,
    pages: [
      [pageNumber, SHA256(page.normalizedText)],
      ...
    ]
  },
  ...
]
```

`docId` is explicit because evidence source resolution observes it. `title`, normalized document text, page presence, page numbers, and normalized page text are bound because they are the current evidence-observable source state.

### Normalized document and page text

The representation contains `normalizedTextHash`, not the complete normalized document text. During authentication, however, `SHA256(document.normalizedText)` must exactly equal `document.normalizedTextHash`. The representation hash therefore transitively commits to the normalized document text used by evidence matching. It does not bind raw content.

For each page, the representation binds `pageNumber` and `SHA256(page.normalizedText)`. The computation additionally requires:

```text
page.normalizedText === normalizeSourceText(page.text)
```

Consequently, raw page-text differences that normalize to the same normalized page text do not intentionally produce different evidence-representation hashes.

`pagesPresent` remains explicit. `document.pages === undefined` is distinct from `document.pages === []`, because `verifyEvidenceClaim` has different behavior when pages are present.

The implemented notion of page partitioning is the association of page number with normalized page-content hash. It does not hash byte offsets or literal PDF-boundary objects. Thus one page containing `Proof` is representation-distinct from page 1 containing `Pro` and page 2 containing `of`, even when whole-document normalized text otherwise represents the same text.

### Canonical equivalence and VFY binding

A change to the canonical evidence-observable source representation changes `sourceEvidenceRepresentationHash` and therefore changes the VFY identity. Incidental ordering does not:

- Reordering `SourceDocument[]` without changing content does not change the hash because documents are sorted by `docId`.
- Reordering pages without changing their page numbers or content does not change the hash because pages are sorted by `pageNumber`.
- Raw text differences that normalize to the same normalized text do not change the canonical evidence representation.

These are intentional canonical equivalences, not silent identity reuse.

`sourceEvidenceRepresentationHash` is a direct VFY identity input. The VFY tuple is:

```text
[
  convergenceRunId,
  convergenceRawOutputHash,
  sourceEvidenceRepresentationHash,
  kernelVersion,
  promptChecksum,
  provider,
  model,
  schemaVersion,
  algorithmVersion,
  snapshotSchemaVersion
]
```

`sourceBundleHash` remains authenticated lineage state even though it is not itself a VFY identity input.

### Current evidence observer and intentional exclusions

`verifyEvidenceClaim` observes:

- `document.docId` for exact source resolution;
- `document.title` as fallback source resolution;
- `document.normalizedText` for document-level quote matching;
- presence or absence of `document.pages`;
- `page.pageNumber` for declared-page matching; and
- `page.normalizedText` for page-level quote matching.

The representation binds the canonical form of this current evidence-resolution surface. It intentionally excludes `mimeType`, `rawContentHash`, and `metadata`: the current evidence matcher does not observe them, so they do not participate in `sourceEvidenceRepresentationHash` or influence VFY identity through this hash. This does not make them globally irrelevant to the application.

### Layered source and evidence authentication

Phase-4 authentication is more than a representation-hash comparison. It first recomputes both hashes and immediately requires:

```text
Discovery.sourceBundleHash == recomputed sourceBundleHash
CONV.sourceBundleHash      == recomputed sourceBundleHash
VFY.sourceBundleHash       == recomputed sourceBundleHash
VFY.sourceEvidenceRepresentationHash
                           == recomputed representation hash
```

It then deterministically reconstructs Discovery candidates and evidence, and literally re-verifies evidence against the same supplied source documents. The representation hash is therefore one part of a layered source/evidence authentication boundary, not the only source-integrity mechanism.

### Validation split

`verification/authenticator.ts` validates supplied `SourceDocument` shape before hash use, including:

- a non-empty source collection;
- unique, non-empty `docId` values;
- non-empty titles;
- `normalizedText` and `normalizedTextHash` shape and consistency;
- pages-array shape when present;
- integer `pageNumber` values; and
- string `page.text` and `page.normalizedText` values.

`computeSourceEvidenceRepresentationHash` in `verification/run.ts` enforces representation-specific consistency: unique document IDs, normalized-document hash consistency, unique page numbers within each `SourceDocument`, and `page.normalizedText === normalizeSourceText(page.text)`. It then computes the canonical representation hash.

## Evidence

- `hashing.ts` defines the backwards-compatible `sourceBundleHash`.
- `source.ts` defines `SourceDocument` and `SourcePage`, `normalizeSourceText`, and `normalizeEvidenceMatchText`.
- `evidence-validator.ts` implements the source fields observed by evidence matching.
- `verification/run.ts` canonicalizes and hashes `sourceEvidenceRepresentationHash`.
- `verification/authenticator.ts` validates source shape, recomputes and binds hashes, reconstructs evidence, and re-verifies it.
- `verification/integrity-contract.test.ts` covers page content, page partitioning, page numbers, duplicate pages, normalized-page consistency, ordering canonicalization, title, and `pages === undefined` versus `pages === []`.

## Consequence

1. `docId` and title participate in `sourceEvidenceRepresentationHash`.
2. Full raw content does not participate.
3. Normalized document text is effectively bound through the validated `normalizedTextHash`.
4. `pages === undefined` and `pages === []` are not equivalent.
5. Page and document input ordering do not affect the hash.
6. Changing a page number or page partitioning changes the hash.
7. A raw page-text change need not change the hash when normalization yields the same normalized page text.
8. `mimeType`, `rawContentHash`, and `metadata` are not part of the current evidence representation.
9. A changed canonical evidence representation cannot reuse the same VFY identity because the representation hash is a VFY identity input.
10. The representation hash does not replace `sourceBundleHash` and is not the only evidence-authentication defense.
