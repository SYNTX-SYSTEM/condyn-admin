import type { SourceDocument } from "../source";
import type { CapabilityDiscoveryPrompt, ResolvedCapabilityKernel } from "./types";
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
export function buildCapabilityDiscoveryPrompt(documents: SourceDocument[], resolvedKernel: ResolvedCapabilityKernel): CapabilityDiscoveryPrompt {
  const sections = documents.slice().sort((a, b) => compare(a.docId, b.docId)).map((document) => {
    const header = `<SOURCE_DOCUMENT>\nDOC_ID: ${document.docId}\nTITLE: ${document.title}\nMIME_TYPE: ${document.mimeType ?? ""}\n`;
    const body = document.pages?.length ? document.pages.slice().sort((a, b) => a.pageNumber - b.pageNumber).map((page) => `<PAGE number="${page.pageNumber}">\n${page.normalizedText}\n</PAGE>`).join("\n") : document.normalizedText;
    return `${header}${body}\n</SOURCE_DOCUMENT>`;
  });
  return { systemPrompt: resolvedKernel.plainTextContent, userPrompt: `CONDYN CAPABILITY DISCOVERY SOURCE CORPUS\nSOURCE_DOCUMENT_COUNT: ${documents.length}\n\n${sections.join("\n\n")}` };
}
