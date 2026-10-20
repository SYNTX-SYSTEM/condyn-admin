// Text inventory of the rendered page: every visible text run with its rendered size, weight, colour, contrast and clipping.
export const inventory = page => page.evaluate(() => {
  const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = ({ r, g, b }) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const over = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
  const FIELD = { r: 3, g: 8, b: 15, a: 1 };
  const bgOf = el => {
    const stack = [];
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const s = getComputedStyle(e); const c = parse(s.backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a >= 0.98) break; } }
    let bg = FIELD; for (const c of stack.reverse()) bg = over(c, bg); return bg;
  };
  const opacityOf = el => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= Number(getComputedStyle(e).opacity); return o; };
  const keyOf = el => { const t = el.closest("[data-testid]"); const raw = t ? t.getAttribute("data-testid") : "(none)"; return raw.replace(/(JPOOL|role|org|req|cap|ANL|AJOB|DREV|DCTX)[_A-Za-z0-9-]*/g, "$1*"); };
  const out = []; const els = [];
  const W = innerWidth, H = innerHeight;
  for (const el of document.querySelectorAll("body *")) {
    if (["SCRIPT", "STYLE", "NOSCRIPT", "TITLE"].includes(el.tagName)) continue;
    const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join("").replace(/\s+/g, " ").trim();
    if (!own) continue;
    const s = getComputedStyle(el);
    if (s.visibility === "hidden" || s.display === "none") continue;
    const b = el.getBoundingClientRect();
    if (b.width < 1 || b.height < 1 || b.right < 0 || b.bottom < 0 || b.left > W || b.top > H) continue;
    const op = opacityOf(el); if (op < 0.04) continue;
    let scale = 1;
    if (el instanceof SVGElement) { const m = el.getScreenCTM?.(); if (m) scale = Math.hypot(m.a, m.b); }
    else { let e = el; while (e && !(e.offsetWidth > 0)) e = e.parentElement; if (e) { const r = e.getBoundingClientRect(); scale = r.width / e.offsetWidth; } }
    const size = parseFloat(s.fontSize) * scale;
    const fgRaw = parse(el instanceof SVGElement && s.fill && s.fill !== "none" && !el.closest("foreignObject") ? s.fill : s.color) ?? { r: 255, g: 255, b: 255, a: 1 };
    const bg = bgOf(el); const fg = over({ ...fgRaw, a: fgRaw.a * op }, bg);
    const L1 = lum(fg), L2 = lum(bg); const contrast = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    // Clipped: the text's own extent leaves a clipping ancestor (overflow other than visible), or an ellipsis cuts it.
    let clipped = false;
    const range = document.createRange(); const texts = [...el.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim());
    range.setStartBefore(texts[0]); range.setEndAfter(texts[texts.length - 1]);
    const tr = range.getBoundingClientRect();
    // One rect per line box of each own text node (a run that wraps does not claim the whole block between its lines).
    const rects = texts.flatMap(node => { const r = document.createRange(); r.selectNodeContents(node); return [...r.getClientRects()].map(b => [Math.round(b.left * 10) / 10, Math.round(b.top * 10) / 10, Math.round(b.right * 10) / 10, Math.round(b.bottom * 10) / 10]); }).filter(r => r[2] - r[0] > 1 && r[3] - r[1] > 1);
    if (s.textOverflow === "ellipsis" && el.scrollWidth > el.clientWidth + 1) clipped = true;
    for (let e = el; e && e.nodeType === 1 && !clipped; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.overflowX === "visible" && cs.overflowY === "visible") continue;
      const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
      const scroller = /auto|scroll/.test(cs.overflowX + cs.overflowY);
      if (!scroller && (tr.left < r.left - 1 || tr.right > r.right + 1 || tr.top < r.top - 1 || tr.bottom > r.bottom + 1)) clipped = true;
      if (scroller && (tr.left < r.left - 1 || tr.right > r.right + 1)) clipped = true;
    }
    els.push(el); out.push({ key: keyOf(el), tag: el.tagName.toLowerCase(), text: own.slice(0, 70), size: Math.round(size * 100) / 100, css: parseFloat(s.fontSize), weight: Number(s.fontWeight), mono: /mono/i.test(s.fontFamily), ls: s.letterSpacing, tt: s.textTransform, contrast: Math.round(contrast * 100) / 100, opacity: Math.round(op * 100) / 100, clipped, rects, box: [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)] });
  }
  // Visible extent of each run: its text rects cut to every clipping ancestor.
  const visibleRects = (el, rects) => {
    let rs = rects.map(r => [...r]);
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      const cs = getComputedStyle(e); if (cs.overflowX === "visible" && cs.overflowY === "visible") continue;
      const b = e.getBoundingClientRect(); rs = rs.map(r => [Math.max(r[0], b.left), Math.max(r[1], b.top), Math.min(r[2], b.right), Math.min(r[3], b.bottom)]).filter(r => r[2] - r[0] > 1 && r[3] - r[1] > 1);
    }
    return rs;
  };
  const related = (a, b) => a === b || a.contains(b) || b.contains(a);
  // Seen at a point: no unrelated, painted surface lies above the run's element there.
  const seenAt = (el, x, y) => {
    for (const top of document.elementsFromPoint(x, y)) {
      if (related(top, el)) return true;
      const cs = getComputedStyle(top); const bg = cs.backgroundColor.match(/rgba?\(([^)]+)\)/); const alpha = bg ? (bg[1].split(/[ ,\/]+/).filter(Boolean).map(Number)[3] ?? 1) : 0;
      if (alpha >= 0.5 || cs.backgroundImage !== "none" || cs.backdropFilter !== "none") return false;
    }
    return true;
  };
  const vis = out.map((it, i) => visibleRects(els[i], it.rects));
  const collisions = [];
  for (let i = 0; i < out.length; i += 1) for (let j = i + 1; j < out.length; j += 1) {
    if (out[i].opacity < 0.5 || out[j].opacity < 0.5 || related(els[i], els[j])) continue;
    let hit = null;
    for (const a of vis[i]) { for (const b of vis[j]) { const w = Math.min(a[2], b[2]) - Math.max(a[0], b[0]), h = Math.min(a[3], b[3]) - Math.max(a[1], b[1]); if (w > 2 && h > 2 && w * h > 6) { hit = [Math.max(a[0], b[0]) + w / 2, Math.max(a[1], b[1]) + h / 2, Math.round(w * h)]; break; } } if (hit) break; }
    if (hit && seenAt(els[i], hit[0], hit[1]) && seenAt(els[j], hit[0], hit[1])) collisions.push({ a: out[i].key, at: out[i].text.slice(0, 40), b: out[j].key, bt: out[j].text.slice(0, 40), area: hit[2] });
  }
  return { url: location.href, w: W, h: H, items: out, collisions };
});
