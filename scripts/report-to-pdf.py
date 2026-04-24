#!/usr/bin/env python3
"""
Generate the SGSITS project-report PDF for DASHH (2025-26).

Fills in every placeholder from the Google-Doc review: fixes the typo
roll numbers, replaces the placeholder Symbols/Abbreviations with the
real DASHH-specific ones, restores the truncated Chapter 4 ending,
adds the missing Scope-of-Future-Work section, cleans the test-cases
table, and adds the missing features (fee, payout models, 13-rule
disqualification pipeline, 3-strike ban policy, SIWS, mode system).

Output: /Users/vedantsingh/Documents/Projects/Dashh/major-project-/docs/PROJECT_REPORT.pdf
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, inch
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    PageBreak,
    Table,
    TableStyle,
    KeepTogether,
    ListFlowable,
    ListItem,
)

# ───────────────────────── Theme ─────────────────────────

PURPLE = colors.HexColor("#9945FF")
MINT = colors.HexColor("#14F195")
DARK = colors.HexColor("#0a0a0a")
INK = colors.HexColor("#111827")
MUTED = colors.HexColor("#6b7280")
RULE = colors.HexColor("#d1d5db")
BG_LIGHT = colors.HexColor("#f9fafb")

styles = getSampleStyleSheet()

COVER_TITLE = ParagraphStyle(
    "CoverTitle", parent=styles["Title"], fontName="Helvetica-Bold",
    fontSize=22, leading=28, alignment=TA_CENTER, textColor=INK, spaceAfter=10,
)
COVER_SUB = ParagraphStyle(
    "CoverSub", parent=styles["Normal"], fontName="Helvetica",
    fontSize=13, leading=18, alignment=TA_CENTER, textColor=INK, spaceAfter=4,
)
COVER_ITALIC = ParagraphStyle(
    "CoverItalic", parent=styles["Normal"], fontName="Helvetica-Oblique",
    fontSize=11, leading=16, alignment=TA_CENTER, textColor=INK, spaceAfter=2,
)
COVER_BOLD = ParagraphStyle(
    "CoverBold", parent=styles["Normal"], fontName="Helvetica-Bold",
    fontSize=12, leading=16, alignment=TA_CENTER, textColor=INK, spaceAfter=2,
)
COVER_SMALL = ParagraphStyle(
    "CoverSmall", parent=styles["Normal"], fontName="Helvetica",
    fontSize=10, leading=14, alignment=TA_CENTER, textColor=INK,
)
H1 = ParagraphStyle(
    "H1", parent=styles["Heading1"], fontName="Helvetica-Bold",
    fontSize=18, leading=22, textColor=PURPLE, spaceBefore=10, spaceAfter=12,
)
H2 = ParagraphStyle(
    "H2", parent=styles["Heading2"], fontName="Helvetica-Bold",
    fontSize=14, leading=18, textColor=INK, spaceBefore=14, spaceAfter=8,
)
H3 = ParagraphStyle(
    "H3", parent=styles["Heading3"], fontName="Helvetica-Bold",
    fontSize=12, leading=16, textColor=INK, spaceBefore=10, spaceAfter=6,
)
BODY = ParagraphStyle(
    "Body", parent=styles["BodyText"], fontName="Helvetica",
    fontSize=11, leading=16, alignment=TA_JUSTIFY, textColor=INK, spaceAfter=8,
)
BULLET = ParagraphStyle(
    "Bullet", parent=BODY, leftIndent=14, bulletIndent=2, spaceAfter=4,
)
CENTER = ParagraphStyle(
    "Center", parent=BODY, alignment=TA_CENTER,
)
CAPTION = ParagraphStyle(
    "Caption", parent=styles["Normal"], fontName="Helvetica-Oblique",
    fontSize=9, leading=12, alignment=TA_CENTER, textColor=MUTED, spaceAfter=8,
)
TOC_ROW = ParagraphStyle(
    "TOCRow", parent=styles["Normal"], fontName="Helvetica",
    fontSize=11, leading=18, textColor=INK,
)

# ───────────────────────── Page footer + top-accent ─────────────────────────

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved = []

    def showPage(self):
        self._saved.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        total = len(self._saved)
        for state in self._saved:
            self.__dict__.update(state)
            self._draw_accents(total)
            super().showPage()
        super().save()

    def _draw_accents(self, total):
        w, h = A4
        # top accent bar
        self.setFillColor(PURPLE)
        self.rect(0, h - 0.3 * cm, w / 2, 0.3 * cm, fill=1, stroke=0)
        self.setFillColor(MINT)
        self.rect(w / 2, h - 0.3 * cm, w / 2, 0.3 * cm, fill=1, stroke=0)
        # footer
        if self._pageNumber > 1:
            self.setFont("Helvetica", 8)
            self.setFillColor(MUTED)
            self.drawString(
                2 * cm, 1.2 * cm,
                "DASHH \u2014 On-Chain Advertising Platform",
            )
            self.drawRightString(
                w - 2 * cm, 1.2 * cm, f"Page {self._pageNumber - 1} of {total - 1}",
            )


# ───────────────────────── Constants ─────────────────────────

TITLE = "DASHH — A Peer-to-Peer, zkTLS-Verified On-Chain Advertising Platform"
SHORT = "DASHH — On-Chain Advertising Platform"
SESSION = "2025–26"
INSTITUTE = "Shri Govindram Seksaria Institute of Technology and Science, Indore (M.P.)"
UNIVERSITY = "Rajiv Gandhi Proudyogiki Vishwavidyalaya, Bhopal"
DEPT = "Department of Computer Engineering"
GUIDE = "Ms. Ritambhara Patidar"
COGUIDE = "Ms. Mamta Gupta"
HOD = "Prof. Surendra Gupta"

STUDENTS = [
    ("Saksham Vyalsa",    "0801CS231117"),
    ("Sanjeet Kumar",     "0801CS231122"),
    ("Vedant Singh",      "0801CS231156"),
    ("Vivek Bharti",      "0801CS231162"),
    ("Yatharth Urmaliya", "0801CS231165"),
]

# ───────────────────────── Builders ─────────────────────────

def spacer(h):
    return Spacer(1, h)


def hr():
    return Table(
        [[""]],
        colWidths=[16 * cm],
        style=TableStyle([("LINEBELOW", (0, 0), (-1, -1), 0.5, RULE)]),
    )


def student_list_compact():
    """Cover-page student list with consistent numbering 1–5."""
    rows = []
    for i, (name, roll) in enumerate(STUDENTS, start=1):
        rows.append([f"{i}.", Paragraph(f"<b>{name}</b>", COVER_SMALL), roll])
    t = Table(rows, colWidths=[1 * cm, 6 * cm, 4.5 * cm])
    t.setStyle(TableStyle([
        ("FONT", (0, 0), (-1, -1), "Helvetica", 11),
        ("TEXTCOLOR", (0, 0), (-1, -1), INK),
        ("ALIGN", (0, 0), (0, -1), "RIGHT"),
        ("ALIGN", (2, 0), (2, -1), "LEFT"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    return t


def build_cover(story):
    story.append(spacer(1.5 * cm))
    story.append(Paragraph(TITLE, COVER_TITLE))
    story.append(spacer(0.5 * cm))
    story.append(Paragraph("<i>A Project Report Submitted to</i>", COVER_ITALIC))
    story.append(Paragraph(
        f"<i>{UNIVERSITY} towards the partial fulfilment of the degree of</i>",
        COVER_ITALIC,
    ))
    story.append(spacer(0.3 * cm))
    story.append(Paragraph("<b>Bachelor of Technology (Computer Science &amp; Engineering)</b>", COVER_SUB))
    story.append(spacer(1.2 * cm))

    # Guide / Submitted by header row
    header = Table(
        [[Paragraph("<b>Project Guide:</b>", COVER_SMALL),
          Paragraph("<b>Submitted by:</b>", COVER_SMALL)]],
        colWidths=[7 * cm, 8.5 * cm],
    )
    header.setStyle(TableStyle([("ALIGN", (0, 0), (-1, -1), "CENTER")]))
    story.append(header)
    story.append(spacer(0.2 * cm))

    guide_col = [
        Paragraph(GUIDE, COVER_SMALL),
        Paragraph("Assistant Professor", COVER_SMALL),
        Paragraph(f"({DEPT})", COVER_SMALL),
    ]
    students_col = [student_list_compact()]

    main_row = Table(
        [[guide_col, students_col]],
        colWidths=[7 * cm, 8.5 * cm],
    )
    main_row.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(main_row)
    story.append(spacer(0.8 * cm))

    story.append(Paragraph("<b>Project Co-Guide:</b>", COVER_SMALL))
    story.append(Paragraph(COGUIDE, COVER_SMALL))
    story.append(Paragraph("Assistant Professor", COVER_SMALL))
    story.append(Paragraph(f"({DEPT})", COVER_SMALL))
    story.append(spacer(1.5 * cm))

    story.append(Paragraph(f"<b>{DEPT.upper()}</b>", COVER_SUB))
    story.append(Paragraph(f"<b>{INSTITUTE}</b>", COVER_SMALL))
    story.append(spacer(0.3 * cm))
    story.append(Paragraph(f"<b>[SESSION {SESSION}]</b>", COVER_SUB))
    story.append(PageBreak())


def build_institute_header(story):
    story.append(Paragraph(f"<b>{INSTITUTE}</b>", CENTER))
    story.append(Paragraph("<i>A Govt. Aided Autonomous Institute, Affiliated to RGPV, Bhopal</i>", CAPTION))
    story.append(Paragraph(f"<b>{DEPT.upper()}</b>", CENTER))
    story.append(spacer(0.4 * cm))
    story.append(hr())
    story.append(spacer(0.6 * cm))


def build_recommendation(story):
    build_institute_header(story)
    story.append(Paragraph("<b>RECOMMENDATION</b>", COVER_TITLE))
    story.append(spacer(0.5 * cm))

    names_with_rolls = ", ".join([f"{n} ({r})" for n, r in STUDENTS])
    body = (
        f"We are pleased to recommend that the project report entitled "
        f"<b>{TITLE}</b>, submitted by <b>{names_with_rolls}</b>, students of "
        f"<b>B.Tech III Year (Computer Science &amp; Engineering)</b>, may be accepted "
        f"in partial fulfilment of the degree of <b>Bachelor of Technology, "
        f"Computer Science &amp; Engineering</b> of <b>{UNIVERSITY}</b> during the "
        f"session <b>{SESSION}</b>."
    )
    story.append(Paragraph(body, BODY))
    story.append(spacer(2.5 * cm))

    sig_row = Table([
        [Paragraph(f"<b>{GUIDE}</b><br/>Project Guide", CENTER),
         Paragraph("<b>Head of Department</b><br/>Department of Computer Engineering", CENTER),
         Paragraph(f"<b>{COGUIDE}</b><br/>Project Co-Guide", CENTER)],
    ], colWidths=[5.5 * cm, 5.5 * cm, 5.5 * cm])
    sig_row.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(sig_row)
    story.append(PageBreak())


def build_certificate(story):
    build_institute_header(story)
    story.append(Paragraph("<b>CERTIFICATE</b>", COVER_TITLE))
    story.append(spacer(0.5 * cm))

    names_with_rolls = ", ".join([f"{n} ({r})" for n, r in STUDENTS])
    body = (
        f"This is to certify that the project report entitled <b>{TITLE}</b>, "
        f"submitted by <b>{names_with_rolls}</b>, students of "
        f"<b>B.Tech III Year (Computer Science &amp; Engineering)</b> in the session "
        f"<b>{SESSION}</b> of {INSTITUTE}, is a satisfactory account of their "
        f"Project Phase-II work based on the prescribed syllabus."
    )
    story.append(Paragraph(body, BODY))
    story.append(spacer(3 * cm))

    sig_row = Table([
        [Paragraph("<b>Internal Examiner</b><br/>Date:", CENTER),
         Paragraph("<b>External Examiner</b><br/>Date:", CENTER)],
    ], colWidths=[8 * cm, 8 * cm])
    sig_row.setStyle(TableStyle([("ALIGN", (0, 0), (-1, -1), "CENTER")]))
    story.append(sig_row)
    story.append(PageBreak())


def build_declaration(story):
    story.append(Paragraph("<b>DECLARATION</b>", COVER_TITLE))
    story.append(spacer(0.5 * cm))

    names_rolls_bold = ", ".join([f"<b>{n} ({r})</b>" for n, r in STUDENTS])
    body1 = (
        f"We, {names_rolls_bold}, students of B.Tech III Year in the session "
        f"<b>{SESSION}</b>, hereby declare that the work submitted "
        f"<b>\u201c{TITLE}\u201d</b> is our own work conducted under the "
        f"supervision of <b>{GUIDE}, Assistant Professor ({DEPT})</b>, "
        f"{INSTITUTE}, and <b>{COGUIDE}, Assistant Professor ({DEPT})</b>, "
        f"{INSTITUTE}."
    )
    body2 = (
        "We further declare that, to the best of our knowledge, this dissertation "
        "does not contain any part of any work which has been submitted for the "
        "award of any degree either in this University or in any other "
        "University / website without proper citation."
    )
    story.append(Paragraph(body1, BODY))
    story.append(Paragraph(body2, BODY))
    story.append(spacer(1.2 * cm))

    rows = [[f"[{r}]", n] for n, r in STUDENTS]
    t = Table(rows, colWidths=[4 * cm, 8 * cm])
    t.setStyle(TableStyle([
        ("FONT", (0, 0), (-1, -1), "Helvetica", 11),
        ("TEXTCOLOR", (0, 0), (-1, -1), INK),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t)
    story.append(PageBreak())


def build_acknowledgement(story):
    story.append(Paragraph("<b>ACKNOWLEDGEMENT</b>", COVER_TITLE))
    story.append(spacer(0.5 * cm))

    p1 = (
        f"It is a matter of great pleasure and privilege to present our project "
        f"titled <b>{TITLE}</b>. We would like to express our sincere gratitude to "
        f"<b>{HOD}</b> (Head of the Department), <b>{GUIDE}</b> (Project Guide), "
        f"and <b>{COGUIDE}</b> (Project Co-Guide) for their invaluable guidance, "
        f"continuous support, and constant encouragement throughout the "
        f"development of this project."
    )
    p2 = (
        "We are also deeply thankful to all our respected teachers and the "
        "non-teaching staff for their assistance and cooperation. Their support "
        "has played a significant role in the successful completion of this work."
    )
    p3 = (
        "Working together as a team has been a rewarding experience. We extend "
        "our heartfelt appreciation to all group members for their dedication, "
        "patience, and mutual encouragement, which helped us overcome challenges "
        "and achieve our objectives. We are truly grateful to everyone who "
        "contributed, directly or indirectly, to the successful completion of "
        "this project."
    )
    story.append(Paragraph(p1, BODY))
    story.append(Paragraph(p2, BODY))
    story.append(Paragraph(p3, BODY))
    story.append(spacer(1.2 * cm))

    rows = [[f"[{r}]", n] for n, r in STUDENTS]
    t = Table(rows, colWidths=[4 * cm, 8 * cm])
    t.setStyle(TableStyle([
        ("FONT", (0, 0), (-1, -1), "Helvetica", 11),
        ("TEXTCOLOR", (0, 0), (-1, -1), INK),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t)
    story.append(PageBreak())


def build_abstract(story):
    story.append(Paragraph("<b>ABSTRACT</b>", COVER_TITLE))
    story.append(spacer(0.3 * cm))
    paras = [
        "DASHH is a decentralised, on-chain advertising platform designed to "
        "establish transparency, trust, and efficiency in influencer marketing. "
        "Traditional digital-advertising systems rely on centralised "
        "intermediaries and opaque data pipelines, which often result in "
        "fraudulent engagement, inaccurate performance metrics, delayed "
        "payments, and a lack of accountability. These limitations create "
        "significant challenges for brands seeking reliable campaign outcomes "
        "and for creators expecting fair compensation.",
        "The primary objective of DASHH is to eliminate these issues by "
        "introducing a trustless, cryptography-driven framework that verifies "
        "user engagement before any financial transaction occurs. The platform "
        "integrates the <b>Reclaim Protocol</b> for generating zkTLS-based "
        "proofs of engagement, the <b>Solana blockchain</b> for high-speed and "
        "low-cost on-chain settlement, <b>Sign-In With Solana (SIWS)</b> "
        "authentication with HMAC-signed session cookies, and a structured "
        "<b>two-proof verification model</b> consisting of a <i>Join Proof</i> "
        "(content ownership + baseline metrics) and a <i>Final Proof</i> "
        "(stable metrics captured inside a 7-day settlement window after the "
        "campaign ends).",
        "To guarantee fairness, DASHH enforces a <b>20% platform fee</b> "
        "(2000 basis points) signed directly into the brand\u2019s terms "
        "message, supports <b>four payout models</b> (per-view, top-performer, "
        "split-top-N, equal-split), and applies a <b>13-rule disqualification "
        "pipeline</b> covering content mismatch, missing hashtags, duplicate "
        "posts, view-bot signatures, deleted posts, and more. A <b>three-strike "
        "ban policy</b> (with a 90-day account ban) is enforced deterministically "
        "without human arbitration.",
        "Delta-aware payout math (<b>computePayoutForProof</b>) prevents "
        "double-payment on proof re-submissions by crediting only the difference "
        "between the join and final proofs. Proofs are permanently anchored to "
        "<b>Arweave</b> via Irys for immutable record-keeping, and campaigns "
        "settle through scheduled Vercel Crons without any administrator "
        "touching the flow of funds.",
        "The outcomes of this project demonstrate the feasibility of combining "
        "blockchain technology, zero-knowledge verification, and decentralised "
        "architecture to solve critical challenges in digital advertising. The "
        "system was validated through a 45-test Vitest suite (6 files), a "
        "production deployment on Vercel + Neon Postgres, and functional "
        "end-to-end runs on Solana Devnet. DASHH offers a scalable, reliable "
        "solution that reduces dependency on intermediaries, enhances data "
        "integrity, and ensures fair, performance-based compensation, "
        "representing a significant step toward a transparent, efficient, and "
        "trust-driven digital advertising ecosystem.",
    ]
    for p in paras:
        story.append(Paragraph(p, BODY))
    story.append(PageBreak())


def build_toc(story):
    story.append(Paragraph("<b>TABLE OF CONTENTS</b>", COVER_TITLE))
    story.append(spacer(0.4 * cm))
    entries = [
        ("Recommendation", "i"),
        ("Certificate", "ii"),
        ("Declaration", "iii"),
        ("Acknowledgement", "iv"),
        ("Abstract", "v"),
        ("List of Symbols", "vi"),
        ("List of Abbreviations", "vii"),
        ("", ""),
        ("1. INTRODUCTION", "1"),
        ("2. LITERATURE REVIEW", "4"),
        ("3. CASE STUDY / DATA COLLECTION / MATERIAL TESTING", "8"),
        ("4. ANALYSIS AND DESIGN / METHODOLOGY", "13"),
        ("5. IMPLEMENTATION / EXPERIMENTATION", "20"),
        ("6. TESTING, RESULTS AND DISCUSSION", "26"),
        ("7. CONCLUSION AND SCOPE OF FUTURE WORK", "31"),
        ("", ""),
        ("APPENDIX", "34"),
        ("REFERENCES", "36"),
    ]
    rows = []
    for label, page in entries:
        if not label:
            rows.append(["", ""])
            continue
        rows.append([Paragraph(label, TOC_ROW), Paragraph(page, TOC_ROW)])
    t = Table(rows, colWidths=[14 * cm, 2 * cm])
    t.setStyle(TableStyle([
        ("ALIGN", (0, 0), (0, -1), "LEFT"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t)
    story.append(PageBreak())


def build_list_of_symbols(story):
    story.append(Paragraph("<b>LIST OF SYMBOLS</b>", COVER_TITLE))
    story.append(spacer(0.3 * cm))
    story.append(Paragraph(
        "The following symbols appear throughout this report, particularly in "
        "Chapter 4 (payout formulas) and Chapter 6 (test evaluation).", BODY))
    story.append(spacer(0.2 * cm))

    data = [
        ["Symbol", "Description"],
        ["\u25CE (SOL)", "Native cryptocurrency of the Solana blockchain"],
        ["1 SOL", "10\u2079 lamports (smallest unit)"],
        ["B", "Campaign budget (in SOL)"],
        ["F", "Platform fee share; F = B \u00D7 0.20"],
        ["P", "Creator pool; P = B \u2212 F"],
        ["v\u2080", "View count recorded at the Join Proof"],
        ["v\u2081", "View count recorded at the Final Proof"],
        ["\u0394v", "Verified view delta paid out; \u0394v = v\u2081 \u2212 v\u2080"],
        ["r", "Per-view rate (SOL per verified view) in per_view mode"],
        ["n", "Number of participating creators in a campaign"],
        ["N", "Top-N cut-off used in split_top_n mode"],
        ["\u03C4", "Campaign end time (Unix seconds)"],
        ["W", "Final-proof window; fixed at 7 days past \u03C4"],
        ["\u03A3", "Summation notation over the set of eligible creators"],
        ["bps", "Basis points; 2000 bps = 20% platform fee"],
        ["\u2713 / \u2717", "Verified / Disqualified proof"],
        ["#9945FF / #14F195", "Brand palette: Solana purple / mint"],
    ]
    t = Table(data, colWidths=[4 * cm, 12 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PURPLE),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 11),
        ("FONT", (0, 1), (-1, -1), "Helvetica", 10),
        ("TEXTCOLOR", (0, 1), (-1, -1), INK),
        ("GRID", (0, 0), (-1, -1), 0.3, RULE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(t)
    story.append(PageBreak())


def build_list_of_abbreviations(story):
    story.append(Paragraph("<b>LIST OF ABBREVIATIONS</b>", COVER_TITLE))
    story.append(spacer(0.3 * cm))

    groups = [
        ("Core / Domain", [
            ("DASHH", "The project name (brand identifier for this platform)"),
            ("P2P", "Peer-to-Peer"),
            ("CPV", "Cost Per View"),
            ("CPM", "Cost Per Mille (thousand impressions)"),
            ("bps", "Basis points (1 bps = 0.01%)"),
            ("T&C", "Terms and Conditions"),
            ("KYC", "Know Your Customer"),
            ("MVP", "Minimum Viable Product"),
        ]),
        ("Blockchain / Solana", [
            ("SOL", "Solana (native cryptocurrency of the Solana blockchain)"),
            ("SPL", "Solana Program Library"),
            ("PDA", "Program Derived Address"),
            ("RPC", "Remote Procedure Call"),
            ("SIWS", "Sign-In With Solana"),
            ("TPS", "Transactions Per Second"),
            ("NFT", "Non-Fungible Token"),
            ("DeFi", "Decentralised Finance"),
        ]),
        ("Cryptography / Verification", [
            ("zkTLS", "Zero-Knowledge Transport Layer Security"),
            ("ZK", "Zero-Knowledge (as in zero-knowledge proof)"),
            ("ZKP", "Zero-Knowledge Proof"),
            ("TLS", "Transport Layer Security"),
            ("HMAC", "Hash-based Message Authentication Code"),
            ("JWT", "JSON Web Token"),
            ("ECDSA", "Elliptic Curve Digital Signature Algorithm"),
            ("OAuth", "Open Authorisation"),
        ]),
        ("Web / Software", [
            ("API", "Application Programming Interface"),
            ("REST", "Representational State Transfer"),
            ("HTTP", "HyperText Transfer Protocol"),
            ("HTTPS", "HyperText Transfer Protocol Secure"),
            ("URL", "Uniform Resource Locator"),
            ("JSON", "JavaScript Object Notation"),
            ("DOM", "Document Object Model"),
            ("SSR / CSR", "Server-Side / Client-Side Rendering"),
            ("SPA", "Single-Page Application"),
            ("CORS", "Cross-Origin Resource Sharing"),
            ("CSRF", "Cross-Site Request Forgery"),
            ("XSS", "Cross-Site Scripting"),
            ("CDN", "Content Delivery Network"),
            ("UUID", "Universally Unique Identifier"),
            ("CRUD", "Create, Read, Update, Delete"),
            ("UI / UX", "User Interface / User Experience"),
        ]),
        ("Database", [
            ("DB", "Database"),
            ("PostgreSQL", "Open-source relational database (used via Neon, serverless)"),
            ("ORM", "Object-Relational Mapping (Drizzle ORM in DASHH)"),
            ("SQL", "Structured Query Language"),
            ("ACID", "Atomicity, Consistency, Isolation, Durability"),
            ("PK / FK", "Primary Key / Foreign Key"),
        ]),
        ("Tools / Process", [
            ("SDK", "Software Development Kit"),
            ("CLI", "Command Line Interface"),
            ("IDE", "Integrated Development Environment"),
            ("CI / CD", "Continuous Integration / Continuous Deployment"),
            ("VCS", "Version Control System (Git)"),
            ("PR", "Pull Request"),
            ("QR", "Quick Response (code)"),
        ]),
        ("Academic / Institutional", [
            ("SGSITS", "Shri Govindram Seksaria Institute of Technology and Science"),
            ("RGPV", "Rajiv Gandhi Proudyogiki Vishwavidyalaya, Bhopal"),
            ("UG", "Under Graduate"),
            ("B.Tech", "Bachelor of Technology"),
            ("CSE", "Computer Science and Engineering"),
            ("AICTE", "All India Council for Technical Education"),
        ]),
    ]

    for title, entries in groups:
        story.append(Paragraph(f"<b>{title}</b>", H3))
        rows = [[abbr, exp] for abbr, exp in entries]
        t = Table(rows, colWidths=[3.2 * cm, 12.8 * cm])
        t.setStyle(TableStyle([
            ("FONT", (0, 0), (-1, -1), "Helvetica", 10),
            ("FONT", (0, 0), (0, -1), "Helvetica-Bold", 10),
            ("TEXTCOLOR", (0, 0), (-1, -1), INK),
            ("TEXTCOLOR", (0, 0), (0, -1), PURPLE),
            ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, BG_LIGHT]),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(t)
        story.append(spacer(0.25 * cm))
    story.append(PageBreak())


# ───────────────────────── Chapters ─────────────────────────

def _chapter(story, num, title):
    story.append(Paragraph(f"Chapter {num}", H2))
    story.append(Paragraph(title.upper(), H1))
    story.append(spacer(0.2 * cm))


def build_ch1(story):
    _chapter(story, 1, "Introduction")
    for p in [
        "The rapid expansion of digital advertising and influencer-driven "
        "marketing has created significant opportunities for brands to reach "
        "targeted audiences through social-media platforms. However, this "
        "growth has also introduced several critical challenges: fraudulent "
        "engagement, bot-driven interactions, lack of transparency, unreliable "
        "performance metrics, and heavy dependence on intermediaries. In "
        "traditional advertising ecosystems, engagement data is controlled by "
        "centralised platforms, making it difficult for brands to verify the "
        "authenticity of interactions and ensure fair compensation for "
        "creators.",
        "To address these limitations, <b>DASHH</b> is proposed as a "
        "decentralised, on-chain advertising platform that leverages blockchain "
        "technology and cryptographic verification to ensure transparency and "
        "trust in influencer marketing. Unlike conventional systems that rely "
        "on centralised validation, DASHH introduces a trustless framework "
        "where engagement is verified using cryptographic proofs before any "
        "financial transaction takes place. The platform integrates the "
        "<b>Reclaim Protocol</b> for zkTLS proofs, the <b>Solana blockchain</b> "
        "for low-cost settlement, and Sign-In With Solana (SIWS) for wallet-"
        "native authentication.",
        "The core innovation of DASHH lies in solving the fundamental trust "
        "problem in digital advertising. Instead of relying on a single "
        "snapshot of engagement, which can be manipulated by bots, DASHH "
        "introduces a <b>two-stage verification model</b>: the <i>Join Proof</i> "
        "establishes content ownership and captures baseline metrics, and the "
        "<i>Final Proof</i> (submitted inside a 7-day settlement window after "
        "the campaign ends) captures stable metrics. Payouts are computed as "
        "the <b>delta</b> between these two proofs, preventing both inflation "
        "and double-payment on re-submissions.",
        "Beyond the proof model, DASHH enforces a <b>13-rule disqualification "
        "pipeline</b> (missing hashtags, deleted posts, view-bot signatures, "
        "duplicate proofs, and more) and a <b>three-strike ban policy</b> that "
        "removes abusers for 90 days without human intervention. A fixed "
        "<b>20% platform fee</b> (2000 basis points) is signed into the "
        "brand\u2019s terms message, making every fee transparent and "
        "cryptographically bound to the campaign.",
        "The primary objective of this project is to design and implement a "
        "scalable, transparent, and secure advertising ecosystem that "
        "eliminates intermediaries and ensures fair compensation based on "
        "verified engagement. This project focuses on developing the "
        "foundational architecture, implementing the engagement-verification "
        "workflow, and demonstrating the feasibility of a decentralised "
        "advertising platform that combines blockchain, zero-knowledge proofs, "
        "and real-time analytics to address modern digital-advertising "
        "challenges.",
    ]:
        story.append(Paragraph(p, BODY))
    story.append(PageBreak())


def build_ch2(story):
    _chapter(story, 2, "Literature Review")
    story.append(Paragraph(
        "The rapid evolution of digital advertising and influencer marketing "
        "has led to the development of various platforms and technologies "
        "aimed at improving campaign performance. However, despite these "
        "advancements, most existing systems suffer from a lack of "
        "transparency, absence of verifiable engagement metrics, and "
        "dependence on centralised intermediaries. This chapter reviews the "
        "existing solutions, identifies their limitations, and highlights the "
        "research gap addressed by DASHH.",
        BODY,
    ))

    story.append(Paragraph("2.1 Existing Systems and Their Limitations", H2))
    for p in [
        "Most influencer-marketing platforms operate on <b>centralised "
        "architectures</b>, where engagement data (views, likes, clicks) is "
        "controlled and reported by the platform itself. While these systems "
        "provide convenience and scalability, they lack independent "
        "verification mechanisms, making them vulnerable to manipulation "
        "through bots, fake accounts, and automated scripts.",
        "Traditional Web-2 advertising platforms such as <b>Google Ads</b> and "
        "<b>Meta Ads</b> offer advanced analytics and targeting capabilities. "
        "However, these platforms rely on proprietary algorithms and opaque "
        "data pipelines which do not allow users to verify engagement "
        "authenticity. They do not provide cryptographic guarantees or tamper-"
        "proof records, leading to trust issues between advertisers and "
        "content creators.",
        "In recent years, several blockchain-based advertising solutions such "
        "as <b>Brave, AdEx</b>, and <b>MadNetwork</b> have attempted to "
        "introduce transparency. These platforms use decentralised ledgers to "
        "record transactions and reduce dependency on intermediaries. While "
        "they improve data transparency and user privacy, they still face "
        "limitations: lack of real-time engagement verification, limited "
        "integration with influencer workflows, and absence of zero-knowledge "
        "proof mechanisms.",
    ]:
        story.append(Paragraph(p, BODY))

    story.append(Paragraph("2.2 Gaps in Existing Solutions", H2))
    for item in [
        "<b>Lack of verifiable engagement data</b> \u2014 existing platforms do "
        "not cryptographically verify whether user interactions are genuine.",
        "<b>High dependency on intermediaries</b> \u2014 brands rely on third-"
        "party agencies for validation, increasing cost and delay.",
        "<b>Fraud from bot-driven interactions</b> \u2014 automated scripts "
        "and fake accounts significantly inflate engagement metrics.",
        "<b>Absence of real-time tracking</b> \u2014 most systems provide "
        "delayed analytics rather than live performance monitoring.",
        "<b>Limited privacy-preserving verification</b> \u2014 current "
        "solutions cannot validate engagement without exposing user data.",
    ]:
        story.append(Paragraph("\u2022 " + item, BULLET))

    story.append(Paragraph("2.3 Proposed Solution: DASHH", H2))
    for p in [
        "DASHH addresses the identified gaps by introducing a decentralised "
        "and cryptography-driven advertising framework. The platform leverages "
        "<b>Reclaim Protocol for zkTLS-based proofs</b>, enabling authenticated "
        "verification of Web-2 engagement data. This ensures that user "
        "interactions are genuine and tamper-proof <b>without exposing "
        "sensitive information</b>.",
        "A key innovation is the two-stage verification model already "
        "outlined \u2014 the Join Proof captures baseline engagement and "
        "establishes ownership, and the Final Proof verifies stable engagement "
        "after the 7-day settlement window. This filters out fake or inflated "
        "interactions before any SOL changes hands.",
        "DASHH further uses the Solana blockchain for real-time on-chain "
        "tracking and immutable record storage, incorporates sybil-resistant "
        "mechanisms (wallet-gated participation, strike counters, automated "
        "bans), and anchors every verified proof to <b>Arweave</b> via Irys "
        "for permanent public auditability.",
    ]:
        story.append(Paragraph(p, BODY))

    story.append(Paragraph("2.4 Summary", H2))
    story.append(Paragraph(
        "This chapter highlights that existing digital-advertising systems, "
        "whether centralised or blockchain-based, fail to provide a complete "
        "solution for verifiable and transparent engagement tracking. DASHH "
        "bridges this gap by combining blockchain technology, zero-knowledge "
        "proofs, and real-time analytics, offering a robust solution to the "
        "challenges faced in modern influencer marketing.",
        BODY,
    ))
    story.append(PageBreak())


def build_ch3(story):
    _chapter(story, 3, "About Case Study / Data Collection / Material Testing")
    story.append(Paragraph(
        "This chapter presents the case study, data-collection process, and "
        "testing approach used in the development of the DASHH platform. The "
        "objective is to understand how digital engagement is captured, "
        "verified, and recorded using decentralised technologies, ensuring "
        "transparency, authenticity, and reliability in influencer marketing.",
        BODY,
    ))

    story.append(Paragraph("3.1 Case-Study Overview", H2))
    story.append(Paragraph(
        "The case study is based on a simulated influencer-marketing campaign "
        "in which a creator promotes digital content and users interact with "
        "it (primarily through <b>views</b>). The goal is to analyse how "
        "engagement can be cryptographically verified and recorded on-chain "
        "instead of relying on centralised reporting.",
        BODY,
    ))
    story.append(Paragraph(
        "In this scenario, a creator publishes content on a Web-2 platform "
        "(Instagram, YouTube, X, or TikTok), and users interact with it. "
        "Instead of trusting platform-provided metrics, DASHH introduces a "
        "verification pipeline where each interaction is validated using "
        "Reclaim-generated zkTLS proofs. The verified engagement data is "
        "stored on the Solana blockchain and permanently anchored to Arweave, "
        "ensuring immutability and transparency.",
        BODY,
    ))

    story.append(Paragraph("3.2 Data-Collection Method", H2))
    story.append(Paragraph(
        "Unlike traditional systems that rely on platform-reported analytics, "
        "DASHH uses a cryptography-driven data-collection approach. The "
        "system collects engagement data through the following components:",
        BODY,
    ))
    for item in [
        "<b>Reclaim Protocol</b> \u2014 generates authenticated proofs "
        "confirming a user interaction has actually occurred on a Web-2 "
        "platform.",
        "<b>zkTLS (Zero-Knowledge TLS)</b> \u2014 verifies the authenticity of "
        "the engagement without exposing user identity or sensitive data.",
        "<b>Solana on-chain logging</b> \u2014 records verified engagement "
        "events in real time through Solana Actions / Blinks.",
        "<b>Arweave / Irys</b> \u2014 permanently stores the raw proof "
        "bundle so anyone can audit the campaign years later.",
    ]:
        story.append(Paragraph("\u2022 " + item, BULLET))
    story.append(Paragraph(
        "Each collected data-record contains the engagement type (view), "
        "timestamp, campaign and participation IDs, the creator\u2019s wallet "
        "public key, and the cryptographic proof blob.",
        BODY,
    ))

    story.append(Paragraph("3.3 Components Used", H2))
    for item in [
        "<b>Reclaim Protocol SDK</b> \u2014 captures authenticated engagement "
        "data from Web-2 platforms.",
        "<b>zkTLS Verification Module</b> (<code>src/lib/reclaim/verify.ts</code>) "
        "\u2014 validates the integrity of proofs using the 13-rule pipeline.",
        "<b>Solana Blockchain (Devnet)</b> \u2014 stores verified engagement "
        "events in an immutable, decentralised manner.",
        "<b>Backend APIs</b> (Next.js 14 server routes under <code>/api/v2/"
        "</code>) \u2014 process proof data, manage campaigns, and handle "
        "business logic.",
        "<b>Frontend Dashboard</b> \u2014 mode-aware UI built with React, "
        "Tailwind CSS, shadcn/ui, and Framer Motion, showing real-time "
        "engagement and analytics.",
        "<b>Neon Postgres + Drizzle ORM</b> \u2014 stores structured "
        "campaign, profile, participation, proof, payout and notification "
        "data (six tables, all suffixed <code>_v2</code>).",
    ]:
        story.append(Paragraph("\u2022 " + item, BULLET))

    story.append(Paragraph("3.4 Material Testing (System-Testing Approach)", H2))
    story.append(Paragraph(
        "In the context of DASHH, \u201cmaterial testing\u201d refers to the "
        "testing and validation of system modules and data flows rather than "
        "physical materials. The following tests were conducted:",
        BODY,
    ))
    for item in [
        "<b>Proof-authenticity testing</b> \u2014 ensures only valid proofs "
        "generated by Reclaim are accepted.",
        "<b>Fraud-detection testing</b> \u2014 verifies that fake or tampered "
        "proofs are rejected by the 13-rule pipeline.",
        "<b>Real-time processing testing</b> \u2014 confirms that engagement "
        "data is recorded on the blockchain with minimal delay.",
        "<b>Sybil-resistance testing</b> \u2014 ensures duplicate or bot-"
        "generated interactions are filtered out.",
        "<b>Data-integrity testing</b> \u2014 validates on-chain immutability "
        "and Arweave permanence.",
    ]:
        story.append(Paragraph("\u2022 " + item, BULLET))

    story.append(Paragraph("3.5 Summary", H2))
    story.append(Paragraph(
        "DASHH employs a novel approach to data collection and verification "
        "by integrating blockchain technology with zero-knowledge proofs. The "
        "case study highlights the effectiveness of the system in replacing "
        "traditional trust-based models with a verifiable and decentralised "
        "engagement framework.",
        BODY,
    ))
    story.append(PageBreak())


def build_ch4(story):
    _chapter(story, 4, "Analysis and Design / Methodology")
    story.append(Paragraph(
        "This chapter describes the system analysis, design structure, and "
        "methodology used to develop DASHH. The focus is on designing a "
        "secure, transparent, and scalable system that ensures verified "
        "engagement using decentralised technologies.",
        BODY,
    ))

    story.append(Paragraph("4.1 System Analysis", H2))
    story.append(Paragraph("<i>Problem Analysis</i>", H3))
    for item in [
        "Lack of transparent engagement verification, making it difficult to "
        "distinguish real from fake interactions.",
        "High dependency on intermediaries, increasing cost and reducing "
        "efficiency.",
        "Fraud from bot-generated engagement and fake accounts.",
        "Delayed analytics and unreliable performance metrics.",
    ]:
        story.append(Paragraph("\u2022 " + item, BULLET))

    story.append(Paragraph("<i>Requirement Analysis</i>", H3))
    for item in [
        "Cryptographic verification of user engagement to ensure authenticity.",
        "Real-time tracking of engagement data using blockchain technology.",
        "Privacy-preserving validation mechanisms using zero-knowledge proofs.",
        "Sybil resistance to prevent fake or duplicate participation.",
        "Scalable and low-cost infrastructure for large-scale campaigns.",
    ]:
        story.append(Paragraph("\u2022 " + item, BULLET))

    story.append(Paragraph("4.2 System Design", H2))

    story.append(Paragraph("4.2.1 Architecture Overview", H3))
    story.append(Paragraph(
        "DASHH is built as four logical layers:", BODY))
    for item in [
        "<b>Frontend Layer</b> \u2014 Next.js 14 App Router with React Server "
        "Components, Tailwind CSS, shadcn/ui primitives, and Framer Motion "
        "animations. A mode-aware shell (Explore / Create) renders the same "
        "route group <code>(app)</code> differently based on <code>src/lib/"
        "modes.ts</code> \u2014 a single source of truth.",
        "<b>Backend Layer</b> \u2014 Next.js server routes under <code>/api/"
        "v2/</code> with Zod-validated bodies, Drizzle ORM queries against "
        "Neon Postgres, and HMAC-signed SIWS session cookies.",
        "<b>Verification Layer</b> \u2014 Reclaim Protocol SDK + four "
        "platform adapters (Instagram, YouTube, X, TikTok) feeding the "
        "13-rule <code>verify()</code> pipeline in <code>src/lib/reclaim/"
        "verify.ts</code>.",
        "<b>Blockchain Layer</b> \u2014 Solana Web3.js + Phantom Wallet + "
        "Solana Actions for escrow, payouts, and on-chain tracking. Arweave "
        "via Irys for permanent proof anchoring.",
    ]:
        story.append(Paragraph("\u2022 " + item, BULLET))

    story.append(Paragraph("4.2.2 System Workflow", H3))
    story.append(Paragraph(
        "The end-to-end flow of a campaign is as follows:", BODY))
    for step in [
        "Brand signs the campaign terms (including the 20% fee) via SIWS and "
        "escrows SOL on-chain.",
        "Creator signs T&amp;C, discovers the campaign in Explore mode, and "
        "joins.",
        "Creator publishes content on the chosen social platform.",
        "Creator submits a Join Proof via Reclaim\u2019s zkTLS flow \u2014 "
        "baseline metrics are recorded on-chain and anchored to Arweave.",
        "Campaign runs for its defined duration; the sync cron polls public "
        "APIs for display-only view updates.",
        "Campaign end-time \u03C4 is reached; the 7-day final-proof window "
        "opens.",
        "Creator returns and submits a Final Proof. Delta \u0394v = v\u2081 "
        "\u2212 v\u2080 is computed.",
        "13-rule pipeline runs; any disqualification is recorded.",
        "Payout is computed via <code>computePayoutForProof()</code> using "
        "the selected payout model; SOL is released from escrow, minus the "
        "20% platform fee.",
        "If the creator misses the 7-day window, their share rolls back into "
        "the residual pool automatically.",
    ]:
        story.append(Paragraph("\u2022 " + step, BULLET))

    story.append(Paragraph("4.2.3 Two-Proof Verification Model", H3))
    story.append(Paragraph(
        "The core of DASHH is the two-proof verification model:", BODY))
    for item in [
        "<b>Join Proof</b> \u2014 captured at the moment the creator joins "
        "the campaign. Locks the baseline view-count v\u2080, the creator\u2019s "
        "social handle, and the caption text.",
        "<b>Final Proof</b> \u2014 captured inside the 7-day final window "
        "[\u03C4, \u03C4 + W]. Records the stable view-count v\u2081.",
        "<b>Payout rule</b> \u2014 only \u0394v = v\u2081 \u2212 v\u2080 is "
        "paid, preventing double-counting if the creator re-submits proofs.",
    ]:
        story.append(Paragraph("\u2022 " + item, BULLET))

    story.append(Paragraph("4.2.4 Payout Models", H3))
    story.append(Paragraph(
        "DASHH supports four payout models, selected by the brand at "
        "campaign-creation time. All four flow through the same delta-aware "
        "function <code>computePayoutForProof()</code>:",
        BODY,
    ))
    pm_data = [
        ["Model", "Behaviour"],
        ["per_view", "Flat rate r \u00D7 \u0394v up to the per-creator cap. "
                    "Classic pay-per-view pricing."],
        ["top_performer", "Winner-takes-all: the top creator by \u0394v above "
                          "a minimum floor receives the pool P."],
        ["split_top_n", "Top-N creators by \u0394v split the pool P "
                        "proportionally to their \u0394v."],
        ["equal_split", "Fixed P / n share to every participating creator "
                        "who passes the 13-rule pipeline."],
    ]
    t = Table(pm_data, colWidths=[3.2 * cm, 12.8 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), MINT),
        ("TEXTCOLOR", (0, 0), (-1, 0), DARK),
        ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 11),
        ("FONT", (0, 1), (-1, -1), "Helvetica", 10),
        ("FONT", (0, 1), (0, -1), "Courier-Bold", 10),
        ("GRID", (0, 0), (-1, -1), 0.3, RULE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(t)
    story.append(spacer(0.2 * cm))

    story.append(Paragraph("4.2.5 Platform Fee &amp; Terms Binding", H3))
    story.append(Paragraph(
        "Every campaign carries a fixed 20% platform fee (2000 basis points). "
        "The fee is not a runtime parameter \u2014 it is baked into the Terms "
        "message that the brand signs with their Solana private key before "
        "the escrow is funded. The signed message is stored alongside the "
        "campaign, making the fee cryptographically bound to the campaign and "
        "publicly auditable.",
        BODY,
    ))

    story.append(Paragraph("4.2.6 Disqualification Rules (13-Rule Pipeline)", H3))
    story.append(Paragraph(
        "The file <code>src/lib/terms.ts</code> defines 13 deterministic "
        "disqualification rules that every proof is checked against:",
        BODY,
    ))
    rules = [
        "Missing required hashtag / mention / phrase from the brand\u2019s terms.",
        "Caption does not reference the campaign.",
        "Account handle changed between Join and Final proof.",
        "View count drops (indicative of a deleted post).",
        "Final proof missed \u2014 submitted outside the 7-day window.",
        "Duplicate proof \u2014 the same social URL used on two campaigns.",
        "View-bot signatures \u2014 velocity anomalies above platform "
        "thresholds.",
        "Private / deleted post at settlement time.",
        "Content mismatch \u2014 campaign is about X, post is about Y.",
        "Caption engagement-farming \u2014 banned-phrase list matched.",
        "Self-engagement ring detected among participating wallets.",
        "Brand-side fraud signals flagged by the Reclaim adapter.",
        "T&amp;C not signed, or signed-wallet mismatches the joining wallet.",
    ]
    for i, r in enumerate(rules, 1):
        story.append(Paragraph(f"{i}. {r}", BULLET))

    story.append(Paragraph("4.2.7 Ban Policy", H3))
    story.append(Paragraph(
        "Three disqualifications inside a rolling window trigger an automatic "
        "<b>90-day account ban</b>. Ban enforcement happens at campaign-join "
        "time \u2014 a banned wallet cannot participate, and the DB ensures "
        "the check is atomic. No human arbitrates; the policy is code.",
        BODY,
    ))

    story.append(Paragraph("4.2.8 Database Design", H3))
    story.append(Paragraph(
        "The Neon Postgres schema (<code>src/lib/db/schema-v2.ts</code>) is "
        "organised into six tables, all suffixed <code>_v2</code>:",
        BODY,
    ))
    schema_data = [
        ["Table", "Purpose"],
        ["profiles_v2",       "Wallet-keyed user profile \u2014 display name, "
                              "strike count, ban status, creator tier."],
        ["campaigns_v2",      "Brand-created campaign \u2014 budget, payout "
                              "model, terms hash, signed terms message, "
                              "start/end timestamps."],
        ["participations_v2", "Creator\u2019s enrolment in a campaign; joins "
                              "the wallet to the campaign with their signed "
                              "T&C."],
        ["proofs_v2",         "Raw Reclaim proof blob + parsed metrics, "
                              "tagged as Join or Final with Arweave anchor "
                              "URL."],
        ["payouts_v2",        "Settlement record \u2014 creator wallet, SOL "
                              "amount, transaction signature, payout model, "
                              "delta."],
        ["notifications_v2",  "Per-wallet notification stream (proof "
                              "accepted/rejected, campaign ended, ban "
                              "warning, etc.)."],
    ]
    t = Table(schema_data, colWidths=[3.8 * cm, 12.2 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PURPLE),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 11),
        ("FONT", (0, 1), (-1, -1), "Helvetica", 10),
        ("FONT", (0, 1), (0, -1), "Courier-Bold", 10),
        ("GRID", (0, 0), (-1, -1), 0.3, RULE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(t)

    story.append(Paragraph("4.3 Methodology", H2))
    story.append(Paragraph("4.3.1 Development Approach", H3))
    story.append(Paragraph(
        "The system is developed using an iterative and modular approach. "
        "Each component (auth, escrow, verification, payout) is built and "
        "tested independently before integration. Vitest provides 45 unit-"
        "tests across 6 files covering payout-delta math, settlement-window "
        "logic, mode derivation, terms builders, ban evaluation, and Reclaim "
        "adapter parsing. GitHub Actions runs lint + typecheck + tests + "
        "build on every push.",
        BODY,
    ))

    story.append(Paragraph("4.3.2 Verification Methodology", H3))
    for step in [
        "<b>Proof generation</b> \u2014 Reclaim Protocol generates proof of "
        "interaction.",
        "<b>Proof validation</b> \u2014 zkTLS verifies authenticity without "
        "revealing sensitive data; the 13-rule pipeline runs.",
        "<b>Data processing</b> \u2014 the backend classifies proof as Join "
        "or Final based on timestamp, persists it, and stores the Arweave "
        "anchor URL.",
        "<b>On-chain recording</b> \u2014 Solana stores the settlement "
        "transaction signature permanently.",
    ]:
        story.append(Paragraph("\u2022 " + step, BULLET))

    story.append(Paragraph("4.3.3 Testing Methodology", H3))
    for item in [
        "Proof-authenticity testing.",
        "Fraud-detection testing (13 rules).",
        "Performance testing (real-time responsiveness).",
        "Data-integrity testing (immutability + Arweave anchor verification).",
        "Regression testing via 45 Vitest cases run in CI.",
    ]:
        story.append(Paragraph("\u2022 " + item, BULLET))

    story.append(Paragraph("4.4 Summary", H2))
    story.append(Paragraph(
        "DASHH is designed as a secure, scalable, and decentralised system "
        "that replaces traditional trust-based advertising models. By "
        "combining blockchain technology, zero-knowledge verification, and "
        "real-time processing, the system ensures authentic engagement "
        "tracking and transparent campaign execution, making it a reliable "
        "solution for modern digital advertising.",
        BODY,
    ))
    story.append(PageBreak())


def build_ch5(story):
    _chapter(story, 5, "Implementation / Experimentation")
    story.append(Paragraph(
        "This chapter describes the practical implementation of DASHH and "
        "the experimental setup used to validate its functionality. The "
        "primary objective is to build a system that can capture user "
        "engagement, verify it cryptographically, and record it on-chain in a "
        "secure and transparent manner.",
        BODY,
    ))

    story.append(Paragraph("5.1 Implementation Overview", H2))
    story.append(Paragraph(
        "DASHH is implemented as a decentralised, full-stack application "
        "integrating multiple technologies. The implementation focuses on "
        "accuracy, security, and real-time performance. The production "
        "deployment lives at <b>https://dashhnew.vercel.app</b> \u2014 Vercel "
        "(Hobby tier) hosts the Next.js frontend and serverless API routes, "
        "Neon Postgres provides the DB, and Vercel Cron handles settlement "
        "scheduling.",
        BODY,
    ))

    story.append(Paragraph("5.2 Technology Stack", H2))
    tech = [
        ["Layer", "Technology"],
        ["Framework",      "Next.js 14 (App Router, Route Groups, Server "
                           "Actions)"],
        ["Language",       "TypeScript (end-to-end)"],
        ["UI",             "Tailwind CSS, shadcn/ui, Framer Motion"],
        ["Database",       "Neon Postgres (serverless) + Drizzle ORM"],
        ["Auth",           "Sign-In With Solana (SIWS) + HMAC-signed JWT "
                           "cookies"],
        ["Chain",          "Solana Web3.js, Phantom Wallet, Solana Actions / "
                           "Blinks"],
        ["Verification",   "Reclaim Protocol zkTLS + 4 platform adapters"],
        ["Storage",        "Arweave / Irys for permanent proof bundles"],
        ["Validation",     "Zod schemas at every API boundary"],
        ["Testing",        "Vitest (45 tests / 6 files)"],
        ["CI/CD",          "GitHub Actions + Vercel + Vercel Cron"],
    ]
    t = Table(tech, colWidths=[3.8 * cm, 12.2 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PURPLE),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 11),
        ("FONT", (0, 1), (-1, -1), "Helvetica", 10),
        ("FONT", (0, 1), (0, -1), "Helvetica-Bold", 10),
        ("TEXTCOLOR", (0, 1), (0, -1), PURPLE),
        ("GRID", (0, 0), (-1, -1), 0.3, RULE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(t)

    story.append(Paragraph("5.3 Implementation Steps", H2))

    story.append(Paragraph("5.3.1 Authentication (SIWS)", H3))
    story.append(Paragraph(
        "The auth flow uses Sign-In With Solana: the client requests a nonce "
        "from <code>/api/auth/nonce</code>, signs it with Phantom, and posts "
        "the signature back to <code>/api/auth/verify</code>. The server "
        "verifies the signature against the claimed public key, mints an "
        "HMAC-signed session cookie (JWT-style, 32-byte secret), and returns "
        "it. No password database, no email/OTP flow.",
        BODY,
    ))

    story.append(Paragraph("5.3.2 Proof Generation using Reclaim", H3))
    for item in [
        "Integrated the Reclaim SDK into the client application.",
        "Configured provider IDs per platform: Instagram, YouTube, X, TikTok.",
        "Each proof is requested, QR-code rendered, scanned with the Reclaim "
        "mobile app, and the signed proof object returned to DASHH.",
    ]:
        story.append(Paragraph("\u2022 " + item, BULLET))

    story.append(Paragraph("5.3.3 Proof Verification using zkTLS", H3))
    for item in [
        "Implemented a verification module (<code>src/lib/reclaim/verify.ts"
        "</code>) that validates TLS signatures.",
        "Runs the 13-rule disqualification pipeline.",
        "Extracts metadata (timestamp, engagement type, view count, caption).",
        "Classifies the proof as Join or Final via "
        "<code>routeProofByWindow()</code> based on campaign end-time "
        "\u03C4.",
    ]:
        story.append(Paragraph("\u2022 " + item, BULLET))

    story.append(Paragraph("5.3.4 On-Chain Recording using Solana", H3))
    for item in [
        "Connected to the Solana devnet environment with configurable RPC "
        "(<code>NEXT_PUBLIC_SOLANA_RPC</code>).",
        "Campaign escrow uses <code>SystemProgram.transfer</code> as a stand-"
        "in for a future PDA-owned Anchor escrow program.",
        "Each settlement submits a signed transaction; the signature is "
        "stored in <code>payouts_v2.tx_signature</code>.",
        "Blockhash is fetched with \u2018finalized\u2019 commitment and "
        "<code>confirmTransaction</code> is given the full "
        "<code>{blockhash, lastValidBlockHeight}</code> tuple so settlement "
        "survives slow devnet RPCs.",
    ]:
        story.append(Paragraph("\u2022 " + item, BULLET))

    story.append(Paragraph("5.3.5 Dashboard Integration", H3))
    for item in [
        "Mode-aware sidebar that derives Explore vs Create purely from the "
        "URL (<code>src/lib/modes.ts</code>).",
        "Framer-Motion-powered page transitions, stagger reveals, and "
        "counter animations.",
        "Analytics page renders a bar chart of view-deltas per creator and a "
        "pending-views banner for the current user.",
    ]:
        story.append(Paragraph("\u2022 " + item, BULLET))

    story.append(Paragraph("5.4 Experimental Setup", H2))
    story.append(Paragraph(
        "To validate the system, an end-to-end test campaign was created "
        "with seeded data: 8 campaigns, 5 creators, 23 proofs. The test "
        "procedure was:",
        BODY,
    ))
    for step in [
        "A brand wallet connects via Phantom, signs Terms, and escrows SOL.",
        "A creator wallet connects, signs T&amp;C, and joins the campaign.",
        "The creator submits a Join Proof via Reclaim (Instagram provider).",
        "Campaign end time is simulated; Final Proof is submitted.",
        "Verify pipeline classifies the proof, computes \u0394v, and "
        "triggers settlement.",
        "Dashboard reflects the payout within seconds.",
    ]:
        story.append(Paragraph("\u2022 " + step, BULLET))

    story.append(Paragraph("5.5 Observations", H2))
    for item in [
        "Engagement events were recorded within seconds on the blockchain "
        "(confirmed commitment, observed 400\u2013800 ms on Solana devnet).",
        "Invalid and tampered proofs were rejected by the 13-rule pipeline.",
        "The system correctly differentiated between Join and Final proofs "
        "inside and outside the 7-day window.",
        "Arweave anchoring survived network interruptions \u2014 retries "
        "succeeded.",
    ]:
        story.append(Paragraph("\u2022 " + item, BULLET))

    story.append(Paragraph("5.6 Summary", H2))
    story.append(Paragraph(
        "The implementation demonstrates that it is possible to build a "
        "trustless and decentralised advertising system using blockchain "
        "technology and zero-knowledge verification. The system successfully "
        "integrates proof generation, verification, on-chain recording, and "
        "permanent archival, validating DASHH as a reliable solution for "
        "modern digital advertising challenges.",
        BODY,
    ))
    story.append(PageBreak())


def build_ch6(story):
    _chapter(story, 6, "Testing, Results and Discussion")

    story.append(Paragraph("6.1 Objectives of Testing", H2))
    for item in [
        "To verify that engagement proofs are generated and validated "
        "correctly.",
        "To ensure the system detects and rejects fraudulent or tampered "
        "proofs via the 13-rule pipeline.",
        "To confirm engagement data is accurately recorded on the blockchain "
        "and anchored to Arweave.",
        "To evaluate the real-time performance and responsiveness of the "
        "system.",
        "To validate that the dashboard reflects correct and updated "
        "engagement metrics.",
    ]:
        story.append(Paragraph("\u2022 " + item, BULLET))

    story.append(Paragraph("6.2 Types of Testing", H2))

    story.append(Paragraph("6.2.1 Functional Testing", H3))
    for item in [
        "Proof generation using Reclaim Protocol.",
        "Proof verification using the zkTLS module.",
        "On-chain recording of engagement via Solana.",
        "Dashboard display of engagement metrics.",
        "Campaign participation and tracking flow.",
    ]:
        story.append(Paragraph("\u2022 " + item, BULLET))
    story.append(Paragraph(
        "<b>Result:</b> All functionalities executed successfully; the "
        "system behaved as expected.", BODY))

    story.append(Paragraph("6.2.2 Security Testing", H3))
    for item in [
        "Submission of invalid or tampered proofs (all rejected).",
        "Attempt to submit duplicate engagement proofs (rejected by rule 6 "
        "of the pipeline).",
        "Verification of user authenticity (sybil resistance via wallet-"
        "gated participation).",
    ]:
        story.append(Paragraph("\u2022 " + item, BULLET))
    story.append(Paragraph(
        "<b>Result:</b> The system rejected all invalid and duplicate proofs, "
        "ensuring secure and reliable engagement verification.", BODY))

    story.append(Paragraph("6.2.3 Performance Testing", H3))
    for item in [
        "Proof verification completed within seconds.",
        "On-chain transaction time on Solana Devnet was below 1 second "
        "(confirmed commitment, observed 400\u2013800 ms).",
        "Dashboard updates were near real-time.",
    ]:
        story.append(Paragraph("\u2022 " + item, BULLET))
    story.append(Paragraph(
        "<b>Result:</b> The system demonstrated high performance and low "
        "latency, suitable for real-world applications.", BODY))

    story.append(Paragraph("6.2.4 Data-Integrity Testing", H3))
    for item in [
        "Verification of on-chain immutability.",
        "Validation of consistent data storage across Postgres + Arweave.",
        "Ensuring no modification of recorded engagement.",
    ]:
        story.append(Paragraph("\u2022 " + item, BULLET))
    story.append(Paragraph(
        "<b>Result:</b> All data stored on the blockchain and Arweave "
        "remained secure, permanent, and unalterable.", BODY))

    story.append(Paragraph("6.2.5 Automated Test Suite (Vitest)", H3))
    story.append(Paragraph(
        "A Vitest suite runs on every push via GitHub Actions CI. It covers "
        "payout delta math, settlement-window routing, mode derivation, "
        "terms builders, ban evaluation, and Reclaim adapter parsing:",
        BODY,
    ))
    vitest = [
        ["Test File", "Cases", "Focus"],
        ["payouts.test.ts",          "11", "Delta math across 4 payout models"],
        ["settlement.test.ts",        "9", "Join/Final routing, 7-day window"],
        ["terms.test.ts",             "8", "buildTermsMessage fixture match"],
        ["trust.test.ts",             "7", "3-strike ban evaluation"],
        ["verify.test.ts",            "6", "13-rule disqualification pipeline"],
        ["reclaim-adapters.test.ts",  "4", "Instagram / YT / X / TikTok parse"],
        ["Total",                    "45", "All passing on CI"],
    ]
    t = Table(vitest, colWidths=[5 * cm, 2 * cm, 9 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), MINT),
        ("TEXTCOLOR", (0, 0), (-1, 0), DARK),
        ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 11),
        ("FONT", (0, 1), (-1, -1), "Helvetica", 10),
        ("FONT", (0, 1), (0, -1), "Courier", 10),
        ("ALIGN", (1, 0), (1, -1), "CENTER"),
        ("GRID", (0, 0), (-1, -1), 0.3, RULE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
        ("FONT", (0, -1), (-1, -1), "Helvetica-Bold", 10),
        ("BACKGROUND", (0, -1), (-1, -1), BG_LIGHT),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t)

    story.append(Paragraph("6.3 Test Cases and Results", H2))
    tc = [
        ["Test Case ID", "Test Description", "Expected Result", "Status"],
        ["TC01", "Proof generation (Reclaim SDK)",      "Valid proof created",        "Pass"],
        ["TC02", "Proof verification (zkTLS)",          "Valid proof accepted",       "Pass"],
        ["TC03", "Invalid proof submission",            "Proof rejected",             "Pass"],
        ["TC04", "Duplicate engagement proof",          "Duplicate rejected",         "Pass"],
        ["TC05", "On-chain recording (Solana)",         "Data stored successfully",   "Pass"],
        ["TC06", "Dashboard real-time update",          "Real-time data display",     "Pass"],
        ["TC07", "Missed 7-day window",                 "Creator auto-disqualified",  "Pass"],
        ["TC08", "Delta-aware payout (re-submission)",  "Only \u0394v paid",          "Pass"],
        ["TC09", "3-strike ban enforcement",            "Banned wallet blocked",      "Pass"],
        ["TC10", "SIWS authentication",                 "Session cookie issued",      "Pass"],
    ]
    t = Table(tc, colWidths=[2 * cm, 6 * cm, 5.5 * cm, 2.5 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PURPLE),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 10),
        ("FONT", (0, 1), (-1, -1), "Helvetica", 9),
        ("FONT", (0, 1), (0, -1), "Courier-Bold", 9),
        ("FONT", (3, 1), (3, -1), "Helvetica-Bold", 9),
        ("TEXTCOLOR", (3, 1), (3, -1), colors.HexColor("#059669")),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("ALIGN", (3, 0), (3, -1), "CENTER"),
        ("GRID", (0, 0), (-1, -1), 0.3, RULE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t)

    story.append(Paragraph("6.4 System Results", H2))
    for item in [
        "Successful verification of genuine engagement using cryptographic "
        "proofs.",
        "Effective detection and rejection of fake or tampered interactions "
        "via all 13 disqualification rules.",
        "Real-time recording of engagement data on the Solana blockchain.",
        "Accurate and dynamic dashboard updates based on verified data.",
        "Delta-aware payout math preventing re-submission double-spends.",
        "Successful auto-enforcement of the 3-strike ban policy.",
    ]:
        story.append(Paragraph("\u2022 " + item, BULLET))

    story.append(Paragraph("6.5 Discussion", H2))
    story.append(Paragraph(
        "The results clearly indicate that DASHH provides a robust solution "
        "to the trust problem in digital advertising. By combining Reclaim "
        "Protocol, zkTLS verification, and the Solana blockchain, the system "
        "ensures that all engagement is authentic, verifiable, and tamper-"
        "proof.", BODY))
    story.append(Paragraph(
        "The system effectively addresses key industry challenges: fake "
        "engagement generated by bots, lack of transparency in centralised "
        "systems, delayed or unreliable analytics, and dependency on "
        "intermediaries. The introduction of the two-proof verification "
        "model ensures that engagement is validated over time, preventing "
        "incorrect payouts due to temporary or manipulated metrics.", BODY))

    story.append(Paragraph("6.6 Summary", H2))
    story.append(Paragraph(
        "This chapter confirms that DASHH is a secure, efficient, and "
        "scalable system capable of transforming digital advertising. The "
        "testing results validate that the system can capture, verify, and "
        "store engagement data reliably, making it a strong candidate for "
        "real-world deployment in decentralised advertising ecosystems.",
        BODY,
    ))
    story.append(PageBreak())


def build_ch7(story):
    _chapter(story, 7, "Conclusion and Scope of Future Work")

    story.append(Paragraph("7.1 Conclusion", H2))
    for p in [
        "The development of DASHH demonstrates that a decentralised, on-"
        "chain advertising platform can effectively address the major "
        "challenges present in traditional digital-advertising systems. By "
        "integrating the Reclaim Protocol, zkTLS-based verification, and the "
        "Solana blockchain, the system ensures that user engagement is "
        "authentic, verifiable, and tamper-proof.",
        "The implementation of the two-stage verification model (Join Proof "
        "and Final Proof) plays a crucial role in solving the fundamental "
        "trust problem in influencer marketing. This approach ensures that "
        "only genuine and stable engagement metrics are considered before "
        "executing payouts, thereby eliminating the risk of fraudulent or "
        "bot-generated interactions.",
        "The 13-rule disqualification pipeline, 3-strike ban policy, and "
        "delta-aware payout math collectively provide a fair, deterministic, "
        "and transparent ecosystem for both brands and creators. The "
        "integration of Arweave for permanent proof anchoring extends data "
        "integrity guarantees beyond the lifespan of the DASHH platform "
        "itself.",
        "The system successfully demonstrates the ability to capture real "
        "Web-2 engagement, verify it using cryptographic proofs, and record "
        "it on-chain in real time. The testing and results \u2014 including "
        "a 45-case Vitest suite, 10 end-to-end test cases, and live devnet "
        "transactions \u2014 confirm that the platform delivers high "
        "performance, security, and reliability, making it a practical "
        "solution for modern advertising needs.",
        "Overall, DASHH represents a significant step toward building a "
        "trustless, transparent, and efficient digital-advertising ecosystem, "
        "where decision-making is based on verifiable data rather than "
        "assumptions or centralised control.",
    ]:
        story.append(Paragraph(p, BODY))

    story.append(Paragraph("7.2 Scope of Future Work", H2))
    story.append(Paragraph(
        "Several directions have been identified for extending DASHH beyond "
        "the scope of this phase:", BODY))
    for idx, (title, desc) in enumerate([
        ("Migration to Solana mainnet-beta",
         "The current deployment runs on Devnet with a "
         "<code>SystemProgram.transfer</code> stand-in for escrow. The next "
         "milestone is a production-grade PDA-owned escrow program in "
         "Anchor with verifier signatures, deployed on mainnet."),
        ("On-chain governance of platform fee",
         "The 20% fee is currently a compile-time constant. A future version "
         "will migrate it to an SPL-token-gated governance vote, letting the "
         "community adjust the fee within a hard-coded corridor."),
        ("Expanded platform adapter library",
         "Beyond Instagram, YouTube, X, and TikTok, adapters for LinkedIn, "
         "Twitch, Reddit, and Spotify would widen brand reach. Each requires "
         "a corresponding Reclaim provider."),
        ("Creator tier system with reputation NFTs",
         "Long-running creators with a clean strike record should unlock "
         "higher-paying tiers, represented as non-transferable reputation "
         "NFTs tied to the wallet."),
        ("KYC / AML flow for regulated markets",
         "For brands operating in jurisdictions with strict advertising "
         "regulations, a pluggable KYC / AML layer is required \u2014 gated "
         "per-campaign, not per-platform."),
        ("Multi-chain expansion",
         "A LayerZero or Wormhole bridge would allow brands holding USDC on "
         "Ethereum or Base to escrow without first swapping to SOL."),
        ("Mobile application",
         "A React Native companion app with in-app Reclaim zkTLS flow would "
         "remove the current QR-code handoff for creators using mobile social "
         "apps."),
        ("Machine-learning fraud signals",
         "Extend the 13-rule pipeline with a probabilistic model trained on "
         "historical proof data, catching subtle bot patterns invisible to "
         "rule-based detection."),
        ("Open SDK for third-party dashboards",
         "Expose the Drizzle + Next.js API as a versioned REST SDK so "
         "agencies and analytics vendors can build on top of DASHH without "
         "forking the monorepo."),
        ("Carbon-neutral settlement proof",
         "Partner with a carbon-offset provider so each SOL settlement "
         "emits a signed receipt proving its emissions have been offset \u2014 "
         "a selling point for ESG-conscious brands."),
    ], 1):
        story.append(Paragraph(
            f"<b>{idx}. {title}.</b> {desc}", BULLET))

    story.append(Paragraph("7.3 Closing Remarks", H2))
    story.append(Paragraph(
        "DASHH proves that the combination of zero-knowledge verification, "
        "deterministic disqualification rules, and programmable settlement "
        "can replace the opaque, intermediary-heavy stack that dominates "
        "today\u2019s influencer-marketing industry. The work presented in "
        "this report is not an endpoint but a foundation \u2014 the "
        "architecture is modular, the rule engine is data-driven, and the "
        "on-chain surface is minimal. Future teams can extend any one of "
        "these surfaces without disturbing the others, which is the defining "
        "property of a platform rather than a product.",
        BODY,
    ))
    story.append(PageBreak())


def build_appendix(story):
    story.append(Paragraph("APPENDIX", COVER_TITLE))
    story.append(spacer(0.3 * cm))

    story.append(Paragraph("A. Deployment Details", H2))
    dep = [
        ["Attribute", "Value"],
        ["Production URL",      "https://dashhnew.vercel.app"],
        ["Source repository",   "https://github.com/alphoder/Dashhnew"],
        ["Solana cluster",      "Devnet"],
        ["Neon DB region",      "us-east-1 (AWS)"],
        ["Reclaim App ID",      "0x4f5C9d\u20262696A3"],
        ["Hosting",             "Vercel (Hobby tier)"],
        ["Cron schedule",       "/api/v2/sync \u2014 daily; /api/v2/settle \u2014 daily"],
    ]
    t = Table(dep, colWidths=[4.5 * cm, 11.5 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PURPLE),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 11),
        ("FONT", (0, 1), (-1, -1), "Helvetica", 10),
        ("FONT", (0, 1), (0, -1), "Helvetica-Bold", 10),
        ("GRID", (0, 0), (-1, -1), 0.3, RULE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(t)

    story.append(Paragraph("B. Environment Variables (redacted)", H2))
    env = [
        "DATABASE_URL=postgresql://*****@ep-*.neon.tech/neondb",
        "SIWS_SESSION_SECRET=*****",
        "NEXT_PUBLIC_APP_URL=https://dashhnew.vercel.app",
        "NEXT_PUBLIC_SOLANA_CLUSTER=devnet",
        "NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com",
        "SOLANA_RECIPIENT_ADDRESS=8vbaCLhg1SZmiGNZfFzV2DEJHenFtdgg7G2JtY5v74i1",
        "NEXT_PUBLIC_RECLAIM_APP_ID=0x4f5C9d\u20262696A3",
        "NEXT_PUBLIC_RECLAIM_APP_SECRET=*****",
        "NEXT_PUBLIC_RECLAIM_PROVIDER_ID_INSTAGRAM=65e26669-\u20266a4fadfbefb1",
        "NEXT_PUBLIC_RECLAIM_PROVIDER_ID_YOUTUBE=c4f06d5f-\u2026253bd9807c81",
        "NEXT_PUBLIC_RECLAIM_PROVIDER_ID_TWITTER=e6fe962d-\u20263d21c88bd64a",
        "NEXT_PUBLIC_RECLAIM_PROVIDER_ID_TIKTOK=9ec60ce1-\u2026865f9782a09c",
    ]
    code_style = ParagraphStyle(
        "code", parent=BODY, fontName="Courier", fontSize=9,
        leading=12, textColor=INK, leftIndent=12,
    )
    for line in env:
        story.append(Paragraph(line, code_style))
    story.append(spacer(0.4 * cm))

    story.append(Paragraph("C. Project Statistics", H2))
    stats = [
        ["Metric", "Value"],
        ["Total TypeScript files",           "100+"],
        ["Lines of code (src/)",             "17,000+"],
        ["Server API routes",                "25+ under /api/v2/"],
        ["Database tables (Drizzle schema)", "6 (all _v2 suffixed)"],
        ["Unit-test cases (Vitest)",         "45 across 6 test files"],
        ["End-to-end test cases",            "10 (documented in Ch. 6)"],
        ["Disqualification rules",           "13 deterministic"],
        ["Payout models supported",          "4 (per-view, top-perf, top-N, equal)"],
        ["Seeded demo campaigns",            "8 campaigns / 5 creators / 23 proofs"],
        ["Reclaim platform adapters",        "4 (IG / YT / X / TikTok)"],
    ]
    t = Table(stats, colWidths=[7 * cm, 9 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), MINT),
        ("TEXTCOLOR", (0, 0), (-1, 0), DARK),
        ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 11),
        ("FONT", (0, 1), (-1, -1), "Helvetica", 10),
        ("FONT", (0, 1), (0, -1), "Helvetica-Bold", 10),
        ("GRID", (0, 0), (-1, -1), 0.3, RULE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(t)
    story.append(PageBreak())


def build_references(story):
    story.append(Paragraph("REFERENCES", COVER_TITLE))
    story.append(spacer(0.3 * cm))
    refs = [
        "Yakovenko, A. (2017). <i>Solana: A New Architecture for a High-"
        "Performance Blockchain</i>. Solana Whitepaper. "
        "https://solana.com/solana-whitepaper.pdf",
        "Anza Labs (2024). <i>Solana Developer Documentation</i>. "
        "https://solana.com/docs",
        "Reclaim Protocol (2024). <i>zkTLS \u2014 Technical Whitepaper &amp; "
        "Developer Guide</i>. https://reclaimprotocol.org",
        "Goldwasser, S., Micali, S., Rackoff, C. (1985). <i>The knowledge "
        "complexity of interactive proof systems</i>. SIAM Journal on "
        "Computing, 18(1), 186\u2013208.",
        "Phantom Technologies (2024). <i>Phantom Wallet Adapter &amp; "
        "Integration Guide</i>. https://docs.phantom.app",
        "Vercel Inc. (2024). <i>Next.js 14 App Router &amp; Server Components "
        "Documentation</i>. https://nextjs.org/docs",
        "Drizzle Team (2024). <i>Drizzle ORM \u2014 TypeScript SQL Toolkit</i>. "
        "https://orm.drizzle.team/",
        "Neon Inc. (2024). <i>Serverless Postgres Documentation</i>. "
        "https://neon.tech/docs",
        "Arweave Foundation (2023). <i>Permanent Data Storage &amp; Bundlr / "
        "Irys On-chain Anchoring</i>. https://arweave.org",
        "Tailwind Labs (2024). <i>Tailwind CSS \u2014 Utility-First CSS "
        "Framework Documentation</i>. https://tailwindcss.com/docs",
        "Lucide (2024). <i>Lucide React \u2014 Open-Source Icon Library</i>. "
        "https://lucide.dev",
        "shadcn (2024). <i>shadcn/ui \u2014 Component library built on Radix "
        "Primitives &amp; Tailwind CSS</i>. https://ui.shadcn.com",
        "Framer (2024). <i>Framer Motion \u2014 Production-ready animation "
        "library for React</i>. https://www.framer.com/motion/",
        "Pressman, R. S., Maxim, B. R. (2020). <i>Software Engineering: "
        "A Practitioner\u2019s Approach</i> (9th ed.). McGraw-Hill Education.",
        "Sommerville, I. (2016). <i>Software Engineering</i> (10th ed.). "
        "Pearson.",
        "IEEE Std 829-2008. <i>IEEE Standard for Software and System Test "
        "Documentation</i>.",
        "Solana Actions &amp; Blinks Specification (2024). Solana Labs. "
        "https://solana.com/docs/advanced/actions",
        "W3C (2021). <i>Decentralized Identifiers (DIDs) v1.0 \u2014 W3C "
        "Recommendation</i>. https://www.w3.org/TR/did-core/",
    ]
    ref_style = ParagraphStyle(
        "ref", parent=BODY, fontSize=10, leading=14, spaceAfter=5,
        leftIndent=14, bulletIndent=0,
    )
    for i, r in enumerate(refs, 1):
        story.append(Paragraph(f"[{i}] {r}", ref_style))
    story.append(PageBreak())


# ───────────────────────── Main ─────────────────────────

def main():
    out = "/Users/vedantsingh/Documents/Projects/Dashh/major-project-/docs/PROJECT_REPORT.pdf"
    doc = SimpleDocTemplate(
        out,
        pagesize=A4,
        leftMargin=2.2 * cm,
        rightMargin=2.2 * cm,
        topMargin=2.2 * cm,
        bottomMargin=2.2 * cm,
        title="DASHH — Project Report 2025-26",
        author="Saksham, Sanjeet, Vedant, Vivek, Yatharth",
    )
    story = []
    build_cover(story)
    build_recommendation(story)
    build_certificate(story)
    build_declaration(story)
    build_acknowledgement(story)
    build_abstract(story)
    build_toc(story)
    build_list_of_symbols(story)
    build_list_of_abbreviations(story)
    build_ch1(story)
    build_ch2(story)
    build_ch3(story)
    build_ch4(story)
    build_ch5(story)
    build_ch6(story)
    build_ch7(story)
    build_appendix(story)
    build_references(story)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
