/**
 * SYNTX field · manifestation layout (owner mandate "GRÜN — SYNTX SEMIOTIC TRANSFER", 2026-10-12).
 *
 * The screen geometry of the field's deeper levels, built on the Capability Field's own layouts (the shared L1 packing of
 * `buildOrbitalCosmosLayout`, the shared L2 constellation of `buildOrbitalDeepFocusLayout`) and on the relation-state
 * geometry of the view model (`SUPPORT_DISTANCE`, R14). Pure and deterministic: ids, titles, support categories and the
 * viewport in; positions out. Nothing here reads a score, a rank, a contribution or a confidence.
 */
import { buildCapabilityCosmosLayout, type CapabilityCosmosLayout } from "../view-model/capability-cosmos-layout";
import { buildOrbitalCosmosLayout } from "../view-model/orbital-cosmos-layout";
import { buildOrbitalDeepFocusLayout } from "../view-model/orbital-deep-focus-layout";
import type { CapabilityDeepFocusLayout } from "../view-model/capability-deep-focus-layout";
import { PENDING_BOUNDARY_RADIUS } from "./syntx-field-view-model";

type Point = { x: number; y: number };
const round = (value: number): number => Math.round(value * 100) / 100;

/** One turn of the role cosmos (every ring together, so the relation geometry between anchors and sources holds in every frame). */
export const ROLE_COSMOS_PERIOD_SECONDS = 160;
/** Margin of every layout against the viewport edge (the Capability layouts' VIEWPORT_MARGIN / MARGIN). */
export const SYNTX_MARGIN = 28;

/**
 * The organization cosmos: the Capability Field's shared L1 packing of its satellites. For a pool whose organization holds
 * more roles than the viewport can carry as full cards, the cards first shorten their titles (the full title stays the
 * accessible name), then fall back to a compact uniform packing on as many orbits as needed — never fewer satellites. The orbit
 * is then drawn closer to the organization as far as its geometry allows (`compactRoleOrbit`).
 */
export function syntxCosmosLayout(items: ReadonlyArray<{ id: string; title: string }>, width: number, height: number): { layout: CapabilityCosmosLayout; compact: boolean; compactness: RoleOrbitCompactness } {
  const packed = syntxCosmosPacking(items, width, height);
  const { layout, compactness } = compactRoleOrbit(packed.layout);
  return { layout, compact: packed.compact, compactness };
}

/** The packing before the orbit is drawn in (the shared L1 packing, shortened titles, the compact uniform packing). */
export function syntxCosmosPacking(items: ReadonlyArray<{ id: string; title: string }>, width: number, height: number): { layout: CapabilityCosmosLayout; compact: boolean } {
  try {
    return { layout: buildOrbitalCosmosLayout({ items: [...items], width, height }), compact: false };
  } catch {
    try {
      return { layout: buildOrbitalCosmosLayout({ items: items.map(item => ({ id: item.id, title: item.title.length > 22 ? `${item.title.slice(0, 21)}…` : item.title })), width, height }), compact: true };
    } catch {
      return { layout: compactCosmos(items, width, height), compact: true };
    }
  }
}

/** Uniform compact satellites (120 × 44) on concentric ellipses, as many orbits as the count needs. */
function compactCosmos(items: ReadonlyArray<{ id: string; title: string }>, width: number, height: number): CapabilityCosmosLayout {
  const w = Math.max(320, Math.floor(width));
  const h = Math.max(300, Math.floor(height));
  const node = { width: 120, height: 44 };
  const outerX = w / 2 - SYNTX_MARGIN - node.width / 2;
  const outerY = h / 2 - SYNTX_MARGIN - node.height / 2;
  const sorted = [...items].sort((left, right) => left.id.localeCompare(right.id));
  const rings: CapabilityCosmosLayout["rings"] = [];
  const nodes: CapabilityCosmosLayout["nodes"] = [];
  let offset = 0;
  for (let index = 0; offset < sorted.length; index += 1) {
    const factor = Math.max(0.3, 1 - index * 0.17);
    const rx = outerX * factor;
    const ry = outerY * factor;
    const perimeter = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
    const take = Math.min(sorted.length - offset, Math.max(1, Math.floor(perimeter / (node.width * 0.82))));
    rings.push({ index, radiusX: rx, radiusY: ry, periodSeconds: 130 + index * 35 });
    for (let k = 0; k < take; k += 1) {
      const angle = -Math.PI / 2 + (k * 2 * Math.PI) / take + (index % 2) * (Math.PI / take);
      const item = sorted[offset + k];
      nodes.push({ id: item.id, title: item.title, ringIndex: index, angle, x: round(w / 2 + Math.cos(angle) * rx), y: round(h / 2 + Math.sin(angle) * ry), width: node.width, height: node.height, visualMass: 1 });
    }
    offset += take;
  }
  return { width: w, height: h, centerX: w / 2, centerY: h / 2, nodes, rings, staticPositions: false };
}

