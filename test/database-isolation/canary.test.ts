import { writeFileSync } from "node:fs";
import { it } from "vitest";

/** Writes a marker only if a test body actually executed; used by the fail-closed e2e. */
it("canary", () => {
  const target = process.env.CONDYN_ISOLATION_CANARY_FILE;
  if (target) writeFileSync(target, process.env.DATABASE_URL ?? "", "utf8");
});
