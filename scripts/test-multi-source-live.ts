import { loadWebsiteDocument } from "../lib/career/loaders/website";
import { loadGitHubRepositoryDocuments } from "../lib/career/loaders/github";
import { executeCareerAnalysisPipeline } from "../lib/career/pipeline";
import { getCareerInferenceProvider } from "../lib/career/providers";
import { buildCapabilityProofChain } from "../lib/career/evidence/proof-chain";
import * as fs from "fs";
import * as path from "path";

try {
  const envFile = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
  envFile.split("\n").forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim().replace(/^"|"$/g, '');
    }
  });
} catch (e) {}

async function run() {
  console.log("Starting Live Proof Inspection (TEST002A)...");

  // Load PDF
  const pdfBase64 = fs.readFileSync(path.join(process.cwd(), "public", "showcase.pdf")).toString("base64");
  
  const documents: any[] = [];
  documents.push({
    url: "file://showcase.pdf",
    type: "pdf",
    title: "Showcase PDF",
    content: pdfBase64,
    docId: "DOC_001"
  });

  // Load GitHub
  const githubDocs = await loadGitHubRepositoryDocuments("https://github.com/vercel/next.js");
  githubDocs.forEach((d, i) => d.docId = `DOC_GH_00${i + 1}`);
  documents.push(...githubDocs);

  // Load Website
  const webDoc = await loadWebsiteDocument("https://vercel.com", "Vercel", "DOC_WEB_001");
  documents.push(webDoc);

  // Text
  documents.push({
    url: "memory://manual-text",
    type: "markdown",
    title: "Manual Input",
    content: "Senior Engineer specializing in distributed architectures.",
    docId: "DOC_TXT_001"
  });

  const provider = getCareerInferenceProvider();
  
  const sourceManifest = documents.map(d => ({
    canonicalDocumentId: d.docId,
    sourceRef: d.url || d.metadata?.uri || "unknown"
  }));

  console.log(`Executing pipeline with ${documents.length} runtime documents...`);
  const result = await executeCareerAnalysisPipeline(documents, provider);

  if (!result.success) {
    console.error("PIPELINE FAILED:", JSON.stringify(result.issues, null, 2));
    return;
  }
  
  const analysis = result.data!.structured_data.analysis;
  console.log(`Pipeline success! Capabilities found: ${analysis.capabilities.length}\n`);
  
  // Find a PDF-only capability and a Multi-source capability (or just take any two distinct ones)
  let singleSourceCap = analysis.capabilities.find(c => c.evidence.length === 1 && c.evidence[0].doc_id === "DOC_001");
  let multiSourceCap = analysis.capabilities.find(c => c.evidence.length > 1);
  
  // Fallbacks if exactly matching ones weren't generated
  if (!singleSourceCap && analysis.capabilities.length > 0) singleSourceCap = analysis.capabilities[0];
  if (!multiSourceCap && analysis.capabilities.length > 1) multiSourceCap = analysis.capabilities[1];

  if (singleSourceCap) {
    console.log("==========================================");
    console.log("INSPECTING SINGLE/PDF CAPABILITY");
    console.log("==========================================");
    const proof = buildCapabilityProofChain(singleSourceCap.entity_id, analysis, sourceManifest);
    console.log(`Capability: ${proof.capability.identity.name}`);
    proof.evidence.forEach(ev => {
      console.log(`  ↓ Evidence Quote: "${ev.context_quote}"`);
      const doc = proof.documents.find(d => d.entity_id === ev.doc_id);
      console.log(`  ↓ Document: ${doc?.identity.name} (${doc?.entity_id})`);
      const src = proof.sources.find(s => s.canonicalDocumentId === ev.doc_id);
      console.log(`  ↓ Original Source: ${src?.sourceRef}`);
      console.log("  ----------------------------------------");
    });
  }

  if (multiSourceCap) {
    console.log("\n==========================================");
    console.log("INSPECTING MULTI-SOURCE CAPABILITY");
    console.log("==========================================");
    const proof = buildCapabilityProofChain(multiSourceCap.entity_id, analysis, sourceManifest);
    console.log(`Capability: ${proof.capability.identity.name}`);
    proof.evidence.forEach(ev => {
      console.log(`  ↓ Evidence Quote: "${ev.context_quote}"`);
      const doc = proof.documents.find(d => d.entity_id === ev.doc_id);
      console.log(`  ↓ Document: ${doc?.identity.name} (${doc?.entity_id})`);
      const src = proof.sources.find(s => s.canonicalDocumentId === ev.doc_id);
      console.log(`  ↓ Original Source: ${src?.sourceRef}`);
      console.log("  ----------------------------------------");
    });
  }
}

run().catch(console.error);