/**
 * The role orbit drawn closer to its organization (owner "SFE — GRÜN | ROLE ORBIT REFINEMENT", 2026-10-18). The shared packing fills
 * the level box, so its orbit is a wide, flat ellipse; here every orbit and every satellite on it is scaled about the centre, the
 * cards keep their size, title and order, every ring its period and every satellite its phase. Each axis is drawn in by
 * ROLE_ORBIT_COMPACTNESS as far as the geometry allows: the horizontal axis (the long one) first, then the vertical one as far as
 * the centre body leaves room. A pair of factors holds when, in every phase, every card keeps its air to the centre body and to
 * its neighbours on the same orbit, and to the neighbouring orbits as far as the packing kept them apart (in every phase pair
 * where it did; at rest, and never closer than the packing, where it did not). Where no pair below 1 holds, and for the static
 * grid fallback, the packing stays as it is.
 */
export const ROLE_ORBIT_COMPACTNESS = 0.78;
/** The organization centre the cards keep clear of: SYNTX_COSMOS_CENTER_MATERIAL's 174 px disc, its 4 + 1 px outer rings and air. */
export const ROLE_ORBIT_CENTRE_CLEARANCE = 87 + 5 + 16;
/** Air between two cards; a card's text may run a line beyond the packing's estimate, so the vertical air is larger. */
export const ROLE_ORBIT_CARD_GAP = Object.freeze({ x: 12, y: 20 });
/** A rendered role card runs up to 11.25 px taller than the packing's estimate (kicker, four title lines, the count line; PINK §3.45
 * D-RO-1): every air is measured on the estimate plus this allowance, so it holds for the card as drawn. */
export const ROLE_ORBIT_CARD_HEIGHT_ALLOWANCE = 12;
export interface RoleOrbitCompactness { x: number; y: number }
/** Every half degree of the turn (PINK §3.45 D-RO-1: at 5° a card moves 35–50 px between two checks and the least air lies between them). */
const PHASES = Array.from({ length: 720 }, (_, index) => (index * Math.PI * 2) / 720);
const CROSS_PHASES = PHASES.filter((_, index) => index % 30 === 0);

interface OrbitAir { centre: number; orbit: number; across: number; acrossAtRest: number }

/**
 * The air (px; negative = overlap) the layout leaves at the compactness: to the centre body, between neighbours on one orbit,
 * between neighbouring orbits (every phase pair) and between any two cards at rest. The satellites of one orbit share its path and
 * are evenly spaced, so each orbit is measured once with its largest card (as drawn: the estimate plus the height allowance): the
 * centre over every phase, the next and the one after in angular order over every phase of the turn they make together.
 */
function orbitAir(layout: CapabilityCosmosLayout, k: RoleOrbitCompactness, withMotionAcross: boolean): OrbitAir {
  const orbits = layout.rings.map(ring => {
    const nodes = layout.nodes.filter(node => node.ringIndex === ring.index);
    return { ring, count: nodes.length, width: Math.max(0, ...nodes.map(node => node.width)), height: Math.max(0, ...nodes.map(node => node.height)) + ROLE_ORBIT_CARD_HEIGHT_ALLOWANCE };
  }).filter(orbit => orbit.count > 0);
  const on = (ring: CapabilityCosmosLayout["rings"][number], angle: number): Point => ({ x: Math.cos(angle) * ring.radiusX * k.x, y: Math.sin(angle) * ring.radiusY * k.y });
  const between = (p: Point, aw: number, ah: number, q: Point, bw: number, bh: number): number => Math.max(Math.abs(p.x - q.x) - (aw + bw) / 2 - ROLE_ORBIT_CARD_GAP.x, Math.abs(p.y - q.y) - (ah + bh) / 2 - ROLE_ORBIT_CARD_GAP.y);
  const air: OrbitAir = { centre: Infinity, orbit: Infinity, across: Infinity, acrossAtRest: Infinity };
  for (const orbit of orbits) {
    const steps = orbit.count > 3 ? [1, 2] : orbit.count > 1 ? [1] : [];
    for (const phase of PHASES) {
      const p = on(orbit.ring, phase);
      air.centre = Math.min(air.centre, Math.hypot(Math.max(0, Math.abs(p.x) - orbit.width / 2), Math.max(0, Math.abs(p.y) - orbit.height / 2)) - ROLE_ORBIT_CENTRE_CLEARANCE);
      for (const step of steps) air.orbit = Math.min(air.orbit, between(p, orbit.width, orbit.height, on(orbit.ring, phase + (step * 2 * Math.PI) / orbit.count), orbit.width, orbit.height));
    }
  }
  if (withMotionAcross) {
    for (let index = 1; index < orbits.length; index += 1) {
      const inner = orbits[index - 1], outer = orbits[index];
      for (const a of CROSS_PHASES) for (const b of CROSS_PHASES) air.across = Math.min(air.across, between(on(inner.ring, a), inner.width, inner.height, on(outer.ring, b), outer.width, outer.height));
    }
  }
  const rings = new Map(layout.rings.map(ring => [ring.index, ring]));
  for (const a of layout.nodes) for (const b of layout.nodes) if (b.ringIndex > a.ringIndex) air.acrossAtRest = Math.min(air.acrossAtRest, between(on(rings.get(a.ringIndex)!, a.angle), a.width, a.height + ROLE_ORBIT_CARD_HEIGHT_ALLOWANCE, on(rings.get(b.ringIndex)!, b.angle), b.width, b.height + ROLE_ORBIT_CARD_HEIGHT_ALLOWANCE));
  return air;
}

