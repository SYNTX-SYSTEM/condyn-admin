#!/usr/bin/env python3
import os
import sys
import mistune
import re
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas
from reportlab.graphics.shapes import Drawing, Line, Circle

# --- CUSTOM CANVAS FOR RUNTIME HEADERS & FOOTERS ---
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        width, height = A4
        margin_x = 42.5  # ~15mm Margins
        
        # Running Header Line (Corporate Blue)
        self.setStrokeColor(colors.HexColor("#2563eb"))
        self.setLineWidth(2)
        self.line(margin_x, height - 65, width - margin_x, height - 65)
        
        # Header Text Left
        self.setFont("Helvetica-Bold", 14)
        self.setFillColor(colors.HexColor("#0f172a"))
        self.drawString(margin_x, height - 50, "CONDYN / SYNTX RUNTIME")
        
        # Header Text Subtitle
        self.setFont("Helvetica-Bold", 7.5)
        self.setFillColor(colors.HexColor("#2563eb"))
        self.drawString(margin_x, height - 60, "HIGH-VELOCITY INSTITUTIONAL ENGINE // AUTOMATED CLIENT DELIVERY")
        
        # Dynamic Local Logo Embed
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        logo_path = os.path.join(base_dir, "public", "logo.jpeg")
        if os.path.exists(logo_path):
            try:
                self.drawImage(logo_path, width - margin_x - 45, height - 60, width=42, height=42, mask='auto')
            except:
                pass

        # Running Footer Text Left
        self.setFont("Helvetica-Bold", 7.5)
        self.setFillColor(colors.HexColor("#2563eb"))
        self.drawString(margin_x, 35, "CLASSIFICATION: CONFIDENTIAL // ADMIN INTERFACE: admin.condyn.eu")
        
        # Running Footer Text Right (Dynamic Page Counting)
        self.setFont("Helvetica-Bold", 7.5)
        self.setFillColor(colors.HexColor("#94a3b8"))
        page_str = f"CONDYN // SYNTX MASTER RUNTIME // PAGE {self._pageNumber} OF {page_count}"
        self.drawRightString(width - margin_x, 35, page_str)
        
        self.restoreState()


# --- RIGOROUS TAG VALIDATOR & CLEANER FOR REPORTLAB ---
def validate_and_clean_tags(html_text):
    """
    Translates Markdown HTML elements into strict, valid ReportLab XML tags.
    Strips raw block tags like <p>, <ul>, <span> to prevent ReportLab parsing crashes.
    """
    # 1. Strip raw paragraph blocks but keep double breaks for spacing
    text = html_text.replace("<p>", "").replace("</p>", "<br/><br/>")
    
    # 2. Map standard text modifiers to strict ReportLab XML tags
    text = text.replace("<strong>", "<b>").replace("</strong>", "</b>")
    text = text.replace("<em>", "<i>").replace("</em>", "</i>")
    
    # 3. Clean list elements natively for flowables
    text = text.replace("<ul>", "").replace("</ul>", "")
    text = text.replace("<li>", " &bull; ").replace("</li>", "<br/>")
    
    # 4. Strip unsupported inline tags like specific span classes or divs to ensure absolute structural safety
    text = re.sub(r'<span[^>]*>', '', text)
    text = text.replace("</span>", "")
    text = re.sub(r'<div[^>]*>', '', text)
    text = text.replace("</div>", "")
    
    return text.strip()


