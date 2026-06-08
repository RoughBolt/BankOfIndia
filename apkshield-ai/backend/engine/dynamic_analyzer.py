"""
Dynamic Analyzer (Simulated Sandbox)
Generates realistic execution traces and behavioral detections based on
static findings. For MVP: simulates what a real sandbox would report.
"""
import random
from datetime import datetime, timedelta
from typing import Any


# ── Behavior templates ─────────────────────────────────────────────────────────
BEHAVIOR_RULES = [
    {
        "trigger_permissions": ["android.permission.READ_SMS", "android.permission.RECEIVE_SMS"],
        "behavior": "SMS_READ",
        "description": "Application accessed SMS inbox and read message content.",
        "severity": "CRITICAL",
        "mitre": "T1412 - Capture SMS Messages",
    },
    {
        "trigger_permissions": ["android.permission.SEND_SMS"],
        "behavior": "SMS_SEND",
        "description": "Application sent SMS messages to premium-rate numbers without user interaction.",
        "severity": "HIGH",
        "mitre": "T1582 - SMS Control",
    },
    {
        "trigger_permissions": ["android.permission.READ_CONTACTS", "android.permission.WRITE_CONTACTS"],
        "behavior": "CONTACT_ACCESS",
        "description": "Application enumerated device contacts and uploaded them to external server.",
        "severity": "HIGH",
        "mitre": "T1636.003 - Contact List",
    },
    {
        "trigger_permissions": ["android.permission.INTERNET"],
        "behavior": "NETWORK_EXFILTRATION",
        "description": "Application established connection to external C2 server and transmitted encrypted payload.",
        "severity": "CRITICAL",
        "mitre": "T1041 - Exfiltration Over C2 Channel",
    },
    {
        "trigger_permissions": ["android.permission.ACCESS_FINE_LOCATION", "android.permission.ACCESS_COARSE_LOCATION"],
        "behavior": "LOCATION_TRACKING",
        "description": "Application continuously tracked device GPS location in background.",
        "severity": "HIGH",
        "mitre": "T1430 - Location Tracking",
    },
    {
        "trigger_permissions": ["android.permission.CAMERA"],
        "behavior": "CAMERA_ACCESS",
        "description": "Application accessed device camera without visible UI interaction.",
        "severity": "HIGH",
        "mitre": "T1512 - Video Capture",
    },
    {
        "trigger_permissions": ["android.permission.RECORD_AUDIO"],
        "behavior": "AUDIO_RECORDING",
        "description": "Application activated microphone and recorded audio in background.",
        "severity": "CRITICAL",
        "mitre": "T1429 - Capture Audio",
    },
    {
        "trigger_permissions": ["android.permission.GET_ACCOUNTS"],
        "behavior": "CREDENTIAL_HARVEST",
        "description": "Application enumerated device accounts and extracted authentication tokens.",
        "severity": "CRITICAL",
        "mitre": "T1634 - Credentials from Password Store",
    },
    {
        "trigger_permissions": ["android.permission.WRITE_EXTERNAL_STORAGE", "android.permission.READ_EXTERNAL_STORAGE"],
        "behavior": "FILE_OPERATIONS",
        "description": "Application created hidden files and directories on external storage.",
        "severity": "MEDIUM",
        "mitre": "T1532 - Archive Collected Data",
    },
    {
        "trigger_permissions": ["android.permission.RECEIVE_BOOT_COMPLETED"],
        "behavior": "PERSISTENCE",
        "description": "Application registered boot receiver for persistent background execution.",
        "severity": "HIGH",
        "mitre": "T1624.001 - Boot or Logon Initialization Scripts",
    },
    {
        "trigger_permissions": ["android.permission.READ_PHONE_STATE", "android.permission.READ_CALL_LOG"],
        "behavior": "CALL_LOG_ACCESS",
        "description": "Application read call history and device IMEI for device fingerprinting.",
        "severity": "HIGH",
        "mitre": "T1636.002 - Call Log",
    },
    {
        "trigger_permissions": ["android.permission.BIND_DEVICE_ADMIN"],
        "behavior": "DEVICE_ADMIN",
        "description": "Application requested device administrator privileges to prevent uninstallation.",
        "severity": "CRITICAL",
        "mitre": "T1629.003 - Disable or Modify Tools",
    },
    {
        "trigger_permissions": ["android.permission.SYSTEM_ALERT_WINDOW"],
        "behavior": "OVERLAY_ATTACK",
        "description": "Application drew overlay windows to intercept user input (tapjacking / credential theft).",
        "severity": "CRITICAL",
        "mitre": "T1417 - Input Capture",
    },
]

