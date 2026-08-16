import React from "react";
import { CareerIntelligenceDashboard } from "../../components/career/demo/CareerIntelligenceDashboard";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "./demo-data";

export default function CareerIntelligenceDemoPage() {
  return <CareerIntelligenceDashboard data={EMPTY_CAREER_INTELLIGENCE_DATA} />;
}
