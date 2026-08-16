import { describe, it, expect } from "vitest";
import { loadGitHubRepositoryDocuments } from "../lib/career/loaders/github";
import { loadDocuments } from "../lib/career/pipeline";

describe("CONDYN Career Analysis Protocol v1.0 — Step 19b: GitHub Repository Loader", () => {
  it("should enforce the correct request boundary headers WITHOUT a GITHUB_TOKEN", async () => {
    const originalToken = process.env.GITHUB_TOKEN;
    delete process.env.GITHUB_TOKEN;
    
    let capturedOptions: any = null;
    const mockFetcher = async (url: string, options?: any) => {
      capturedOptions = options;
      return { ok: true, status: 200, json: async () => ({ content: Buffer.from("test").toString("base64") }) };
    };

    await loadGitHubRepositoryDocuments("https://github.com/condyn/career-engine", { fetcher: mockFetcher as any });
    
    expect(capturedOptions).toBeDefined();
    expect(capturedOptions.headers["Accept"]).toBe("application/vnd.github+json");
    expect(capturedOptions.headers["X-GitHub-Api-Version"]).toBe("2022-11-28");
    expect(capturedOptions.headers["User-Agent"]).toBe("CONDYN");
    expect(capturedOptions.headers["Authorization"]).toBeUndefined();
    
    if (originalToken !== undefined) process.env.GITHUB_TOKEN = originalToken;
  });

  it("should enforce the correct request boundary headers WITH a GITHUB_TOKEN", async () => {
    const originalToken = process.env.GITHUB_TOKEN;
    process.env.GITHUB_TOKEN = "ghp_mock_token_12345";
    
    let capturedOptions: any = null;
    const mockFetcher = async (url: string, options?: any) => {
      capturedOptions = options;
      return { ok: true, status: 200, json: async () => ({ content: Buffer.from("test").toString("base64") }) };
    };

    await loadGitHubRepositoryDocuments("https://github.com/condyn/career-engine", { fetcher: mockFetcher as any });
    
    expect(capturedOptions).toBeDefined();
    expect(capturedOptions.headers["Accept"]).toBe("application/vnd.github+json");
    expect(capturedOptions.headers["X-GitHub-Api-Version"]).toBe("2022-11-28");
    expect(capturedOptions.headers["User-Agent"]).toBe("CONDYN");
    expect(capturedOptions.headers["Authorization"]).toBe("Bearer ghp_mock_token_12345");
    
    if (originalToken !== undefined) process.env.GITHUB_TOKEN = originalToken;
    else delete process.env.GITHUB_TOKEN;
  });

  it("should load valid GitHub repo URL and extract README, package.json, and docs/*.md as DocumentInput[]", async () => {
    const mockFetcher = async (url: string) => {
      if (url.endsWith("/readme")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            name: "README.md",
            path: "README.md",
            content: Buffer.from("# CONDYN Career Engine\nSemantic Career Analysis Platform").toString("base64")
          })
        };
      }
      if (url.endsWith("/contents/package.json")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            name: "package.json",
            path: "package.json",
            content: Buffer.from('{"name": "condyn-career-engine", "description": "High precision engine"}').toString("base64")
          })
        };
      }
      if (url.endsWith("/contents/docs")) {
        return {
          ok: true,
          status: 200,
          json: async () => ([
            { name: "ARCHITECTURE.md", path: "docs/ARCHITECTURE.md", type: "file" },
            { name: "logo.png", path: "docs/logo.png", type: "file" }
          ])
        };
      }
      if (url.endsWith("/contents/docs/ARCHITECTURE.md")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            name: "ARCHITECTURE.md",
            path: "docs/ARCHITECTURE.md",
            content: Buffer.from("# Architecture Overview\nDecoupled presentation layer and canonical graph.").toString("base64")
          })
        };
      }
      return { ok: false, status: 404 };
    };

    const docs = await loadGitHubRepositoryDocuments(
      "https://github.com/condyn/career-engine",
      { fetcher: mockFetcher as any, docIdPrefix: "DOC_GH_" }
    );

    expect(docs).toHaveLength(3);
    expect(docs[0].docId).toBe("DOC_GH_001");
    expect(docs[0].title).toBe("README.md");
    expect(docs[0].content).toContain("Semantic Career Analysis Platform");

    expect(docs[1].docId).toBe("DOC_GH_002");
    expect(docs[1].title).toBe("package.json");
    expect(docs[1].content).toContain("condyn-career-engine");

    expect(docs[2].docId).toBe("DOC_GH_003");
    expect(docs[2].title).toBe("docs/ARCHITECTURE.md");
    expect(docs[2].content).toContain("Decoupled presentation layer");
  });

  it("should throw ERR_INVALID_GITHUB_URL when URL is malformed or not a GitHub repository URL", async () => {
    await expect(
      loadGitHubRepositoryDocuments("not-a-url")
    ).rejects.toThrow(/ERR_INVALID_GITHUB_URL/);

    await expect(
      loadGitHubRepositoryDocuments("https://example.com/condyn/career-engine")
    ).rejects.toThrow(/ERR_INVALID_GITHUB_URL/);

    await expect(
      loadGitHubRepositoryDocuments("https://github.com/condyn")
    ).rejects.toThrow(/ERR_INVALID_GITHUB_URL/);
  });

  it("should throw ERR_GITHUB_FETCH_FAILURE when GitHub API returns 500 or fails unexpectedly", async () => {
    const mockFailFetcher = async () => ({
      ok: false,
      status: 500,
      statusText: "Internal Server Error"
    });

    await expect(
      loadGitHubRepositoryDocuments("https://github.com/condyn/career-engine", { fetcher: mockFailFetcher as any })
    ).rejects.toThrow(/ERR_GITHUB_FETCH_FAILURE/);

    const mockThrowFetcher = async () => {
      throw new Error("Network timeout");
    };

    await expect(
      loadGitHubRepositoryDocuments("https://github.com/condyn/career-engine", { fetcher: mockThrowFetcher as any })
    ).rejects.toThrow(/ERR_GITHUB_FETCH_FAILURE/);
  });

  it("should throw ERR_GITHUB_EMPTY_REPOSITORY_CONTENT when repository contains zero usable documentation files", async () => {
    const mockEmptyFetcher = async () => ({
      ok: false,
      status: 404
    });

    await expect(
      loadGitHubRepositoryDocuments("https://github.com/condyn/empty-repo", { fetcher: mockEmptyFetcher as any })
    ).rejects.toThrow(/ERR_GITHUB_EMPTY_REPOSITORY_CONTENT/);
  });

  it("should produce DocumentInput[] compatible with loadDocuments pipeline input", async () => {
    const mockFetcher = async (url: string) => {
      if (url.endsWith("/readme")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            name: "README.md",
            path: "README.md",
            content: Buffer.from("# Candidate Project\nFullstack React Application").toString("base64")
          })
        };
      }
      return { ok: false, status: 404 };
    };

    const ghDocs = await loadGitHubRepositoryDocuments(
      "https://github.com/condyn/candidate-project",
      { fetcher: mockFetcher as any }
    );

    const pipelineDocs = loadDocuments(ghDocs);
    expect(pipelineDocs).toHaveLength(1);
    expect(pipelineDocs[0].docId).toBe("DOC_GH_001");
    expect(pipelineDocs[0].title).toBe("README.md");
    expect(pipelineDocs[0].content).toContain("Fullstack React Application");
  });
});
