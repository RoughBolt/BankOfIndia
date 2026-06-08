# APKShield AI 🛡️

**Automated Malware Analysis Platform for Android APK Files**

APKShield AI is a full-stack MVP that lets cybersecurity analysts upload suspicious APK files and receive automated threat assessment, risk scores, malware classification, and AI-powered investigation reports.

---

## 📐 Architecture

```
apkshield-ai/
├── backend/                       # FastAPI Python backend
│   ├── main.py                    # Application entry point + CORS
│   ├── database.py                # SQLite via SQLAlchemy
│   ├── models.py                  # ORM models + Pydantic schemas
│   ├── routers/
│   │   ├── upload.py              # POST /api/upload
│   │   ├── analysis.py            # POST /api/analyze/{id}, GET /api/scan/{id}
│   │   └── reports.py             # GET /api/report/{id}/pdf|json
│   ├── engine/
│   │   ├── static_analyzer.py     # Real APK parsing via androguard
│   │   ├── dynamic_analyzer.py    # Simulated sandbox (MITRE ATT&CK mapped)
│   │   ├── threat_scorer.py       # Rule-based weighted scoring (0–100)
│   │   └── ai_module.py           # Pluggable LLM (Mock/Gemini/OpenAI)
│   ├── uploads/                   # Stored APK files (SHA-256 named)
│   ├── sample_data/
│   │   ├── mock_malware_dataset.json
│   │   └── create_sample_apks.py  # Generates demo APKs
│   ├── .env.example
│   └── requirements.txt
└── frontend/                      # React + TypeScript + Tailwind CSS
    └── src/
        ├── api/client.ts           # Axios API client
        ├── types/index.ts          # TypeScript type definitions
        ├── components/
        │   ├── Navbar.tsx
        │   ├── UploadZone.tsx      # Drag-and-drop with progress
        │   ├── RiskGauge.tsx       # Animated circular score
        │   ├── SeverityBadge.tsx   # Color-coded severity
        │   ├── PermissionList.tsx  # Permission rows with risk icons
        │   └── FindingCard.tsx     # Collapsible finding card
        └── pages/
            ├── UploadPage.tsx      # Hero + upload flow
            ├── DashboardPage.tsx   # Scan history table
            └── ScanDetailPage.tsx  # Full scan results (4 tabs)
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm

### 1. Backend Setup

```bash
cd apkshield-ai/backend

# Install dependencies
pip install -r requirements.txt

# (Optional) Copy and configure environment
cp .env.example .env

# Start the backend
python3 -m uvicorn main:app --reload --port 8000
```

The API will be available at: http://localhost:8000
Interactive API docs: http://localhost:8000/docs

### 2. Frontend Setup

```bash
cd apkshield-ai/frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The UI will be available at: http://localhost:5173 (or next available port)

### 3. Generate Sample APKs (for demo)

```bash
cd apkshield-ai/backend
python3 sample_data/create_sample_apks.py
```

This creates 3 sample APK files in `backend/sample_data/`:
- `BankStealer_CRITICAL.apk` — Score ~100, Critical severity
- `SuspiciousAdware_HIGH.apk` — Score ~60-70, High severity
- `CleanCalendar_LOW.apk` — Score ~10, Low severity

---

## 📡 API Reference

### Upload APK
```
POST /api/upload
Content-Type: multipart/form-data

Body: file=<.apk file>

Response: { scan_id, filename, message }
```

### Start Analysis
```
POST /api/analyze/{scan_id}

Response: { scan_id, status, message }
```
Analysis runs asynchronously in the background. Poll the scan endpoint until `status == "complete"`.

### Get Scan Results
```
GET /api/scan/{scan_id}

Response: {
  id, filename, file_hash, risk_score, severity, status,
  static_findings: { package_name, permissions, dangerous_permissions,
                     activities, services, urls, suspicious_strings, ... },
  dynamic_findings: { detected_behaviors, network_connections, files_created, ... },
  ai_report: { executive_summary, threat_classification, recommendations, ... }
}
```

### List All Scans
```
GET /api/scans

Response: [ { id, filename, risk_score, severity, status, ... }, ... ]
```

### Download JSON Report
```
GET /api/report/{scan_id}/json
```

