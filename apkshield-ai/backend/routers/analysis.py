"""
Analysis Router — triggers and retrieves APK analysis results
"""
import json
import os

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import AnalysisResponse, Scan, ScanDetail, ScanListItem, ScanStatus
from engine.static_analyzer import StaticAnalyzer
from engine.dynamic_analyzer import DynamicAnalyzer
from engine.threat_scorer import ThreatScorer
from engine.ai_module import get_ai_module

router = APIRouter()

UPLOAD_DIR = "uploads"


def run_full_analysis(scan_id: int, db: Session):
    """Full analysis pipeline: Static → Dynamic → Scoring → AI."""
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        return

    try:
        scan.status = ScanStatus.ANALYZING
        db.commit()

        apk_path = os.path.join(UPLOAD_DIR, f"{scan.file_hash}.apk")

        # ── 1. Static Analysis ─────────────────────────────────────────────────
        static_analyzer = StaticAnalyzer(apk_path)
        static_findings = static_analyzer.analyze()

        # ── 2. Dynamic Analysis (Simulated) ───────────────────────────────────
        dynamic_analyzer = DynamicAnalyzer(static_findings)
        dynamic_findings = dynamic_analyzer.simulate()

        # ── 3. Threat Scoring ─────────────────────────────────────────────────
        scorer = ThreatScorer(static_findings, dynamic_findings)
        risk_score, severity = scorer.score()

        # ── 4. AI Summary ─────────────────────────────────────────────────────
        ai = get_ai_module()
        ai_report = ai.generate_report(
            filename=scan.filename,
            static_findings=static_findings,
            dynamic_findings=dynamic_findings,
            risk_score=risk_score,
            severity=severity,
        )

        # ── 5. Persist results ─────────────────────────────────────────────────
        scan.static_findings = json.dumps(static_findings)
        scan.dynamic_findings = json.dumps(dynamic_findings)
        scan.ai_report = json.dumps(ai_report)
        scan.risk_score = risk_score
        scan.severity = severity
        scan.package_name = static_findings.get("package_name", "unknown")
        scan.status = ScanStatus.COMPLETE

    except Exception as exc:
        scan.status = ScanStatus.ERROR
        scan.error_message = str(exc)
    finally:
        db.commit()


@router.post("/analyze/{scan_id}", response_model=AnalysisResponse)
def start_analysis(
    scan_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Trigger full analysis pipeline for an uploaded APK.
    Analysis runs asynchronously. Poll /api/scan/{scan_id} for results.
    """
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found.")
    if scan.status == ScanStatus.ANALYZING:
        raise HTTPException(status_code=409, detail="Analysis already in progress.")

    background_tasks.add_task(run_full_analysis, scan_id, db)

    return AnalysisResponse(
        scan_id=scan_id,
        status="analyzing",
        message="Analysis started. Poll /api/scan/{scan_id} for results.",
    )


@router.get("/scan/{scan_id}", response_model=ScanDetail)
def get_scan(scan_id: int, db: Session = Depends(get_db)):
    """Retrieve full scan results including all analysis findings."""
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found.")

    result = ScanDetail(
        id=scan.id,
        filename=scan.filename,
        file_size=scan.file_size,
        file_hash=scan.file_hash,
        upload_time=scan.upload_time,
        status=scan.status,
        risk_score=scan.risk_score,
        severity=scan.severity,
        package_name=scan.package_name,
        static_findings=scan.get_static_findings(),
        dynamic_findings=scan.get_dynamic_findings(),
        ai_report=scan.get_ai_report(),
        error_message=scan.error_message,
    )
    return result


@router.get("/scans", response_model=list[ScanListItem])
def list_scans(db: Session = Depends(get_db)):
    """List all past scans ordered by most recent first."""
    scans = db.query(Scan).order_by(Scan.upload_time.desc()).all()
    return [
        ScanListItem(
            id=s.id,
            filename=s.filename,
            file_size=s.file_size,
            file_hash=s.file_hash,
            upload_time=s.upload_time,
            status=s.status,
            risk_score=s.risk_score,
            severity=s.severity,
            package_name=s.package_name,
        )
        for s in scans
    ]
