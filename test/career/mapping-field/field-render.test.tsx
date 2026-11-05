import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import signTable from "../../../docs/architecture/decision-fields/mapping-spec/sign-table.json";
import { LINE_DASH, MAPPING_FIELD_CSS, PersonJobMappingField } from "../../../app/components/career/demo/PersonJobMappingField";
import { MAPPING_FIELD_COPY } from "../../../app/components/career/demo/mapping-field-copy";
import { AutoJobRankingPanel } from "../../../app/components/career/demo/AutoJobRankingPanel";
import { mappingFieldModel } from "../../../lib/career/view-model/mapping-field";
import type { AutoMatchWatch, JobRankingState } from "../../../lib/career/ui/auto-match";
import { available, classRoles, crowdedRoles, projectionOf, rankingOf, standardRanking, watchOf } from "./support";

/**
 * MAP-C-RENDER · the field server-rendered (EN and DE): one body per drawn role with the model's attributes, the class told by the
 * line only (never by colour), the evidence class and the authority always beside it, the run's time sign at field level, the
 * count of what is not drawn, no new figure, no word that claims more than a ranking. And the panel's slot: the field stands above
 * the ranked list while a ranking is shown; without a field the panel is the panel it was.
 */
const html = (ranking: JobRankingState, watch: AutoMatchWatch = watchOf("COMPLETED"), locale: "en" | "de" = "en") =>
  renderToString(<PersonJobMappingField locale={locale} projection={projectionOf()} ranking={ranking} watch={watch} />);
const text = (markup: string) => markup.replace(/<style>[\s\S]*?<\/style>/g, "").replace(/<title>[\s\S]*?<\/title>/g, " ").replace(/<!-- -->/g, "").replace(/<[^>]+>/g, " ")
  .replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const attr = (markup: string, testId: string, name: string) => new RegExp(`data-testid="${testId}"[^>]*?${name}="([^"]*)"`).exec(markup)?.[1] ?? null;
const tags = (markup: string, prefix: string) => [...markup.matchAll(new RegExp(`<[a-z]+[^>]*data-testid="${prefix}[^"]*"[^>]*>`, "g"))].map(m => m[0]);
/** Words that would claim more than a ranking of unverified relations (P-07 vocabulary, auto-match-copy's rule). */
const CLAIM = /\b(match(es|ed)?|fit|fits|qualified|recommend(ed|ation)?|suitable|verified skill|best candidate)\b|eignung|geeignet|passt|empfohlen|empfehlung|qualifiziert/i;

