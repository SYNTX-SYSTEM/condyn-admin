import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { sql } from "drizzle-orm";
import { db, initDbSchema } from "../lib/career/db/client";
import { prepareDocuments } from "../lib/career/orchestration/document-loader";
import { POST } from "../app/api/career/analyze/route";

/** GitHub account input, end to end up to the extraction entry: the route accepts it, the worker's document preparation loads it. No network, no model. */
const b64 = (text: string) => Buffer.from(text).toString("base64");
const stubGitHub = (listing: unknown[]) => {
  const urls: string[] = [];
  vi.stubGlobal("fetch", async (url: string) => {
    urls.push(String(url));
    if (String(url).startsWith("https://api.github.com/users/")) return { ok: true, status: 200, json: async () => listing };
    const m = String(url).match(/\/repos\/[^/]+\/([^/]+)\/readme$/);
    return m ? { ok: true, status: 200, json: async () => ({ path: "README.md", content: b64(`# ${m[1]}`) }) } : { ok: false, status: 404 };
  });
  return urls;
};
const repo = (name: string, pushedAt: string) => ({ name, fork: false, archived: false, disabled: false, private: false, pushed_at: pushedAt });
const analyze = (documents: unknown[]) => POST(new Request("http://local/api/career/analyze", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ documents, investigation: { mode: "PERSON" } }) }));
const created: string[] = [];

describe("GitHub account input reaches the extraction", () => {
  afterEach(() => vi.unstubAllGlobals());
  afterAll(async () => { for (const id of created) await db.execute(sql`DELETE FROM career_analysis_jobs WHERE job_id = ${id}`); });

  it("prepareDocuments loads an account through the automatic selection and gives the documents canonical ids", async () => {
    const urls = stubGitHub([repo("alpha", "2025-02-01T00:00:00Z"), repo("beta", "2025-01-01T00:00:00Z")]);
    const { normalizedDocs, sourceManifest } = await prepareDocuments([{ type: "github", url: "https://github.com/octo", docId: "SRC_1" }]);
    expect(normalizedDocs.map(d => d.content)).toEqual(["# alpha", "# beta"]);
    expect(normalizedDocs.map(d => d.docId)).toEqual(["DOC_001", "DOC_002"]);
    expect(sourceManifest.map(m => m.sourceRef)).toEqual(["SRC_1", "SRC_1"]);
    expect(urls.every(u => u.startsWith("https://api.github.com/"))).toBe(true);
  });

  it("the analyze route accepts an account on github.com and on www.github.com, and still refuses other hosts", async () => {
    await initDbSchema();
    for (const url of ["https://github.com/octo", "https://www.github.com/octo", "https://github.com/octo/tool/tree/main"]) {
      const response = await analyze([{ type: "github", url }]);
      expect([response.status, url]).toEqual([202, url]);
      created.push((await response.json()).jobId);
    }
    for (const url of ["https://gitlab.com/octo", "https://github.com.evil.example/octo", "https://api.github.com/octo"]) {
      const response = await analyze([{ type: "github", url }]);
      expect([response.status, (await response.json()).issues[0].code, url]).toEqual([400, "ERR_INVALID_GITHUB_URL", url]);
    }
  });
});
