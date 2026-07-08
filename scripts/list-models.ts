import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";
import * as path from "path";

// Simple loader for .env.local in script execution
function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...vals] = trimmed.split("=");
        if (key && vals.length > 0) {
          const val = vals.join("=").replace(/^["']|["']$/g, "");
          process.env[key.trim()] = val.trim();
        }
      }
    }
  }
}

async function listModels() {
  loadEnvLocal();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ Kein GEMINI_API_KEY gefunden (weder in environment noch in .env.local)!");
    process.exit(1);
  }

  console.log("🔍 Frage Google Gemini API nach allen verfügbaren Modellen für deinen API Key...\n");
  try {
    const ai = new GoogleGenAI({ apiKey });
    console.log("------------------------------------------------------------");
    console.log("MODELL-ID (für GEMINI_MODEL) | DISPLAY-NAME");
    console.log("------------------------------------------------------------");
    
    let count = 0;
    const response = await ai.models.list();
    let modelList: any[] = [];
    if (Symbol.asyncIterator in Object(response)) {
      for await (const m of (response as any)) {
        modelList.push(m);
      }
    } else if (Array.isArray(response)) {
      modelList = response;
    } else if (response && Array.isArray(response.models)) {
      modelList = response.models;
    } else if (response && Symbol.iterator in Object(response)) {
      modelList = Array.from(response as any);
    } else {
      console.log("⚠️ Unerwartetes SDK-Format, Struktur:", Object.keys(response || {}));
    }

    for (const model of modelList) {
      // Filter primarily for generateContent capable models
      if (model.name && model.name.toLowerCase().includes("gemini")) {
        const cleanName = model.name.replace(/^models\//, "");
        console.log(`${cleanName.padEnd(28)} | ${model.displayName || "N/A"}`);
        count++;
      }
    }
    console.log("------------------------------------------------------------");
    console.log(`✅ ${count} Gemini-Modelle gefunden!`);
    console.log("\n💡 Tipp: Trage eines dieser Modelle in deine .env.local ein, z.B.:");
    console.log('GEMINI_MODEL="gemini-2.0-flash"');
  } catch (err: any) {
    console.error("❌ Fehler beim Abrufen der Modell-Liste:", err.message || err);
  }
}

listModels();
