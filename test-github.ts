import { GoogleGenAI } from "@google/genai";
import { loadGitHubRepositoryDocuments } from "./lib/career/loaders/github";
import { buildCareerAnalysisPrompt } from "./lib/career/adapter";
import { GeminiProvider } from "./lib/career/providers/gemini";
import { processLlmOutput } from "./lib/career/adapter";
import fs from "fs";

async function run() {
  const repoUrl = process.argv[2] || "https://github.com/microsoft/TypeScript";
  
  console.log("1. Loading GitHub repository...");
  console.log(`URL: ${repoUrl}`);
  
  const docs = await loadGitHubRepositoryDocuments(repoUrl, { maxFiles: 5 });
  console.log(`2. Documents loaded: ${docs.length}`);
  
  console.log("3. Runtime document IDs:");
  docs.forEach(d => console.log(`   ${d.docId} (${d.title})`));
  
  console.log("4. Building Prompt...");
  const prompt = buildCareerAnalysisPrompt(docs);
  console.log("User prompt chars:", prompt.userPrompt.length);
  console.log("System prompt chars:", prompt.systemPrompt.length);
  
  console.log("5. allowedDocIds:", JSON.stringify(prompt.allowedDocIds));
  
  console.log("6. Executing GeminiProvider...");
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    try {
      const envFile = fs.readFileSync(".env.local", "utf8");
      envFile.split("\n").forEach(line => {
        let match = line.match(/^GEMINI_API_KEY=(.*)$/);
        if (match) process.env.GEMINI_API_KEY = match[1].trim().replace(/^"|"$/g, '');
        
        match = line.match(/^GEMINI_MODEL=(.*)$/);
        if (match) process.env.GEMINI_MODEL = match[1].trim().replace(/^"|"$/g, '');
      });
    } catch(e) {}
  }
  
  const provider = new GeminiProvider();
  let rawOutput = "";
  try {
    rawOutput = await provider.execute(prompt);
    console.log("GeminiProvider SUCCESS. Output length:", rawOutput.length);
  } catch (err: any) {
    console.error("GeminiProvider FAILED:");
    console.error(err.message || err);
    process.exit(1);
  }

  console.log("7. Validating and Assembling...");
  const context = {
    analysis_id: "ANL_TEST_GITHUB",
    execution_duration_ms: 0,
    document_count: docs.length,
    pipeline_steps: [],
    documents: docs
  };
  const result = processLlmOutput(rawOutput, context);
  
  if (result.success) {
    console.log("8. VALIDATION SUCCESS!");
    console.log("9. Final Canonical Entities Count:", 
      (result.data?.structured_data?.analysis?.documents?.length || 0) +
      (result.data?.structured_data?.analysis?.capabilities?.length || 0) +
      (result.data?.structured_data?.analysis?.roles?.length || 0) +
      (result.data?.structured_data?.analysis?.organizations?.length || 0)
    );
  } else {
    console.error("8. VALIDATION FAILED:");
    console.error(JSON.stringify(result.issues, null, 2));
    process.exit(1);
  }
}

run().catch(err => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
