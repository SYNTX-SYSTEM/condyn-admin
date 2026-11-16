import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { browser, instance } from "../pxj-first-screen/harness";
import { CAPS, POOL_A, available, crowdedRoles, projectionOf, rankingOf, standardRoles, watchOf } from "./support";
import { allStates, keyCases } from "./support-d";
import { fieldViewBox, mappingFieldModel } from "../../../lib/career/view-model/mapping-field";

/**
 * MAP-G-FIELD · PERSON_X_JOB_MAPPING_PHASE_G.md at the drawing (GRÜN). The light budget (PG-1/2/6/10/11/12/13) and the frame and
 * occlusion bounds on pixels (PG-14/15) are measured in a running browser; here are the structural parts a render can decide.
 */
vi.mock("react", async (importOriginal) => (await import("../pxj-first-screen/harness")).mockReact(await importOriginal<object>()));
import { BODY_BUDGET, CROWDING, DISC_OCCLUSION, l0Margin, GAP_HUE, MAPPING_FIELD_CSS, PersonJobMappingField, TRAVEL, WAVE, type PersonJobMappingFieldProps } from "../../../app/components/career/demo/PersonJobMappingField";
import { MAPPING_FIELD_COPY } from "../../../app/components/career/demo/mapping-field-copy";

type Tree = ReactElement<Record<string, unknown>>;
function byTestId(node: unknown, id: string): Tree | null {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) { for (const child of node) { const hit = byTestId(child, id); if (hit) return hit; } return null; }
  const element = node as Tree;
  if (element.props?.["data-testid"] === id) return element;
  return byTestId(element.props?.children, id);
}
function all(node: unknown, match: (e: Tree) => boolean, out: Tree[] = []): Tree[] {
  if (!node || typeof node !== "object") return out;
  if (Array.isArray(node)) { for (const child of node) all(child, match, out); return out; }
  const element = node as Tree;
  if (match(element)) out.push(element);
  all(element.props?.children, match, out);
  return out;
}
const cls = (e: Tree) => String(e.props?.className ?? "");
const textOf = (node: unknown): string => !node ? "" : typeof node === "string" || typeof node === "number" ? String(node) : Array.isArray(node) ? node.map(textOf).join("") : textOf((node as Tree).props?.children);
const bodies = (t: unknown) => all(t, e => e.props?.["data-mapping-body"] === true);
const fire = (node: Tree | null, handler: string) => { expect(node, handler).not.toBeNull(); (node!.props[handler] as (e: unknown) => void)({ stopPropagation: () => undefined, preventDefault: () => undefined, key: "Enter" }); };

let tab: ReturnType<typeof browser>;
beforeEach(() => {
  tab = browser("http://127.0.0.1/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=CAN_00000000000000000000000000000002");
  vi.stubGlobal("window", tab.window);
  vi.stubGlobal("fetch", async () => ({ status: 500, json: async () => ({}) }));
});
afterEach(() => { vi.unstubAllGlobals(); });
const props = (rs = [allStates(), keyCases(), ...standardRoles()]): PersonJobMappingFieldProps => ({ locale: "en", projection: projectionOf(CAPS), ranking: available(rankingOf(rs)), watch: watchOf("COMPLETED") });
const modelOf = (p: PersonJobMappingFieldProps) => mappingFieldModel({ projection: p.projection, ranking: p.ranking, watch: p.watch })!;

describe("MAP-G-FIELD · G-1 / PG-21 — one dark field: no lit plate, only occlusion", () => {
  it("REPRODUCE: the one opaque disc is OCCLUSION in the stage's own ground colour (no light of its own); the medium is the faint ground and its wave; the glows are their own group, outside the medium", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const tree = view.settle(props());
    const medium = byTestId(tree, "mapping-medium")!;
    const opaque = all(medium.props.children, e => e.type === "circle" && /^rgb\(/.test(String(e.props.fill)));
    expect(opaque.map(e => [e.props.fill, e.props.r]), "occlusion only, in the stage's ground colour (rgb 3, 5, 8: the section's own dark at alpha 1)").toEqual(DISC_OCCLUSION ? [["rgb(3, 5, 8)", 500]] : []);
    expect(all(medium.props.children, e => /\bmf-halo\b/.test(cls(e))), "no glow in the medium").toEqual([]);
    const glows = byTestId(tree, "mapping-glows")!;
    expect([glows.props["aria-hidden"], glows.props.pointerEvents]).toEqual(["true", "none"]);
    view.unmount();
  });
});

