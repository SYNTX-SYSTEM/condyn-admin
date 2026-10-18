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
 * The role orbit drawn in to the smallest orbit its geometry carries (owner "SFE — GRÜN | ROLE ORBIT — SECOND VISUAL REFINEMENT",
 * 2026-10-19; the first pass of 2026-10-18 stopped at a 0.78 orientation). The shared packing fills the level box, so its orbit is a
 * wide, flat ellipse; here every orbit and every satellite on it is scaled about the centre by a horizontal and a vertical factor, the
 * cards keep their size, title and order, every ring its period and every satellite its phase. A pair of factors holds when, in
 * every phase, every card keeps its air to the centre body and to every other card of its orbit, and to the neighbouring orbits as
 * far as the packing kept them apart (in every phase pair where it did; at rest, and never closer than the packing, where it did
 * not). Every air measured is a factor times a fixed length less a fixed size, so it grows with each factor, and for a horizontal
 * factor it bounds the vertical one from below directly: the least vertical factor is read off the geometry in one pass. Of the
 * pairs that hold the smallest drawn orbit wins (the least product of the factors, i.e. the least area of the outer orbit; at a tie
 * the narrower one), as long as the orbit stays at least as wide as it is tall (the field's lying ellipses). The result therefore
 * follows from card sizes, role count, motion and the minimum air alone: no fixed percentage. Where the packing itself does not
 * hold, and for the static grid fallback, the packing stays as it is.
 */
/** The organization centre the cards keep clear of: SYNTX_COSMOS_CENTER_MATERIAL's 174 px disc, its 4 + 1 px outer rings and air. */
export const ROLE_ORBIT_CENTRE_CLEARANCE = 87 + 5 + 16;
/** Air between two cards; a card's text may run a line beyond the packing's estimate, so the vertical air is larger. */
export const ROLE_ORBIT_CARD_GAP = Object.freeze({ x: 12, y: 20 });
/** A rendered role card runs up to 11.25 px taller than the packing's estimate (kicker, four title lines, the count line; PINK §3.45
 * D-RO-1): every air is measured on the estimate plus this allowance, so it holds for the card as drawn. */
export const ROLE_ORBIT_CARD_HEIGHT_ALLOWANCE = 12;
export interface RoleOrbitCompactness { x: number; y: number }
/** Neighbouring orbits turn at their own periods: every phase pair on a 5° grid (PINK §3.46 O-RO-CROSS-GRID: formerly 15°). */
const CROSS_PHASES = Array.from({ length: 72 }, (_, index) => (index * Math.PI * 2) / 72);
/** The corner arc of the widened card, every quarter degree (the bound is smooth there, so the reading is exact to a thousandth of a pixel). */
const CORNER_ARC = Array.from({ length: 361 }, (_, index) => (index * Math.PI) / 720);

interface OrbitCard { angle: number; width: number; height: number }
interface Orbit { ring: CapabilityCosmosLayout["rings"][number]; cards: OrbitCard[]; width: number; height: number }

/** The orbits with their cards as drawn (the estimate plus the height allowance); an orbit's largest card stands for it across orbits. */
function orbitsOf(layout: CapabilityCosmosLayout): Orbit[] {
  return layout.rings.map(ring => {
    const cards = layout.nodes.filter(node => node.ringIndex === ring.index).map(node => ({ angle: node.angle, width: node.width, height: node.height + ROLE_ORBIT_CARD_HEIGHT_ALLOWANCE }));
    return { ring, cards, width: Math.max(0, ...cards.map(card => card.width)), height: Math.max(0, ...cards.map(card => card.height)) };
  }).filter(orbit => orbit.cards.length > 0);
}

/** The point of an orbit at a phase, unscaled. */
const onRing = (ring: Orbit["ring"], angle: number): Point => ({ x: Math.cos(angle) * ring.radiusX, y: Math.sin(angle) * ring.radiusY });

/** The packing's own air between neighbouring orbits: in every phase pair (they turn at their own periods) and between any two cards at rest. */
function packedAcross(layout: CapabilityCosmosLayout, orbits: Orbit[]): { inMotion: number; atRest: number } {
  const between = (p: Point, aw: number, ah: number, q: Point, bw: number, bh: number): number => Math.max(Math.abs(p.x - q.x) - (aw + bw) / 2 - ROLE_ORBIT_CARD_GAP.x, Math.abs(p.y - q.y) - (ah + bh) / 2 - ROLE_ORBIT_CARD_GAP.y);
  let inMotion = Infinity, atRest = Infinity;
  for (let index = 1; index < orbits.length; index += 1) {
    const inner = orbits[index - 1], outer = orbits[index];
    for (const a of CROSS_PHASES) for (const b of CROSS_PHASES) inMotion = Math.min(inMotion, between(onRing(inner.ring, a), inner.width, inner.height, onRing(outer.ring, b), outer.width, outer.height));
  }
  const rings = new Map(layout.rings.map(ring => [ring.index, ring]));
  for (const a of layout.nodes) for (const b of layout.nodes) if (b.ringIndex > a.ringIndex) atRest = Math.min(atRest, between(onRing(rings.get(a.ringIndex)!, a.angle), a.width, a.height + ROLE_ORBIT_CARD_HEIGHT_ALLOWANCE, onRing(rings.get(b.ringIndex)!, b.angle), b.width, b.height + ROLE_ORBIT_CARD_HEIGHT_ALLOWANCE));
  return { inMotion, atRest };
}

/**
 * The least vertical factor that keeps every air at the horizontal factor kx (Infinity above 1), solved in closed form where the
 * motion allows it, so no phase between two readings is left unread (PINK §3.45 D-RO-1):
 *   centre   a card keeps the centre clear while its centre stays outside the card rectangle widened by the clearance C (a rounded
 *            rectangle); the orbit (kx·Rx, ky·Ry) does so in every phase exactly when it encloses that shape, i.e. every point
 *            (w/2 + C·cos θ, h/2 + C·sin θ) of its corner arc: ky ≥ (h/2 + C·sin θ) / (Ry·√(1 − ((w/2 + C·cos θ) / (kx·Rx))²)).
 *   orbit    two cards of one orbit, Δ apart in phase, stand at (Dx·sin u, Dy·cos u) from each other over the turn, with
 *            Dx = 2·kx·Rx·|sin(Δ/2)| and Dy = 2·ky·Ry·|sin(Δ/2)|; they keep the air W × H (half sizes plus the gap) in every phase
 *            exactly when (W/Dx)² + (H/Dy)² ≤ 1: ky ≥ H / (2·Ry·|sin(Δ/2)|·√(1 − (W/Dx)²)).
 *   across   neighbouring orbits turn at their own periods: every phase pair on the 5° grid where the packing kept them apart in
 *            motion, at rest (never closer than the packing) where it did not; two cards keep their air when
 *            max(kx·|ΔX| − W, ky·|ΔY| − H) ≥ floor, so where the horizontal term falls short, ky ≥ (H + floor) / |ΔY|.
 */
function leastVertical(layout: CapabilityCosmosLayout, orbits: Orbit[], kx: number, packed: { inMotion: number; atRest: number }): number {
  let least = 0;
  const pair = (dx: number, w: number, dy: number, h: number, floor: number): void => {
    if (kx * dx - w >= floor) return;
    least = Math.max(least, dy > 0 ? (h + floor) / dy : Infinity);
  };
  const C = ROLE_ORBIT_CENTRE_CLEARANCE;
  for (const orbit of orbits) {
    const rx = kx * orbit.ring.radiusX, ry = orbit.ring.radiusY;
    orbit.cards.forEach((card, index) => {
      for (const theta of CORNER_ARC) {
        const rest = 1 - ((card.width / 2 + C * Math.cos(theta)) / rx) ** 2;
        least = Math.max(least, rest > 0 ? (card.height / 2 + C * Math.sin(theta)) / (ry * Math.sqrt(rest)) : Infinity);
      }
      for (let other = index + 1; other < orbit.cards.length; other += 1) {
        const apart = 2 * Math.abs(Math.sin((card.angle - orbit.cards[other].angle) / 2));
        const rest = 1 - (((card.width + orbit.cards[other].width) / 2 + ROLE_ORBIT_CARD_GAP.x) / (rx * apart)) ** 2;
        least = Math.max(least, rest > 0 ? ((card.height + orbit.cards[other].height) / 2 + ROLE_ORBIT_CARD_GAP.y) / (ry * apart * Math.sqrt(rest)) : Infinity);
      }
    });
    if (least > 1) return Infinity;
  }
  if (packed.inMotion >= 0) {
    for (let index = 1; index < orbits.length; index += 1) {
      const inner = orbits[index - 1], outer = orbits[index];
      for (const a of CROSS_PHASES) for (const b of CROSS_PHASES) { const p = onRing(inner.ring, a), q = onRing(outer.ring, b); pair(Math.abs(p.x - q.x), (inner.width + outer.width) / 2 + ROLE_ORBIT_CARD_GAP.x, Math.abs(p.y - q.y), (inner.height + outer.height) / 2 + ROLE_ORBIT_CARD_GAP.y, 0); }
    }
  } else {
    const rings = new Map(layout.rings.map(ring => [ring.index, ring]));
    for (const a of layout.nodes) for (const b of layout.nodes) {
      if (b.ringIndex <= a.ringIndex) continue;
      const p = onRing(rings.get(a.ringIndex)!, a.angle), q = onRing(rings.get(b.ringIndex)!, b.angle);
      pair(Math.abs(p.x - q.x), (a.width + b.width) / 2 + ROLE_ORBIT_CARD_GAP.x, Math.abs(p.y - q.y), (a.height + b.height) / 2 + ROLE_ORBIT_CARD_HEIGHT_ALLOWANCE + ROLE_ORBIT_CARD_GAP.y, Math.min(0, packed.atRest));
    }
  }
  return least > 1 ? Infinity : least;
}

export function compactRoleOrbit(layout: CapabilityCosmosLayout): { layout: CapabilityCosmosLayout; compactness: RoleOrbitCompactness } {
  const unchanged = { layout, compactness: { x: 1, y: 1 } };
  if (layout.staticPositions || layout.nodes.length === 0) return unchanged;
  const orbits = orbitsOf(layout);
  const packed = packedAcross(layout, orbits);
  // Factors in hundredths: the least vertical one for a horizontal one, rounded up (Infinity where none holds).
  const vertical = (sx: number): number => { const least = leastVertical(layout, orbits, sx / 100, packed); return Number.isFinite(least) ? Math.max(1, Math.ceil(least * 100 - 1e-6)) : Infinity; };
  const atFull = vertical(100);
  if (!Number.isFinite(atFull)) return unchanged;
  // The smallest horizontal factor that holds at all (holding grows with the factor), then every one above it while it can still
  // give a smaller orbit: the vertical factor never falls below its value at full width.
  let low = 1, high = 100;
  while (low < high) { const mid = (low + high) >> 1; if (Number.isFinite(vertical(mid))) high = mid; else low = mid + 1; }
  const outer = layout.rings.reduce((wide, ring) => (ring.radiusX > wide.radiusX ? ring : wide));
  let best: RoleOrbitCompactness = { x: 100, y: 100 };
  for (let sx = low; sx <= 100 && sx * atFull < best.x * best.y; sx += 1) {
    const sy = vertical(sx);
    if (outer.radiusY * sy > outer.radiusX * sx) continue;
    if (sx * sy < best.x * best.y) best = { x: sx, y: sy };
  }
  if (best.x === 100 && best.y === 100) return unchanged;
  const k = { x: best.x / 100, y: best.y / 100 };
  return {
    compactness: k,
    layout: {
      ...layout,
      rings: layout.rings.map(ring => ({ ...ring, radiusX: round(ring.radiusX * k.x), radiusY: round(ring.radiusY * k.y) })),
      nodes: layout.nodes.map(node => ({ ...node, x: round(layout.centerX + (node.x - layout.centerX) * k.x), y: round(layout.centerY + (node.y - layout.centerY) * k.y) }))
    }
  };
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
