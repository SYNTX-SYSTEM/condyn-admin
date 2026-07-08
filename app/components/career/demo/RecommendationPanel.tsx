import React from "react";
import { DemoCapabilityGap, DemoNextAction } from "../../../career/demo/demo-data";
import { TensionLayer } from "./TensionLayer";
import { EvolutionLayer } from "./EvolutionLayer";

export interface RecommendationPanelProps {
  capabilityGaps: DemoCapabilityGap[];
  nextActions: DemoNextAction[];
}

export function RecommendationPanel({ capabilityGaps, nextActions }: RecommendationPanelProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <TensionLayer capabilityGaps={capabilityGaps} />
      <EvolutionLayer nextActions={nextActions} />
    </div>
  );
}
