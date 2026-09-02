export type SourceSatelliteKind =
  | "PDF"
  | "GITHUB"
  | "WEB"
  | "MARKDOWN"
  | "TEXT"
  | "ODF"
  | "SOURCE";

export interface SourceSatellitePresentation {
  kind: SourceSatelliteKind;
  kindLabel: string;
  glyph: string;
  displayTitle: string;
  secondaryLabel: string;
}

export interface SourceSatelliteInput {
  sourceTitle?: string;
  sourceKind?: string;
  sourceUri?: string;
}

function inferKind(source: SourceSatelliteInput): SourceSatelliteKind {
  const title = (source.sourceTitle ?? "").trim();
  const kind = (source.sourceKind ?? "").trim().toLowerCase();
  const uri = (source.sourceUri ?? "").trim();

  const hasExtension = (extensions: string[]) => {
    const pattern = new RegExp(
      `\\.(${extensions.join("|")})(?:$|[?#])`,
      "i"
    );

    return pattern.test(title) || pattern.test(uri);
  };

  if (hasExtension(["pdf"]) || kind === "pdf") {
    return "PDF";
  }

  if (
    kind.includes("github") ||
    kind.includes("repository") ||
    /github\\.com/i.test(uri)
  ) {
    return "GITHUB";
  }

  if (
    hasExtension(["md", "markdown"]) ||
    kind.includes("markdown")
  ) {
    return "MARKDOWN";
  }

  if (
    hasExtension(["odt", "ods", "odp", "odf"]) ||
    kind === "odf"
  ) {
    return "ODF";
  }

  if (
    kind.includes("website") ||
    kind === "web" ||
    /^https?:\/\//i.test(title) ||
    /^https?:\/\//i.test(uri)
  ) {
    return "WEB";
  }

  if (kind.includes("text")) {
    return "TEXT";
  }

  return "SOURCE";
}

function removeTechnicalExtension(value: string): string {
  return value.replace(/\.(?:pdf|md|markdown|txt|odt|ods|odp|odf)$/i, "");
}

function formatDocumentTitle(rawTitle: string): string {
  let value = rawTitle.trim();

  try {
    value = decodeURIComponent(value);
  } catch {
    // Presentation only: preserve the original string if URI decoding fails.
  }

  value = value.split(/[\\/]/).pop() || value;
  value = value.replace(/\s*\(\d+\)\s*(?=\.[^.]+$|$)/, "");
  value = removeTechnicalExtension(value);
  value = value.replace(/_+/g, " ");
  value = value.replace(/\bKap(?:itel)?\s*0*(\d+)\b/gi, "Kapitel $1");
  value = value.replace(/\s+\bFINAL\b$/i, "");
  value = value.replace(/\s+/g, " ").trim();
  value = value.replace(/\s+Kapitel\s+(\d+)\b/i, " · Kapitel $1");

  return value || rawTitle;
}

function formatRepositoryTitle(rawTitle: string, sourceUri?: string): string {
  if (rawTitle.trim()) {
    return removeTechnicalExtension(rawTitle.trim());
  }

  if (sourceUri) {
    try {
      const url = new URL(sourceUri);
      return url.pathname.split("/").filter(Boolean).pop() || sourceUri;
    } catch {
      return sourceUri;
    }
  }

  return "Repository Source";
}

export function buildSourceSatellitePresentation(
  source: SourceSatelliteInput
): SourceSatellitePresentation {
  const kind = inferKind(source);
  const rawTitle = source.sourceTitle || source.sourceUri || "Source";

  const displayTitle =
    kind === "GITHUB"
      ? formatRepositoryTitle(rawTitle, source.sourceUri)
      : formatDocumentTitle(rawTitle);

  switch (kind) {
    case "PDF":
      return { kind, kindLabel: "PDF", glyph: "▣", displayTitle, secondaryLabel: "DOCUMENT SOURCE" };
    case "GITHUB":
      return { kind, kindLabel: "GITHUB", glyph: "⌘", displayTitle, secondaryLabel: "REPOSITORY SOURCE" };
    case "WEB":
      return { kind, kindLabel: "WEB", glyph: "↗", displayTitle, secondaryLabel: "WEB SOURCE" };
    case "MARKDOWN":
      return { kind, kindLabel: "MARKDOWN", glyph: "¶", displayTitle, secondaryLabel: "MARKDOWN SOURCE" };
    case "TEXT":
      return { kind, kindLabel: "TEXT", glyph: "≡", displayTitle, secondaryLabel: "TEXT SOURCE" };
    case "ODF":
      return { kind, kindLabel: "ODF", glyph: "◇", displayTitle, secondaryLabel: "OPEN DOCUMENT SOURCE" };
    default:
      return { kind, kindLabel: "SOURCE", glyph: "◈", displayTitle, secondaryLabel: "SOURCE" };
  }
}
