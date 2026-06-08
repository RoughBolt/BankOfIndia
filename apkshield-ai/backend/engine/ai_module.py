"""
AI Module — Pluggable LLM interface for APKShield AI.
Provides MockLLM (no API key required) and stubs for Gemini/OpenAI.
"""
import os
import textwrap
from typing import Any


# ── Base Interface ─────────────────────────────────────────────────────────────
class BaseLLM:
    def generate_report(
        self,
        filename: str,
        static_findings: dict[str, Any],
        dynamic_findings: dict[str, Any],
        risk_score: float,
        severity: str,
    ) -> dict[str, Any]:
        raise NotImplementedError


# ── Mock LLM (template-based, no API key required) ────────────────────────────
class MockLLM(BaseLLM):
    """
    Template-based AI report generator. Produces realistic executive summaries
    and remediation recommendations without requiring an LLM API key.
    """

    SEVERITY_INTROS = {
        "Critical": (
            "⚠️ CRITICAL THREAT DETECTED — This application exhibits highly malicious characteristics "
            "consistent with advanced Android malware. Immediate containment is strongly advised."
        ),
        "High": (
            "🔴 HIGH RISK — This application demonstrates several dangerous behaviors that indicate "
            "potential malware activity. Do not install or run on production devices."
        ),
        "Medium": (
            "🟡 MEDIUM RISK — This application exhibits suspicious behaviors that warrant further "
            "investigation. Exercise caution before deployment."
        ),
        "Low": (
            "🟢 LOW RISK — This application appears relatively benign based on automated analysis. "
            "Some minor concerns were noted for review."
        ),
        "Unknown": (
            "⚪ ANALYSIS INCOMPLETE — Risk level could not be determined. Manual review is recommended."
        ),
    }

    def generate_report(
        self,
        filename: str,
        static_findings: dict[str, Any],
        dynamic_findings: dict[str, Any],
        risk_score: float,
        severity: str,
    ) -> dict[str, Any]:
        permissions = static_findings.get("permissions", [])
        dangerous_perms = static_findings.get("dangerous_permissions", [])
        behaviors = dynamic_findings.get("detected_behaviors", [])
        urls = static_findings.get("urls", [])
        package = static_findings.get("package_name", "unknown")
        critical_behaviors = [b for b in behaviors if b.get("severity") in ("CRITICAL", "HIGH")]

        intro = self.SEVERITY_INTROS.get(severity, self.SEVERITY_INTROS["Unknown"])

        # Build executive summary
        summary_parts = [intro, ""]
        summary_parts.append(
            f"Analysis of '{filename}' (package: {package}) yielded a risk score of "
            f"{risk_score}/100, classified as {severity} severity."
        )
        if dangerous_perms:
            perm_list = ", ".join(p.replace("android.permission.", "") for p in dangerous_perms[:5])
            summary_parts.append(
                f"\nThe application requests {len(permissions)} permissions, including {len(dangerous_perms)} "
                f"dangerous permissions: {perm_list}."
            )
        if critical_behaviors:
            beh_list = ", ".join(b["behavior"] for b in critical_behaviors[:4])
            summary_parts.append(
                f"\nDynamic simulation detected {len(behaviors)} suspicious behaviors including: {beh_list}."
            )
        if urls:
            summary_parts.append(
                f"\n{len(urls)} hardcoded URLs/IP addresses were found in the application binary, "
                "suggesting potential C2 communication infrastructure."
            )

        executive_summary = " ".join(summary_parts)

        # Build behavior explanation
        behavior_explanations = []
        for b in behaviors[:6]:
            mitre = b.get("mitre_technique", "")
            behavior_explanations.append({
                "behavior": b["behavior"],
                "severity": b["severity"],
                "explanation": b["description"],
                "mitre": mitre,
                "confidence": b.get("confidence", 80),
            })

        # Build code behavior analysis
        code_analysis = self._build_code_analysis(static_findings)

        # Build recommendations
        recommendations = self._build_recommendations(dangerous_perms, behaviors, urls, severity)

        return {
            "model": "APKShield MockLLM v1.0",
            "executive_summary": executive_summary,
            "threat_classification": self._classify_threat(behaviors, dangerous_perms),
            "behavior_explanations": behavior_explanations,
            "code_behavior_analysis": code_analysis,
            "recommendations": recommendations,
            "ioc_summary": {
                "hardcoded_urls": urls[:10],
                "dangerous_permissions": dangerous_perms,
                "critical_behaviors": [b["behavior"] for b in critical_behaviors],
            },
        }

    def _classify_threat(self, behaviors: list[dict], dangerous_perms: list[str]) -> str:
        behavior_names = {b["behavior"] for b in behaviors}
        if "SMS_READ" in behavior_names or "DEVICE_ADMIN" in behavior_names:
            return "Spyware / Trojan"
        if "CREDENTIAL_HARVEST" in behavior_names or "OVERLAY_ATTACK" in behavior_names:
            return "Banking Trojan / Credential Stealer"
        if "NETWORK_EXFILTRATION" in behavior_names and "AUDIO_RECORDING" in behavior_names:
            return "Advanced Persistent Threat (APT) Component"
        if "C2_COMMUNICATION" in behavior_names:
            return "Remote Access Trojan (RAT)"
        if "PERSISTENCE" in behavior_names:
            return "Adware / Potentially Unwanted Application (PUA)"
        if len(dangerous_perms) > 5:
            return "Potentially Unwanted Application (PUA)"
        return "Suspicious Application — Manual Review Required"

    def _build_code_analysis(self, static_findings: dict) -> str:
        parts = []
        sus_strings = static_findings.get("suspicious_strings", [])
        if sus_strings:
            parts.append(
                f"Static analysis identified {len(sus_strings)} suspicious code patterns including "
                "hardcoded credentials, obfuscated strings, and potentially dangerous API usage. "
                "These are common indicators of malicious intent or poor security practices."
            )
        apis = static_findings.get("dangerous_api_calls", [])
        if apis:
            parts.append(
                f"The application invokes {len(apis)} dangerous Android API calls including reflection, "
                "runtime execution, and telephony management APIs that are frequently abused by malware."
            )
        return " ".join(parts) if parts else "No significant code behavior anomalies detected in static analysis."

    def _build_recommendations(
        self,
        dangerous_perms: list[str],
        behaviors: list[dict],
        urls: list[str],
        severity: str,
    ) -> list[str]:
        recs = []
        if severity in ("Critical", "High"):
            recs.append("Immediately quarantine and do not install this application on any device.")
            recs.append("Report the APK hash to your threat intelligence platform and blacklist all identified C2 URLs.")
        if "android.permission.READ_SMS" in dangerous_perms:
            recs.append("Block SMS-reading applications via MDM policy unless explicitly authorized by IT security.")
        if "android.permission.BIND_DEVICE_ADMIN" in dangerous_perms:
            recs.append("Revoke device administrator privileges immediately and perform a factory reset if installed.")
        if any(b["behavior"] == "OVERLAY_ATTACK" for b in behaviors):
            recs.append("Enable 'Display over other apps' monitoring via MDM. Disable this permission for untrusted apps.")
        if urls:
            recs.append(f"Block {len(urls)} identified hardcoded IPs/URLs at the network firewall level.")
        recs.append("Submit the APK to a secondary analysis platform (VirusTotal, Hybrid Analysis) for cross-validation.")
        recs.append("Review application signing certificate and compare against known malware signing key databases.")
        if severity == "Low":
            recs.append("Monitor network traffic from this application during a controlled testing period.")
        return recs


