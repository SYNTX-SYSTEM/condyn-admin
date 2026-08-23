import type { CapabilityCandidate, EvidenceClaim } from "./schema";
import { normalizeEvidenceMatchText, type SourceDocument } from "./source";

function rejection(claim: EvidenceClaim, status: EvidenceClaim["verification"]["status"], reason: string): EvidenceClaim {
  return { ...claim, verification: { status, reason } };
}

function declaredPage(location: string): number | undefined {
  const match = /\b(?:page|seite)\s+(\d+)\b/i.exec(location);
  return match ? Number(match[1]) : undefined;
}

export function verifyEvidenceClaim(claim: EvidenceClaim, documents: SourceDocument[]): EvidenceClaim {
  const exactDocIdMatches = documents.filter(({ docId }) => docId === claim.sourceDocumentRef);
  const titleMatches = exactDocIdMatches.length ? exactDocIdMatches : documents.filter(({ title }) => title === claim.sourceDocumentRef);
  if (titleMatches.length !== 1) {
    return rejection(claim, "REJECTED_UNKNOWN_SOURCE", titleMatches.length ? "Ambiguous source title." : "Unknown source document.");
  }
  if (!claim.exactQuote.trim()) return rejection(claim, "REJECTED_EMPTY_QUOTE", "Evidence quote is empty.");

  const document = titleMatches[0];
  const normalizedQuote = normalizeEvidenceMatchText(claim.exactQuote);
  const expectedPage = declaredPage(claim.declaredLocation);
  const matchedPages = (document.pages ?? []).filter((page) => normalizeEvidenceMatchText(page.normalizedText).includes(normalizedQuote));
  if (document.pages) {
    if (expectedPage !== undefined) {
      const declaredSourcePage = document.pages.find((page) => page.pageNumber === expectedPage);
      if (declaredSourcePage && normalizeEvidenceMatchText(declaredSourcePage.normalizedText).includes(normalizedQuote)) {
        const sourceText = normalizeEvidenceMatchText(declaredSourcePage.normalizedText);
        const sourceSpanStart = sourceText.indexOf(normalizedQuote);
        return { ...claim, verification: { status: "VERIFIED", matchedDocId: document.docId, matchedPageNumber: declaredSourcePage.pageNumber, matchedNormalizedQuote: normalizedQuote, sourceSpanStart, sourceSpanEnd: sourceSpanStart + normalizedQuote.length } };
      }
      return rejection(claim, matchedPages.length ? "REJECTED_LOCATION_MISMATCH" : "REJECTED_QUOTE_NOT_FOUND", matchedPages.length ? `Declared page ${expectedPage} does not contain the quote.` : "Exact normalized quote was not found in source.");
    }
    if (!matchedPages.length) return rejection(claim, "REJECTED_QUOTE_NOT_FOUND", "Exact normalized quote was not found in source.");
  }
  const matchedPage = matchedPages.length === 1 ? matchedPages[0] : undefined;
  const sourceText = matchedPage ? normalizeEvidenceMatchText(matchedPage.normalizedText) : normalizeEvidenceMatchText(document.normalizedText);
  const sourceSpanStart = sourceText.indexOf(normalizedQuote);
  if (sourceSpanStart === -1) return rejection(claim, "REJECTED_QUOTE_NOT_FOUND", "Exact normalized quote was not found in source.");
  return { ...claim, verification: { status: "VERIFIED", matchedDocId: document.docId, ...(matchedPage ? { matchedPageNumber: matchedPage.pageNumber } : {}), matchedNormalizedQuote: normalizedQuote, sourceSpanStart, sourceSpanEnd: sourceSpanStart + normalizedQuote.length } };
}

export function verifyCandidateEvidence(candidate: CapabilityCandidate, documents: SourceDocument[]): CapabilityCandidate {
  const evidenceClaims = candidate.evidenceClaims.map((claim) => verifyEvidenceClaim(claim, documents));
  return { ...candidate, evidenceClaims, status: evidenceClaims.some(({ verification }) => verification.status === "VERIFIED") ? "EVIDENCE_PASSED" : "EVIDENCE_REJECTED" };
}
