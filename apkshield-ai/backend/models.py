"""
ORM Models and Pydantic Schemas for APKShield AI
"""
import json
from datetime import datetime
from enum import Enum as PyEnum
from typing import Any, Optional

from pydantic import BaseModel
from sqlalchemy import Column, DateTime, Float, Integer, String, Text, func

from database import Base


# ── Enums ─────────────────────────────────────────────────────────────────────
class ScanStatus(str, PyEnum):
    PENDING = "pending"
    ANALYZING = "analyzing"
    COMPLETE = "complete"
    ERROR = "error"


class SeverityLevel(str, PyEnum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"
    UNKNOWN = "Unknown"


# ── ORM Model ─────────────────────────────────────────────────────────────────
class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=True)
    file_hash = Column(String(64), nullable=True)          # SHA-256
    upload_time = Column(DateTime, server_default=func.now())
    status = Column(String(20), default=ScanStatus.PENDING)
    
    # Analysis results stored as JSON strings
    static_findings = Column(Text, nullable=True)
    dynamic_findings = Column(Text, nullable=True)
    ai_report = Column(Text, nullable=True)

    risk_score = Column(Float, nullable=True)
    severity = Column(String(20), nullable=True)
    package_name = Column(String(255), nullable=True)
    error_message = Column(Text, nullable=True)

    def get_static_findings(self) -> dict:
        return json.loads(self.static_findings) if self.static_findings else {}

    def get_dynamic_findings(self) -> dict:
        return json.loads(self.dynamic_findings) if self.dynamic_findings else {}

    def get_ai_report(self) -> dict:
        return json.loads(self.ai_report) if self.ai_report else {}


# ── Pydantic Schemas ───────────────────────────────────────────────────────────
class ScanBase(BaseModel):
    filename: str


class ScanCreate(ScanBase):
    file_size: Optional[int] = None
    file_hash: Optional[str] = None


class ScanListItem(BaseModel):
    id: int
    filename: str
    file_size: Optional[int]
    file_hash: Optional[str]
    upload_time: datetime
    status: str
    risk_score: Optional[float]
    severity: Optional[str]
    package_name: Optional[str]

    class Config:
        from_attributes = True


class ScanDetail(ScanListItem):
    static_findings: Optional[dict[str, Any]] = None
    dynamic_findings: Optional[dict[str, Any]] = None
    ai_report: Optional[dict[str, Any]] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


class UploadResponse(BaseModel):
    scan_id: int
    filename: str
    message: str


class AnalysisResponse(BaseModel):
    scan_id: int
    status: str
    message: str