export function compactRoleOrbit(layout: CapabilityCosmosLayout, target: number = ROLE_ORBIT_COMPACTNESS): { layout: CapabilityCosmosLayout; compactness: RoleOrbitCompactness } {
  const unchanged = { layout, compactness: { x: 1, y: 1 } };
  if (layout.staticPositions || layout.nodes.length === 0) return unchanged;
  const packed = orbitAir(layout, { x: 1, y: 1 }, true);
  const inMotion = packed.across >= 0;
  const holds = (air: OrbitAir): boolean => air.centre >= 0 && air.orbit >= 0 && (inMotion ? air.across >= 0 : air.acrossAtRest >= Math.min(0, packed.acrossAtRest));
  const first = Math.round(target * 100);
  for (let sx = first; sx <= 100; sx += 1) {
    // A horizontal factor that fails with the vertical axis left as packed is not tried with any smaller vertical one.
    if (sx < 100 && !holds(orbitAir(layout, { x: sx / 100, y: 1 }, inMotion))) continue;
    for (let sy = first; sy <= 100; sy += 1) {
      if (sx === 100 && sy === 100) return unchanged;
      const k = { x: sx / 100, y: sy / 100 };
      if (!holds(orbitAir(layout, k, inMotion))) continue;
      return {
        compactness: k,
        layout: {
          ...layout,
          rings: layout.rings.map(ring => ({ ...ring, radiusX: round(ring.radiusX * k.x), radiusY: round(ring.radiusY * k.y) })),
          nodes: layout.nodes.map(node => ({ ...node, x: round(layout.centerX + (node.x - layout.centerX) * k.x), y: round(layout.centerY + (node.y - layout.centerY) * k.y) }))
        }
      };
    }
  }
  return unchanged;
}

/** Re-export for the renderer: the Capability Field's L1 packing (planetarium-sized cosmos of one item, etc.). */
export { buildCapabilityCosmosLayout };

/**
 * The role cosmos frame: the view model's ecology (role at its centre, anchors at their support distance, sources on their
 * ring, the suspended boundary at 205) scaled uniformly into the viewport. A similarity transform: every distance keeps its
 * category and its order (R14), every bow its side.
 */
export interface SyntxEcologyFrame { cx: number; cy: number; scale: number; width: number; height: number }
export function syntxEcologyFrame(width: number, height: number): SyntxEcologyFrame {
  const w = Math.max(320, Math.floor(width));
  const h = Math.max(300, Math.floor(height));
  // Room for the outermost anchor's card beyond the suspended boundary.
  const reach = Math.min(w, h) / 2 - SYNTX_MARGIN - 44;
  return { cx: w / 2, cy: h / 2, scale: round(Math.min(2.6, Math.max(1.05, reach / PENDING_BOUNDARY_RADIUS))), width: w, height: h };
}

/** A point of the ecology (view-model units around the role) on screen, turned by `rotation` radians about the role. */
export function ecologyToScreen(frame: SyntxEcologyFrame, role: Point, point: Point, rotation: number): Point {
  const dx = (point.x - role.x) * frame.scale;
  const dy = (point.y - role.y) * frame.scale;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return { x: round(frame.cx + dx * cos - dy * sin), y: round(frame.cy + dx * sin + dy * cos) };
}

