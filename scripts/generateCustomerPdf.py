#!/usr/bin/env python3
import os, sys, mistune, re
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

BLUE_PRIMARY = colors.HexColor("#1565C0")
BLUE_DARK    = colors.HexColor("#0D47A1")
BLUE_LIGHT   = colors.HexColor("#42A5F5")
BLUE_FAINT   = colors.HexColor("#E3F0FF")
WHITE        = colors.white
NEAR_BLACK   = colors.HexColor("#1A1A2E")
GREY_TEXT    = colors.HexColor("#334155")
GREY_BORDER  = colors.HexColor("#DBEAFE")
W, H = A4
MARGIN = 42.5

def draw_system_grid(c):
    """Systemisches Hintergrundmuster — läuft durch ALLE Seiten, fast unsichtbar"""
    c.saveState()
    # Horizontale Basislinien (Seitenmatrix)
    c.setStrokeColor(BLUE_PRIMARY)
    c.setLineWidth(0.3)
    density = 14
    for i in range(density + 1):
        fy = (H / density) * i
        alpha = 0.04 + 0.015 * abs((i - density/2) / (density/2))
        c.setStrokeAlpha(alpha)
        c.line(0, fy, W, fy)

    # Diagonale Spannungslinien (diagonal ≠ horizontal = Spannung laut SA)
    c.setLineWidth(0.2)
    c.setStrokeAlpha(0.025)
    for i in range(18):
        fx = (W / 16) * i
        c.line(fx, 0, fx - H * 0.3, H)

    # Knotenpunkte (Verdichtungsmarker — sehr dezent)
    c.setFillColor(BLUE_PRIMARY)
    c.setStrokeColor(BLUE_PRIMARY)
    c.setLineWidth(0.3)
    for i in range(5):
        for j in range(7):
            nx = MARGIN + (W - 2*MARGIN) / 4 * i
            ny = 60 + (H - 120) / 6 * j
            c.setFillAlpha(0.06)
            c.setStrokeAlpha(0.08)
            c.circle(nx, ny, 1.8, stroke=1, fill=1)

    # Vertikale Strukturlinie links (QR7D-Sieben — durchgehend)
    c.setStrokeColor(BLUE_DARK)
    c.setLineWidth(0.4)
    c.setStrokeAlpha(0.06)
    c.line(MARGIN - 8, 60, MARGIN - 8, H - 80)

    c.restoreState()

