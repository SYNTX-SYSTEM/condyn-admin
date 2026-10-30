import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { AutoJobRankingPanel, RankRow, autoMatchLine } from "../../../app/components/career/demo/AutoJobRankingPanel";
import { AUTO_MATCH_COPY } from "../../../app/components/career/demo/auto-match-copy";
import { RoleDiscoveryEntry } from "../../../app/components/career/demo/RoleDiscoveryPanel";
import { decodeAutoMatch, decodeRoleRanking, type AutoMatchRunState, type AutoMatchWatch, type JobRankingState } from "../../../lib/career/ui/auto-match";
import { ANALYSIS, autoMatch, ranking } from "./fixtures";

/**
 * AUTO_CAPABILITY (owner 2026-10-30), GRÜN points 3 and 4: the panel, server-rendered. Per run state its own line in the entry
 * line's language (a path, one sentence, one transition; role="status" polite; cool; no word of prohibition or alarm), EN and DE;
 * the ranking with rank, role, organisation, pool, tier, fit, and per requirement its state, source, quote and limitation; the
 * evidence class and the authority (none) always above a shown ranking. No picker, no confirmation, no other action than the two
 * existing ones (the Job Field switch where no active pool was in the field; the manual discovery's entry).
 */
const PROHIBITION = /\b(closed|gated|blocked|locked|denied|first|must|cannot|warning|error|failed|invalid)\b|geschlossen|gesperrt|blockiert|zuerst|muss|nicht möglich|fehler|warnung|ungültig/i;
const colours = (markup: string): number[][] => [
  ...[...markup.matchAll(/rgba?\((\d+),\s*(\d+),\s*(\d+)/g)].map(m => [Number(m[1]), Number(m[2]), Number(m[3])]),
  ...[...markup.matchAll(/#([0-9a-f]{6})\b/gi)].map(m => [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16)))
];
const cool = ([r, g, b]: number[]) => {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), c = max - min;
  if (c < 24) return true;
  const h = max === r ? (60 * ((g - b) / c) + 360) % 360 : max === g ? 60 * ((b - r) / c) + 120 : 60 * ((r - g) / c) + 240;
  return h >= 150 && h <= 260;
};
const text = (html: string) => html.replace(/<style>[\s\S]*?<\/style>/g, "").replace(/<!-- -->/g, "").replace(/<[^>]+>/g, " ").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const attr = (html: string, testId: string, name: string) => new RegExp(`data-testid="${testId}"[^>]*?${name}="([^"]*)"`).exec(html)?.[1] ?? null;
const watch = (state: AutoMatchRunState, patch: Record<string, unknown> = {}, waitedOut = false): AutoMatchWatch => ({ read: { state: "AVAILABLE", autoMatch: decodeAutoMatch(autoMatch(state, patch))! }, waitedOut });
const shown: JobRankingState = { state: "AVAILABLE", ranking: decodeRoleRanking(ranking({ analysisId: ANALYSIS }), ANALYSIS)! };
const panel = (w: AutoMatchWatch, r: JobRankingState = { state: "IDLE" }, locale: "en" | "de" = "en", entry = true) =>
  renderToString(<AutoJobRankingPanel locale={locale} watch={w} ranking={r} onGoToJobField={() => undefined}>{entry ? <RoleDiscoveryEntry locale={locale} inline onOpen={() => undefined} /> : null}</AutoJobRankingPanel>);

/** Every line the panel can stand in: [label, watch, expected line key]. */
const LINES: Array<[string, AutoMatchWatch, string]> = [
  ["reading", { read: { state: "LOADING" }, waitedOut: false }, "READING"],
  ["read failed", { read: { state: "FAILED", code: "ERR_X" }, waitedOut: false }, "READ_FAILED"],
  ["not found", { read: { state: "ANALYSIS_NOT_FOUND" }, waitedOut: false }, "ANALYSIS_NOT_FOUND"],
  ["NOT_STARTED", watch("NOT_STARTED"), "NOT_STARTED"],
  ["NOT_STARTED waited out", watch("NOT_STARTED", {}, true), "WAITED_OUT"],
  ["RUNNING", watch("RUNNING"), "RUNNING"],
  ["COMPLETED", watch("COMPLETED"), "COMPLETED"],
  ["PARTIAL budget", watch("PARTIAL"), "PARTIAL"],
  ["PARTIAL failures", watch("PARTIAL", { reason: "ROLE_FAILURES" }), "PARTIAL"],
  ["PARTIAL day budget", watch("PARTIAL", { reason: "DAY_BUDGET_EXHAUSTED" }), "PARTIAL"],
  ["DISABLED", watch("DISABLED"), "DISABLED"],
  ["DISABLED day limit", watch("DISABLED", { reason: "DAY_LIMIT_ZERO" }), "DISABLED"],
  ["DISABLED not provisioned", watch("DISABLED", { reason: "NOT_PROVISIONED" }), "DISABLED"],
  ["SKIPPED no pools", watch("SKIPPED"), "SKIPPED"],
  ["SKIPPED not person", watch("SKIPPED", { reason: "NOT_PERSON" }), "SKIPPED"],
  ["FAILED", watch("FAILED"), "FAILED"],
  ["FAILED budget", watch("FAILED", { reason: "ERR_BUDGET_EXHAUSTED" }), "FAILED"]
];

describe("AC-PANEL · the state line", () => {
  it("REPRODUCE: every state has its own line — path, one sentence, one transition — in a quiet status channel, EN and DE", () => {
    for (const locale of ["en", "de"] as const) {
      const sentences = new Set<string>();
      for (const [label, w, key] of LINES) {
        const html = panel(w, { state: "IDLE" }, locale);
        const line = autoMatchLine(w, AUTO_MATCH_COPY[locale]);
        expect(line.key, label).toBe(key);
        expect(attr(html, "auto-line", "data-line"), label).toBe(key);
        expect(html).toMatch(/data-testid="auto-line"[^>]*role="status"[^>]*aria-live="polite"/);
        expect(text(html), label).toContain(AUTO_MATCH_COPY[locale].path);
        expect(text(html), label).toContain(line.cause);
        expect(line.way.startsWith("→ "), label).toBe(true);
        expect((line.cause.match(/[.!?](\s|$)/g) ?? []).length, `${label}: one sentence`).toBe(1);
        sentences.add(`${line.cause}|${line.way}`);
      }
      // 17 situations, 14 distinct lines: the three DISABLED reasons share the sentence and differ in the named reason, the two FAILED
      // runs share it and differ in the named code (both stand beside the line, auto-line-detail).
      expect(sentences.size, locale).toBe(LINES.length - 3);
    }
  });

  it("REPRODUCE: the facts beside the line — budget and pools of a run, the reason of DISABLED, the code of FAILED", () => {
    expect(text(panel(watch("RUNNING")))).toContain("1 of 4 roles checked");
    expect(text(panel(watch("COMPLETED")))).toContain("4 of 4 roles checked semantically · call limit 25");
    expect(text(panel(watch("COMPLETED")))).toContain("Job pools: Pool Alpha · Pool Beta");
    expect(text(panel(watch("DISABLED", { reason: "DAY_LIMIT_ZERO" })))).toContain("no call budget for today");
    expect(text(panel(watch("DISABLED", { reason: "NOT_PROVISIONED" })))).toContain("the match store is not provisioned");
    expect(text(panel(watch("DISABLED", { reason: "NOT_PROVISIONED" }), { state: "IDLE" }, "de"))).toContain("der Abgleichspeicher ist nicht eingerichtet");
    expect(text(panel(watch("PARTIAL", { reason: "DAY_BUDGET_EXHAUSTED" })))).toContain("Today's call budget ran out during the matching; the roles not reached are ranked by name relation.");
    expect(text(panel(watch("PARTIAL", { reason: "DAY_BUDGET_EXHAUSTED" }), { state: "IDLE" }, "de"))).toContain("Das heutige Aufrufbudget war während des Abgleichs aufgebraucht");
    expect(text(panel(watch("FAILED", { reason: "ERR_BUDGET_EXHAUSTED" })))).toContain("code ERR_BUDGET_EXHAUSTED");
    expect(text(panel(watch("COMPLETED"), { state: "IDLE" }, "de"))).toContain("4 von 4 Rollen semantisch geprüft · Aufruflimit 25");
  });

  it("inverse: no line carries a word of prohibition or alarm, a warm colour, or an action other than the two existing ones", () => {
    for (const locale of ["en", "de"] as const) for (const [label, w] of LINES) {
      const html = panel(w, { state: "IDLE" }, locale);
      const line = autoMatchLine(w, AUTO_MATCH_COPY[locale]);
      expect(`${line.cause} ${line.way}`, label).not.toMatch(PROHIBITION);
      expect(colours(html).filter(c => !cool(c)), label).toEqual([]);
      const buttons = [...html.matchAll(/<button[^>]*data-testid="([^"]+)"/g)].map(m => m[1]);
      expect(buttons.every(id => id === "rd-open" || id === "auto-go-to-job-field"), `${label}: ${buttons}`).toBe(true);
      expect(html, label).not.toMatch(/type="checkbox"|<select|<input/);
    }
    // The Job Field switch only where no active pool was in the field.
    for (const [label, w] of LINES) expect(panel(w).includes('data-testid="auto-go-to-job-field"'), label).toBe(label === "SKIPPED no pools");
  });
});

describe("AC-PANEL · the ranking", () => {
  it("REPRODUCE: rank, role, organisation, pool, tier, fit and semantic coverage per rank, in the server's order; evidence class and authority above", () => {
    const html = panel(watch("COMPLETED"), shown);
    expect(attr(html, "auto-evidence", "data-evidence-class")).toBe("STAND_IN");
    expect(text(html)).toContain("STAND-IN · labelled, no model");
    expect(attr(html, "auto-authority", "data-authority-state")).toBe("NONE");
    expect(attr(html, "auto-authority", "data-decision")).toBe("false");
    expect(text(html)).toContain("Authority: none · a ranking from unverified relations, not a decision");
    const ranks = [...html.matchAll(/data-testid="auto-rank-([^"]+)" data-rank="(\d+)" data-tier="([A-Z_]+)" data-fit="([^"]*)"/g)].map(m => [m[1], Number(m[2]), m[3], m[4]]);
    expect(ranks).toEqual([
      ["JPOOL_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:role_platform", 1, "SEMANTIC", "0.8"],
      ["JPOOL_BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB:role_data", 2, "SEMANTIC", "0.125"],
      ["JPOOL_BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB:role_ops", 3, "LEXICAL_ONLY", "0.25"],
      ["JPOOL_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:role_empty", 4, "LEXICAL_ONLY", ""]
    ]);
    const t = text(html);
    for (const piece of ["Platform Engineer", "Org of Platform Engineer · Pool Alpha", "fit 80 %", "2 of 2 requirements checked semantically", "fit 13 %", "1 required without a meeting", "NAME RELATION ONLY", "no requirements · not rated"]) expect(t).toContain(piece);
    // Reasons stay folded until asked for: one WHY per role with requirements, none for the role without.
    expect((html.match(/data-testid="auto-rank-why"/g) ?? []).length).toBe(3);
    expect(html).not.toContain('data-testid="auto-rank-reasons"');
  });

  it("REPRODUCE: WHY opens the reasons — formula, per requirement necessity × weight, source, state, contribution, capability, statement, limitation, quote", () => {
    const r = decodeRoleRanking(ranking({ analysisId: ANALYSIS }), ANALYSIS)!;
    for (const locale of ["en", "de"] as const) {
      const html = renderToString(<RankRow id="x" rank={r.ranks[1]} c={AUTO_MATCH_COPY[locale]} locale={locale} open onToggle={() => undefined} />);
      const t = text(html);
      expect(t).toContain(AUTO_MATCH_COPY[locale].ranking.formula);
      expect(html).toMatch(/data-testid="auto-req-r3" data-source="SEMANTIC" data-state="DIFFERENT"/);
      expect(html).toMatch(/data-testid="auto-req-r4" data-source="LEXICAL" data-state="NAME_ALIAS"/);
      if (locale === "en") {
        expect(t).toContain("required · semantic · different · ×3 · 0 → 0");
        expect(t).toContain("optional · name · name alias · ×1 · 0.5 → 0.5");
        expect(t).toContain("capability: Capability r3");
        expect(t).toContain("Statement: Explanation for r3.");
        expect(t).toContain("Limitation: Limitation for r3.");
        expect(t).toContain('Source DOC_1: “placeholder quote 2”');
      } else {
        expect(t).toContain("optional · Name · Name Alias · ×1 · 0,5 → 0,5");
        expect(t).toContain("Aussage: Explanation for r3.");
        expect(t).toContain("Begrenzung: Limitation for r3.");
      }
      expect(html).toMatch(/data-testid="auto-rank-why"[^>]*aria-expanded="true"/);
    }
  });

  it("REPRODUCE: a ranking without any semantic relation is labelled as name relation, no model; pools left out are named; an empty ranking says so", () => {
    const lexicalOnly = ranking({ analysisId: ANALYSIS, evidenceClass: null, ranks: [(ranking().ranks as Array<Record<string, unknown>>)[2]].map(r => ({ ...r, rank: 1 })), counts: { pools: 2, roles: 4, ranked: 1 }, poolsDropped: ["JPOOL_CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC"] });
    const html = panel(watch("DISABLED"), { state: "AVAILABLE", ranking: decodeRoleRanking(lexicalOnly, ANALYSIS)! });
    expect(attr(html, "auto-evidence", "data-evidence-class")).toBe("NONE");
    expect(text(html)).toContain("NAME RELATION · no model statement");
    expect(text(html)).toContain("No longer active, left out: JPOOL_CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC");
    const empty = panel(watch("SKIPPED"), { state: "AVAILABLE", ranking: decodeRoleRanking(ranking({ analysisId: ANALYSIS, evidenceClass: null, pools: [], ranks: [], counts: { pools: 0, roles: 0, ranked: 0 } }), ANALYSIS)! });
    expect(text(empty)).toContain("No role to rank in the active job pools.");
    expect(text(panel(watch("COMPLETED", { evidenceClass: "REAL_GEMINI" }), { state: "AVAILABLE", ranking: decodeRoleRanking(ranking({ analysisId: ANALYSIS, evidenceClass: "REAL_GEMINI" }), ANALYSIS)! }, "de"))).toContain("GEMINI · Modellaussagen");
  });

  it("inverse: no ranking shown while it is not read (open run) or not readable — then no evidence class, no authority line, no ranks; its own sentence", () => {
    expect(panel(watch("RUNNING"))).not.toContain('data-testid="auto-ranking"');
    for (const [state, sentence] of [["LOADING", "The ranking is being read."], ["NOT_PERSON", "Only a PERSON analysis is ranked against the job pools."], ["PROJECTION_ABSENT", "no capability projection"], ["NOT_PROVISIONED", "not provisioned"], ["ANALYSIS_NOT_FOUND", "not on record"]] as const) {
      const html = panel(watch("COMPLETED"), { state } as JobRankingState);
      expect(text(html), state).toContain(sentence);
      for (const id of ["auto-evidence", "auto-authority", "auto-ranks"]) expect(html, `${state} ${id}`).not.toContain(`data-testid="${id}"`);
    }
    expect(text(panel(watch("COMPLETED"), { state: "FAILED", code: "ERR_Y" }))).toContain("The ranking is not readable at the moment. · code ERR_Y");
    expect(text(panel(watch("COMPLETED"), { state: "BOUNDARY_UNRESOLVED", reason: "MODE_MISMATCH" }))).toContain("(MODE_MISMATCH)");
  });

  it("inverse: the panel takes the discovery's slot and grammar, and the manual entry only as given", () => {
    const html = panel(watch("COMPLETED"), shown);
    expect(html).toMatch(/data-testid="auto-ranking-panel" data-pxj-panel="true" data-rd-panel="true"/);
    expect(html).toContain('data-testid="rd-open"');
    expect(html).not.toContain('data-sx-shell="rd-entry"');
    expect(panel(watch("COMPLETED"), shown, "en", false)).not.toContain('data-testid="rd-open"');
  });
});