describe("MAP-G-FIELD · G-2 / PG-4 / A-G9 — a body is named, and measured without a figure", () => {
  it("REPRODUCE: every drawn body at L0 carries its name and its measure — rank and tier in words; no percent, no fit, no score", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props();
    const tree = view.settle(p);
    const drawn = bodies(tree);
    expect(drawn.length).toBeGreaterThan(0);
    for (const b of drawn) {
      const id = String(b.props["data-testid"]).replace("mapping-body-", "");
      expect(byTestId(b, `mapping-name-${id}`), `${id} named`).not.toBeNull();
      const measure = textOf(byTestId(b, `mapping-measure-${id}`));
      expect(measure, id).toBe(MAPPING_FIELD_COPY.en.measure(Number(b.props["data-rank"]), b.props["data-tier"] === "SEMANTIC"));
      expect(measure, id).not.toMatch(/%|\bfit\b|score/i);
    }
    view.unmount();
  });

  it("PG-3 / V1.1: the drawn radius is the model's (the layout's collision radius), monotone in requirement mass, never smaller than the mass radius", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props();
    const tree = view.settle(p);
    const m = modelOf(p);
    for (const b of bodies(tree)) {
      const body = m.bodies.find(x => `mapping-body-${x.id.jobPoolUploadId}:${x.id.poolRoleId}` === b.props["data-testid"])!;
      expect(Number(b.props["data-drawn-radius"]), body.title).toBeGreaterThanOrEqual(body.drawnRadius - 1e-3);
      expect(body.drawnRadius, body.title).toBeGreaterThan(body.radius);
    }
    view.unmount();
  });
});

describe("MAP-G-FIELD · PG-5 — presence is a budget, stated on its own", () => {
  // PG-16 (R23): the spacing wins and the budget shrinks — the drawn set is greedy by rank under the crowding bound, at most the budget.
  it("REPRODUCE: L0 draws by rank, at most BODY_BUDGET.L0, every pair spaced ≥ CROWDING × eccentricity (a stronger body that would crowd one drawn is left to the list); L1 likewise of its pool; the rest is mapping-beyond-budget, overflow stays overflow", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props([...crowdedRoles(30, POOL_A), ...standardRoles()]);
    const m = modelOf(p);
    let tree = view.settle(p);
    const drawnBodies = bodies(tree).map(b => m.bodies.find(x => `mapping-body-${x.id.jobPoolUploadId}:${x.id.poolRoleId}` === b.props["data-testid"])!);
    expect(m.bodies.length, "precondition: more bodies have room than L0 draws").toBeGreaterThan(BODY_BUDGET.L0);
    expect(drawnBodies.length).toBeLessThanOrEqual(BODY_BUDGET.L0);
    const spacedOk = (a: typeof drawnBodies[number], b: typeof drawnBodies[number]) => Math.hypot(a.x - b.x, a.y - b.y) - a.drawnRadius - b.drawnRadius >= CROWDING * Math.max(Math.hypot(a.x, a.y), Math.hypot(b.x, b.y));
    for (let i = 0; i < drawnBodies.length; i++) for (let j = i + 1; j < drawnBodies.length; j++) expect(spacedOk(drawnBodies[i], drawnBodies[j]), `${drawnBodies[i].title}/${drawnBodies[j].title}`).toBe(true);
    const lastDrawn = Math.max(...drawnBodies.map(b => b.rank));
    for (const skipped of m.bodies.filter(b => b.rank < lastDrawn && !drawnBodies.includes(b)))
      expect(drawnBodies.filter(d => d.rank < skipped.rank).some(d => !spacedOk(d, skipped)), `rank ${skipped.rank} left out only because it crowds a stronger drawn body`).toBe(true);
    expect(drawnBodies.some(b => b.rank === 1), "the strongest is always drawn").toBe(true);
    expect(byTestId(tree, "mapping-beyond-budget")!.props["data-count"]).toBe(m.bodies.length - drawnBodies.length);
    expect(byTestId(tree, "mapping-overflow")?.props["data-count"] ?? 0, "overflow is its own count").toBe(m.overflowCount);
    fire(byTestId(tree, `mapping-pool-${POOL_A}`), "onClick"); tree = view.settle(p);
    const inPool = bodies(tree).filter(b => b.props["data-in-pool"] === "true");
    const poolBodies = m.bodies.filter(b => b.id.jobPoolUploadId === POOL_A);
    expect(inPool.length, "L1: at most the pool's twelve").toBeLessThanOrEqual(Math.min(BODY_BUDGET.L1, poolBodies.length));
    expect(inPool.length).toBeGreaterThan(0);
    expect(byTestId(tree, "mapping-beyond-budget")?.props["data-count"] ?? 0).toBe(poolBodies.length - inPool.length);
    // every drawn beam belongs to a drawn body
    const drawnKeys = new Set(bodies(tree).map(b => String(b.props["data-testid"]).replace("mapping-body-", "")));
    for (const beam of all(tree, e => String(e.props?.["data-testid"] ?? "").startsWith("mapping-beam-"))) expect(drawnKeys.has(String(beam.props["data-testid"]).replace("mapping-beam-", "").split(":").slice(0, 2).join(":"))).toBe(true);
    view.unmount();
  });
});

