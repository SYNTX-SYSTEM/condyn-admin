import { getGeminiCareerResponseJsonSchema } from "./lib/career/schema-projector";
import * as fs from "fs";

const schema = getGeminiCareerResponseJsonSchema();
const jsonStr = JSON.stringify(schema, null, 2);
fs.writeFileSync("schema_output.json", jsonStr);
console.log("Has $ref?", jsonStr.includes("$ref"));
console.log("Has $defs?", jsonStr.includes("$defs"));
