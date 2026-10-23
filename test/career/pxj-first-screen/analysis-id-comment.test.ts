import { readFileSync, existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Owner "OWNER_GO_FULL_PXJ_CLOSURE" §05, N-4 F-RF-4 (GELB): the comment on the URL's analysisId said it fed the Job Pool match
 * panel only and loaded nothing into the planetarium; since G1 the analysis is loaded for the first screen. The parameter's
 * declarations (page.tsx before N-1, the shared URL props since, the field's prop) say what the code does. A text check.
 */
const files = ["app/career/demo/page.tsx", "lib/career/ui/career-demo-url.ts", "app/components/career/demo/SemanticCareerIntelligenceField.tsx"].filter(existsSync);
const comment = (source: string) => /\/\*\*((?:(?!\*\/)[\s\S])*)\*\/\s*analysisId\?: string;/.exec(source)?.[1] ?? null;

describe("N-4 · the analysisId comment says what G1 does", () => {
  it("REPRODUCE: no declaration says the analysis is the match panel's only or loads nothing", () => {
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/loads nothing into the planetarium/);
      expect(source, file).not.toMatch(/Job Pool match panel only/);
    }
  });

  it("inverse: the shared URL props and the field name the first screen at analysisId", () => {
    for (const file of ["lib/career/ui/career-demo-url.ts", "app/components/career/demo/SemanticCareerIntelligenceField.tsx"]) {
      expect(comment(readFileSync(file, "utf8")), file).toMatch(/first screen/);
    }
  });
});
