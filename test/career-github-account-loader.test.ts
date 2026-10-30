import { describe, it, expect } from "vitest";
import { loadGitHubAccountDocuments, loadGitHubSourceDocuments, parseGitHubSourceUrl, selectAccountRepositories } from "../lib/career/loaders/github";

const b64 = (text: string) => Buffer.from(text).toString("base64");
const repo = (name: string, pushedAt: string, extra: Record<string, unknown> = {}) => ({ name, fork: false, archived: false, disabled: false, private: false, pushed_at: pushedAt, ...extra });

/** A fake GitHub API: a listing for the account and a README per repository; every requested URL is recorded. */
function fakeGitHub(listing: unknown, readmes: Record<string, string | null>) {
  const urls: string[] = [];
  const fetcher = async (url: string) => {
    urls.push(url);
    if (url.startsWith("https://api.github.com/users/")) return listing === null ? { ok: false, status: 404 } : { ok: true, status: 200, json: async () => listing };
    const match = url.match(/^https:\/\/api\.github\.com\/repos\/[^/]+\/([^/]+)\/readme$/);
    if (match && readmes[match[1]]) return { ok: true, status: 200, json: async () => ({ path: "README.md", content: b64(readmes[match[1]] as string) }) };
    return { ok: false, status: 404 };
  };
  return { fetcher: fetcher as never, urls };
}

describe("GitHub account input: the automatic, bounded repository selection", () => {
  it("tells an account URL from a repository URL and refuses anything else", () => {
    expect(parseGitHubSourceUrl("https://github.com/octo")).toEqual({ kind: "account", owner: "octo" });
    expect(parseGitHubSourceUrl("https://github.com/octo/")).toEqual({ kind: "account", owner: "octo" });
    expect(parseGitHubSourceUrl("https://www.github.com/octo")).toEqual({ kind: "account", owner: "octo" });
    expect(parseGitHubSourceUrl("https://github.com/octo/tool")).toEqual({ kind: "repo", owner: "octo", repo: "tool" });
    for (const bad of ["https://gitlab.com/octo", "https://github.com/", "https://github.com/-bad", "https://github.com/a..b", "https://github.com/octo%2F..", "https://api.github.com/octo", "not a url", "http://github.com.evil.example/octo"])
      expect(() => parseGitHubSourceUrl(bad), bad).toThrow(/ERR_INVALID_GITHUB_URL/);
  });

  it("selects owned, public, active repositories newest push first, name as tie-break, bounded", () => {
    const listing = [repo("old", "2020-01-01T00:00:00Z"), repo("fork", "2026-01-01T00:00:00Z", { fork: true }), repo("arch", "2026-01-01T00:00:00Z", { archived: true }),
      repo("priv", "2026-01-01T00:00:00Z", { private: true }), repo("off", "2026-01-01T00:00:00Z", { disabled: true }), repo("b-new", "2025-06-01T00:00:00Z"), repo("a-new", "2025-06-01T00:00:00Z"), repo("mid", "2023-01-01T00:00:00Z")];
    expect(selectAccountRepositories(listing, 3).map(r => r.name)).toEqual(["a-new", "b-new", "mid"]);
    expect(selectAccountRepositories(listing, 99).map(r => r.name)).toEqual(["a-new", "b-new", "mid", "old"]);
    expect(selectAccountRepositories(listing, 0)).toEqual([]);
    expect(selectAccountRepositories([{ name: 7 }, null, "x", repo("ok", "2024-01-01T00:00:00Z")] as never, 5).map(r => r.name)).toEqual(["ok"]);
  });

  it("loads the documents of the selected repositories only, from api.github.com, with unique document ids", async () => {
    const api = fakeGitHub([repo("one", "2025-01-02T00:00:00Z"), repo("two", "2025-01-01T00:00:00Z"), repo("skipped", "2024-01-01T00:00:00Z")], { one: "# One\nRust services", two: "# Two\nPostgres tooling", skipped: "# nope" });
    const docs = await loadGitHubAccountDocuments("https://github.com/octo", { fetcher: api.fetcher, maxRepos: 2 });
    expect(docs.map(d => d.content)).toEqual(["# One\nRust services", "# Two\nPostgres tooling"]);
    expect(new Set(docs.map(d => d.docId)).size).toBe(docs.length);
    expect(api.urls.every(u => u.startsWith("https://api.github.com/"))).toBe(true);
    expect(api.urls.some(u => u.includes("/repos/octo/skipped"))).toBe(false);
    expect(api.urls[0]).toBe("https://api.github.com/users/octo/repos?type=owner&sort=pushed&per_page=100");
  });

  it("skips a repository without usable documentation and fails when nothing usable is left", async () => {
    const mixed = fakeGitHub([repo("empty", "2025-01-02T00:00:00Z"), repo("full", "2025-01-01T00:00:00Z")], { empty: null, full: "# Full" });
    expect((await loadGitHubAccountDocuments("https://github.com/octo", { fetcher: mixed.fetcher })).map(d => d.content)).toEqual(["# Full"]);
    const none = fakeGitHub([repo("empty", "2025-01-02T00:00:00Z")], { empty: null });
    await expect(loadGitHubAccountDocuments("https://github.com/octo", { fetcher: none.fetcher })).rejects.toThrow(/ERR_GITHUB_EMPTY_ACCOUNT_CONTENT/);
    await expect(loadGitHubAccountDocuments("https://github.com/octo", { fetcher: fakeGitHub([], {}).fetcher })).rejects.toThrow(/ERR_GITHUB_EMPTY_ACCOUNT_CONTENT/);
    await expect(loadGitHubAccountDocuments("https://github.com/ghost", { fetcher: fakeGitHub(null, {}).fetcher })).rejects.toThrow(/ERR_GITHUB_ACCOUNT_NOT_FOUND/);
  });

  it("does not hide a network failure behind an empty result (the job may retry)", async () => {
    const failing = (async () => { throw new Error("socket hang up"); }) as never;
    await expect(loadGitHubAccountDocuments("https://github.com/octo", { fetcher: failing })).rejects.toThrow(/ERR_GITHUB_FETCH_FAILURE/);
  });

  it("the source loader dispatches: an account to the account loader, a repository to the repository loader", async () => {
    const api = fakeGitHub([repo("one", "2025-01-02T00:00:00Z")], { one: "# One" });
    expect((await loadGitHubSourceDocuments("https://github.com/octo", { fetcher: api.fetcher })).length).toBe(1);
    expect(api.urls.some(u => u.includes("/users/octo/repos"))).toBe(true);
    const repoApi = fakeGitHub([], { tool: "# Tool" });
    expect((await loadGitHubSourceDocuments("https://github.com/octo/tool", { fetcher: repoApi.fetcher })).length).toBe(1);
    expect(repoApi.urls.some(u => u.includes("/users/"))).toBe(false);
  });
});