# --- NATIVE BLUE NEURAL NETWORK GRAPH GRAPHIC ---
def create_neural_network_drawing():
    d = Drawing(510, 80)
    d.add(Line(0, 0, 510, 0, strokeColor=colors.HexColor("#e2e8f0"), strokeWidth=0.5))
    
    layer1 = [(30, 15), (30, 40), (30, 65)]
    layer2 = [(160, 20), (160, 60)]
    layer3 = [(320, 15), (320, 65)]
    layer4 = [(470, 40)]
    
    for n1 in layer1:
        for n2 in layer2:
            d.add(Line(n1[0], n1[1], n2[0], n2[1], strokeColor=colors.HexColor("#93c5fd"), strokeWidth=0.6))
    for n2 in layer2:
        for n3 in layer3:
            d.add(Line(n2[0], n2[1], n3[0], n3[1], strokeColor=colors.HexColor("#60a5fa"), strokeWidth=0.6))
    for n3 in layer3:
        for n4 in layer4:
            d.add(Line(n3[0], n3[1], n4[0], n4[1], strokeColor=colors.HexColor("#2563eb"), strokeWidth=0.9))
            
    for n in layer1: d.add(Circle(n[0], n[1], 3.5, fillColor=colors.HexColor("#38bdf8"), strokeColor=colors.HexColor("#1e3a8a"), strokeWidth=0.8))
    for n in layer2: d.add(Circle(n[0], n[1], 4, fillColor=colors.HexColor("#2563eb"), strokeColor=colors.HexColor("#1e3a8a"), strokeWidth=0.8))
    for n in layer3: d.add(Circle(n[0], n[1], 4, fillColor=colors.HexColor("#1d4ed8"), strokeColor=colors.HexColor("#0f172a"), strokeWidth=0.8))
    for n in layer4: d.add(Circle(n[0], n[1], 5, fillColor=colors.HexColor("#0369a1"), strokeColor=colors.HexColor("#0f172a"), strokeWidth=1.2))
    
    return d


def build_table_flowable(raw_data, header_style, cell_style):
    formatted_data = []
    # Build strict header row
    formatted_data.append([Paragraph(validate_and_clean_tags(cell), header_style) for cell in raw_data[0]])
    # Build strict validated data rows
    for row in raw_data[1:]:
        formatted_data.append([Paragraph(validate_and_clean_tags(mistune.html(cell)), cell_style) for cell in row])
        
    t = Table(formatted_data, colWidths=[110, 130, 270])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1e3a8a")),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,0), 8),
        ('TOPPADDING', (0,0), (-1,0), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('TOPPADDING', (0,1), (-1,-1), 8),
        ('BOTTOMPADDING', (0,1), (-1,-1), 8),
    ]))
    return t


