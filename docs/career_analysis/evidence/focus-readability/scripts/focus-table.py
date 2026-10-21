# Rendered entity typography per state from the inventory (size = css × scale, contrast composited, opacity effective).
import json, sys, re
PAT = [("pool", r"^syntx-pool"), ("org", r"^syntx-(body-org|organization)"), ("centre", r"^syntx-cosmos-centre"), ("role", r"^syntx-(role|cosmos-org)"), ("req", r"^syntx-(req|requirement)"), ("evidence", r"^syntx-(evidence|trace|source|open|aperture)"), ("cap", r"^(cap|capability-)"), ("path", r"^syntx-path"), ("state", r"^syntx-state")]
for f in sys.argv[1:]:
    d = json.load(open(f)); print(f"=== {d['name']} {d['lang']} {d['w']}")
    rows = {}
    for it in d["inv"]["items"]:
        if it["box"][2] < 3: continue
        for name, p in PAT:
            if re.match(p, it["key"]):
                k = (name, it["key"][:30], it["text"][:30])
                if k not in rows: rows[k] = it
                break
    for (name, key, text), it in sorted(rows.items(), key=lambda x: (x[0][0], -x[1]["size"])):
        print(f"  {name:8s} {it['size']:5.1f}px w{it['weight']} c{it['contrast']:4.1f} op{it['opacity']:.2f} {it['tt'][:5]:5s} {key[:26]:26s} \"{text}\"")
