import React from "react";
import { DemoCapabilityEvidence } from "../../../career/demo/demo-data";
import { CapabilityField } from "./CapabilityField";

export interface CapabilityEvidencePanelProps {
  capabilities: DemoCapabilityEvidence[];
}

export function CapabilityEvidencePanel({ capabilities }: CapabilityEvidencePanelProps) {
  return <CapabilityField capabilities={capabilities} />;
}
