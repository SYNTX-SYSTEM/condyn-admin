import type { CapabilityCosmosLayoutInput } from "./capability-cosmos-layout";

export interface CapabilityDeepFocusNode {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  opacity: number;
}

export interface CapabilityDeepFocusLayout {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  focus: CapabilityDeepFocusNode;
  evidence: CapabilityDeepFocusNode;
  satellites: CapabilityDeepFocusNode[];
  staticPositions: boolean;
}

export interface CapabilityDeepFocusLayoutRequest {
  capabilities: CapabilityCosmosLayoutInput[];
  selectedCapabilityId: string;
  width: number;
  height: number;
}

const MARGIN = 28;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function estimateHeight(title: string, width: number, base: number, characterWidth: number) {
  const charactersPerLine = Math.max(14, Math.floor((width - 34) / characterWidth));
  return clamp(base + Math.ceil(title.length / charactersPerLine) * 18, base + 18, 156);
}

function intersects(left: CapabilityDeepFocusNode, right: CapabilityDeepFocusNode) {
  return (
    Math.abs(left.x - right.x) < (left.width + right.width) / 2 + 10 &&
    Math.abs(left.y - right.y) < (left.height + right.height) / 2 + 10
  );
}

/**
 * A deterministic Stage-02-only local constellation. It deliberately derives
 * geometry from viewport and labels, never from confidence or capability level.
 */
export function buildCapabilityDeepFocusLayout(
  request: CapabilityDeepFocusLayoutRequest
): CapabilityDeepFocusLayout {
  const width = Math.max(320, Math.floor(request.width));
  const height = Math.max(300, Math.floor(request.height));
  const capabilities = [...request.capabilities].sort((left, right) => left.id.localeCompare(right.id));
  const selected = capabilities.find((capability) => capability.id === request.selectedCapabilityId) ?? capabilities[0];

  if (!selected) {
    throw new Error("ERR_CAPABILITY_DEEP_FOCUS_SELECTION_REQUIRED");
  }

  const focusWidth = clamp(Math.round(width * 0.38), 238, 460);
  const focusHeight = estimateHeight(selected.title, focusWidth, 72, 7.2);
  const evidenceWidth = clamp(Math.round(width * 0.29), 214, 356);
  const evidenceHeight = 102;
  const centerX = width / 2;
  const centerY = clamp(
    Math.round(height * 0.41),
    MARGIN + focusHeight / 2,
    height - MARGIN - evidenceHeight - focusHeight / 2 - 38
  );
  const focus: CapabilityDeepFocusNode = {
    id: selected.id,
    title: selected.title,
    x: centerX,
    y: centerY,
    width: focusWidth,
    height: focusHeight,
    scale: 1,
    opacity: 1
  };
  const evidence: CapabilityDeepFocusNode = {
    id: `evidence-${selected.id}`,
    title: "EVIDENCE",
    x: centerX,
    y: clamp(
      centerY + focusHeight / 2 + 24 + evidenceHeight / 2,
      MARGIN + evidenceHeight / 2,
      height - MARGIN - evidenceHeight / 2
    ),
    width: evidenceWidth,
    height: evidenceHeight,
    scale: 1,
    opacity: 1
  };
  const satelliteInputs = capabilities.filter((capability) => capability.id !== selected.id);
  const satelliteWidth = clamp(Math.round(width * 0.145), 116, 184);
  const satelliteHeight = 78;
  const radiusX = Math.max(focusWidth / 2 + satelliteWidth / 2 + 32, width / 2 - MARGIN - satelliteWidth / 2);
  const radiusY = Math.max(94, Math.min(centerY - MARGIN - satelliteHeight / 2, height - centerY - MARGIN - satelliteHeight / 2));
  const occupied = [focus, evidence];
  const satellites: CapabilityDeepFocusNode[] = [];

  for (let index = 0; index < satelliteInputs.length; index += 1) {
    const input = satelliteInputs[index];
    let candidate: CapabilityDeepFocusNode | null = null;

    for (let phaseStep = 0; phaseStep < 72 && candidate === null; phaseStep += 1) {
      const angle = -Math.PI / 2 + (index * Math.PI * 2) / satelliteInputs.length + (phaseStep * Math.PI * 2) / 72;
      const next: CapabilityDeepFocusNode = {
        id: input.id,
        title: input.title,
        x: Math.round(clamp(centerX + Math.cos(angle) * radiusX, MARGIN + satelliteWidth / 2, width - MARGIN - satelliteWidth / 2) * 100) / 100,
        y: Math.round(clamp(centerY + Math.sin(angle) * radiusY, MARGIN + satelliteHeight / 2, height - MARGIN - satelliteHeight / 2) * 100) / 100,
        width: satelliteWidth,
        height: satelliteHeight,
        scale: 0.78,
        opacity: 0.42
      };
      if (!occupied.some((node) => intersects(next, node))) candidate = next;
    }

    // Very small screens cannot sustain a full orbit. Keep the node bounded
    // and subordinate rather than replacing the local semantic projection.
    const fallback = candidate ?? {
      id: input.id,
      title: input.title,
      x: MARGIN + satelliteWidth / 2 + (index % 2) * (width - MARGIN * 2 - satelliteWidth),
      y: MARGIN + satelliteHeight / 2 + Math.floor(index / 2) * (satelliteHeight + 8),
      width: satelliteWidth,
      height: satelliteHeight,
      scale: 0.72,
      opacity: 0.34
    };
    satellites.push(fallback);
    occupied.push(fallback);
  }

  return { width, height, centerX, centerY, focus, evidence, satellites, staticPositions: false };
}
