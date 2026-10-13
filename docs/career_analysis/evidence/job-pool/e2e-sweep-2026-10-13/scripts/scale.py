import json, sys
D = sys.argv[1]
base = json.load(open("/home/codi/Entwicklung/condyn-admin-e2e/docs/examples/job-pool-tests/DLL_JOBPOOL_ENTERPRISE_SCALE.json"))
for k in (2, 4):
    out = {"pool": dict(base["pool"]), "organizations": [], "roles": [], "requirements": []}
    out["pool"]["id"] = f"pool_dll_enterprise_scale_x{k}"; out["pool"]["name"] = f"DLL Enterprise Scale x{k} (E2E growth test)"
    for c in range(k):
        s = "" if c == 0 else f"_c{c}"
        for o in base["organizations"]:
            o2 = dict(o); o2["id"] = o["id"] + s; o2["org_id"] = o["org_id"] + s; o2["name"] = o["name"] + ("" if c == 0 else f" {c + 1}"); o2["pool_id"] = out["pool"]["id"]; out["organizations"].append(o2)
        for r in base["roles"]:
            r2 = dict(r); r2["id"] = r["id"] + s; r2["organization_id"] = r["organization_id"] + s; r2["pool_id"] = out["pool"]["id"] if "pool_id" in r else r.get("pool_id"); out["roles"].append(r2)
        for q in base["requirements"]:
            q2 = dict(q); q2["id"] = q["id"] + s; q2["role_id"] = q["role_id"] + s; out["requirements"].append(q2)
    p = f"{D}/scale-x{k}.json"; json.dump(out, open(p, "w")); import os; print(p, len(out["organizations"]), len(out["roles"]), len(out["requirements"]), os.path.getsize(p))
