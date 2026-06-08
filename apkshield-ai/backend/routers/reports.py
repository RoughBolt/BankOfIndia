"""
Reports Router — PDF and JSON report generation
"""
import json
import os
from datetime import datetime
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from fpdf import FPDF
from sqlalchemy.orm import Session

from database import get_db
from models import Scan, ScanStatus

router = APIRouter()


class APKShieldPDF(FPDF):
    """Custom FPDF subclass for APKShield branded reports."""

    def header(self):
        self.set_fill_color(15, 23, 42)
        self.rect(0, 0, 210, 30, "F")
        self.set_font("Helvetica", "B", 18)
        self.set_text_color(99, 102, 241)
        self.cell(0, 15, "APKShield AI", ln=True, align="C")
        self.set_font("Helvetica", "", 10)
        self.set_text_color(148, 163, 184)
        self.cell(0, 8, "Automated Malware Analysis Report", ln=True, align="C")
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(148, 163, 184)
        self.cell(0, 10, f"Page {self.page_no()} | APKShield AI — Confidential", align="C")

    def section_title(self, title: str):
        self.set_fill_color(30, 41, 59)
        self.set_text_color(99, 102, 241)
        self.set_font("Helvetica", "B", 12)
        self.cell(0, 10, f"  {title}", ln=True, fill=True)
        self.ln(2)

    def kv_row(self, key: str, value: str, danger: bool = False):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(148, 163, 184)
        self.cell(55, 7, key)
        self.set_font("Helvetica", "", 10)
        self.set_text_color(239, 68, 68 if danger else 226, 232 if not danger else 240)
        self.cell(0, 7, str(value)[:90], ln=True)

    def bullet_item(self, text: str, danger: bool = False):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(239, 68, 68) if danger else self.set_text_color(203, 213, 225)
        self.cell(8, 6, "•")
        self.cell(0, 6, str(text)[:100], ln=True)

    def paragraph(self, text: str):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(203, 213, 225)
        self.multi_cell(0, 6, text)
        self.ln(2)


SEVERITY_COLORS = {
    "Low": (34, 197, 94),
    "Medium": (234, 179, 8),
    "High": (249, 115, 22),
    "Critical": (239, 68, 68),
    "Unknown": (148, 163, 184),
}


def generate_pdf(scan: Scan) -> bytes:
    static = scan.get_static_findings()
    dynamic = scan.get_dynamic_findings()
    ai_rep = scan.get_ai_report()
    severity = scan.severity or "Unknown"
    sev_color = SEVERITY_COLORS.get(severity, (148, 163, 184))

    pdf = APKShieldPDF()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    # ── Cover Summary ──────────────────────────────────────────────────────────
    pdf.set_fill_color(15, 23, 42)
    pdf.rect(0, 30, 210, 297, "F")

    pdf.section_title("Scan Summary")
    pdf.kv_row("File Name:", scan.filename)
    pdf.kv_row("Package:", scan.package_name or "N/A")
    pdf.kv_row("SHA-256:", scan.file_hash or "N/A")
    pdf.kv_row("Scan Date:", scan.upload_time.strftime("%Y-%m-%d %H:%M UTC") if scan.upload_time else "N/A")
    pdf.kv_row("Status:", scan.status)
    pdf.ln(3)

    # Risk Score Badge
    score = int(scan.risk_score or 0)
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(*sev_color)
    pdf.cell(0, 10, f"Risk Score: {score}/100  |  Severity: {severity}", ln=True, align="C")
    pdf.ln(5)

    # ── Executive Summary ──────────────────────────────────────────────────────
    if ai_rep.get("executive_summary"):
        pdf.section_title("Executive Summary")
        pdf.paragraph(ai_rep["executive_summary"])

    # ── Permissions ───────────────────────────────────────────────────────────
    if static.get("permissions"):
        pdf.section_title("Requested Permissions")
        dangerous = set(static.get("dangerous_permissions", []))
        for perm in static["permissions"][:30]:
            short = perm.replace("android.permission.", "")
            pdf.bullet_item(short, danger=(perm in dangerous))

    # ── Static Findings ────────────────────────────────────────────────────────
    pdf.section_title("Static Analysis Findings")
    pdf.kv_row("Activities:", str(len(static.get("activities", []))))
    pdf.kv_row("Services:", str(len(static.get("services", []))))
    pdf.kv_row("Receivers:", str(len(static.get("receivers", []))))
    pdf.kv_row("Hardcoded URLs:", str(len(static.get("urls", []))))
    pdf.kv_row("Suspicious Strings:", str(len(static.get("suspicious_strings", []))))
    pdf.kv_row("Dangerous API Calls:", str(len(static.get("dangerous_api_calls", []))))

    if static.get("urls"):
        pdf.ln(2)
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(148, 163, 184)
        pdf.cell(0, 7, "Hardcoded URLs/IPs:", ln=True)
        for url in static["urls"][:10]:
            pdf.bullet_item(url, danger=True)

    # ── Dynamic Findings ───────────────────────────────────────────────────────
    pdf.section_title("Dynamic Analysis (Simulated)")
    for behavior in dynamic.get("detected_behaviors", []):
        pdf.bullet_item(f"[{behavior['severity']}] {behavior['description']}", danger=behavior["severity"] in ("HIGH", "CRITICAL"))

    # ── Recommendations ────────────────────────────────────────────────────────
    if ai_rep.get("recommendations"):
        pdf.section_title("Remediation Recommendations")
        for i, rec in enumerate(ai_rep["recommendations"], 1):
            pdf.bullet_item(f"{i}. {rec}")

    return bytes(pdf.output())


@router.get("/report/{scan_id}/json")
def download_json_report(scan_id: int, db: Session = Depends(get_db)):
    """Download a complete JSON report for the given scan."""
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found.")
    if scan.status != ScanStatus.COMPLETE:
        raise HTTPException(status_code=400, detail="Analysis not yet complete.")

    report = {
        "apkshield_version": "1.0.0",
        "generated_at": datetime.utcnow().isoformat(),
        "scan_id": scan.id,
        "filename": scan.filename,
        "package_name": scan.package_name,
        "sha256": scan.file_hash,
        "file_size_bytes": scan.file_size,
        "risk_score": scan.risk_score,
        "severity": scan.severity,
        "static_findings": scan.get_static_findings(),
        "dynamic_findings": scan.get_dynamic_findings(),
        "ai_report": scan.get_ai_report(),
    }

    return JSONResponse(
        content=report,
        headers={"Content-Disposition": f'attachment; filename="apkshield_scan_{scan_id}.json"'},
    )


@router.get("/report/{scan_id}/pdf")
def download_pdf_report(scan_id: int, db: Session = Depends(get_db)):
    """Generate and download a branded PDF report for the given scan."""
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found.")
    if scan.status != ScanStatus.COMPLETE:
        raise HTTPException(status_code=400, detail="Analysis not yet complete.")

    pdf_bytes = generate_pdf(scan)

    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="apkshield_report_{scan_id}.pdf"'},
    )
