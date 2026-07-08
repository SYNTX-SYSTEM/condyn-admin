import React from "react";
import { CareerIntelligenceDashboard } from "../../components/career/demo/CareerIntelligenceDashboard";
import { DEMO_CAREER_INTELLIGENCE_DATA } from "./demo-data";

export default function CareerIntelligenceDemoPage() {
  return <CareerIntelligenceDashboard data={DEMO_CAREER_INTELLIGENCE_DATA} />;
}
