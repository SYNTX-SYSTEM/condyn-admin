/**
 * CONDYN CAREER ANALYSIS PROTOCOL v1.0
 * SERVER-SIDE GITHUB REPOSITORY LOADER (`lib/career/loaders/github.ts`)
 * 
 * Status: Step 19b Implemented / Multi-Source Ingestion
 * Scope: Fetches documentation artifacts (README, package.json, /docs/*.md) from GitHub API server-side.
 */

import { DocumentInput } from "../adapter";
import { createSourceMetadata } from "./source";

export interface GitHubLoaderOptions {
  docIdPrefix?: string;
  fetcher?: any;
  maxFiles?: number;
  /** Account input only: how many repositories are read (default 5, hard cap 10). */
  maxRepos?: number;
}

/** An account name as GitHub allows it; checked before it is placed into an API path. */
const GITHUB_ACCOUNT_NAME = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;
export const GITHUB_ACCOUNT_MAX_REPOS_DEFAULT = 5;
export const GITHUB_ACCOUNT_MAX_REPOS_HARD_CAP = 10;

/**
 * Tells a repository URL (`github.com/owner/repo`) from an account URL (`github.com/owner`). Anything else — another host, no owner,
 * an owner name GitHub does not allow — is refused before any request is made.
 */
export function parseGitHubSourceUrl(sourceUrl: string): { kind: "repo"; owner: string; repo: string } | { kind: "account"; owner: string } {
  let url: URL;
  try { url = new URL(sourceUrl); } catch { throw new Error(`ERR_INVALID_GITHUB_URL: Invalid GitHub URL "${sourceUrl}".`); }
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error(`ERR_INVALID_GITHUB_URL: URL "${sourceUrl}" must point to github.com.`);
  if (url.hostname !== "github.com" && url.hostname !== "www.github.com") throw new Error(`ERR_INVALID_GITHUB_URL: URL "${sourceUrl}" must point to github.com.`);
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length === 0 || !GITHUB_ACCOUNT_NAME.test(parts[0])) throw new Error(`ERR_INVALID_GITHUB_URL: URL "${sourceUrl}" must name a GitHub account or repository.`);
  if (parts.length === 1) return { kind: "account", owner: parts[0] };
  const { owner, repo } = parseGitHubRepoUrl(sourceUrl);
  return { kind: "repo", owner, repo };
}

/**
 * Validates a GitHub repository URL and extracts `{ owner, repo }`.
 * Throws `ERR_INVALID_GITHUB_URL` if malformed or non-github.com.
 */
export function parseGitHubRepoUrl(repoUrl: string): { owner: string; repo: string } {
  let url: URL;
  try {
    url = new URL(repoUrl);
  } catch {
    throw new Error(`ERR_INVALID_GITHUB_URL: Invalid GitHub repository URL "${repoUrl}".`);
  }

  if (url.hostname !== "github.com" && url.hostname !== "www.github.com") {
    throw new Error(`ERR_INVALID_GITHUB_URL: URL "${repoUrl}" must point to github.com.`);
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) {
    throw new Error(`ERR_INVALID_GITHUB_URL: URL "${repoUrl}" must include both owner and repository name.`);
  }

  return { owner: parts[0], repo: parts[1] };
}

function decodeGitHubContent(base64Content?: string): string {
  if (!base64Content) return "";
  return Buffer.from(base64Content, "base64").toString("utf-8").trim();
}

async function fetchGitHubJson(apiUrl: string, fetcher?: any): Promise<any> {
  const activeFetcher = fetcher || fetch;
  let response: any;
  
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "CONDYN"
  };

  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    response = await activeFetcher(apiUrl, { headers });
  } catch (err: any) {
    throw new Error(`ERR_GITHUB_FETCH_FAILURE: Network error fetching GitHub API "${apiUrl}": ${err?.message || err}`);
  }

  if (!response || !response.ok) {
    if (response?.status === 404) {
      return null;
    }
    throw new Error(`ERR_GITHUB_FETCH_FAILURE: GitHub API request failed for "${apiUrl}". HTTP Status: ${response?.status || "Unknown"}`);
  }

  try {
    return await response.json();
  } catch {
    throw new Error(`ERR_GITHUB_FETCH_FAILURE: Failed to parse JSON from GitHub API "${apiUrl}".`);
  }
}

/**
 * Loads canonical career documentation files from a GitHub repository URL.
 * Extracts README, package.json, and /docs markdown files without cloning or inspecting code.
 */