# ── Gemini Stub ────────────────────────────────────────────────────────────────
class GeminiLLM(BaseLLM):
    """
    Gemini API integration stub.
    Set GEMINI_API_KEY environment variable to activate.
    """

    def __init__(self, api_key: str):
        self.api_key = api_key

    def generate_report(self, filename, static_findings, dynamic_findings, risk_score, severity):
        # TODO: Implement Gemini API call
        # from google import genai
        # client = genai.Client(api_key=self.api_key)
        # prompt = self._build_prompt(filename, static_findings, dynamic_findings, risk_score, severity)
        # response = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
        # return self._parse_response(response.text)
        raise NotImplementedError("Gemini integration not yet activated. Set GEMINI_API_KEY.")


# ── OpenAI Stub ────────────────────────────────────────────────────────────────
class OpenAILLM(BaseLLM):
    """
    OpenAI API integration stub.
    Set OPENAI_API_KEY environment variable to activate.
    """

    def __init__(self, api_key: str):
        self.api_key = api_key

    def generate_report(self, filename, static_findings, dynamic_findings, risk_score, severity):
        # TODO: Implement OpenAI API call
        # from openai import OpenAI
        # client = OpenAI(api_key=self.api_key)
        # ...
        raise NotImplementedError("OpenAI integration not yet activated. Set OPENAI_API_KEY.")


# ── Factory ────────────────────────────────────────────────────────────────────
def get_ai_module() -> BaseLLM:
    """
    Returns the appropriate AI module based on available API keys.
    Priority: Gemini > OpenAI > MockLLM
    """
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        return GeminiLLM(gemini_key)

    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        return OpenAILLM(openai_key)

    return MockLLM()
