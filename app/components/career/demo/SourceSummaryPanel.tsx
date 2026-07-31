import React from "react";
import { DemoSourceItem } from "../../../career/demo/demo-data";
import { IdentityCoreNode } from "./IdentityCoreNode";

export interface SourceSummaryPanelProps {
  sources: DemoSourceItem[];
}

export function SourceSummaryPanel({ sources }: SourceSummaryPanelProps) {
  return <IdentityCoreNode sources={sources} />;
}