describe("MAP-G-FIELD · G-4 / PG-8 — hue answers exactly one question", () => {
  it("REPRODUCE: the one hue sits exactly on the glows of bodies with an unmet REQUIRED requirement, and nowhere else in the field", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props();
    const tree = view.settle(p);
    const m = modelOf(p);
    const gaps = new Map<string, number>(m.ranking.ranks.map(r => [`${r.role.jobPoolUploadId}:${r.role.poolRoleId}`, r.requiredGaps]));
    let withGap = 0, without = 0;
    for (const b of bodies(tree)) {
      const id = String(b.props["data-testid"]).replace("mapping-body-", "");
      expect(b.props["data-required-gaps"], id).toBe(gaps.get(id));
      if (gaps.get(id)! > 0) withGap += 1; else without += 1;
    }
    expect([withGap > 0, without > 0], "precondition: both kinds drawn").toEqual([true, true]);
    // every glow — the field's and the shelf's — carries the hue exactly when its own body has an unmet REQUIRED requirement
    const glowGroups = all(byTestId(tree, "mapping-field-svg"), e => /\bmf-halo\b/.test(cls(e)));
    expect(glowGroups.length, "one glow per drawn body").toBe(withGap + without);
    for (const g of glowGroups) {
      const key = String(g.key).replace(/^halo\|/, "").replace(/#.*$/, "").replace("\u0000", ":");
      const fill = all(g.props.children, e => e.type === "circle")[0].props.fill;
      expect(fill, key).toBe(gaps.get(key)! > 0 ? "url(#mf-halo-gap)" : "url(#mf-halo)");
    }
    // nowhere else: no element in the field svg paints the hue except the gap gradient's stops
    const svg = byTestId(tree, "mapping-field-svg")!;
    const hued = all(svg, e => [e.props?.stroke, e.props?.fill, e.props?.stopColor].some(v => typeof v === "string" && v.includes(GAP_HUE)));
    expect(hued.every(e => e.type === "stop"), "only the gap gradient carries the hue").toBe(true);
    view.unmount();
  });
});

