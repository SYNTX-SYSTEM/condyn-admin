/**
 * CONDYN CAREER ANALYSIS PROTOCOL v1.0
 * SERVER-SIDE WEBSITE LOADER (`lib/career/loaders/website.ts`)
 * 
 * Status: Step 19a Implemented / Multi-Source Ingestion
 * Scope: Fetches HTML websites server-side, strips non-content tags/scripts/styles, and produces canonical DocumentInput.
 */

import { DocumentInput } from "../adapter";

/**
 * Strips `<script>`, `<style>`, `<nav>`, `<header>`, `<footer>`, HTML comments,
 * and remaining markup tags from an HTML string, returning clean normalized text.
 */
export function cleanHtmlContent(html: string): string {
  if (!html || typeof html !== "string") {
    return "";
  }

  let text = html;
  // Strip head tags and content
  text = text.replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, " ");
  // Strip script tags and content
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ");
  // Strip style tags and content
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ");
  // Strip nav tags and content
  text = text.replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ");
  // Strip header tags and content
  text = text.replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, " ");
  // Strip footer tags and content
  text = text.replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ");
  // Strip HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, " ");
  // Strip all remaining HTML tags
  text = text.replace(/<[^>]+>/g, " ");
  // Decode basic HTML entities
  text = text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"');
  // Normalize whitespace
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

/**
 * Server-side website document loader.
 * Validates URL, fetches HTML, sanitizes content, and returns canonical DocumentInput.
 */
export async function loadWebsiteDocument(
  url: string,
  title?: string,
  docId?: string,
  fetcher?: any
): Promise<DocumentInput> {
  // 1. Validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("Unsupported protocol");
    }
  } catch {
    throw new Error(`ERR_INVALID_WEBSITE_URL: Invalid or unsupported website URL "${url}". Must use http: or https:.`);
  }

  // 2. Fetch HTML
  const activeFetcher = fetcher || fetch;
  let response: any;
  try {
    response = await activeFetcher(url);
  } catch (err: any) {
    throw new Error(`ERR_WEBSITE_FETCH_FAILURE: Network error fetching website "${url}": ${err?.message || err}`);
  }

  if (!response || !response.ok) {
    throw new Error(`ERR_WEBSITE_FETCH_FAILURE: Failed to fetch website "${url}". HTTP Status: ${response?.status || "Unknown"}`);
  }

  let rawHtml = "";
  try {
    rawHtml = await response.text();
  } catch (err: any) {
    throw new Error(`ERR_WEBSITE_FETCH_FAILURE: Failed to read text body from website "${url}".`);
  }

  // 3. Clean HTML and extract text
  const content = cleanHtmlContent(rawHtml);

  // 4. Validate non-empty content
  if (!content || content.length === 0) {
    throw new Error(`ERR_WEBSITE_EMPTY_CONTENT: Extracted content from website "${url}" is empty.`);
  }

  return {
    docId: docId || "DOC_WEB_001",
    title: title || url,
    content
  };
}