export async function loadGitHubRepositoryDocuments(
  repoUrl: string,
  options?: GitHubLoaderOptions
): Promise<DocumentInput[]> {
  const { owner, repo } = parseGitHubRepoUrl(repoUrl);
  const prefix = options?.docIdPrefix || "DOC_GH_";
  const maxFiles = options?.maxFiles || 10;
  const documents: DocumentInput[] = [];

  const formatId = (index: number) => `${prefix}${String(index).padStart(3, "0")}`;

  // 1. Fetch README
  const readmeData = await fetchGitHubJson(
    `https://api.github.com/repos/${owner}/${repo}/readme`,
    options?.fetcher
  );
  if (readmeData && readmeData.content) {
    const text = decodeGitHubContent(readmeData.content);
    if (text) {
      const path = readmeData.path || "README.md";
      documents.push({
        docId: formatId(documents.length + 1),
        title: path,
        content: text,
        metadata: createSourceMetadata("GITHUB_README", text, { uri: repoUrl, path, title: path })
      });
    }
  }

  // 2. Fetch package.json if under maxFiles
  if (documents.length < maxFiles) {
    const pkgData = await fetchGitHubJson(
      `https://api.github.com/repos/${owner}/${repo}/contents/package.json`,
      options?.fetcher
    );
    if (pkgData && pkgData.content) {
      const text = decodeGitHubContent(pkgData.content);
      if (text) {
        const path = pkgData.path || "package.json";
        documents.push({
          docId: formatId(documents.length + 1),
          title: path,
          content: text,
          metadata: createSourceMetadata("GITHUB_PACKAGE_JSON", text, { uri: repoUrl, path, title: path })
        });
      }
    }
  }

  // 3. Fetch /docs markdown files if under maxFiles
  if (documents.length < maxFiles) {
    const docsListing = await fetchGitHubJson(
      `https://api.github.com/repos/${owner}/${repo}/contents/docs`,
      options?.fetcher
    );
    if (Array.isArray(docsListing)) {
      const mdFiles = docsListing.filter(f => f.type === "file" && f.name.endsWith(".md"));
      for (const mdFile of mdFiles) {
        if (documents.length >= maxFiles) break;
        const fileData = await fetchGitHubJson(
          `https://api.github.com/repos/${owner}/${repo}/contents/${mdFile.path}`,
          options?.fetcher
        );
        if (fileData && fileData.content) {
          const text = decodeGitHubContent(fileData.content);
          if (text) {
            const path = fileData.path || mdFile.name;
            documents.push({
              docId: formatId(documents.length + 1),
              title: path,
              content: text,
              metadata: createSourceMetadata("GITHUB_DOCS", text, { uri: repoUrl, path, title: path })
            });
          }
        }
      }
    }
  }

  if (documents.length === 0) {
    throw new Error(`ERR_GITHUB_EMPTY_REPOSITORY_CONTENT: Repository "${owner}/${repo}" contains zero usable documentation files.`);
  }

  return documents;
}


interface AccountRepository { name: string; pushed_at?: string }

/**
 * The automatic repository selection of an account (no manual choice): the repositories the account owns and publishes — not
 * forks, not archived, not disabled, not private — newest push first, name as tie-break, at most `max` of them. Entries that are
 * not repository objects are ignored.
 */
export function selectAccountRepositories(listing: unknown, max: number): AccountRepository[] {
  if (!Array.isArray(listing) || !(max > 0)) return [];
  const usable = listing.filter((r): r is AccountRepository & Record<string, unknown> =>
    !!r && typeof r === "object" && typeof (r as any).name === "string" && (r as any).name.length > 0 &&
    (r as any).fork !== true && (r as any).archived !== true && (r as any).disabled !== true && (r as any).private !== true);
  const time = (r: AccountRepository) => { const t = Date.parse(r.pushed_at ?? ""); return Number.isFinite(t) ? t : 0; };
  return usable.sort((a, b) => time(b) - time(a) || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)).slice(0, Math.floor(max));
}

const accountRepoLimit = (requested?: number) => {
  const fromEnv = Number(process.env.GITHUB_ACCOUNT_MAX_REPOS);
  const value = requested ?? (Number.isInteger(fromEnv) && fromEnv >= 1 ? fromEnv : GITHUB_ACCOUNT_MAX_REPOS_DEFAULT);
  return Math.max(1, Math.min(Math.floor(value), GITHUB_ACCOUNT_MAX_REPOS_HARD_CAP));
};

/** Loads the documentation of an account's automatically selected repositories with the existing repository loader. */
export async function loadGitHubAccountDocuments(accountUrl: string, options?: GitHubLoaderOptions): Promise<DocumentInput[]> {
  const parsed = parseGitHubSourceUrl(accountUrl);
  if (parsed.kind !== "account") throw new Error(`ERR_INVALID_GITHUB_URL: URL "${accountUrl}" is not a GitHub account.`);
  const listing = await fetchGitHubJson(`https://api.github.com/users/${parsed.owner}/repos?type=owner&sort=pushed&per_page=100`, options?.fetcher);
  if (listing === null) throw new Error(`ERR_GITHUB_ACCOUNT_NOT_FOUND: GitHub account "${parsed.owner}" was not found.`);
  const documents: DocumentInput[] = [];
  const selected = selectAccountRepositories(listing, accountRepoLimit(options?.maxRepos));
  for (const [index, repository] of selected.entries()) {
    try {
      const docs = await loadGitHubRepositoryDocuments(`https://github.com/${parsed.owner}/${repository.name}`, { ...options, docIdPrefix: `${options?.docIdPrefix || "DOC_GH_"}R${index + 1}_` });
      documents.push(...docs);
    } catch (error: any) {
      // A repository without usable documentation is skipped; every other failure (network, rate limit) stays a failure of the job.
      if (!String(error?.message ?? "").startsWith("ERR_GITHUB_EMPTY_REPOSITORY_CONTENT")) throw error;
    }
  }
  if (documents.length === 0) throw new Error(`ERR_GITHUB_EMPTY_ACCOUNT_CONTENT: GitHub account "${parsed.owner}" has no repository with usable documentation files.`);
  return documents;
}

/** One entry for a github source item: an account or a repository URL. */
export async function loadGitHubSourceDocuments(sourceUrl: string, options?: GitHubLoaderOptions): Promise<DocumentInput[]> {
  return parseGitHubSourceUrl(sourceUrl).kind === "account" ? loadGitHubAccountDocuments(sourceUrl, options) : loadGitHubRepositoryDocuments(sourceUrl, options);
}
