import { buildCapabilityDeepFocusLayout } from "./capability-deep-focus-layout";
import type { OrbitFocusItem } from "./orbit-focus-projection";

/** Shared L2 geometry with no generic evidence panel or semantic weighting. */
export function buildOrbitalDeepFocusLayout(request: {
  items: Pick<OrbitFocusItem, "id" | "title">[];
  selectedItemId: string;
  width: number;
  height: number;
}) {
  return buildCapabilityDeepFocusLayout({
    capabilities: request.items.map((item) => ({ id: item.id, title: item.title })),
    selectedCapabilityId: request.selectedItemId,
    width: request.width,
    height: request.height
  });
}
