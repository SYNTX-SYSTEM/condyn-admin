import React from "react";
import { DemoIngestionSource } from "../../../career/demo/demo-data";
import { IdentityCoreNode } from "./IdentityCoreNode";

export interface SourceSummaryPanelProps {
  sources: DemoIngestionSource[];
}

export function SourceSummaryPanel({ sources }: SourceSummaryPanelProps) {
  return <IdentityCoreNode sources={sources} />;
}