describe("MAP-G-FIELD · G-3 / PG-7 — relations carry their own light", () => {
  it("REPRODUCE: each drawn relation has its glow under it and one travelling light over it; the sign's stroke, dash and data are untouched", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const tree = view.settle(props());
    const group = byTestId(tree, "mapping-beams")!;
    const beams = all(group, e => String(e.props?.["data-testid"] ?? "").startsWith("mapping-beam-"));
    expect(beams.length).toBeGreaterThan(0);
    expect(all(group, e => cls(e) === "mf-travel").length).toBe(beams.length);
    expect(all(group, e => cls(e) === "mf-beam-glow").length).toBe(beams.length);
    for (const t of all(group, e => cls(e) === "mf-travel" || cls(e) === "mf-beam-glow")) expect([t.props["aria-hidden"], t.props.pointerEvents, Object.keys(t.props).filter(k => k.startsWith("data-"))]).toEqual(["true", "none", []]);
    view.unmount();
  });

  it("PG-7: the travel is CSS keyed on the breath, its period an exact integer divisor of the breath's, hidden under reduced motion", () => {
    expect(MAPPING_FIELD_CSS).toContain(`[data-testid="mapping-field"][data-breath="LIVE"] .mf-travel { opacity: 1; animation: mappingFieldTravel ${TRAVEL.periodMs}ms linear infinite; }`);
    expect(Number.isInteger(WAVE.periodMs / TRAVEL.periodMs)).toBe(true);
    expect(MAPPING_FIELD_CSS).toMatch(/@media \(prefers-reduced-motion: reduce\) \{[\s\S]*\.mf-travel \{ visibility: hidden; \}/);
  });
});

/**
 * §131 · THE EM THE FRAME ACTUALLY USES, READ FROM THE PRODUCT RATHER THAN RETYPED.
 *
 * `FRAME_EM_PER_CHAR` is module-private, so the label check below used to carry a BARE `0.62` — the same bare
 * literal §86 found in `frameWithBodies` itself and named as a defect ("`CHAR_EM` NEVER GOVERNED THIS
 * FUNCTION"). A test that retypes the constant it is checking against cannot fail when that constant moves:
 * it would keep measuring the old frame and keep passing. So it is read, and the read FAILS LOUD.
 *
 * §116's lesson is honoured in the shape rather than the strictness: the needle pins the PROPERTY (the two
 * faces' ems, under any spacing) and a miss throws a named error instead of silently falling back.
 *
 * *** AND WHAT THIS LIMB CAN AND CANNOT FALSIFY, BECAUSE THE BARE LITERAL MADE IT LOOK INDEPENDENT AND IT IS
 * NOT. *** The product sizes the frame from this same em, so the containment check below is TAUTOLOGICAL IN
 * THE EM: no value of it can make the limb fail. What the limb can falsify is the solve DISAGREEING WITH ITS
 * OWN EXTENT MODEL — which is exactly §64's defect, where the frame was emitted at the previous iterate's `k`
 * and clipped by 1.59 px. Reading the constant does not buy independence; it buys that the limb stops
 * measuring a DIFFERENT frame from the product's the moment the product's model is corrected upward, which a
 * retyped 0.62 would have done silently while still passing. Real glyph advance is PINK's browser route.
 */