# --- MAIN PDF COMPILATION ENGINE ---
def generate_customer_pdf(markdown_source, output_pdf_path="customer_output.pdf"):
    if os.path.exists(markdown_source):
        with open(markdown_source, "r", encoding="utf-8") as f:
            markdown_text = f.read()
    else:
        markdown_text = markdown_source

    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=A4,
        leftMargin=42.5, rightMargin=42.5,
        topMargin=85, bottomMargin=60
    )
    
    styles = getSampleStyleSheet()
    
    # Typography Setup
    body_style = ParagraphStyle(
        'ClientBody', parent=styles['Normal'],
        fontName='Helvetica', fontSize=10, leading=14.5,
        textColor=colors.HexColor("#334155"), spaceAfter=10
    )
    
    h2_style = ParagraphStyle(
        'ClientH2', parent=styles['Heading2'],
        fontName='Helvetica-Bold', fontSize=13, leading=16,
        textColor=colors.HexColor("#0f172a"), spaceBefore=18, spaceAfter=8,
        keepWithNext=True
    )
    
    table_header_style = ParagraphStyle(
        'TableHeader', fontName='Helvetica-Bold', fontSize=9, leading=11,
        textColor=colors.white
    )
    
    table_cell_style = ParagraphStyle(
        'TableCell', fontName='Helvetica', fontSize=9.5, leading=13,
        textColor=colors.HexColor("#334155")
    )

    disclaimer_title_style = ParagraphStyle(
        'DiscTitle', fontName='Helvetica-Bold', fontSize=9.5, leading=12,
        textColor=colors.HexColor("#9f1239"), spaceAfter=6
    )

    disclaimer_text_style = ParagraphStyle(
        'DiscText', fontName='Helvetica', fontSize=8.5, leading=12,
        textColor=colors.HexColor("#4c0519")
    )

    story = []
    
    # Add top structural element
    story.append(create_neural_network_drawing())
    story.append(Spacer(1, 15))

    lines = markdown_text.strip().split('\n')
    in_table = False
    table_data = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
            
        if stripped.startswith("##"):
            if in_table and table_data:
                story.append(build_table_flowable(table_data, table_header_style, table_cell_style))
                story.append(Spacer(1, 12))
                table_data = []
                in_table = False
                
            header_text = stripped.lstrip('#').strip()
            story.append(Paragraph(validate_and_clean_tags(header_text), h2_style))
            continue
            
        if stripped.startswith("|"):
            in_table = True
            if "---" in stripped:
                continue
            cells = [c.strip() for c in stripped.split("|")[1:-1]]
            table_data.append(cells)
            continue
        else:
            if in_table and table_data:
                story.append(build_table_flowable(table_data, table_header_style, table_cell_style))
                story.append(Spacer(1, 12))
                table_data = []
                in_table = False

        raw_html = mistune.html(line)
        cleaned_text = validate_and_clean_tags(raw_html)
        if cleaned_text.strip():
            story.append(Paragraph(cleaned_text, body_style))

    if in_table and table_data:
        story.append(build_table_flowable(table_data, table_header_style, table_cell_style))
        story.append(Spacer(1, 12))

    # Absolute System Disclaimer
    disclaimer_elements = [
        Spacer(1, 10),
        Paragraph("⚠️ ENHANCED SYSTEMIC & STRATEGIC DISCLOSURE PROTOCOL", disclaimer_title_style),
        Paragraph(
            "<b>CONFIDENTIALITY, PROPRIETARY RIGHTS, AND LIABILITY LIMITATION MANIFESTO:</b> "
            "This operational manual, architectural framework, and the associated business blueprints constitute an entirely enclosed, "
            "highly proprietary system designed exclusively for the CONDYN/SYNTX enterprise network. Any unauthorized extraction, duplication, "
            "republication, or structural exploitation of these text segments, resource allocation patterns, or role-dependency matrix tables "
            "is strictly prohibited under global copyright statutes and systemic code governance rules. All calculated performance indicators, "
            "financial parameters, and methodology workflows are optimized for elite-level executive implementation and do not guarantee uniform "
            "commercial outperformance without the continuous input of high-intensity cognitive and structural energy. This framework functions "
            "strictly under an absolute zero-drift mandate; any unapproved operational variance from designated role boundaries or time-allocation "
            "thresholds introduces immediate risk of localized systemic breakdown. The architectural authors, developers, and corporate entities "
            "associated with CONDYN/SYNTX accept zero civil or structural liability for damages, operational disruptions, or asset loss stemming "
            "from undisciplined execution or deviation from the instructions outlined herein. Run with absolute precision.", 
            disclaimer_text_style
        )
    ]
    
    disclaimer_table = Table([[disclaimer_elements]], colWidths=[510])
    disclaimer_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#fff1f2")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#f43f5e")),
        ('PADDING', (0,0), (-1,-1), 14),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    
    story.append(KeepTogether([disclaimer_table]))
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[SUCCESS] Corporate White ReportLab PDF compiled: {output_pdf_path}")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        target_input = sys.argv[1]
        output_name = sys.argv[2] if len(sys.argv) > 2 else "customer_output.pdf"
        generate_customer_pdf(target_input, output_name)
    else:
        demo_md = """
## 1.0 Runtime Operations Target
This document defines the raw operational boundaries calculated for the client infrastructure setup.

## 2.0 Strategic Pricing Architecture
The execution models map out exactly to the target brackets defined in the system runtime.

| Step ID | Operational Target Block | Financial Architecture |
| STAGE_01 | **Baseline Analysis Audit** | €5,000 |
| STAGE_02 | **Full Topology Deployment** | €25,000 |
"""
        generate_customer_pdf(demo_md, "CONDYN_ReportLab_Showcase.pdf")
