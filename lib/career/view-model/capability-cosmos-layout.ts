export interface CapabilityCosmosLayoutInput {
  id: string;
  title: string;
  evidenceCount?: number;
}

export interface CapabilityCosmosLayoutNode {
  id: string;
  title: string;
  ringIndex: number;
  angle: number;
  x: number;
  y: number;
  width: number;
  height: number;
  /**
   * Visual mass is deliberately bounded and derives only from exact evidence
   * count. It is spatial emphasis, not confidence, authority, or truth.
   */
  visualMass: number;
}

export interface CapabilityCosmosRing {
  index: number;
  radiusX: number;
  radiusY: number;
  periodSeconds: number;
}

export interface CapabilityCosmosLayout {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  nodes: CapabilityCosmosLayoutNode[];
  rings: CapabilityCosmosRing[];
  staticPositions: boolean;
}

export interface CapabilityCosmosLayoutRequest {
  capabilities: CapabilityCosmosLayoutInput[];
  width: number;
  height: number;
}

export interface CapabilityCosmosFocusState {
  activeStageId: string | null;
  zoomLevel: 0 | 1;
  isCosmos: boolean;
}

/**
 * Projects a satellite center directly onto its assigned ellipse. Presentation
 * components advance only `phase`; no rotating container may displace the
 * card away from this geometry.
 */
export function positionCosmosNodeAtPhase(
  layout: Pick<CapabilityCosmosLayout, "centerX" | "centerY">,
  node: Pick<CapabilityCosmosLayoutNode, "angle">,
  ring: Pick<CapabilityCosmosRing, "radiusX" | "radiusY">,
  phase: number
) {
  const angle = node.angle + phase * Math.PI * 2;
  return {
    x: layout.centerX + Math.cos(angle) * ring.radiusX,
    y: layout.centerY + Math.sin(angle) * ring.radiusY
  };
}

const VIEWPORT_MARGIN = 28;
const NODE_GAP = 0;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function estimateNode(title: string, evidenceCount?: number, availableWidth = 1200) {
  const maximumWidth = clamp(Math.round(availableWidth * 0.20), 144, 300);
  const baseWidth = clamp(118 + title.length * 2.2, 128, maximumWidth);
  const charactersPerLine = Math.max(14, Math.floor((baseWidth - 28) / 7.2));
  const lines = Math.max(1, Math.ceil(title.length / charactersPerLine));
  const visualMass = 1 + Math.min(0.12, Math.max(0, (evidenceCount ?? 0) - 1) * 0.03);

  return {
    width: Math.round(baseWidth * visualMass),
    height: Math.round(clamp(52 + lines * 18, 72, 126) * visualMass),
    visualMass
  };
}

function ellipsePerimeter(radiusX: number, radiusY: number) {
  const sum = radiusX + radiusY;
  if (sum === 0) return 0;
  const difference = radiusX - radiusY;
  const h = (difference * difference) / (sum * sum);
  return Math.PI * sum * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
}

function overlaps(
  candidate: CapabilityCosmosLayoutNode,
  placed: CapabilityCosmosLayoutNode[]
) {
  return placed.some((node) =>
    Math.abs(candidate.x - node.x) < (candidate.width + node.width) / 2 + NODE_GAP &&
    Math.abs(candidate.y - node.y) < (candidate.height + node.height) / 2 + NODE_GAP
  );
}

function buildForRingCount(
  inputs: CapabilityCosmosLayoutInput[],
  width: number,
  height: number,
  ringCount: number
): CapabilityCosmosLayout | null {
  const dimensions = inputs.map((input) => ({ input, ...estimateNode(input.title, input.evidenceCount, width) }));
  const maxWidth = Math.max(...dimensions.map((node) => node.width), 128);
  const maxHeight = Math.max(...dimensions.map((node) => node.height), 72);
  const outerRadiusX = width / 2 - VIEWPORT_MARGIN - maxWidth / 2;
  const outerRadiusY = height / 2 - VIEWPORT_MARGIN - maxHeight / 2;

  if (outerRadiusX <= 44 || outerRadiusY <= 44) return null;

  const footprint = maxWidth + NODE_GAP;
  const ringCapacities = Array.from({ length: ringCount }, (_, index) => {
    const factor = (index + 1) / ringCount;
    return Math.max(1, Math.floor(ellipsePerimeter(outerRadiusX * factor, outerRadiusY * factor) / footprint));
  });

  if (ringCapacities.reduce((total, capacity) => total + capacity, 0) < inputs.length) return null;

  const centerX = width / 2;
  const centerY = height / 2;
  const nodes: CapabilityCosmosLayoutNode[] = [];
  const rings: CapabilityCosmosRing[] = [];
  let inputOffset = 0;

  for (let ringIndex = 0; ringIndex < ringCount && inputOffset < dimensions.length; ringIndex += 1) {
    const count = Math.min(ringCapacities[ringIndex], dimensions.length - inputOffset);
    const radiusFactor = (ringIndex + 1) / ringCount;
    const radiusX = outerRadiusX * radiusFactor;
    const radiusY = outerRadiusY * radiusFactor;
    const candidates = dimensions.slice(inputOffset, inputOffset + count);
    let selected: CapabilityCosmosLayoutNode[] | null = null;

    // A deterministic phase search avoids collisions between neighbouring rings
    // without deriving presentation from semantic capability attributes.
    for (let phaseStep = 0; phaseStep < 48 && selected === null; phaseStep += 1) {
      const phase = -Math.PI / 2 + (phaseStep * Math.PI * 2) / 48;
      const proposed = candidates.map((candidate, index) => {
        const angle = phase + (index * Math.PI * 2) / count;
        return {
          id: candidate.input.id,
          title: candidate.input.title,
          ringIndex,
          angle,
          x: Math.round((centerX + Math.cos(angle) * radiusX) * 100) / 100,
          y: Math.round((centerY + Math.sin(angle) * radiusY) * 100) / 100,
          width: candidate.width,
          height: candidate.height,
          visualMass: candidate.visualMass
        };
      });

      if (!proposed.some((node) => overlaps(node, nodes))) {
        selected = proposed;
      }
    }

    if (selected === null) return null;
    nodes.push(...selected);
    rings.push({
      index: ringIndex,
      radiusX,
      radiusY,
      periodSeconds: 130 + ringIndex * 35
    });
    inputOffset += count;
  }

  return { width, height, centerX, centerY, nodes, rings, staticPositions: false };
}

