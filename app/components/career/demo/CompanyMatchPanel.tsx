import React from "react";
import { DemoOrganizationMatch } from "../../../career/demo/demo-data";
import { ResonanceOrbits } from "./ResonanceOrbits";

export interface CompanyMatchPanelProps {
  companyMatches: DemoOrganizationMatch[];
}

export function CompanyMatchPanel({ companyMatches }: CompanyMatchPanelProps) {
  return <ResonanceOrbits companyMatches={companyMatches} />;
}
