"""
Static Analyzer — extracts manifest, permissions, components, URLs, strings,
and dangerous API call patterns from a real Android APK using androguard.
Falls back to a minimal ZIP-based parser if androguard is unavailable.
"""
import re
import zipfile
from typing import Any

# ── Dangerous permission definitions ──────────────────────────────────────────
DANGEROUS_PERMISSIONS = {
    "android.permission.READ_SMS",
    "android.permission.RECEIVE_SMS",
    "android.permission.SEND_SMS",
    "android.permission.READ_CONTACTS",
    "android.permission.WRITE_CONTACTS",
    "android.permission.READ_CALL_LOG",
    "android.permission.CAMERA",
    "android.permission.RECORD_AUDIO",
    "android.permission.ACCESS_FINE_LOCATION",
    "android.permission.ACCESS_COARSE_LOCATION",
    "android.permission.READ_EXTERNAL_STORAGE",
    "android.permission.WRITE_EXTERNAL_STORAGE",
    "android.permission.GET_ACCOUNTS",
    "android.permission.USE_BIOMETRIC",
    "android.permission.USE_FINGERPRINT",
    "android.permission.PROCESS_OUTGOING_CALLS",
    "android.permission.READ_PHONE_STATE",
    "android.permission.CALL_PHONE",
    "android.permission.BIND_DEVICE_ADMIN",
    "android.permission.SYSTEM_ALERT_WINDOW",
}

# ── Suspicious string patterns ─────────────────────────────────────────────────
SUSPICIOUS_PATTERNS = [
    (r"(?i)(password|passwd|pwd|secret|api_?key|token|credential)", "Hardcoded credential keyword"),
    (r"(?i)exec\s*\(", "Shell exec call"),
    (r"(?i)Runtime\.getRuntime\(\)", "Runtime execution"),
    (r"(?i)(su|sudo)\s+", "Root/sudo invocation"),
    (r"(?i)Base64\.decode", "Base64 decoding (possible obfuscation)"),
    (r"(?i)\.encrypt\(|\.decrypt\(|AES|DES|RSA", "Cryptographic operation"),
    (r"(?i)reflection|getDeclaredMethod|invoke\(", "Java reflection"),
    (r"(?i)TelephonyManager|getDeviceId|getSubscriberId", "Device ID harvesting"),
    (r"(?i)sendTextMessage|SmsManager", "SMS sending"),
    (r"(?i)getContentResolver.*contacts", "Contact access"),
    (r"(?i)keylogger|keylog", "Keylogger reference"),
    (r"(?i)BankAccount|CreditCard|CVV", "Banking/card data reference"),
    (r"(?i)ContentValues.*password|SharedPreferences.*pass", "Credential storage"),
]

# ── Dangerous API patterns ─────────────────────────────────────────────────────
DANGEROUS_API_PATTERNS = [
    "Ljava/lang/Runtime;->exec",
    "Landroid/telephony/SmsManager;->sendTextMessage",
    "Landroid/telephony/TelephonyManager;->getDeviceId",
    "Landroid/telephony/TelephonyManager;->getSubscriberId",
    "Ljava/lang/reflect/Method;->invoke",
    "Landroid/content/ContentResolver;->query",
    "Ljava/net/URL;->openConnection",
    "Landroid/accounts/AccountManager;->getAccounts",
    "Ljava/io/FileOutputStream;-><init>",
    "Landroid/app/admin/DevicePolicyManager",
    "Ljava/lang/ProcessBuilder;->start",
    "Landroid/location/LocationManager;->requestLocationUpdates",
]

# ── URL / IP Patterns ──────────────────────────────────────────────────────────
URL_PATTERN = re.compile(
    r'https?://[^\s\'"<>]{5,}|'
    r'\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\b'
)