const FRAME_SRC = readFileSync(join(__dirname, "../../../app/components/career/demo/PersonJobMappingField.tsx"), "utf8");
function fromComponent(re: RegExp, what: string): number {
  const m = re.exec(FRAME_SRC);
  if (m === null) throw new Error(`ERR_FRAME_CONSTANT_UNREADABLE: ${what} is not where this proof reads it — the frame's own constant moved and the check below would have gone on using the retyped value.`);
  return Number(m[1]);
}
const FRAME_EM_SANS = fromComponent(/FRAME_EM_PER_CHAR\s*=\s*Object\.freeze\(\{\s*sans:\s*([\d.]+)/, "FRAME_EM_PER_CHAR.sans");
const FRAME_EM_MONO = fromComponent(/FRAME_EM_PER_CHAR\s*=\s*Object\.freeze\(\{\s*sans:\s*[\d.]+,\s*mono:\s*([\d.]+)/, "FRAME_EM_PER_CHAR.mono");
const FRAME_PASS_CAP = fromComponent(/FRAME_PASS_CAP\s*=\s*(\d+)/, "FRAME_PASS_CAP");

describe("MAP-G-FIELD · PG-14 / PG-15 — framed whole, rings behind", () => {
  // PG-14: the widening exists for what a drawn body carries beyond its rim — the name above and the measure below (the rims of the
  // existing inputs never leave the base frame: a body on the shelf sits off the frame's axes). Read from the rendered text elements.
  it("REPRODUCE: L0 and L1 frame every drawn body whole — rim, name above, measure below — inside the viewBox; at L2 the open role's ring lies outside its drawn disc", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props();
    let tree = view.settle(p);
    const inside = (t: unknown, level: string) => {
      const [x, y, w, h] = String(byTestId(t, "mapping-field-svg")!.props.viewBox).split(" ").map(Number);
      let checked = 0;
      for (const b of bodies(t).filter(b => b.props["data-in-pool"] === "true")) {
        const [bx, by] = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(String((b.props.style as Record<string, string>).transform))!.slice(1).map(Number);
        const r = Number(b.props["data-drawn-radius"]), id = String(b.props["data-testid"]).replace("mapping-body-", "");
        expect(bx - r >= x && bx + r <= x + w && by - r >= y && by + r <= y + h, `${level} ${id} rim`).toBe(true);
        // the name is SANS and the measure MONO — §86's second correction; each is bought in its own face's em
        for (const [tid, em] of [[`mapping-name-${id}`, FRAME_EM_SANS], [`mapping-measure-${id}`, FRAME_EM_MONO]] as const) {
          const text = byTestId(b, tid); if (text === null) continue;
          const font = Number(text.props.fontSize), ty = by + Number(text.props.y), half = (textOf(text).length * em * font) / 2;
          expect(ty - font >= y && ty + 0.3 * font <= y + h && bx - half >= x && bx + half <= x + w, `${level} ${tid}`).toBe(true);
          checked += 1;
        }
      }
      return checked;
    };
    const base = fieldViewBox(l0Margin(960, 500));
    expect(Number(String(byTestId(tree, "mapping-field-svg")!.props.viewBox).split(" ")[2]), "precondition: the L0 frame was widened beyond its base to hold them").toBeGreaterThan(base.width);
    expect(inside(tree, "L0"), "L0: labels were checked, not skipped").toBeGreaterThan(0);
    fire(byTestId(tree, `mapping-pool-${POOL_A}`), "onClick"); tree = view.settle(p);
    /* §131: the L1 call's RETURN WAS DISCARDED, so the whole L1 half of this proof passed over nothing the
       moment L1 stopped carrying an in-pool body with a label. Measured here: 2 bodies x 2 labels = 4. */
    expect(inside(tree, "L1"), "L1: labels were checked, not skipped — the discarded return made this limb silently vacuous").toBeGreaterThan(0);
    const open = bodies(tree).find(b => b.props["data-in-pool"] === "true")!;
    fire(open, "onClick"); tree = view.settle(p);
    const ring = byTestId(tree, "mapping-ring")!;
    expect(Number(ring.props["data-radius"]), "the ring outside the drawn disc").toBeGreaterThan(Number(bodies(tree)[0].props["data-drawn-radius"]));
    view.unmount();
  });

  /**
   * §131 · PG-14's RESTATED CONTENT, WHICH NOTHING HERE ASSERTED: A-G271 established that PG-14's falsifiable
   * content is **the convergence of the two-pass fixed point, not the containment**, and §66 replaced the
   * fixed two passes with an iteration to half a device pixel under a cap. The pin has stood
   * RESTATED/UNVERIFIED ever since — `gruen-pg14-frame-fixed.mjs` sweeps 440 cases of the ARITHMETIC and says
   * so itself: *"this derivation renders nothing and cannot establish"* that the disclosure is unconditional.
   * This is the half that needs a render, and it is the cheap half.
   *
   * AND IT IS THE ONLY LIMB IN THIS PROOF THAT CAN SEE §64's DEFECT CLASS, WHICH WAS MEASURED RATHER THAN
   * ASSUMED. With `FRAME_PASS_CAP` mutated to 1 — the single-pass version of the very defect §66 replaced —
   * the containment limb above STAYS GREEN and only this one fails. That is not a fault in the limb above:
   * §64's shortfall was 1.59 px at a 16-character name at 420 px, and this proof's population carries short
   * titles at 960 px, where the residual is 0.1008 px. So on the populations a render can reach, the
   * convergence DISCLOSURE is the carrier of PG-14's falsifiable content and the containment is not.
   *
   * THREE STATES, AND THE THIRD IS THE ONE THAT MATTERS. At L2 `framed` is empty, so the solve never runs:
   * §87 changed `converged` from a VACUOUS `true` to `null`/"n/a" for exactly that reason. Asserting "n/a"
   * here is what stops the vacuous true returning unnoticed — a true at L2 would read as a healthy solve
   * where none executed.
   */
  it("§131: PG-14's solve DISCLOSES its own convergence in every state — true inside the cap at L0 and L1, \"n/a\" at L2 where it never runs (§87's vacuous true cannot return)", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props();
    let tree = view.settle(p);
    const disclosure = (level: string) => {
      const field = byTestId(tree, "mapping-field")!;
      const converged = field.props["data-frame-converged"], passes = field.props["data-frame-passes"];
      // UNCONDITIONAL is the claim §86 makes and only a render can check: present in every state, not only when something went wrong.
      expect(converged, `${level}: data-frame-converged is absent — the disclosure is conditional, which cannot be told from a removed one`).not.toBeUndefined();
      expect(passes, `${level}: data-frame-passes is absent`).not.toBeUndefined();
      return { converged: String(converged), passes: Number(passes) };
    };
    const l0 = disclosure("L0");
    expect(l0.converged, "L0: the solve reached its fixed point").toBe("true");
    expect(Number.isInteger(l0.passes) && l0.passes >= 1 && l0.passes < FRAME_PASS_CAP, `L0: passes ${l0.passes} is a real iterate count inside the cap of ${FRAME_PASS_CAP}`).toBe(true);
    fire(byTestId(tree, `mapping-pool-${POOL_A}`), "onClick"); tree = view.settle(p);
    const l1 = disclosure("L1");
    expect(l1.converged, "L1: the solve reached its fixed point").toBe("true");
    expect(Number.isInteger(l1.passes) && l1.passes >= 1 && l1.passes < FRAME_PASS_CAP, `L1: passes ${l1.passes} inside the cap`).toBe(true);
    const open = bodies(tree).find(b => b.props["data-in-pool"] === "true")!;
    fire(open, "onClick"); tree = view.settle(p);
    const l2 = disclosure("L2");
    expect([l2.converged, l2.passes], "L2: the solve has nothing to frame, so it reports NOT APPLICABLE and zero passes — never a convergence it did not perform").toEqual(["n/a", 0]);
    view.unmount();
  });

  /**
   * §131 · THE ONE EXTENT OF THE THREE THAT HAS NO CARRIER ANYWHERE, STATED AS A MEASUREMENT RATHER THAN
   * LEFT AS SILENCE. §86's second correction was the ASYMMETRIC reservation for `mapping-collar-more-*`: a
   * LEFT-ANCHORED label needs its full width past its own anchor, not half a width about a centre. §84 found
   * it renders ZERO times on the served population, the golden vectors are L0 populations so the sweep's
   * `collarMore` is null throughout, and this proof's own populations render it zero times at L0, L1 and L2.
   *
   * *** AND THE MECHANISM THE RECORD GIVES FOR THAT ZERO IS THE WRONG QUANTITY (F-G10). *** A-G373 wrote
   * *"`:784` emits the span only when `floored > 0`"*, and `gruen-pg14-frame-fixed.mjs` carries the same
   * citation. The emit condition is `level === "L1" && collar !== null && collar.hidden > 0 && inPoolNow`
   * (`:884`). `floored` is the count of bodies pushed up to the 12 px SIZE FLOOR (`:783`, disclosed as
   * `data-size-floors`); `collar.hidden` is the count of requirement arcs that do not FIT ON THE COLLAR
   * (`collarSplit`, disclosed per body as `data-collar-hidden` and in the meta as `mapping-collar-hidden`).
   * The two are unrelated and neither implies the other. The CONCLUSION both lanes drew — "no body hides a
   * collar requirement" — is right and is about `collar.hidden`; the cited line and constant are not. So this
   * limb reads the quantity the condition actually tests, which is the only way its zero means anything.
   *
   * §67's case, exactly: a disclosure conditional on being non-zero cannot be told from a removed one. So the
   * absence is ASSERTED rather than assumed — if a population ever does render one, this limb fails and says
   * the asymmetric budget now has a carrier and must be measured, which is the opposite of a stale pass.
   */
  it("§131: PG-14's third extent — the left-anchored \"n more\" label — has NO carrier at L0, L1 or L2 on these populations, so its asymmetric budget is reserved-but-unexercised and says so", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props();
    let tree = view.settle(p);
    const more = (level: string) => {
      const found = all(tree, e => /mapping-collar-more/.test(String(e.props?.["data-testid"] ?? "")) || /\bmapping-collar-more\b/.test(cls(e)));
      expect(bodies(tree).length, `${level}: bodies are drawn, so the scan below is not looking at an empty field`).toBeGreaterThan(0);
      return found.length;
    };
    const counts = [more("L0")];
    fire(byTestId(tree, `mapping-pool-${POOL_A}`), "onClick"); tree = view.settle(p);
    counts.push(more("L1"));
    /* THE REASON, in the quantity the emit condition actually tests (F-G10). L1 is the only level where the
       span can render at all, so this is where the zero has to be explained — and `data-collar-hidden` is
       the product's own disclosure of `collar.hidden`, not `data-size-floors`. */
    const hidden = bodies(tree).filter(b => b.props["data-in-pool"] === "true").map(b => Number(b.props["data-collar-hidden"]));
    expect(hidden.length, "L1 draws in-pool bodies, so the reason below is read off something").toBeGreaterThan(0);
    expect(hidden.filter(n => n > 0), "no in-pool body at L1 hides a collar requirement — `collar.hidden` is 0 throughout, which is why `:884` emits no span").toEqual([]);
    const open = bodies(tree).find(b => b.props["data-in-pool"] === "true")!;
    fire(open, "onClick"); tree = view.settle(p);
    counts.push(more("L2"));
    expect(counts, "zero at every level: the measured boundary on PG-14's third extent. A non-zero here is not a failure of the product — it means the carrier exists at last and the asymmetric reservation must be measured on it").toEqual([0, 0, 0]);
    view.unmount();
  });
});

describe("MAP-G-FIELD · PG-20 — the mark glyphs gain an icon for their own question", () => {
  it("REPRODUCE: DIFFERENT's two open ends splay outward (they point apart); NONE's open ends stay radial; CONSTITUENT nests a shorter arc; ALIAS echoes the arc", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props();
    let tree = view.settle(p);
    fire(byTestId(tree, `mapping-pool-${POOL_A}`), "onClick"); tree = view.settle(p);
    fire(byTestId(tree, `mapping-body-${POOL_A}:role_all`), "onClick"); tree = view.settle(p);
    const ring = byTestId(tree, "mapping-ring")!;
    const angleOf = (x: number, y: number, ox: number, oy: number) => Math.atan2(y - oy, x - ox);
    const body = bodies(tree)[0];
    const [bx, by] = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(String((body.props.style as Record<string, string>).transform))!.slice(1).map(Number);
    const tilt = (state: string) => all(ring, e => e.props?.["data-mapping-arc"] === true && e.props["data-state"] === state).flatMap(arc =>
      all(arc, e => e.props?.["data-arc-end"] === true).map(e => {
        const [x1, y1, x2, y2] = ["x1", "y1", "x2", "y2"].map(k => Number(e.props[k]));
        return angleOf(x2, y2, bx, by) - angleOf(x1, y1, bx, by);
      }));
    const different = tilt("DIFFERENT"), none = tilt("NONE");
    expect([different.length, none.length], "precondition: both open states drawn with their two ends").toEqual([2, 2]);
    for (const t of none) expect(Math.abs(t), "NONE: radial (to the coordinates' rounding)").toBeLessThan(1e-4);
    for (const t of different) expect(Math.abs(t), "DIFFERENT: a visible splay, far above rounding").toBeGreaterThan(0.01);
    expect(Math.sign(different[0]) * Math.sign(different[1]), "DIFFERENT: the two ends lean opposite ways").toBe(-1);
    expect(different[0], "DIFFERENT: the start end leans back, away from the end").toBeLessThan(0);
    expect(different[1], "DIFFERENT: the end end leans forward, away from the start").toBeGreaterThan(0);
    const parts = (state: string) => all(ring, e => e.props?.["data-mapping-arc"] === true && e.props["data-state"] === state).flatMap(arc => all(arc, e => e.type === "path" && e.props["data-mapping-hit"] === undefined));
    expect(parts("NAME_COMPOSITE_CONSTITUENT").length, "CONSTITUENT: the arc line and its nested arc").toBeGreaterThan(parts("WEAK_TOKEN_CONTAINMENT").length);
    expect(parts("NAME_ALIAS").length, "ALIAS: the arc, its fill and its echo").toBeGreaterThan(parts("NAME_EXACT").length);
    view.unmount();
  });
});

