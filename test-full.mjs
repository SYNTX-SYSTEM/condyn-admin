import { GoogleGenAI } from "@google/genai";
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

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Read the compiled schema output from our vitest run
// Wait, I can just dynamically import the ts file if I use tsx. But tsx fails.
// Let's just import the schema from a quick script