/** Rotation of the role cosmos at `elapsedMs` (one turn per ROLE_COSMOS_PERIOD_SECONDS; 0 in reduced motion and on the server). */
export function roleCosmosRotation(elapsedMs: number): number {
  return (2 * Math.PI * (elapsedMs / 1000)) / ROLE_COSMOS_PERIOD_SECONDS;
}

/**
 * A card attached to a satellite point, outward from the centre: its centre sits beyond the point by the gap plus the card's
 * support extent in that direction, upright, so it moves continuously while the cosmos turns and never covers the point.
 */
export function cardBeside(center: Point, point: Point, halfWidth: number, halfHeight: number, gap: number): Point {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const extent = halfWidth * Math.abs(ux) + halfHeight * Math.abs(uy);
  return { x: round(point.x + ux * (gap + extent)), y: round(point.y + uy * (gap + extent)) };
}

/** Card size of a requirement satellite by the room its orbit offers (full, compact, or glyph only with the card on focus). */
export function requirementCardMode(count: number, innerRadiusPx: number): "full" | "compact" | "glyph" {
  const arc = (2 * Math.PI * innerRadiusPx * 0.75) / Math.max(1, count);
  return arc >= 150 ? "full" : arc >= 84 ? "compact" : "glyph";
}

/**
 * The requirement deep focus: the Capability Field's shared L2 constellation (nucleus, receded siblings, evidence surface
 * beneath) and, inside the evidence surface, one row per evidence relation grouped by source, in delivered order.
 */
export interface SyntxEvidenceGroup { docId: string; entries: string[] }
export interface SyntxEvidenceRows {
  layout: CapabilityDeepFocusLayout;
  surface: { left: number; top: number; width: number; height: number; scroll: boolean };
  groups: Array<{ docId: string; top: number }>;
  rows: Array<{ id: string; docId: string; top: number; height: number }>;
}
export const EVIDENCE_ROW = Object.freeze({ header: 30, group: 24, entry: 46, padding: 12 });

export function syntxRequirementFocus(requirements: ReadonlyArray<{ id: string; title: string }>, selectedId: string, groups: ReadonlyArray<SyntxEvidenceGroup>, extraRows: number, width: number, height: number, nucleusExtra = 0): SyntxEvidenceRows {
  const layout = buildOrbitalDeepFocusLayout({ items: [...requirements], selectedItemId: selectedId, width, height });
  const content = EVIDENCE_ROW.header + groups.reduce((sum, group) => sum + EVIDENCE_ROW.group + group.entries.length * EVIDENCE_ROW.entry, 0) + extraRows * EVIDENCE_ROW.entry + EVIDENCE_ROW.padding;
  const width2 = Math.max(layout.evidence.width, Math.min(440, Math.round(layout.width * 0.34)));
  const top = Math.round(layout.focus.y + (layout.focus.height + nucleusExtra) / 2 + 24);
  const available = Math.max(EVIDENCE_ROW.header + EVIDENCE_ROW.entry * 2, layout.height - SYNTX_MARGIN - top);
  const surfaceHeight = Math.min(content, available);
  const surface = { left: Math.round(layout.focus.x - width2 / 2), top, width: width2, height: surfaceHeight, scroll: content > available };
  const placedGroups: SyntxEvidenceRows["groups"] = [];
  const rows: SyntxEvidenceRows["rows"] = [];
  let y = EVIDENCE_ROW.header;
  for (const group of groups) {
    placedGroups.push({ docId: group.docId, top: y });
    y += EVIDENCE_ROW.group;
    for (const entry of group.entries) { rows.push({ id: entry, docId: group.docId, top: y, height: EVIDENCE_ROW.entry }); y += EVIDENCE_ROW.entry; }
  }
  return { layout, surface, groups: placedGroups, rows };
}

/**
 * The evidence relation of one row: an arc from the nucleus rim to the row's edge, outside the surface (left rows on the
 * left, right rows on the right), each row its own curve; quadratic like every relation of the field.
 */
export function evidenceRelationPath(layout: CapabilityDeepFocusLayout, surface: SyntxEvidenceRows["surface"], rowCentreY: number, side: -1 | 1, lane: number): { d: string; from: Point; control: Point; to: Point } {
  const from = { x: round(layout.focus.x + side * layout.focus.width * 0.32), y: round(layout.focus.y + layout.focus.height * 0.38) };
  const to = { x: round(side < 0 ? surface.left : surface.left + surface.width), y: round(rowCentreY) };
  const control = { x: round(to.x + side * (46 + 16 * lane)), y: round((from.y + to.y) / 2) };
  return { d: `M ${from.x} ${from.y} Q ${control.x} ${control.y} ${to.x} ${to.y}`, from, control, to };
}
