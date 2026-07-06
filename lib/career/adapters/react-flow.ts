import { CareerLayoutModel } from "../layout";
import { ViewStyle } from "../view-model";

export interface ReactFlowData {
  label: string;
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

export interface ReactFlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: ReactFlowData;
  style: { opacity: number };
}

export interface ReactFlowEdgeData {
  interactionForce: number;
  tooltip: string;
}

export interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  animated: boolean;
  style: {
    strokeWidth: number;
    stroke: string;
    strokeDasharray?: string;
  };
  data: ReactFlowEdgeData;
}

export interface ReactFlowGraph {
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
}

/**
 * Pure 1:1 structure mapper from CareerLayoutModel to ReactFlowGraph.
 * Strictly performs zero trigonometry or layout calculation.
 * Transfers node.x/node.y directly to ReactFlow position: { x, y }.
 */
export function toReactFlow(layoutModel: CareerLayoutModel): ReactFlowGraph {
  const nodes: ReactFlowNode[] = layoutModel.nodes.map(node => ({
    id: node.id,
    type: "careerNode",
    position: { x: node.x, y: node.y },
    data: {
      label: node.label,
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
      opacity: node.style.opacity
    }
  }));

  const edges: ReactFlowEdge[] = layoutModel.edges.map(edge => {
    let strokeDasharray: string | undefined = undefined;
    if (edge.style.strokeStyle === "DASHED") strokeDasharray = "5 5";
    else if (edge.style.strokeStyle === "DOTTED") strokeDasharray = "2 2";

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      animated: edge.style.animated,
      style: {
        strokeWidth: edge.style.strokeWidth,
        stroke: edge.style.strokeColor,
        strokeDasharray
      },
      data: {
        interactionForce: edge.interactionForce,
        tooltip: edge.tooltip
      }
    };
  });

  return { nodes, edges };
}
