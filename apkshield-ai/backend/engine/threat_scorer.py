"""
Threat Scorer — rule-based weighted malware scoring engine.
Produces a risk score 0–100 and a severity classification.
"""
from typing import Any


# ── Permission weight table ────────────────────────────────────────────────────
PERMISSION_WEIGHTS: dict[str, int] = {
    "android.permission.READ_SMS": 25,
    "android.permission.RECEIVE_SMS": 20,
    "android.permission.SEND_SMS": 20,
    "android.permission.READ_CONTACTS": 20,
    "android.permission.WRITE_CONTACTS": 15,
    "android.permission.READ_CALL_LOG": 18,
    "android.permission.CAMERA": 10,
    "android.permission.RECORD_AUDIO": 15,
    "android.permission.ACCESS_FINE_LOCATION": 15,
    "android.permission.ACCESS_COARSE_LOCATION": 10,
    "android.permission.GET_ACCOUNTS": 20,
    "android.permission.READ_EXTERNAL_STORAGE": 8,
    "android.permission.WRITE_EXTERNAL_STORAGE": 10,
    "android.permission.PROCESS_OUTGOING_CALLS": 15,
    "android.permission.READ_PHONE_STATE": 15,
    "android.permission.CALL_PHONE": 15,
    "android.permission.INTERNET": 5,
    "android.permission.RECEIVE_BOOT_COMPLETED": 10,
    "android.permission.BIND_DEVICE_ADMIN": 30,
    "android.permission.SYSTEM_ALERT_WINDOW": 25,
    "android.permission.USE_BIOMETRIC": 10,
    "android.permission.USE_FINGERPRINT": 10,
}

# ── Behavior weight table ──────────────────────────────────────────────────────
BEHAVIOR_WEIGHTS: dict[str, int] = {
    "CRITICAL": 20,
    "HIGH": 12,
    "MEDIUM": 6,
    "LOW": 2,
}

# ── Static indicator weights ───────────────────────────────────────────────────
URL_WEIGHT_PER = 5          # per hardcoded URL (capped)
SUSPICIOUS_STRING_PER = 3   # per suspicious string (capped)
DANGEROUS_API_PER = 4       # per dangerous API call (capped)

# ── Thresholds ─────────────────────────────────────────────────────────────────
SEVERITY_THRESHOLDS = [
    (75, "Critical"),
    (50, "High"),
    (25, "Medium"),
    (0, "Low"),
]


class ThreatScorer:
    def __init__(
        self,
        static_findings: dict[str, Any],
        dynamic_findings: dict[str, Any],
    ):
        self.static = static_findings
        self.dynamic = dynamic_findings
        self.score_breakdown: list[dict] = []

    def score(self) -> tuple[float, str]:
        total = 0.0

        # ── Permission scoring ────────────────────────────────────────────────
        for perm in self.static.get("permissions", []):
            weight = PERMISSION_WEIGHTS.get(perm, 0)
            if weight:
                total += weight
                self.score_breakdown.append({"source": "permission", "item": perm, "score": weight})

        # ── URL scoring ────────────────────────────────────────────────────────
        url_count = min(len(self.static.get("urls", [])), 5)
        url_score = url_count * URL_WEIGHT_PER
        if url_score:
            total += url_score
            self.score_breakdown.append({"source": "hardcoded_urls", "item": f"{url_count} URLs", "score": url_score})

        # ── Suspicious strings ─────────────────────────────────────────────────
        sus_count = min(len(self.static.get("suspicious_strings", [])), 8)
        sus_score = sus_count * SUSPICIOUS_STRING_PER
        if sus_score:
            total += sus_score
            self.score_breakdown.append({"source": "suspicious_strings", "item": f"{sus_count} strings", "score": sus_score})

        # ── Dangerous API calls ────────────────────────────────────────────────
        api_count = min(len(self.static.get("dangerous_api_calls", [])), 6)
        api_score = api_count * DANGEROUS_API_PER
        if api_score:
            total += api_score
            self.score_breakdown.append({"source": "dangerous_apis", "item": f"{api_count} API calls", "score": api_score})

        # ── Dynamic behavior scoring ───────────────────────────────────────────
        for behavior in self.dynamic.get("detected_behaviors", []):
            sev = behavior.get("severity", "LOW")
            weight = BEHAVIOR_WEIGHTS.get(sev, 0)
            if weight:
                total += weight
                self.score_breakdown.append({
                    "source": "dynamic_behavior",
                    "item": behavior.get("behavior", "UNKNOWN"),
                    "score": weight,
                })

        # ── Clamp to 0–100 ────────────────────────────────────────────────────
        final_score = min(max(round(total, 1), 0.0), 100.0)

        # ── Severity classification ────────────────────────────────────────────
        severity = "Low"
        for threshold, label in SEVERITY_THRESHOLDS:
            if final_score >= threshold:
                severity = label
                break

        return final_score, severity

    def get_breakdown(self) -> list[dict]:
        return self.score_breakdown
