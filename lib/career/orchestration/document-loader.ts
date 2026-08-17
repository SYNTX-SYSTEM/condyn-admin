import { loadWebsiteDocument } from "../loaders/website";
import { loadGitHubRepositoryDocuments } from "../loaders/github";
import { loadDocumentBatch } from "../loaders/batch";
import { DocumentInput } from "../adapter";

export async function prepareDocuments(documents: any[]): Promise<{ normalizedDocs: DocumentInput[], sourceManifest: any[] }> {
  const normalizedDocs: DocumentInput[] = [];
  const pendingBatch: any[] = [];
  const sourceManifest: Array<{ canonicalDocumentId: string, sourceRef: string }> = [];
  let canonicalDocCounter = 1;
  const getNextCanonicalId = () => `DOC_${String(canonicalDocCounter++).padStart(3, '0')}`;

  const flushPendingBatch = async () => {
    if (pendingBatch.length > 0) {
      pendingBatch.forEach(item => {
        const canonicalId = getNextCanonicalId();
        if (item.docId) {
          sourceManifest.push({ canonicalDocumentId: canonicalId, sourceRef: item.docId });
        }
        item.docId = canonicalId;
      });
      const batchDocs = await loadDocumentBatch(pendingBatch);
      normalizedDocs.push(...batchDocs);
      pendingBatch.length = 0;
    }
  };

  for (const item of documents) {
    if (item.type === "website") {
      await flushPendingBatch();
      if (!item.url || !String(item.url).trim()) {
        throw new Error("ERR_MISSING_SOURCE_URL: Missing url property for website source.");
      }
      const canonicalId = getNextCanonicalId();
      if (item.docId) {
        sourceManifest.push({ canonicalDocumentId: canonicalId, sourceRef: item.docId });
      }
      const doc = await loadWebsiteDocument(item.url, item.title, canonicalId);
      normalizedDocs.push(doc);
    } else if (item.type === "github") {
      await flushPendingBatch();
      if (!item.url || !String(item.url).trim()) {
        throw new Error("ERR_MISSING_SOURCE_URL: Missing url property for github source.");
      }
      const docs = await loadGitHubRepositoryDocuments(item.url);
      docs.forEach(d => {
        const canonicalId = getNextCanonicalId();
        if (item.docId) {
          sourceManifest.push({ canonicalDocumentId: canonicalId, sourceRef: item.docId });
        }
        d.docId = canonicalId;
      });
      normalizedDocs.push(...docs);
    } else {
      if (item.type === "pdf" && item.content) {
        pendingBatch.push({
          ...item,
          base64: item.content
        });
      } else {
        pendingBatch.push(item);
      }
    }
  }
  await flushPendingBatch();

  return { normalizedDocs, sourceManifest };
}
