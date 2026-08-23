import { describe, expect, it } from "vitest";
import { createEvidenceClaim, createSourceDocument, verifyEvidenceClaim } from "../../../lib/career/capability-core";

const quote = "Policy Policy-to-Control Mapping ausführbarer Control Owner Messpunkt Audit Evidence";
const source = createSourceDocument({ docId: "DOC_1", title: "Mercedes", rawContent: quote, pages: [{ pageNumber: 9, text: quote }] });
const claim = (exact_quote: string, source_document = "DOC_1", location = "Page 9") => createEvidenceClaim({ exact_quote, source_document, location });

describe("Capability Core evidence verification", () => {
  it("accepts a quote differing only in whitespace", () => {
    expect(verifyEvidenceClaim(claim("Policy\nPolicy-to-Control\nMapping\nausführbarer Control\nOwner\nMesspunkt\nAudit Evidence", "DOC_1", "Seite 9"), [source]).verification.status).toBe("VERIFIED");
  });
  it("rejects synthetic arrows, paraphrases, unknown sources, and mismatched pages", () => {
    expect(verifyEvidenceClaim(claim("Policy -> Control -> Owner -> Audit Evidence"), [source]).verification.status).toBe("REJECTED_QUOTE_NOT_FOUND");
    expect(verifyEvidenceClaim(claim("Controls are mapped to owners."), [source]).verification.status).toBe("REJECTED_QUOTE_NOT_FOUND");
    expect(verifyEvidenceClaim(claim("Policy", "UNKNOWN"), [source]).verification.status).toBe("REJECTED_UNKNOWN_SOURCE");
    expect(verifyEvidenceClaim(claim("Policy", "DOC_1", "Seite 8"), [source]).verification.status).toBe("REJECTED_LOCATION_MISMATCH");
  });
  it("does not invent a unique page for repeated quotes and resolves exact docId before duplicate titles", () => {
    const repeated = createSourceDocument({ docId: "DOC_REPEAT", title: "Repeated", rawContent: "Repeated quote", pages: [{ pageNumber: 1, text: "Repeated quote" }, { pageNumber: 2, text: "Repeated quote" }] });
    expect(verifyEvidenceClaim(claim("Repeated quote", "DOC_REPEAT", "section A"), [repeated]).verification.matchedPageNumber).toBeUndefined();
    const duplicateTitle = createSourceDocument({ docId: "DOC_2", title: "Mercedes", rawContent: "Other text" });
    expect(verifyEvidenceClaim(claim("Policy", "DOC_1", "Seite 9"), [source, duplicateTitle]).verification.status).toBe("VERIFIED");
  });
});
