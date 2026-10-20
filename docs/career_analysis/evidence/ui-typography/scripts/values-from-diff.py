# Every changed type value (font size, tracking, spacing, colour, offset) of the sweep, from the diff against its base commit, as a
# Markdown table: file, line (after), before → after. Run from the repository root: python3 <this file> <base commit> > ../values.md
import re, subprocess, sys
base = sys.argv[1]
diff = subprocess.run(["git", "diff", "-U0", base, "--", "app"], capture_output=True, text=True, check=True).stdout.split("\n")
PROP = r'(?:font-?[sS]ize|letter-?[sS]pacing|padding|gap|bottom|width|height|color|textMuted|whiteSpace|max-height)\s*:\s*[^,;}]+'
rows, path, line, minus, plus = [], None, 0, [], []
def flush():
    global minus, plus
    for a, b in zip(minus, plus):
        for x, y in zip(re.findall(PROP, a), re.findall(PROP, b)):
            if x != y: rows.append((path, line, x.strip(), y.strip()))
    minus, plus = [], []
for l in diff:
    if l.startswith("+++ "): flush(); path = l[6:]
    elif l.startswith("@@"): flush(); line = int(re.search(r"\+(\d+)", l).group(1))
    elif l.startswith("-") and not l.startswith("---"): minus.append(l)
    elif l.startswith("+") and not l.startswith("+++"): plus.append(l)
flush()
print("| file | line | before | after |\n|---|---|---|---|")
for p, n, x, y in rows: print(f"| `{p.split('/')[-1]}` | {n} | `{x}` | `{y}` |")
