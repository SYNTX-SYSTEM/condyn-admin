# Before | after images for the significant changes: the same frame of the baseline take and of the after take, side by side
# (optionally a crop, scaled), labelled. argv: <baseline take dir> <after take dir> <out dir> <width>. Needs Pillow.
import os, sys
from PIL import Image, ImageDraw
B, A, OUT, W = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
os.makedirs(OUT, exist_ok=True)
FRAMES = {  # name: (frame file stem, crop box or None, scale)
    "shell-row": ("16-b2-coverage", (0, 0, int(W), 130), 1.0),
    "orientation-surface": ("11-role-person-no-comparison", (0, 130, 420, 460), 1.5),
    "field-laws-and-mode-statement": ("11-role-person-no-comparison", (int(W) // 2 - 520, int(W) * 9 // 16 - 140, int(W) // 2 + 520, int(W) * 9 // 16), 1.0),
    "role-level": ("11-role-person-no-comparison", None, 0.5),
    "b2-coverage": ("16-b2-coverage", None, 0.5),
    "job-structure": ("18-job-structure", None, 0.5),
    "capability-field": ("03-person-analysis-done", None, 0.5),
    "gemini-output": ("06-person-gemini-output", None, 0.5),
    "kestrel-de": ("x06-de-kestrel", None, 0.5),
    "codex-de": ("x03-codex-de", None, 0.5),
}
for name, (stem, crop, scale) in FRAMES.items():
    pa, pb = os.path.join(B, f"{stem}-{W}.png"), os.path.join(A, f"{stem}-{W}.png")
    if not (os.path.exists(pa) and os.path.exists(pb)): print("missing", name); continue
    ia, ib = Image.open(pa), Image.open(pb)
    if crop: ia, ib = ia.crop(crop), ib.crop(crop)
    if scale != 1.0: ia, ib = (im.resize((int(im.width * scale), int(im.height * scale)), Image.LANCZOS) for im in (ia, ib))
    gap, head = 16, 26
    out = Image.new("RGB", (ia.width * 2 + gap, ia.height + head), (3, 8, 15))
    out.paste(ia, (0, head)); out.paste(ib, (ia.width + gap, head))
    d = ImageDraw.Draw(out); d.text((6, 6), f"BEFORE (35f00bc) · {name} · {W}", fill=(150, 200, 220)); d.text((ia.width + gap + 6, 6), "AFTER (frontend/ui-typography)", fill=(120, 240, 255))
    out.save(os.path.join(OUT, f"{name}-{W}.jpg"), quality=88, optimize=True); print("wrote", name)
