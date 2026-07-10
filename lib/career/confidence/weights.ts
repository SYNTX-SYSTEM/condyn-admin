/**
 * Pure, deterministic helper returning mathematical source weight for confidence propagation.
 * github/code = 1.0
 * pdf/document = 0.85
 * website = 0.70
 * linkedin/profile = 0.40
 * default = 0.60
 */
export function getSourceWeight(sourceType?: string): number {
  if (!sourceType) return 0.60;

  const normalized = sourceType.toLowerCase().trim();

  if (normalized === "github" || normalized === "code" || normalized === "repo" || normalized.includes("github")) {
    return 1.0;
  }

  if (normalized === "pdf" || normalized === "document" || normalized === "file" || normalized.endsWith(".pdf")) {
    return 0.85;
  }

  if (normalized === "website" || normalized === "url" || normalized.startsWith("http")) {
    return 0.70;
  }

  if (normalized === "linkedin" || normalized === "profile" || normalized.includes("linkedin")) {
    return 0.40;
  }

  return 0.60;
}
