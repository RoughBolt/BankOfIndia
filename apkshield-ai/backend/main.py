"""
APKShield AI — FastAPI Backend Entry Point
"""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import engine, Base
from routers import upload, analysis, reports


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create DB tables and uploads directory on startup
    Base.metadata.create_all(bind=engine)
    os.makedirs("uploads", exist_ok=True)
    yield


app = FastAPI(
    title="APKShield AI",
    description="Automated Malware Analysis Platform for Android APK Files",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(analysis.router, prefix="/api", tags=["Analysis"])
app.include_router(reports.router, prefix="/api", tags=["Reports"])


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "APKShield AI", "version": "1.0.0"}
