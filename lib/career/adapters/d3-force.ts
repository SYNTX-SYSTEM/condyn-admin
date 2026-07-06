import { CareerLayoutModel } from "../layout";
import { ViewStyle } from "../view-model";

export interface D3NodeData {
  type: string;
  ringName: string;
  ringIndex: number;
  priorityGroup?: string;
  weight: number;
  tooltip: string;
  isCollapsible: boolean;
  isExpandedByDefault: boolean;
  style: ViewStyle;
}

export interface D3Node {
  id: string;
  label: string;
  x: number;
  y: number;
  fx?: number;
  fy?: number;
  data: D3NodeData;
  style: {
    opacity: number;
    shape: string;
  };
}

export interface D3LinkData {
  tooltip: string;
}

export interface D3Link {
  id: string;
  source: string;
  target: string;
  strength: number;
  animated: boolean;
  style: {
    strokeWidth: number;
    stroke: string;
    strokeDasharray?: string;
  };
  data: D3LinkData;
}

export interface D3ForceGraph {
  nodes: D3Node[];
  links: D3Link[];
}

/**
 * Pure 1:1 structure mapper from CareerLayoutModel to D3ForceGraph.
 * Strictly performs zero simulation ticks or layout recalculation.
 * Sets fx: 0, fy: 0 exclusively for the center node, leaving non-center nodes without fx/fy.
 * Maps interactionForce directly to link strength.
 */
export function toD3Force(layoutModel: CareerLayoutModel): D3ForceGraph {
  const nodes: D3Node[] = layoutModel.nodes.map(node => {
    const isCenter = node.id === layoutModel.centerNodeId;
    const baseNode: D3Node = {
      id: node.id,
      label: node.label,
      x: node.x,
      y: node.y,
      data: {
        type: node.type,
        ringName: node.ringName,
        ringIndex: node.ringIndex,
        priorityGroup: node.priorityGroup,
        weight: node.weight,
        tooltip: node.tooltip,
        isCollapsible: node.isCollapsible,
        isExpandedByDefault: node.isExpandedByDefault,
        style: node.style
      },
      style: {
        opacity: node.style.opacity,
        shape: node.style.shape
      }
    };

    if (isCenter) {
      baseNode.fx = 0;
      baseNode.fy = 0;
    }

    return baseNode;
  });

  const links: D3Link[] = layoutModel.edges.map(edge => {
    let strokeDasharray: string | undefined = undefined;
    if (edge.style.strokeStyle === "DASHED") strokeDasharray = "5 5";
    else if (edge.style.strokeStyle === "DOTTED") strokeDasharray = "2 2";

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      strength: edge.interactionForce,
      animated: edge.style.animated,
      style: {
        strokeWidth: edge.style.strokeWidth,
        stroke: edge.style.strokeColor,
        strokeDasharray
      },
      data: {
        tooltip: edge.tooltip
      }
    };
  });

  return { nodes, links };
}
