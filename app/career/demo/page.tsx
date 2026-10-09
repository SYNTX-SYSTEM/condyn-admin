import React from "react";
import { CareerIntelligenceDashboard } from "../../components/career/demo/CareerIntelligenceDashboard";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "./demo-data";

export default async function CareerIntelligenceDemoPage({ searchParams }: { searchParams: Promise<{ canonicalSilAssociationId?: string }> }) {
  const { canonicalSilAssociationId } = await searchParams;
  return <CareerIntelligenceDashboard data={EMPTY_CAREER_INTELLIGENCE_DATA} canonicalSilAssociationId={canonicalSilAssociationId} />;
}
