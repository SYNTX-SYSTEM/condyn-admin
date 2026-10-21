# Focus / context matrix: per state the focused identity and its context, rendered size · weight · contrast (min over the matching runs).
import json, sys, glob, re, os
def pick(items, key, cond):
    xs = [i for i in items if re.match(key, i["key"]) and i["box"][2] >= 3 and cond(i)]
    if not xs: return "—"
    s = min(i["size"] for i in xs); S_ = max(i["size"] for i in xs); c = min(i["contrast"] for i in xs); w = sorted({i["weight"] for i in xs}); o = min(i["opacity"] for i in xs)
    return f"{s:.1f}{'' if abs(S_-s)<0.15 else f'–{S_:.1f}'}px w{'/'.join(map(str,w))} c{c:.1f}" + (f" op{o:.2f}" if o < 0.99 else "")
NAMES = lambda i: i["weight"] >= 600
ROWS = {
 "s1-field": [("FOCUS pool name", r"^syntx-pool-core", lambda i: i["weight"] >= 700 and "POOL" not in i["text"][:9].upper().replace("JOBPOOL", "JOB POOL") or ("Pool" in i["text"] and i["weight"] >= 700)),
              ("context org names", r"^syntx-body-org", lambda i: i["text"].startswith("⬡")),
              ("context org meta", r"^syntx-body-org", lambda i: i["weight"] == 500)],
 "s2-organization": [("FOCUS org centre name", r"^syntx-cosmos-centre", lambda i: i["weight"] == 700),
              ("centre kicker", r"^syntx-cosmos-centre", lambda i: i["weight"] == 600),
              ("context role titles", r"^syntx-role", lambda i: i["weight"] == 600 and i["opacity"] > 0.9 and i["size"] >= 10.5),
              ("context role count", r"^syntx-role", lambda i: "REQ" in i["text"].upper() or "ANFORD" in i["text"].upper()),
              ("receded org names", r"^syntx-body-org", lambda i: i["text"].startswith("⬡") and i["opacity"] < 0.2)],
 "s3-role": [("FOCUS role centre title", r"^syntx-role", lambda i: i["weight"] == 700 and i["opacity"] > 0.9 and i["size"] >= 11.5),
              ("context requirement labels", r"^syntx-req", lambda i: i["weight"] == 700 and i["size"] >= 10.5),
              ("receded role titles", r"^syntx-role", lambda i: i["weight"] == 600 and i["opacity"] < 0.5 and i["size"] >= 10)],
 "s4-requirement": [("FOCUS requirement nucleus", r"^syntx-req", lambda i: i["weight"] == 800 and i["size"] >= 13),
              ("receded sibling requirements", r"^syntx-req", lambda i: i["opacity"] < 0.5),
              ("evidence surface", r"^syntx-evidence-surface", lambda i: True)],
 "s5-pxj-role": [("FOCUS role centre title", r"^syntx-role", lambda i: i["weight"] == 700 and i["opacity"] > 0.9 and i["size"] >= 11.5),
              ("context requirement labels", r"^syntx-req", lambda i: i["weight"] == 700 and i["size"] >= 9.5 and i["opacity"] > 0.9)],
 "s6-pxj-requirement": [("FOCUS requirement nucleus", r"^syntx-req", lambda i: i["weight"] == 800 and i["size"] >= 13),
              ("receded sibling requirements", r"^syntx-req", lambda i: i["opacity"] < 0.5),
              ("evidence surface", r"^syntx-(evidence-surface|source)", lambda i: True)],
 "s7-pxj-evidence": [("FOCUS aperture title", r"^syntx-aperture$", lambda i: i["weight"] == 800 and i["size"] >= 14),
              ("aperture quote", r"^syntx-aperture-quote", lambda i: True),
              ("aperture labels", r"^syntx-aperture", lambda i: i["tt"] == "uppercase" and i["weight"] == 700)],
 "s8-person-capability-field": [("FOCUS region titles", r"^orbital-physics", lambda i: i["weight"] == 700 and i["size"] >= 12),
              ("region subtitles", r"^orbital-physics", lambda i: i["weight"] in (400, 500) and "items" not in i["text"])],
 "s8b-capability-cosmos": [("FOCUS cosmos centre", r"^cap", lambda i: "CAPABILITY FIELD" in i["text"] or "CAPABILITY-FELD" in i["text"] or "FÄHIGKEITS" in i["text"].upper()),
              ("capability node names", r"^cap", lambda i: i["weight"] == 700 and i["size"] >= 11.5)],
 "s9-capability-evidence": [("FOCUS capability nucleus", r"^cap", lambda i: i["weight"] == 800 and i["size"] >= 13),
              ("receded sibling capabilities", r"^cap", lambda i: i["opacity"] < 0.5),
              ("evidence surface", r"^cap", lambda i: i["size"] <= 10.5 and i["opacity"] > 0.9 and i["weight"] in (400, 700) and "RETURN" not in i["text"] and "ZURÜCK" not in i["text"])],
}
base = sys.argv[1]
for state, rows in ROWS.items():
    print(f"\n### {state}")
    cols = []
    for d in sorted(glob.glob(f"{base}/[wr]*/")):
        for f in sorted(glob.glob(f"{d}{state}-*.json")):
            m = re.search(r"-(en|de)-(\d+)\.json$", f)
            if m: cols.append((f"{m.group(2)} {m.group(1)}", f))
    seenc = {}
    for c, f in cols: seenc[c] = f  # later dirs (r1920) win over w1920
    cols = sorted(seenc.items(), key=lambda x: (-int(x[0].split()[0]), x[0].split()[1]))
    print("| | " + " | ".join(c for c, _ in cols) + " |"); print("|---" * (len(cols) + 1) + "|")
    for label, key, cond in rows:
        cells = []
        for c, f in cols:
            items = json.load(open(f))["inv"]["items"]; cells.append(pick(items, key, cond))
        print(f"| {label} | " + " | ".join(cells) + " |")
