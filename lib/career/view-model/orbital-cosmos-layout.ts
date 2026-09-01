import { buildCapabilityCosmosLayout } from "./capability-cosmos-layout";
export { positionCosmosNodeAtPhase } from "./capability-cosmos-layout";
import type { OrbitFocusItem } from "./orbit-focus-projection";

/**
 * Shared presentation-only packing. Other orbits deliberately provide no
 * visual weight input, so every item receives equal semantic mass.
 */
export function buildOrbitalCosmosLayout(request: {
  items: Pick<OrbitFocusItem, "id" | "title">[];
  width: number;
  height: number;
}) {
  return buildCapabilityCosmosLayout({
    capabilities: request.items.map((item) => ({ id: item.id, title: item.title })),
    width: request.width,
    height: request.height
  });
}
