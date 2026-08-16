import { executeCareerAnalysisPipeline } from "../lib/career/pipeline";
import { getCareerInferenceProvider } from "../lib/career/providers";
import fs from "fs";
import path from "path";

async function main() {
  console.log("=== CONDYN LIVE PIPELINE VERIFICATION TEST ===");

  // Read .env.local if present
  const envPath = path.resolve(__dirname, "../.env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        process.env[match[1].trim()] = match[2].trim();
      }
    }
  }

  process.env.USE_GEMINI_PROVIDER = "true";

  console.log("Active GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 8)}...` : "NOT SET");
  console.log("Active OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 8)}...` : "NOT SET");

  const provider = getCareerInferenceProvider();
  console.log("Resolved Provider:", provider.constructor.name);

  const sampleDocs = [
    {
      docId: "DOC_001",
      title: "Lebenslauf Max Mustermann Architect",
      content: `
      Senior Systems Architect & Engineering Director mit 12 Jahren Erfahrung in verteilten Cloud-Systemen, IIoT Edge Nodes und High-Availability Gossip Protokollen.
      Projektleiter bei Siemens AG (München) und BMW Group.
      Expertise: TypeScript, Rust, Kubernetes, Distributed Systems, Event-Driven Architectures.
      Sprachen: Deutsch (Muttersprache), Englisch (Fließend).
      `
    }
  ];

  console.log("\nExecuting pipeline...");
  const start = Date.now();
  const result = await executeCareerAnalysisPipeline(sampleDocs, provider);
  const duration = Date.now() - start;

  console.log(`\nPipeline completed in ${duration}ms`);
  console.log("Success:", result.success);
  console.log("Error Count:", result.metrics.errorCount);
  console.log("Warning Count:", result.metrics.warningCount);

  if (!result.success) {
    console.error("\n❌ Validation Issues:");
    console.error(JSON.stringify(result.issues, null, 2));
  } else {
    console.log("\n✓ Validation State:", result.data?.structured_data.analysis.metadata.validation_state);
    console.log("✓ Capabilities count:", result.data?.structured_data.analysis.capabilities.length);
    console.log("✓ Organizations count:", result.data?.structured_data.analysis.organizations.length);
    console.log("✓ Roles count:", result.data?.structured_data.analysis.roles.length);
    console.log("✓ Report Markdown length:", result.data?.report_markdown?.length);
    console.log("\nReport Preview:\n", result.data?.report_markdown?.substring(0, 300));
  }
}

main().catch(err => {
  console.error("Fatal Test Execution Error:", err);
});