# ── URL-triggered behaviors ────────────────────────────────────────────────────
URL_NETWORK_BEHAVIOR = {
    "behavior": "C2_COMMUNICATION",
    "description": "Application contacted hardcoded IP/URL — potential Command & Control server.",
    "severity": "HIGH",
    "mitre": "T1437 - Application Layer Protocol",
}


class DynamicAnalyzer:
    def __init__(self, static_findings: dict[str, Any]):
        self.static = static_findings

    def simulate(self) -> dict[str, Any]:
        permissions = set(self.static.get("permissions", []))
        urls = self.static.get("urls", [])
        dangerous_apis = self.static.get("dangerous_api_calls", [])

        detected_behaviors: list[dict] = []
        execution_trace: list[dict] = []
        network_connections: list[str] = []
        files_created: list[str] = []
        start_time = datetime.utcnow()

        # ── Match permission-based behaviors ─────────────────────────────────
        for rule in BEHAVIOR_RULES:
            if any(p in permissions for p in rule["trigger_permissions"]):
                detected_behaviors.append({
                    "behavior": rule["behavior"],
                    "description": rule["description"],
                    "severity": rule["severity"],
                    "mitre_technique": rule["mitre"],
                    "trigger": rule["trigger_permissions"][0],
                    "confidence": random.randint(75, 98),
                })

                # Add execution trace entries
                t = start_time + timedelta(seconds=random.randint(1, 60))
                execution_trace.append({
                    "timestamp": t.isoformat(),
                    "event": rule["behavior"],
                    "details": rule["description"],
                })

        # ── URL-triggered network behavior ────────────────────────────────────
        if urls:
            detected_behaviors.append({**URL_NETWORK_BEHAVIOR, "confidence": random.randint(80, 95)})
            network_connections = [u for u in urls[:5]]

        # ── File operations from suspicious strings ───────────────────────────
        if self.static.get("suspicious_strings"):
            suspicious_count = len(self.static["suspicious_strings"])
            if suspicious_count > 2:
                files_created = [
                    "/data/data/com.malware/files/.hidden_data",
                    "/sdcard/.cache/upload_queue.dat",
                    f"/data/data/com.malware/shared_prefs/{random.randint(1000,9999)}.xml",
                ]

        # ── API-based behaviors ────────────────────────────────────────────────
        api_behaviors = []
        for api_finding in dangerous_apis:
            api = api_finding.get("api", "")
            if "Runtime" in api or "exec" in api:
                api_behaviors.append({
                    "behavior": "SHELL_EXECUTION",
                    "description": "Application executed shell commands via Runtime.exec().",
                    "severity": "CRITICAL",
                    "mitre_technique": "T1623 - Command and Scripting Interpreter",
                    "trigger": api,
                    "confidence": 90,
                })
                break

        detected_behaviors.extend(api_behaviors)

        return {
            "sandbox": "APKShield SimSandbox v1.0",
            "simulation_time_ms": random.randint(2500, 8000),
            "detected_behaviors": detected_behaviors,
            "behavior_count": len(detected_behaviors),
            "network_connections": network_connections,
            "files_created": files_created,
            "execution_trace": execution_trace[:20],
            "syscalls_monitored": random.randint(5000, 25000),
            "api_calls_intercepted": random.randint(50, 400),
        }
