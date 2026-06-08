"""
Upload Router — handles APK file uploads
"""
import hashlib
import os
import shutil

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from database import get_db
from models import Scan, ScanStatus, UploadResponse

router = APIRouter()

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB
UPLOAD_DIR = "uploads"


@router.post("/upload", response_model=UploadResponse, status_code=201)
async def upload_apk(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Upload an Android APK file for analysis.
    - Validates .apk extension and 50 MB size limit.
    - Saves file and creates a DB scan record.
    - Returns a scan_id for subsequent analysis calls.
    """
    # ── Validate extension ─────────────────────────────────────────────────────
    if not file.filename or not file.filename.lower().endswith(".apk"):
        raise HTTPException(status_code=400, detail="Only .apk files are accepted.")

    # ── Read file and validate size ────────────────────────────────────────────
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum allowed size is 50 MB.",
        )

    # ── Compute SHA-256 hash ───────────────────────────────────────────────────
    file_hash = hashlib.sha256(content).hexdigest()

    # ── Persist file to disk ───────────────────────────────────────────────────
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    dest_path = os.path.join(UPLOAD_DIR, f"{file_hash}.apk")
    with open(dest_path, "wb") as f:
        f.write(content)

    # ── Create DB record ───────────────────────────────────────────────────────
    scan = Scan(
        filename=file.filename,
        file_size=len(content),
        file_hash=file_hash,
        status=ScanStatus.PENDING,
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    return UploadResponse(
        scan_id=scan.id,
        filename=scan.filename,
        message="File uploaded successfully. Call /api/analyze/{scan_id} to start analysis.",
    )