def draw_cover(c, doc):
    c.saveState()
    c.setFillColor(colors.HexColor("#F8FAFF"))
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.restoreState()

    # Systemisches Muster — Cover stärker sichtbar
    draw_system_grid(c)

    c.saveState()
    # Obere Linie
    c.setStrokeColor(BLUE_DARK)
    c.setLineWidth(3)
    c.setStrokeAlpha(1)
    c.line(MARGIN, H - 28, W - MARGIN, H - 28)

    # Untere Linie
    c.setStrokeColor(BLUE_PRIMARY)
    c.setLineWidth(1.2)
    c.setStrokeAlpha(1)
    c.line(MARGIN, 44, W - MARGIN, 44)

    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(BLUE_PRIMARY)
    c.setFillAlpha(1)
    c.drawCentredString(W / 2, 30, "condyn.eu — CONFIDENTIAL DOCUMENT")

    # === LOGO RUND ===
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    logo_path = os.path.join(base_dir, "public", "logo.jpeg")
    logo_size = 120
    logo_x = (W - logo_size) / 2
    logo_y = H * 0.55
    cx, cy = W / 2, logo_y + logo_size / 2
    r = logo_size / 2

    c.setFillColor(WHITE)
    c.setStrokeColor(BLUE_DARK)
    c.setLineWidth(2)
    c.setFillAlpha(1)
    c.setStrokeAlpha(1)
    c.circle(cx, cy, r + 10, stroke=1, fill=1)

    if os.path.exists(logo_path):
        try:
            p = c.beginPath()
            p.circle(cx, cy, r)
            c.clipPath(p, stroke=0, fill=0)
            c.drawImage(logo_path, logo_x, logo_y, width=logo_size, height=logo_size, mask='auto')
        except:
            pass

    c.restoreState()
    c.saveState()

    c.setStrokeColor(BLUE_LIGHT)
    c.setLineWidth(0.5)
    c.setStrokeAlpha(0.25)
    c.setFillAlpha(0)
    c.circle(cx, cy, r + 22, stroke=1, fill=0)
    c.circle(cx, cy, r + 38, stroke=1, fill=0)

    # Titel
    c.setFillColor(NEAR_BLACK)
    c.setFillAlpha(1)
    c.setFont("Helvetica-Bold", 26)
    c.drawCentredString(W / 2, logo_y - 36, "CONNECTION DYNAMICS")

    c.setFont("Helvetica-Bold", 9.5)
    c.setFillColor(BLUE_PRIMARY)
    c.drawCentredString(W / 2, logo_y - 52, "STRUCTURAL ANALYZER // CONDYN / SYNTX RUNTIME")

    c.setStrokeColor(BLUE_PRIMARY)
    c.setLineWidth(1)
    c.setStrokeAlpha(1)
    c.line(W / 2 - 50, logo_y - 62, W / 2 + 50, logo_y - 62)

    today = datetime.now().strftime("%d. %B %Y")
    c.setFont("Helvetica", 9)
    c.setFillColor(GREY_TEXT)
    c.drawCentredString(W / 2, logo_y - 80, today)

    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(BLUE_PRIMARY)
    c.drawCentredString(W / 2, logo_y - 95, "condyn.eu")

    # Info-Blöcke
    block_y = 115
    blocks = [
        ("SYSTEM", ["Connection Dynamics", "Analyzer Runtime"]),
        ("KLASSIFIKATION", ["Vertraulich", "Nur autorisierte", "Empfaenger"]),
        ("AUSGABE", [today, "condyn.eu"]),
    ]
    bw = (W - 2 * MARGIN - 20) / 3
    for i, (label, lines_) in enumerate(blocks):
        bx = MARGIN + i * (bw + 10)
        c.setFillColor(BLUE_FAINT)
        c.setStrokeColor(BLUE_PRIMARY)
        c.setLineWidth(0.5)
        c.setFillAlpha(1)
        c.setStrokeAlpha(0.4)
        c.rect(bx, block_y, bw, 58, fill=1, stroke=1)
        # Blauer Akzentstreifen oben
        c.setFillColor(BLUE_DARK)
        c.setFillAlpha(1)
        c.rect(bx, block_y + 46, bw, 12, fill=1, stroke=0)
        c.setFont("Helvetica-Bold", 7)
        c.setFillColor(WHITE)
        c.drawString(bx + 8, block_y + 49, label)
        c.setFont("Helvetica", 8)
        c.setFillColor(GREY_TEXT)
        for j, tl in enumerate(lines_):
            c.drawString(bx + 8, block_y + 34 - j * 11, tl)

    c.restoreState()

