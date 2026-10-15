import type { SourceDocument } from "../source";
import type { CapabilityDiscoveryPrompt, CapabilityInvestigationScope, ResolvedCapabilityKernel } from "./types";
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
/** Owner-approved (SFE 2026-10-15, INV-02/INV-03/INV-04): how Discovery uses the scope without treating it as evidence. */
export const INVESTIGATION_SCOPE_CONTRACT = [
  "Investigation scope contract:",
  "The INVESTIGATION_SCOPE below names the selected job: its role, description, requirements and their mapping. It determines the investigation space and the focus of deepening of this Discovery. Capabilities outside the selected role are still reported when the source corpus supports them verbatim.",
  "The INVESTIGATION_SCOPE is not a SOURCE_DOCUMENT and is not evidence. Every evidence claim must quote a SOURCE_DOCUMENT of the source corpus verbatim and reference its DOC_ID.",
  "Never quote or cite the INVESTIGATION_SCOPE. Never report a capability because the job requires it; a capability without verbatim source support is not reported."
].join("\n");

export function buildCapabilityDiscoveryPrompt(documents: SourceDocument[], resolvedKernel: ResolvedCapabilityKernel, investigationScope?: CapabilityInvestigationScope): CapabilityDiscoveryPrompt {
  const sections = documents.slice().sort((a, b) => compare(a.docId, b.docId)).map((document) => {
    const header = `<SOURCE_DOCUMENT>\nDOC_ID: ${document.docId}\nTITLE: ${document.title}\nMIME_TYPE: ${document.mimeType ?? ""}\n`;
    const body = document.pages?.length ? document.pages.slice().sort((a, b) => a.pageNumber - b.pageNumber).map((page) => `<PAGE number="${page.pageNumber}">\n${page.normalizedText}\n</PAGE>`).join("\n") : document.normalizedText;
    return `${header}${body}\n</SOURCE_DOCUMENT>`;
  });
  // The resolver is the sole source of the expected runtime kernel identity.
  // The model is instructed before inference, while Discovery still rejects a
  // mismatch afterward rather than rewriting arbitrary model output.
  // The scope is an instruction: it extends the system prompt and never enters the source corpus (userPrompt),
  // which the unchanged evidence validator alone verifies against. Unscoped prompts are byte-identical to before.
  const scopeSection = investigationScope ? `\n\n${INVESTIGATION_SCOPE_CONTRACT}\n<INVESTIGATION_SCOPE>\n${investigationScope.text}\n</INVESTIGATION_SCOPE>` : "";
  return {
    systemPrompt: `${resolvedKernel.plainTextContent}\n\nOutput identity contract:\n"kernel_version" MUST equal exactly "${resolvedKernel.kernelVersion}".\nDo not substitute the prompt slug, schema version, model version, semantic version shorthand, or any other value.${scopeSection}`,
    userPrompt: `CONDYN CAPABILITY DISCOVERY SOURCE CORPUS\nSOURCE_DOCUMENT_COUNT: ${documents.length}\n\n${sections.join("\n\n")}`
  };
}