/**
 * Deterministic spatial packing for the Stage-02 presentation only. Ring
 * capacity is based on available circumference and actual capsule footprint,
 * never on a hard-coded capability-count bucket.
 */
export function buildCapabilityCosmosLayout(
  request: CapabilityCosmosLayoutRequest
): CapabilityCosmosLayout {
  const width = Math.max(320, Math.floor(request.width));
  const height = Math.max(300, Math.floor(request.height));
  const inputs = [...request.capabilities].sort((left, right) => left.id.localeCompare(right.id));

  if (inputs.length === 0) {
    return { width, height, centerX: width / 2, centerY: height / 2, nodes: [], rings: [], staticPositions: false };
  }

  for (let ringCount = 1; ringCount <= inputs.length; ringCount += 1) {
    const layout = buildForRingCount(inputs, width, height, ringCount);
    if (layout) return layout;
  }

  // A very small viewport can make a continuous ellipse physically unable to
  // separate multi-line capsules. This deterministic bounded fallback keeps
  // every real capability visible rather than clipping or overlapping it.
  const dimensions = inputs.map((input) => ({ input, ...estimateNode(input.title, input.evidenceCount, width) }));
  const maxWidth = Math.max(...dimensions.map((node) => node.width));
  const maxHeight = Math.max(...dimensions.map((node) => node.height));
  const columns = Math.max(1, Math.min(inputs.length, Math.floor((width - VIEWPORT_MARGIN * 2) / (maxWidth + 8))));
  const rows = Math.ceil(inputs.length / columns);
  if (rows * (maxHeight + 8) > height - VIEWPORT_MARGIN * 2) {
    throw new Error("ERR_CAPABILITY_COSMOS_LAYOUT_UNBOUNDED");
  }

  const gridWidth = columns * maxWidth + (columns - 1) * 8;
  const gridHeight = rows * maxHeight + (rows - 1) * 8;
  const startX = (width - gridWidth) / 2 + maxWidth / 2;
  const startY = (height - gridHeight) / 2 + maxHeight / 2;
  const centerX = width / 2;
  const centerY = height / 2;
  const nodes = dimensions.map((node, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const distance = Math.max(Math.abs(column - (columns - 1) / 2), Math.abs(row - (rows - 1) / 2));
    return {
      id: node.input.id,
      title: node.input.title,
      ringIndex: Math.floor(distance * 2),
      angle: Math.atan2(startY + row * (maxHeight + 8) - centerY, startX + column * (maxWidth + 8) - centerX),
      x: startX + column * (maxWidth + 8),
      y: startY + row * (maxHeight + 8),
      width: node.width,
      height: node.height,
      visualMass: node.visualMass
    };
  });
  const highestRing = Math.max(...nodes.map((node) => node.ringIndex));
  const rings = Array.from({ length: highestRing + 1 }, (_, index) => ({
    index,
    radiusX: ((width - VIEWPORT_MARGIN * 2) / 2) * ((index + 1) / (highestRing + 1)),
    radiusY: ((height - VIEWPORT_MARGIN * 2) / 2) * ((index + 1) / (highestRing + 1)),
    periodSeconds: 130 + index * 35
  }));

  return { width, height, centerX, centerY, nodes, rings, staticPositions: true };
}

/** Stage 02 alone owns the Cosmos L1 projection; other stages retain L1. */
export function resolveCapabilityCosmosFocus(
  activeStageId: string | null,
  requestedStageId: string | null
): CapabilityCosmosFocusState {
  if (requestedStageId === null || requestedStageId === activeStageId) {
    return { activeStageId: null, zoomLevel: 0, isCosmos: false };
  }

  return {
    activeStageId: requestedStageId,
    zoomLevel: 1,
    isCosmos: requestedStageId === "02"
  };
}
