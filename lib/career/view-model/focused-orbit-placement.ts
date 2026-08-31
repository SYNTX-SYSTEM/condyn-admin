export type SilFocusedManifestationPlacement =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export interface SilFocusedManifestationPresentation {
  placement: SilFocusedManifestationPlacement;
  tetherTarget: {
    x: number;
    y: number;
  };
}

const inwardPlacementByStage: Record<
  string,
  SilFocusedManifestationPlacement
> = {
  "01": "bottom",
  "02": "bottom-left",
  "03": "top-left",
  "04": "top",
  "05": "top-right",
  "06": "bottom-right"
};

function resolveInwardPlacement(
  angle: number
): SilFocusedManifestationPlacement {
  const normalized = ((angle % 360) + 360) % 360;

  if (normalized === 270) return "bottom";
  if (normalized === 90) return "top";
  if (normalized === 0) return "left";
  if (normalized === 180) return "right";
  if (normalized > 0 && normalized < 90) return "top-left";
  if (normalized > 90 && normalized < 180) return "top-right";
  if (normalized > 180 && normalized < 270) return "bottom-right";
  return "bottom-left";
}

function tetherTargetFor(
  placement: SilFocusedManifestationPlacement
) {
  return {
    x: placement.includes("left")
      ? 20
      : placement.includes("right")
      ? 220
      : 120,
    y: placement.includes("top")
      ? 20
      : placement.includes("bottom")
      ? 220
      : 120
  };
}

export function resolveSilFocusedManifestationPresentation(
  stageId?: string,
  angle?: number,
  requestedPlacement?: SilFocusedManifestationPlacement
): SilFocusedManifestationPresentation {
  const placement =
    requestedPlacement ||
    (typeof angle === "number"
      ? resolveInwardPlacement(angle)
      : inwardPlacementByStage[stageId || ""] || "bottom");

  return {
    placement,
    tetherTarget: tetherTargetFor(placement)
  };
}