describe("MAP-C-RENDER · the field", () => {
  it("REPRODUCE: one body per drawn role, with rank, tier, class, line, shelf and the model's place", () => {
    const ranking = available(standardRanking());
    const m = mappingFieldModel({ projection: projectionOf(), ranking, watch: watchOf("COMPLETED") })!;
    const markup = html(ranking);
    const bodies = tags(markup, "mapping-body-");
    expect(bodies.length).toBe(m.bodies.length);
    for (const b of m.bodies) {
      const id = `mapping-body-${b.id.jobPoolUploadId}:${b.id.poolRoleId}`;
      expect(attr(markup, id, "data-rank"), id).toBe(String(b.rank));
      expect(attr(markup, id, "data-tier")).toBe(b.tier);
      expect(attr(markup, id, "data-class")).toBe(b.class);
      expect(attr(markup, id, "data-line")).toBe(b.line);
      expect(attr(markup, id, "data-shelf")).toBe(String(b.shelf));
      expect(markup).toContain(`transform:translate(${b.x}px, ${b.y}px)`);
    }
    expect(attr(markup, "mapping-field", "data-level")).toBe("L0");
    expect(attr(markup, "mapping-field", "data-bodies")).toBe(String(m.bodies.length));
    for (const node of m.constellation.nodes) expect(markup).toContain(`data-testid="mapping-capability-${node.key}"`);
    for (const s of m.sectors) expect(markup).toContain(`data-testid="mapping-pool-${s.poolId}"`);
  });

  it("the class is told by the line, never by colour: the three classes share stroke and fill, and differ in dash", () => {
    const markup = html(available(rankingOf(classRoles())));
    const shapes = [...markup.matchAll(/data-class="(SEMANTIC|LEXICAL|NONE)"[\s\S]*?<circle data-mapping-body-shape="true"([^>]*)>/g)].map(m => ({ cls: m[1], circle: m[2] }));
    expect(new Set(shapes.map(s => s.cls))).toEqual(new Set(["SEMANTIC", "LEXICAL", "NONE"]));
    const paint = (circle: string) => [/fill="([^"]*)"/.exec(circle)?.[1], /stroke="([^"]*)"/.exec(circle)?.[1]].join("|");
    expect(new Set(shapes.map(s => paint(s.circle))).size, "one paint for every class").toBe(1);
    const dash = (circle: string) => /stroke-dasharray="([^"]*)"/.exec(circle)?.[1] ?? "none";
    const byClass = new Map(shapes.map(s => [s.cls, dash(s.circle)] as const));
    expect(new Set(byClass.values()).size, "three dashes for three classes").toBe(3);
    // Every line word of the sign table has a drawing; an unknown word is refused, never drawn as another.
    for (const sign of Object.values(signTable.couplingStates)) expect(LINE_DASH[sign.arcLine], sign.arcLine).toBeTypeOf("function");
  });

  it("the evidence class and the authority stand with the field (B-6), EN and DE", () => {
    for (const locale of ["en", "de"] as const) {
      const markup = html(available(standardRanking()), watchOf("COMPLETED"), locale);
      expect(attr(markup, "mapping-field-evidence", "data-evidence-class")).toBe("STAND_IN");
      expect(attr(markup, "mapping-field-authority", "data-authority-state")).toBe("NONE");
      expect(attr(markup, "mapping-field-authority", "data-decision")).toBe("false");
      expect(text(markup)).toContain(MAPPING_FIELD_COPY[locale].authority);
      expect(text(markup)).toContain(MAPPING_FIELD_COPY[locale].evidence.STAND_IN);
      expect(text(markup)).toContain(MAPPING_FIELD_COPY[locale].position);
    }
  });

  it("REPRODUCE: the time sign — RUNNING breathes (name and no-relation bodies only), STALLED stands still, a due continuation pulses", () => {
    const ranking = available(rankingOf(classRoles()));
    const running = html(ranking, watchOf("RUNNING"));
    expect(attr(running, "mapping-field", "data-pending-breath")).toBe("true");
    expect(running).toContain('data-testid="mapping-pending"');
    for (const tag of tags(running, "mapping-body-")) expect(tag.includes('data-breath="true"'), tag).toBe(!tag.includes('data-class="SEMANTIC"'));
    expect(running).not.toContain('data-testid="mapping-still"');

    const stalled = html(ranking, watchOf("STALLED"));
    expect(attr(stalled, "mapping-field", "data-frozen")).toBe("true");
    expect(stalled).toMatch(/data-testid="mapping-still"[^>]*role="status"/);
    expect(text(stalled)).toContain(MAPPING_FIELD_COPY.en.still);
    expect(stalled).not.toContain('data-breath="true"');
    const stalledResume = html(ranking, watchOf("STALLED", { resumePending: true }));
    expect(text(stalledResume)).toContain(MAPPING_FIELD_COPY.en.stillResume);
    expect(stalledResume, "STALLED stays frozen even while resumePending: no pulse").not.toContain('data-testid="mapping-resume-pulse"');

    const due = html(ranking, watchOf("PARTIAL", { resumePending: true }));
    expect(due).toContain('data-testid="mapping-resume-pulse"');
    expect(due).toMatch(/mappingFieldPulse 6s/);
    for (const quiet of [html(ranking, watchOf("COMPLETED")), html(ranking, watchOf("PARTIAL"))]) {
      expect(quiet).not.toContain('data-testid="mapping-resume-pulse"');
      expect(quiet).not.toContain('data-breath="true"');
      expect(quiet).not.toContain('data-testid="mapping-still"');
    }
  });

  it("under prefers-reduced-motion nothing breathes, pulses or travels; pending is a static dashed outline", () => {
    const reduce = /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*)\}\s*$/.exec(MAPPING_FIELD_CSS)?.[1] ?? "";
    expect(reduce).toMatch(/animation: none !important; transition: none !important;/);
    expect(reduce).toMatch(/\[data-pending-breath="true"\] \[data-testid="mapping-pending-outline"\] \{ display: inline; \}/);
    expect(MAPPING_FIELD_CSS).toMatch(/\[data-testid="mapping-pending-outline"\] \{ display: none; \}/);
    expect(MAPPING_FIELD_CSS).toMatch(/\[data-frozen="true"\] \*[^{]*\{ animation: none !important; transition: none !important; \}/);
  });

  it("what has no room is counted, not drawn — and says where it stands", () => {
    const markup = html(available(rankingOf(crowdedRoles(320))));
    const m = mappingFieldModel({ projection: projectionOf(), ranking: available(rankingOf(crowdedRoles(320))), watch: watchOf("COMPLETED") })!;
    expect(attr(markup, "mapping-overflow", "data-count")).toBe(String(m.overflowCount));
    expect(tags(markup, "mapping-body-").length).toBe(m.bodies.length);
    expect(text(markup)).toContain(MAPPING_FIELD_COPY.en.notDrawn(m.overflowCount));
  });

  it("no new figure, no claim word, EN and DE: no percent, no fit, no score; the words say ranking, not decision", () => {
    for (const locale of ["en", "de"] as const) {
      const markup = html(available(standardRanking()), watchOf("RUNNING"), locale);
      const words = text(markup);
      expect(words, locale).not.toMatch(/%/);
      expect(words, locale).not.toMatch(CLAIM);
      expect(markup, locale).not.toMatch(/data-(fit|score|percent|contribution)=/);
      for (const value of Object.values(MAPPING_FIELD_COPY[locale])) if (typeof value === "string") expect(value, locale).not.toMatch(CLAIM);
    }
  });

  it("§8.13 inverse: no empty or error reading is drawn as an empty field — each states its own reason, EN and DE, never a body", () => {
    const readings: Array<[JobRankingState, string]> = [
      [{ state: "IDLE" }, "NO_RANKING"], [{ state: "LOADING" }, "NO_RANKING"], [{ state: "FAILED", code: null }, "NO_RANKING"], [available(rankingOf([])), "NO_ROLES"],
      [{ state: "NOT_PERSON" }, "NOT_PERSON"], [{ state: "PROJECTION_ABSENT" }, "PROJECTION_ABSENT"], [{ state: "BOUNDARY_UNRESOLVED", reason: null }, "BOUNDARY_UNRESOLVED"],
      [{ state: "NOT_PROVISIONED" }, "NOT_PROVISIONED"], [{ state: "ANALYSIS_NOT_FOUND" }, "ANALYSIS_NOT_FOUND"]
    ];
    for (const locale of ["en", "de"] as const) {
      const sentences = new Map<string, string>();
      for (const [ranking, reason] of readings) {
        const markup = html(ranking, watchOf("COMPLETED"), locale);
        expect(attr(markup, "mapping-empty", "data-reason"), `${locale} ${ranking.state}`).toBe(reason);
        expect(text(markup), `${locale} ${ranking.state}`).toContain(MAPPING_FIELD_COPY[locale].empty[reason as keyof typeof MAPPING_FIELD_COPY["en"]["empty"]]);
        expect(markup, ranking.state).not.toContain('data-testid="mapping-body-');
        expect(markup, ranking.state).not.toContain('data-testid="mapping-field-svg"');
        sentences.set(reason, MAPPING_FIELD_COPY[locale].empty[reason as keyof typeof MAPPING_FIELD_COPY["en"]["empty"]]);
      }
      expect(new Set(sentences.values()).size, "seven readings, seven sentences").toBe(7);
    }
    // A ranking whose run is not read yet is no field either.
    expect(attr(html(available(standardRanking()), { read: { state: "LOADING" }, waitedOut: false }), "mapping-empty", "data-reason")).toBe("NO_RANKING");
  });
});

