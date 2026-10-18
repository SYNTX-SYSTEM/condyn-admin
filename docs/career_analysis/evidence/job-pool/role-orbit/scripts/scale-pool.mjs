// A synthetic scale pool: organizations holding 1, 2, 3, 5, 8, 14 roles (titles of mixed length), one requirement each.
export function scalePool(suffix) {
  const pid = `pool_gruen_orbit_scale_${suffix}`;
  const counts = [1, 2, 3, 5, 8, 14];
  const titles = ["Senior Full-Stack Engineer – Shipment Tracking", "Platform Reliability Engineer", "Data Engineer", "Engineering Manager, Payments Infrastructure and Settlement", "QA Lead", "Product Designer", "Machine Learning Engineer (Ranking)", "DevOps Engineer", "Security Analyst", "Frontend Engineer", "Backend Engineer (Go)", "Technical Writer", "Solutions Architect", "Site Reliability Engineer II"];
  const organizations = counts.map(n => ({ id: `org_orbit_${n}`, pool_id: pid, org_id: `orbit_${n}`, name: `Orbit ${n} Roles GmbH`, country_iso: "DE", region: "Berlin", industry: "Test", scale: "Test", description: `Synthetic organization with ${n} roles.` }));
  const roles = [], requirements = [];
  counts.forEach(n => { for (let r = 0; r < n; r += 1) { const id = `role_orbit_${n}_${String(r).padStart(2, "0")}`; roles.push({ id, pool_id: pid, organization_id: `org_orbit_${n}`, title: titles[r % titles.length], seniority: "Senior", domain_focus: "Test", description: "Synthetic role." }); requirements.push({ id: `req_${id}`, role_id: id, capability_name: "TypeScript", domain: "Software Engineering", weight: 0.5, required_level: "L3", necessity: "REQUIRED", requirement_type: "TOOL_TECHNOLOGY", evidence_hint: "Code.", aliases: [] }); } });
  return { pool: { id: pid, name: `GRÜN orbit scale pool ${suffix}`, description: "Role orbit scale check.", version: 1, status: "ACTIVE", created_at: "2026-10-18T00:00:00.000Z" }, organizations, roles, requirements };
}