### Download PDF Report
```
GET /api/report/{scan_id}/pdf
```

---

## 🔬 Analysis Engine

### Static Analysis (`engine/static_analyzer.py`)
- Uses **androguard** for real APK parsing when available
- Falls back to ZIP-based inspection if androguard is unavailable
- Extracts: manifest metadata, all permissions, activities/services/receivers, hardcoded URLs/IPs, suspicious strings, dangerous API calls

### Dynamic Analysis — Simulated (`engine/dynamic_analyzer.py`)
- Generates behavioral detections based on static findings
- Maps to **MITRE ATT&CK Mobile** techniques
- Detects: SMS access, credential harvesting, overlay attacks, C2 communication, persistence, location tracking, audio recording

### Threat Scoring (`engine/threat_scorer.py`)

| Indicator | Score |
|-----------|-------|
| `READ_SMS` | +25 |
| `SEND_SMS` | +20 |
| `READ_CONTACTS` | +20 |
| `GET_ACCOUNTS` | +20 |
| `BIND_DEVICE_ADMIN` | +30 |
| `SYSTEM_ALERT_WINDOW` | +25 |
| `RECORD_AUDIO` | +15 |
| Suspicious URL (per, max 5) | +5 |
| Suspicious String (per, max 8) | +3 |
| Dynamic behavior CRITICAL | +20 |
| Dynamic behavior HIGH | +12 |

**Severity Thresholds:**
- `0–24` → Low 🟢
- `25–49` → Medium 🟡
- `50–74` → High 🟠
- `75–100` → Critical 🔴

### AI Module (`engine/ai_module.py`)
Pluggable interface — automatically selects:
1. **Gemini** — if `GEMINI_API_KEY` is set in `.env`
2. **OpenAI** — if `OPENAI_API_KEY` is set
3. **MockLLM** — always available, no API key required

---

## 🗄️ Database Schema

**Table: `scans`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `filename` | VARCHAR | Original APK filename |
| `file_size` | INTEGER | File size in bytes |
| `file_hash` | VARCHAR(64) | SHA-256 hash |
| `upload_time` | DATETIME | Upload timestamp |
| `status` | VARCHAR | pending / analyzing / complete / error |
| `static_findings` | TEXT | JSON blob of static analysis |
| `dynamic_findings` | TEXT | JSON blob of dynamic simulation |
| `ai_report` | TEXT | JSON blob of AI-generated report |
| `risk_score` | FLOAT | 0–100 |
| `severity` | VARCHAR | Low / Medium / High / Critical |
| `package_name` | VARCHAR | Android package name |
| `error_message` | TEXT | Error details if failed |

---

## 🔌 Adding Real LLM Support

### Gemini
```bash
# In backend/.env
GEMINI_API_KEY=your_key_here
```

Then update `engine/ai_module.py` → `GeminiLLM.generate_report()` with the Google GenAI SDK call.

### OpenAI
```bash
# In backend/.env
OPENAI_API_KEY=your_key_here
```

Then update `engine/ai_module.py` → `OpenAILLM.generate_report()`.

---

## 📸 Sample Workflow

1. Start both servers (backend + frontend)
2. Navigate to `http://localhost:5173`
3. Drag and drop `BankStealer_CRITICAL.apk` from `backend/sample_data/`
4. Click **Analyze APK**
5. View the investigation dashboard with:
   - Risk score: **100/100 — CRITICAL**
   - 9 permissions, 7+ dangerous
   - C2 URLs detected
   - Behavioral findings mapped to MITRE ATT&CK
   - AI executive summary: "Banking Trojan / Credential Stealer"
6. Download the PDF or JSON report

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS 3 (dark cyber theme) |
| HTTP | Axios |
| Routing | React Router v6 |
| Backend | Python 3.10+ + FastAPI |
| ASGI | Uvicorn |
| Database | SQLite via SQLAlchemy |
| APK Parsing | androguard 4.x |
| PDF Generation | fpdf2 |
| AI | MockLLM (built-in) / Gemini / OpenAI (stubs) |

---

## ⚠️ Disclaimer

This is an MVP for educational and hackathon purposes. The dynamic analysis is **simulated** — it does not execute APK files in a real sandbox. Do not rely on this tool for production security decisions.