def draw_content(c, doc, page_num, page_count):
    # Systemisches Muster — Content-Seiten sehr dezent
    draw_system_grid(c)

    c.saveState()

    # === NEUER HEADER-BALKEN ===
    header_h = 38
    header_y = H - header_h - 22

    # Dunkelblauer Hauptbalken
    c.setFillColor(BLUE_DARK)
    c.setFillAlpha(1)
    c.rect(MARGIN, header_y, W - 2*MARGIN, header_h, fill=1, stroke=0)

    # Hellblauer Akzentstreifen unten am Balken
    c.setFillColor(BLUE_PRIMARY)
    c.rect(MARGIN, header_y, W - 2*MARGIN, 3, fill=1, stroke=0)

    # Header Text WEISS gross
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(MARGIN + 12, header_y + 22, "CONDYN / SYNTX RUNTIME")

    c.setFont("Helvetica-Bold", 7)
    c.setFillColor(BLUE_LIGHT)
    c.drawString(MARGIN + 12, header_y + 10, "HIGH-VELOCITY INSTITUTIONAL ENGINE // AUTOMATED CLIENT DELIVERY")

    # Logo im Balken rechts
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    logo_path = os.path.join(base_dir, "public", "logo.jpeg")
    if os.path.exists(logo_path):
        try:
            c.drawImage(logo_path, W - MARGIN - 38, header_y + 2, width=34, height=34, mask='auto')
        except:
            pass

    # Obere Trennlinie
    c.setStrokeColor(BLUE_DARK)
    c.setLineWidth(1)
    c.setStrokeAlpha(1)
    c.line(MARGIN, header_y + header_h, W - MARGIN, header_y + header_h)

    # Footer
    c.setStrokeColor(BLUE_PRIMARY)
    c.setLineWidth(0.8)
    c.line(MARGIN, 42, W - MARGIN, 42)
    c.setFont("Helvetica-Bold", 6.5)
    c.setFillColor(BLUE_PRIMARY)
    c.drawString(MARGIN, 30, "CLASSIFICATION: CONFIDENTIAL // condyn.eu")
    c.setFillColor(colors.HexColor("#94a3b8"))
    c.drawRightString(W - MARGIN, 30, f"CONDYN // SYNTX // PAGE {page_num} OF {page_count}")

    c.restoreState()

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []
    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()
    def save(self):
        n = len(self._saved_page_states)
        for i, state in enumerate(self._saved_page_states):
            self.__dict__.update(state)
            if i == 0:
                draw_cover(self, None)
            else:
                draw_content(self, None, i, n - 1)
            super().showPage()
        super().save()

def clean(html):
    t = html.replace("<p>", "").replace("</p>", "<br/><br/>")
    t = t.replace("<strong>", "<b>").replace("</strong>", "</b>")
    t = t.replace("<em>", "<i>").replace("</em>", "</i>")
    t = t.replace("<ul>", "").replace("</ul>", "")
    t = t.replace("<li>", " • ").replace("</li>", "<br/>")
    t = re.sub(r'<span[^>]*>', '', t).replace("</span>", "")
    t = re.sub(r'<div[^>]*>', '', t).replace("</div>", "")
    return t.strip()

def build_table(raw_data, hs, cs):
    fd = [[Paragraph(clean(cell), hs) for cell in raw_data[0]]]
    for row in raw_data[1:]:
        fd.append([Paragraph(clean(mistune.html(cell)), cs) for cell in row])
    cw = (W - 2 * MARGIN) / len(raw_data[0])
    t = Table(fd, colWidths=[cw] * len(raw_data[0]))
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), BLUE_DARK),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 9),
        ('GRID', (0,0), (-1,-1), 0.4, GREY_BORDER),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, BLUE_FAINT]),
        ('LINEBELOW', (0,0), (-1,0), 2, BLUE_PRIMARY),
        ('TEXTCOLOR', (0,0), (-1,0), WHITE),
    ]))
    return t

DISCLAIMER_MD = """---
## Systemhinweis und Datenschutzerklarung

**Connection Dynamics Analyzer — CONDYN / SYNTX**

Dieses Dokument wurde automatisiert durch das CONDYN Structural Analyzer System generiert und enthaelt ausschliesslich strukturelle, systemische und organisationale Analysedaten.

**Keine Personenanalyse.** Das CONDYN-System analysiert ausschliesslich Kommunikationsmuster, Systemstrukturen und relationale Dynamiken auf organisationaler Ebene. Es werden zu keinem Zeitpunkt personenbezogene Daten im Sinne der DSGVO (EU) 2016/679 erhoben, verarbeitet oder bewertet. Individuelle Personen sind niemals Gegenstand der Analyse.

**Vertraulichkeit.** Dieses Dokument ist ausschliesslich fuer autorisierte Empfaenger bestimmt. Jede unbefugte Weitergabe, Vervielfaeltigung oder Nutzung ist untersagt.

**Haftungsausschluss.** Die enthaltenen Analysen stellen keine rechtliche, medizinische oder psychologische Beurteilung dar. CONDYN / SYNTX uebernimmt keine Haftung fuer Entscheidungen auf Basis dieser Systemausgabe.

(c) CONDYN / SYNTX Runtime — condyn.eu
"""

