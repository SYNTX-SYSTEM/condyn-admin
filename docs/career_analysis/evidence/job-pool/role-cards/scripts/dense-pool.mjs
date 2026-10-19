// Dense and long statements for the role cards (PINK's preliminary findings on ae633a1): titles whose dense words need more lines than
// the packing's estimate counts, long seniorities and domains on narrow and wide cards. Two organizations, one requirement per role.
export function densePool(suffix) {
  const pid = `pool_gruen_cards_dense_${suffix}`;
  const sets = [
    { key: "dense", roles: [
      ["QA LEAD – EMEA OPERATIONS MANAGEMENT", "Senior / L4", "Security & Compliance"],
      ["SENIOR SECURITY & COMPLIANCE ENGINEER – EMEA", "Senior Principal / L7", "Security & Compliance Operations EMEA"],
      ["HEAD OF MMMM WWWW PLATFORM OPERATIONS", "Lead / M2", "Platform Operations"]
    ] },
    { key: "narrow", roles: [["QA", "Senior / L4", "Security & Compliance"], ["SRE", "Staff / L5", "Reliability"], ["UX", "Mid / L3", "Design"], ["PM", "Senior / L4", "Product"]] }
  ];
  const organizations = sets.map(({ key, roles }) => ({ id: `org_cards_${key}`, pool_id: pid, org_id: `cards_${key}`, name: `Cards ${key} GmbH`, country_iso: "DE", region: "Berlin", industry: "Test", scale: "Test", description: `Synthetic organization with ${roles.length} roles.` }));
  const roles = [], requirements = [];
  for (const { key, roles: list } of sets) list.forEach(([title, seniority, domain], index) => {
    const id = `role_cards_${key}_${index}`;
    roles.push({ id, pool_id: pid, organization_id: `org_cards_${key}`, title, seniority, domain_focus: domain, description: "Synthetic role." });
    requirements.push({ id: `req_${id}`, role_id: id, capability_name: "TypeScript", domain: "Software Engineering", weight: 0.5, required_level: "L3", necessity: "REQUIRED", requirement_type: "TOOL_TECHNOLOGY", evidence_hint: "Code.", aliases: [] });
  });
  return { pool: { id: pid, name: `GRÜN cards dense pool ${suffix}`, description: "Role card statements check.", version: 1, status: "ACTIVE", created_at: "2026-10-19T00:00:00.000Z" }, organizations, roles, requirements };
}