/**
 * §106 (GELB's ruling on §105's surviving mutant): PG-15 was listed in the record as ZERO-BY-CONSTRUCTION with
 * "SVG paints in document order" as its enforcement. It is not zero-by-construction — it was UNASSERTED. A
 * zero-by-construction pin has a test that cannot fail; an unasserted one has no test, and §105's mutant moved
 * the field ring to the last SVG child, in front of every body, and all 196 tests passed.
 *
 * *** THIS ASSERTS THE PAINT ORDER, WHICH IS THE MECHANISM — NOT THE OCCLUSION, WHICH IS THE PROPERTY. ***
 * A-G440: PG-15 says "no ring stroke crosses a body's drawn disc". Document order is how the build achieves
 * that, and an assertion labelled "PG-15" would overclaim what a render can decide. The occlusion itself stays
 * a pixel reading on a build (this lane's instrument), which is why this test's name says paint order.
 */
describe("MAP-G-FIELD · PG-15's PAINT ORDER — the mechanism a render can decide", () => {
  it("every field ring is drawn BEFORE every body, so a body paints over it (§106; §105's mutant moved one to last and nothing failed)", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const tree = view.settle(props());
    const svg = byTestId(tree, "mapping-field-svg")!;
    const seq = all(svg, () => true);
    const drawn = bodies(tree);
    expect(drawn.length, "bodies must be drawn, or this passes over nothing").toBeGreaterThan(0);
    const firstBody = Math.min(...drawn.map(b => seq.indexOf(b)));
    expect(firstBody, "the bodies are inside the svg's own subtree").toBeGreaterThanOrEqual(0);
    for (const id of ["mapping-ring-shelf", "mapping-ring-best", "mapping-ring-horizon", "mapping-ring-field"]) {
      const ring = byTestId(svg, id);
      expect(ring, `${id} is drawn`).not.toBeNull();
      const at = seq.indexOf(ring!);
      expect(at, `${id} is in the svg's subtree`).toBeGreaterThanOrEqual(0);
      expect(at, `${id} paints before the first body (index ${at} vs ${firstBody})`).toBeLessThan(firstBody);
    }
    view.unmount();
  });
});
