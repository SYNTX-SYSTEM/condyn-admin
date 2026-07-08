import React from "react";
import { DemoRoleMatch } from "../../../career/demo/demo-data";
import { RoleManifestation } from "./RoleManifestation";

export interface RoleMatchPanelProps {
  roleMatches: DemoRoleMatch[];
}

export function RoleMatchPanel({ roleMatches }: RoleMatchPanelProps) {
  return <RoleManifestation roleMatches={roleMatches} />;
}