class StaticAnalyzer:
    def __init__(self, apk_path: str):
        self.apk_path = apk_path

    def analyze(self) -> dict[str, Any]:
        try:
            return self._analyze_with_androguard()
        except Exception:
            return self._analyze_with_zipfile()

    # ── Androguard-powered analysis ────────────────────────────────────────────
    def _analyze_with_androguard(self) -> dict[str, Any]:
        from androguard.misc import AnalyzeAPK

        apk, dexs, analysis = AnalyzeAPK(self.apk_path)

        permissions = list(apk.get_permissions())
        dangerous_perms = [p for p in permissions if p in DANGEROUS_PERMISSIONS]

        activities = list(apk.get_activities())
        services = list(apk.get_services())
        receivers = list(apk.get_receivers())
        providers = list(apk.get_providers())

        # Extract strings from all dex files
        all_strings: list[str] = []
        for dex in dexs:
            all_strings.extend(dex.get_strings())

        urls = list({m.group(0) for s in all_strings for m in [URL_PATTERN.search(s)] if m})
        suspicious_strings = self._find_suspicious_strings(all_strings)

        # Dangerous API calls
        dangerous_apis: list[dict] = []
        for pattern in DANGEROUS_API_PATTERNS:
            cls_name = pattern.split(";->")[0] + ";"
            method = pattern.split(";->")[1] if ";->" in pattern else ""
            for clazz in analysis.get_classes():
                if cls_name in str(clazz.name):
                    for meth in clazz.get_methods():
                        dangerous_apis.append({
                            "api": pattern,
                            "found_in": str(clazz.name),
                        })
                        break

        return {
            "analyzer": "androguard",
            "package_name": apk.get_package(),
            "app_name": apk.get_app_name(),
            "version_name": apk.get_androidversion_name(),
            "version_code": apk.get_androidversion_code(),
            "min_sdk": apk.get_min_sdk_version(),
            "target_sdk": apk.get_target_sdk_version(),
            "permissions": permissions,
            "dangerous_permissions": dangerous_perms,
            "activities": activities[:20],
            "services": services[:20],
            "receivers": receivers[:20],
            "providers": providers[:20],
            "urls": urls[:30],
            "suspicious_strings": suspicious_strings[:30],
            "dangerous_api_calls": dangerous_apis[:30],
            "total_strings_scanned": len(all_strings),
        }

    # ── Fallback ZIP-based analysis (no androguard) ────────────────────────────
    def _analyze_with_zipfile(self) -> dict[str, Any]:
        permissions: list[str] = []
        activities: list[str] = []
        services: list[str] = []
        receivers: list[str] = []
        providers: list[str] = []
        urls: list[str] = []
        suspicious_strings: list[dict] = []
        dangerous_apis: list[dict] = []
        manifest_text = ""
        package_name = "unknown"
        version_name = "N/A"
        min_sdk = "N/A"
        target_sdk = "N/A"

        try:
            with zipfile.ZipFile(self.apk_path, "r") as zf:
                # Parse AndroidManifest.xml as binary (best-effort text search)
                try:
                    raw = zf.read("AndroidManifest.xml")
                    manifest_text = raw.decode("utf-8", errors="replace")
                except Exception:
                    pass

                # Scan all file entries for strings
                all_text_content: list[str] = [manifest_text]
                for name in zf.namelist():
                    if name.endswith((".dex", ".xml", ".json", ".txt", ".js")):
                        try:
                            content = zf.read(name).decode("utf-8", errors="replace")
                            all_text_content.append(content)
                        except Exception:
                            pass

                combined = "\n".join(all_text_content)

                # Extract URLs
                urls = list(set(URL_PATTERN.findall(combined)))[:30]

                # Extract suspicious strings
                suspicious_strings = self._find_suspicious_strings(all_text_content)[:30]

                # Check dangerous API patterns
                for pattern in DANGEROUS_API_PATTERNS:
                    if pattern.replace(";->", "/").replace("Landroid", "android") in combined or pattern in combined:
                        dangerous_apis.append({"api": pattern, "found_in": "dex"})

        except Exception:
            pass

        # Best-effort manifest parsing (binary APK manifests are AXML encoded;
        # text extraction is approximate but useful for demo)
        perm_matches = re.findall(r'android\.permission\.\w+', manifest_text)
        permissions = list(set(perm_matches))
        dangerous_perms = [p for p in permissions if p in DANGEROUS_PERMISSIONS]

        pkg_match = re.search(r'package="([^"]+)"', manifest_text)
        if pkg_match:
            package_name = pkg_match.group(1)

        return {
            "analyzer": "zipfile-fallback",
            "package_name": package_name,
            "app_name": package_name.split(".")[-1] if "." in package_name else package_name,
            "version_name": version_name,
            "version_code": "N/A",
            "min_sdk": min_sdk,
            "target_sdk": target_sdk,
            "permissions": permissions,
            "dangerous_permissions": dangerous_perms,
            "activities": activities,
            "services": services,
            "receivers": receivers,
            "providers": providers,
            "urls": urls,
            "suspicious_strings": suspicious_strings,
            "dangerous_api_calls": dangerous_apis,
            "total_strings_scanned": 0,
            "note": "Androguard unavailable; partial analysis via ZIP inspection.",
        }

    def _find_suspicious_strings(self, strings: list[str]) -> list[dict]:
        found: list[dict] = []
        seen: set[str] = set()
        for s in strings:
            if not isinstance(s, str):
                continue
            for pattern, description in SUSPICIOUS_PATTERNS:
                match = re.search(pattern, s)
                if match and s[:80] not in seen:
                    seen.add(s[:80])
                    found.append({
                        "string": s[:120],
                        "pattern": pattern,
                        "description": description,
                    })
        return found
