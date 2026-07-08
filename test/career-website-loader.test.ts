import { describe, it, expect } from "vitest";
import { loadWebsiteDocument } from "../lib/career/loaders/website";
import { loadDocuments } from "../lib/career/pipeline";

describe("CONDYN Career Analysis Protocol v1.0 — Step 19a: Website Loader", () => {
  it("should extract clean visible text from valid HTML and return DocumentInput", async () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>Jane Doe Profile</title></head>
        <body>
          <h1>Jane Doe - Senior Cloud Engineer</h1>
          <p>Over 8 years of experience designing scalable distributed systems.</p>
        </body>
      </html>
    `;

    const mockFetcher = async () => ({
      ok: true,
      status: 200,
      text: async () => mockHtml
    });

    const doc = await loadWebsiteDocument(
      "https://condyn.eu/profile/janedoe",
      "Jane Doe Profile",
      "DOC_WEB_001",
      mockFetcher as any
    );

    expect(doc.docId).toBe("DOC_WEB_001");
    expect(doc.title).toBe("Jane Doe Profile");
    expect(doc.content).toContain("Jane Doe - Senior Cloud Engineer");
    expect(doc.content).toContain("Over 8 years of experience designing scalable distributed systems.");
    expect(doc.content).not.toContain("<h1>");
    expect(doc.content).not.toContain("<body>");
  });

  it("should strip <script>, <style>, <nav>, and <footer> tags along with their contents", async () => {
    const mockHtml = `
      <html>
        <head>
          <style>body { color: red; }</style>
        </head>
        <body>
          <nav>Home | About | Contact</nav>
          <header>Top Header Info</header>
          <main>
            <h2>Principal Architect</h2>
            <p>Specialist in Rust and Kubernetes infrastructure.</p>
          </main>
          <script>console.log("secret tracker code");</script>
          <footer>Copyright 2026 CONDYN EU</footer>
        </body>
      </html>
    `;

    const mockFetcher = async () => ({
      ok: true,
      status: 200,
      text: async () => mockHtml
    });

    const doc = await loadWebsiteDocument(
      "https://condyn.eu/profile/arch",
      undefined,
      undefined,
      mockFetcher as any
    );

    expect(doc.content).toContain("Principal Architect");
    expect(doc.content).toContain("Specialist in Rust and Kubernetes infrastructure.");
    expect(doc.content).not.toContain("color: red");
    expect(doc.content).not.toContain("Home | About | Contact");
    expect(doc.content).not.toContain("Top Header Info");
    expect(doc.content).not.toContain("secret tracker code");
    expect(doc.content).not.toContain("Copyright 2026 CONDYN EU");
  });

  it("should throw ERR_WEBSITE_EMPTY_CONTENT when HTML page has no visible text", async () => {
    const mockHtml = `
      <html>
        <head><title>Empty Page</title></head>
        <body>
          <script>alert('empty');</script>
          <!-- only comments -->
        </body>
      </html>
    `;

    const mockFetcher = async () => ({
      ok: true,
      status: 200,
      text: async () => mockHtml
    });

    await expect(
      loadWebsiteDocument("https://condyn.eu/empty", undefined, undefined, mockFetcher as any)
    ).rejects.toThrow(/ERR_WEBSITE_EMPTY_CONTENT/);
  });

  it("should throw ERR_INVALID_WEBSITE_URL when URL is malformed or non-http/https", async () => {
    await expect(
      loadWebsiteDocument("not-a-valid-url")
    ).rejects.toThrow(/ERR_INVALID_WEBSITE_URL/);

    await expect(
      loadWebsiteDocument("ftp://condyn.eu/resume.txt")
    ).rejects.toThrow(/ERR_INVALID_WEBSITE_URL/);
  });

  it("should throw ERR_WEBSITE_FETCH_FAILURE when fetch returns non-200 HTTP status or fails", async () => {
    const mockErrorFetcher = async () => ({
      ok: false,
      status: 404,
      statusText: "Not Found"
    });

    await expect(
      loadWebsiteDocument("https://condyn.eu/404", undefined, undefined, mockErrorFetcher as any)
    ).rejects.toThrow(/ERR_WEBSITE_FETCH_FAILURE/);

    const mockThrowFetcher = async () => {
      throw new Error("DNS resolution failed");
    };

    await expect(
      loadWebsiteDocument("https://unreachable.condyn.eu", undefined, undefined, mockThrowFetcher as any)
    ).rejects.toThrow(/ERR_WEBSITE_FETCH_FAILURE/);
  });

  it("should produce DocumentInput compatible with loadDocuments pipeline input", async () => {
    const mockHtml = `
      <html><body><p>Cloud Security Architect with Azure expertise.</p></body></html>
    `;
    const mockFetcher = async () => ({
      ok: true,
      status: 200,
      text: async () => mockHtml
    });

    const webDoc = await loadWebsiteDocument(
      "https://condyn.eu/profile/sec",
      "Sec Profile",
      "DOC_001",
      mockFetcher as any
    );

    const pipelineDocs = loadDocuments([webDoc]);
    expect(pipelineDocs).toHaveLength(1);
    expect(pipelineDocs[0].docId).toBe("DOC_001");
    expect(pipelineDocs[0].content).toContain("Cloud Security Architect with Azure expertise.");
  });
});
