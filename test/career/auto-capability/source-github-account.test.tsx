import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { instance } from "../pxj-first-screen/harness";

/**
 * SFE::AUTOMATED_CAPABILITY_TO_JOB_EXECUTE (owner 2026-10-30), GRÜN point 2: the dock's GitHub input names an account
 * (`https://github.com/<account>`) besides a repository, EN and DE. The dock does not validate (the server loader decides, GELB §3.1);
 * it says that an account is read through its own public repositories chosen automatically, and titles the staged item by its shape.
 */
vi.mock("react", async (importOriginal) => (await import("../pxj-first-screen/harness")).mockReact(await importOriginal<object>()));

import { SourceDock, githubAccountUrl } from "../../../app/components/career/demo/SourceDock";
import { SIL_COPY } from "../../../lib/career/view-model/sil-language";

function findBy(node: unknown, test: (props: Record<string, unknown>) => boolean): ReactElement<Record<string, unknown>> | null {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) { for (const child of node) { const hit = findBy(child, test); if (hit) return hit; } return null; }
  const element = node as ReactElement<Record<string, unknown>>;
  if (element.props && test(element.props)) return element;
  return findBy(element.props?.children, test);
}
const byId = (tree: unknown, id: string) => findBy(tree, props => props["data-testid"] === id);
const text = (node: unknown): string => !node || typeof node !== "object" ? (typeof node === "string" ? node : "") : Array.isArray(node) ? node.map(text).join("") : text((node as ReactElement<{ children?: unknown }>).props?.children);

/** The dock with the GitHub input opened and `url` staged; what ANALYZE hands over, and the drawn dock before staging. */
function stage(url: string, locale: "en" | "de" = "en") {
  const analyzed: unknown[][] = [];
  const dock = instance<Record<string, unknown>>((props: Record<string, unknown>) => (SourceDock as unknown as { render(p: unknown, r: null): ReactElement<Record<string, unknown>> }).render(props, null));
  const props = { locale, onAnalyze: (documents: unknown[]) => { analyzed.push(documents); } };
  let tree = dock.render(props);
  (byId(tree, "add-github-source-btn")!.props.onClick as () => void)();
  tree = dock.render(props);
  const opened = tree;
  (byId(tree, "source-url-input")!.props.onChange as (event: unknown) => void)({ target: { value: url } });
  tree = dock.render(props);
  (byId(tree, "submit-source-btn")!.props.onClick as () => void)();
  tree = dock.render(props);
  (byId(tree, "start-intake-analysis-btn")!.props.onClick as () => void)();
  return { opened, staged: (analyzed[0] ?? []) as Array<{ type: string; title: string; url?: string }> };
}

afterEach(() => { vi.unstubAllGlobals(); });

describe("AUTO_CAPABILITY · the GitHub input takes an account", () => {
  it("REPRODUCE: an account URL is one path segment on github.com", () => {
    for (const url of ["https://github.com/octo", "https://github.com/octo/", "https://www.github.com/octo", " https://github.com/octo-cat "]) expect(githubAccountUrl(url), url).toBe(true);
  });

  it("inverse: a repository, another host, the bare host or no URL is not an account", () => {
    for (const url of ["https://github.com/octo/repo", "https://github.com/octo/repo/tree/main", "https://gitlab.com/octo", "https://github.com/", "github.com/octo", "octo", ""]) expect(githubAccountUrl(url), url).toBe(false);
  });

  it("REPRODUCE: label, placeholder and hint name both shapes, EN and DE; the input stays a URL input", () => {
    for (const locale of ["en", "de"] as const) {
      const t = SIL_COPY[locale].sourceDock;
      const { opened } = stage("https://github.com/octo", locale);
      expect(text(opened)).toContain(t.repositoryUrl);
      expect(t.repositoryUrl).toMatch(locale === "en" ? /REPOSITORY OR ACCOUNT/ : /REPOSITORY- ODER ACCOUNT/);
      expect(byId(opened, "source-url-input")!.props.placeholder).toBe(t.githubPlaceholder);
      expect(t.githubPlaceholder).toContain("https://github.com/<account>");
      expect(t.githubPlaceholder).toContain("<owner>/<repo>");
      expect(text(byId(opened, "source-github-hint"))).toBe(t.githubHint);
      expect(byId(opened, "source-url-input")!.props.type).toBe("url");
    }
    expect(SIL_COPY.en.sourceDock.githubHint).toMatch(/account .*own public repositories, chosen automatically/i);
    expect(SIL_COPY.de.sourceDock.githubHint).toMatch(/Account .*eigenen öffentlichen Repositories gelesen, automatisch gewählt/);
  });

  it("REPRODUCE: an account is staged as a github source titled as an account, its URL unchanged", () => {
    expect(stage("https://github.com/octo").staged).toEqual([expect.objectContaining({ type: "github", title: "GitHub Account", url: "https://github.com/octo" })]);
    expect(stage("https://github.com/octo", "de").staged[0].title).toBe("GitHub-Account");
  });

  it("inverse: a repository is staged exactly as before; the website input has no GitHub hint", () => {
    expect(stage("https://github.com/octo/repo").staged).toEqual([expect.objectContaining({ type: "github", title: "GitHub Repository", url: "https://github.com/octo/repo" })]);
    const dock = instance<Record<string, unknown>>((props: Record<string, unknown>) => (SourceDock as unknown as { render(p: unknown, r: null): ReactElement<Record<string, unknown>> }).render(props, null));
    const props = { onAnalyze: () => undefined };
    let tree = dock.render(props);
    (byId(tree, "add-website-source-btn")!.props.onClick as () => void)();
    tree = dock.render(props);
    expect(byId(tree, "source-github-hint")).toBeNull();
    expect(byId(tree, "source-url-input")!.props.placeholder).toBe("https://example.com");
  });
});
