import React from "react";
import { DemoCapabilityItem } from "../../../career/demo/demo-data";
import { CapabilityField } from "./CapabilityField";

export interface CapabilityEvidencePanelProps {
  capabilities: DemoCapabilityItem[];
}

export function CapabilityEvidencePanel({ capabilities }: CapabilityEvidencePanelProps) {
  return <CapabilityField capabilities={capabilities} />;
}
