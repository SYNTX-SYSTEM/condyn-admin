// A synthetic scale pool: organizations holding 1, 2, 3, 5, 8, 14 roles (titles of mixed length), 8 roles with long and 12 with short
// titles (PINK §3.45 D-RO-1), one requirement each.
export function scalePool(suffix) {
  const pid = `pool_gruen_orbit_scale_${suffix}`;
  const counts = [1, 2, 3, 5, 8, 14];
  const titles = ["Senior Full-Stack Engineer – Shipment Tracking", "Platform Reliability Engineer", "Data Engineer", "Engineering Manager, Payments Infrastructure and Settlement", "QA Lead", "Product Designer", "Machine Learning Engineer (Ranking)", "DevOps Engineer", "Security Analyst", "Frontend Engineer", "Backend Engineer (Go)", "Technical Writer", "Solutions Architect", "Site Reliability Engineer II"];
  const LONG = ["Principal Engineer, Distributed Settlement and Reconciliation Platform", "Head of Clinical Interoperability Gateways and Integration Services", "Senior Staff Engineer – Real-Time Shipment Telemetry and Exception Handling"];
  const SHORT = ["QA Lead", "SRE", "Designer", "Analyst"];
  const sets = [...counts.map(n => ({ key: String(n), n, titles })), { key: "long_8", n: 8, titles: LONG }, { key: "short_12", n: 12, titles: SHORT }];
  const organizations = sets.map(({ key, n }) => ({ id: `org_orbit_${key}`, pool_id: pid, org_id: `orbit_${key}`, name: `Orbit ${key.replace("_", " ")} Roles GmbH`, country_iso: "DE", region: "Berlin", industry: "Test", scale: "Test", description: `Synthetic organization with ${n} roles.` }));
  const roles = [], requirements = [];
  sets.forEach(({ key, n, titles: names }) => { for (let r = 0; r < n; r += 1) { const id = `role_orbit_${key}_${String(r).padStart(2, "0")}`; roles.push({ id, pool_id: pid, organization_id: `org_orbit_${key}`, title: names[r % names.length], seniority: "Senior", domain_focus: "Test", description: "Synthetic role." }); requirements.push({ id: `req_${id}`, role_id: id, capability_name: "TypeScript", domain: "Software Engineering", weight: 0.5, required_level: "L3", necessity: "REQUIRED", requirement_type: "TOOL_TECHNOLOGY", evidence_hint: "Code.", aliases: [] }); } });
  return { pool: { id: pid, name: `GRÜN orbit scale pool ${suffix}`, description: "Role orbit scale check.", version: 1, status: "ACTIVE", created_at: "2026-10-18T00:00:00.000Z" }, organizations, roles, requirements };
}
