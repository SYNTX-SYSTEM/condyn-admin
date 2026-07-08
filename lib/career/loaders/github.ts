/**
 * CONDYN CAREER ANALYSIS PROTOCOL v1.0
 * SERVER-SIDE GITHUB REPOSITORY LOADER (`lib/career/loaders/github.ts`)
 * 
 * Status: Step 19b Implemented / Multi-Source Ingestion
 * Scope: Fetches documentation artifacts (README, package.json, /docs/*.md) from GitHub API server-side.
 */

import { DocumentInput } from "../adapter";

export interface GitHubLoaderOptions {
  docIdPrefix?: string;
  fetcher?: any;
  maxFiles?: number;
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
  try {
    response = await activeFetcher(apiUrl);
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
      documents.push({
        docId: formatId(documents.length + 1),
        title: readmeData.path || "README.md",
        content: text
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
        documents.push({
          docId: formatId(documents.length + 1),
          title: pkgData.path || "package.json",
          content: text
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
            documents.push({
              docId: formatId(documents.length + 1),
              title: fileData.path || mdFile.name,
              content: text
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
