from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import Response
from bson import ObjectId
from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

from app.auth import get_current_user
from app.database import get_db

router = APIRouter(prefix="/api", tags=["pdf"])

# ── Colors ───────────────────────────────────────────────────────────
INDIGO      = colors.HexColor("#6366f1")
INDIGO_LIGHT= colors.HexColor("#eef2ff")
RED         = colors.HexColor("#ef4444")
RED_LIGHT   = colors.HexColor("#fef2f2")
AMBER       = colors.HexColor("#f59e0b")
AMBER_LIGHT = colors.HexColor("#fffbeb")
GREEN       = colors.HexColor("#22c55e")
GREEN_LIGHT = colors.HexColor("#f0fdf4")
PURPLE      = colors.HexColor("#a855f7")
PURPLE_LIGHT= colors.HexColor("#faf5ff")
BLUE        = colors.HexColor("#3b82f6")
BLUE_LIGHT  = colors.HexColor("#eff6ff")
DARK        = colors.HexColor("#111827")
GRAY        = colors.HexColor("#6b7280")
LIGHT_GRAY  = colors.HexColor("#f9fafb")
BORDER_GRAY = colors.HexColor("#e5e7eb")
WHITE       = colors.white


def score_color(score: int):
    if score >= 80: return GREEN
    if score >= 60: return AMBER
    if score >= 40: return colors.HexColor("#f97316")
    return RED


def score_label(score: int):
    if score >= 80: return "Great"
    if score >= 60: return "Fair"
    if score >= 40: return "Risky"
    return "Critical"


def severity_color(severity: str):
    s = severity.upper()
    if s == "HIGH":   return RED,   RED_LIGHT
    if s == "MEDIUM": return AMBER, AMBER_LIGHT
    return GREEN, GREEN_LIGHT


@router.get("/review/{review_id}/pdf")
async def export_pdf(
    review_id: str,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()

    doc = await db.reviews.find_one({
        "_id": ObjectId(review_id),
        "user_id": current_user["user_id"],
    })

    if not doc:
        raise HTTPException(status_code=404, detail="Review not found.")

    from bson import ObjectId as OID
    user = await db.users.find_one({"_id": OID(current_user["user_id"])})
    reviewer_name = user.get("full_name") or user.get("username", "Unknown")

    pdf_bytes = generate_pdf(doc, reviewer_name)

    filename = f"review_{doc['repo'].replace('/', '_')}_PR{doc['pr_number']}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


def generate_pdf(doc: dict, reviewer_name: str) -> bytes:
    buffer = BytesIO()
    page_w, page_h = A4

    pdf = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=20*mm, rightMargin=20*mm,
        topMargin=15*mm, bottomMargin=15*mm,
    )

    styles = getSampleStyleSheet()
    story = []

    def S(name, **kw):
        return ParagraphStyle(name, **kw)

    h1 = S("H1", fontSize=18, textColor=DARK, fontName="Helvetica-Bold", leading=24)
    h2 = S("H2", fontSize=14, textColor=DARK, fontName="Helvetica-Bold", leading=20)
    body = S("Body", fontSize=10, textColor=GRAY, fontName="Helvetica", leading=14)
    small = S("Small", fontSize=8, textColor=GRAY, fontName="Helvetica")

    score = doc.get("overall_score", 50)
    bugs = doc.get("bugs", [])
    security = doc.get("security", [])
    complexity = doc.get("complexity", [])
    style_issues = doc.get("style", [])

    # ── Header ───────────────────────────────────────────────────────
    story.append(Paragraph("ReviewAI - Code Audit Report", h1))
    story.append(Spacer(1, 10))

    story.append(Paragraph(f"<b>Repository:</b> {doc.get('repo','')}", body))
    story.append(Paragraph(f"<b>PR #:</b> {doc.get('pr_number','')}", body))
    story.append(Paragraph(f"<b>Author:</b> @{doc.get('author','')}", body))
    story.append(Paragraph(f"<b>Reviewed By:</b> {reviewer_name}", body))
    story.append(Spacer(1, 10))

    # ── Score ────────────────────────────────────────────────────────
    story.append(Paragraph(f"<b>Score:</b> {score} ({score_label(score)})", h2))
    story.append(Spacer(1, 10))

    # ── Summary ──────────────────────────────────────────────────────
    story.append(Paragraph("<b>Summary</b>", h2))
    story.append(Paragraph(doc.get("summary", "No summary provided."), body))
    story.append(Spacer(1, 10))

    # ── Bugs ─────────────────────────────────────────────────────────
    story.append(Paragraph(f"<b>Bugs ({len(bugs)})</b>", h2))
    if not bugs:
        story.append(Paragraph("No bugs found.", body))
    else:
        for bug in bugs:
            story.append(Paragraph(
                f"Line {bug.get('line')} - {bug.get('description')} ({bug.get('severity')})",
                body
            ))
    story.append(Spacer(1, 10))

    # ── Security ─────────────────────────────────────────────────────
    story.append(Paragraph(f"<b>Security Issues ({len(security)})</b>", h2))
    if not security:
        story.append(Paragraph("No security issues found.", body))
    else:
        for sec in security:
            story.append(Paragraph(
                f"Line {sec.get('line')} - {sec.get('issue')} | Fix: {sec.get('fix')}",
                body
            ))
    story.append(Spacer(1, 10))

    # ── Complexity ───────────────────────────────────────────────────
    story.append(Paragraph(f"<b>Complexity Issues ({len(complexity)})</b>", h2))
    if not complexity:
        story.append(Paragraph("No complexity issues.", body))
    else:
        for cx in complexity:
            story.append(Paragraph(
                f"{cx.get('function')} - {cx.get('suggestion')}",
                body
            ))
    story.append(Spacer(1, 10))

    # ── Style ────────────────────────────────────────────────────────
    story.append(Paragraph(f"<b>Style Issues ({len(style_issues)})</b>", h2))
    if not style_issues:
        story.append(Paragraph("No style issues.", body))
    else:
        for s in style_issues:
            story.append(Paragraph(s.get("description"), body))

    story.append(Spacer(1, 20))
    story.append(Paragraph(
        f"Generated on {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC",
        small
    ))

    # ── BUILD PDF ────────────────────────────────────────────────────
    pdf.build(story)

    buffer.seek(0)   # ✅ CRITICAL FIX
    pdf_bytes = buffer.getvalue()
    buffer.close()

    return pdf_bytes