describe("MAP-C-SLOT · the automatic ranking's panel", () => {
  const panel = (field?: React.ReactNode) => renderToString(<AutoJobRankingPanel locale="en" watch={watchOf("COMPLETED")} ranking={available(standardRanking())} field={field} />);
  it("REPRODUCE: the field stands after the authority line and above the ranked list", () => {
    const markup = panel(<PersonJobMappingField locale="en" projection={projectionOf()} ranking={available(standardRanking())} watch={watchOf("COMPLETED")} />);
    const at = (id: string) => markup.indexOf(`data-testid="${id}"`);
    expect(at("mapping-field")).toBeGreaterThan(at("auto-authority"));
    expect(at("mapping-field")).toBeLessThan(at("auto-ranks"));
  });

  it("inverse: without a field the panel renders as before — and with one, the panel's own rows are all still there", () => {
    const without = panel(), withField = panel(<PersonJobMappingField locale="en" projection={projectionOf()} ranking={available(standardRanking())} watch={watchOf("COMPLETED")} />);
    expect(without).not.toContain("mapping-field");
    const strip = (markup: string) => markup.replace(/<section data-testid="mapping-field"[\s\S]*?<\/section>/, "");
    expect(strip(withField)).toBe(without);
    // Not shown where no ranking is shown.
    const idle = renderToString(<AutoJobRankingPanel locale="en" watch={watchOf("COMPLETED")} ranking={{ state: "LOADING" }} field={<span data-testid="probe" />} />);
    expect(idle).not.toContain("probe");
  });
});