def generate_customer_pdf(src, out="customer_output.pdf"):
    md = open(src).read() if os.path.exists(src) else src
    md_full = md.strip() + "\n" + DISCLAIMER_MD

    doc = SimpleDocTemplate(out, pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN, topMargin=100, bottomMargin=65)
    s = getSampleStyleSheet()
    body = ParagraphStyle('B', parent=s['Normal'], fontName='Helvetica', fontSize=10, leading=15, textColor=GREY_TEXT, spaceAfter=10)
    h1   = ParagraphStyle('H1', fontName='Helvetica-Bold', fontSize=20, leading=25, textColor=NEAR_BLACK, spaceAfter=8, alignment=1)
    h2   = ParagraphStyle('H2', fontName='Helvetica-Bold', fontSize=13, leading=16, textColor=NEAR_BLACK, spaceBefore=20, spaceAfter=8, keepWithNext=True)
    h3   = ParagraphStyle('H3', fontName='Helvetica-Bold', fontSize=10.5, leading=13, textColor=BLUE_PRIMARY, spaceBefore=12, spaceAfter=6, keepWithNext=True)
    disc = ParagraphStyle('D', fontName='Helvetica', fontSize=8.5, leading=12.5, textColor=GREY_TEXT, spaceAfter=6)
    th   = ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=9, leading=11, textColor=WHITE)
    tc   = ParagraphStyle('TC', fontName='Helvetica', fontSize=9.5, leading=13, textColor=GREY_TEXT)

    story = [PageBreak()]
    lines = md_full.strip().split('\n')
    in_table, table_data = False, []
    in_disc = False

    for line in lines:
        s2 = line.strip()
        if s2 == "---":
            if in_table and table_data:
                story += [build_table(table_data, th, tc), Spacer(1, 14)]
                in_table, table_data = False, []
            story.append(PageBreak())
            in_disc = True
            continue
        if not s2:
            if in_table and table_data:
                story += [build_table(table_data, th, tc), Spacer(1, 14)]
                in_table, table_data = False, []
            continue
        if s2.startswith("# "):
            story.append(Paragraph(clean(s2[2:]), h1))
            continue
        if s2.startswith("## "):
            if in_table and table_data:
                story += [build_table(table_data, th, tc), Spacer(1, 14)]
                in_table, table_data = False, []
            story.append(Paragraph(clean(s2[3:]), h2))
            continue
        if s2.startswith("### "):
            story.append(Paragraph(clean(s2[4:]), h3))
            continue
        if s2.startswith("|"):
            in_table = True
            if "---" in s2: continue
            table_data.append([c.strip() for c in s2.split("|")[1:-1]])
            continue
        else:
            if in_table and table_data:
                story += [build_table(table_data, th, tc), Spacer(1, 14)]
                in_table, table_data = False, []
        cl = clean(mistune.html(line))
        if cl:
            story.append(Paragraph(cl, disc if in_disc else body))

    if in_table and table_data:
        story += [build_table(table_data, th, tc), Spacer(1, 14)]

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[SUCCESS] Corporate White ReportLab PDF compiled: {out}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        generate_customer_pdf(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else "customer_output.pdf")
    else:
        generate_customer_pdf("""# Connection Dynamics Analyse

## 1.0 Systemstruktur
Dieses Dokument definiert die operativen Grenzen der Client-Infrastruktur.

## 2.0 Strategische Architektur

| Phase | Ziel | Parameter |
|---|---|---|
| STAGE_01 | Baseline Analyse | 5.000 EUR |
| STAGE_02 | Topology Deployment | 25.000 EUR |
| STAGE_03 | Runtime Integration | 12.000 EUR |

## 3.0 Prozessanzeige
Alle Knotenpunkte sind strukturell gekoppelt. Drift wird kontinuierlich gemessen.
""", "CONDYN_ReportLab_Showcase.pdf")
