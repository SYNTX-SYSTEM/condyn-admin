import type { SilOrbitStageId } from "./sil-language";

export interface OrbitalFocusNavigationRequest {
  activeStageId: SilOrbitStageId | null;
  selectedItemId: string | null;
  requestedStageId: SilOrbitStageId | null;
  requestedItemId: string | null;
  itemIds: string[];
}

export interface OrbitalFocusNavigationState {
  activeStageId: SilOrbitStageId | null;
  selectedItemId: string | null;
  zoomLevel: 0 | 1 | 2;
}

/** The L0 → L1 → L2 contract for every SIL orbit. */
export function resolveOrbitalFocusNavigation(
  request: OrbitalFocusNavigationRequest
): OrbitalFocusNavigationState {
  const { activeStageId, requestedStageId, requestedItemId, itemIds } = request;

  if (requestedStageId === null) {
    return { activeStageId: null, selectedItemId: null, zoomLevel: 0 };
  }
  if (requestedStageId !== activeStageId) {
    return { activeStageId: requestedStageId, selectedItemId: null, zoomLevel: 1 };
  }
  if (requestedItemId !== null) {
    return itemIds.includes(requestedItemId)
      ? { activeStageId, selectedItemId: requestedItemId, zoomLevel: 2 }
      : { activeStageId, selectedItemId: null, zoomLevel: 1 };
  }
  if (request.selectedItemId !== null) {
    return { activeStageId, selectedItemId: null, zoomLevel: 1 };
  }
  return { activeStageId: null, selectedItemId: null, zoomLevel: 0 };
}
