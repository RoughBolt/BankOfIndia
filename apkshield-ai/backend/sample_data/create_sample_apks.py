#!/usr/bin/env python3
"""
APKShield AI — Sample APK Generator
Creates mock APK files for demo and testing purposes.
Usage: python3 create_sample_apk.py
"""
import io
import os
import zipfile

APKS = [
    {
        "name": "BankStealer_CRITICAL.apk",
        "manifest": b"""<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.android.systemupdate.service"
    android:versionCode="666" android:versionName="3.1.4">
    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33"/>
    <uses-permission android:name="android.permission.READ_SMS"/>
    <uses-permission android:name="android.permission.SEND_SMS"/>
    <uses-permission android:name="android.permission.READ_CONTACTS"/>
    <uses-permission android:name="android.permission.GET_ACCOUNTS"/>
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>
    <uses-permission android:name="android.permission.BIND_DEVICE_ADMIN"/>
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
    <uses-permission android:name="android.permission.CAMERA"/>
    <uses-permission android:name="android.permission.RECORD_AUDIO"/>
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
    <application android:label="SystemUpdate" android:icon="@drawable/ic_launcher">
        <activity android:name=".SplashActivity" android:exported="true"/>
        <service android:name=".StealthService" android:exported="false"/>
        <service android:name=".SMSInterceptor"/>
        <receiver android:name=".BootReceiver" android:exported="true">
            <intent-filter><action android:name="android.intent.action.BOOT_COMPLETED"/></intent-filter>
        </receiver>
        <receiver android:name=".SMSReceiver">
            <intent-filter><action android:name="android.provider.Telephony.SMS_RECEIVED"/></intent-filter>
        </receiver>
    </application>
</manifest>""",
        "dex_content": b"""
// Suspicious code indicators
password = "Sup3r$3cur3P4ss!"
api_key = "sk-live-abc123def456ghi789"
http://185.220.101.47:8080/gate.php
http://c2.malware-hq.ru/panel/admin/login
https://api.exfil-data.net/upload/credentials
http://93.184.216.200:4444/shell
Runtime.getRuntime().exec(new String[]{"su", "-c", "id"})
Base64.decode("aHR0cDovL21hbHdhcmUuZXhhbXBsZS5jb20vYzI=")
TelephonyManager.getDeviceId()
SmsManager.sendTextMessage("+19001234567", null, intercepted_sms, null, null)
getContentResolver().query(ContactsContract.Contacts.CONTENT_URI)
AccountManager.getAccounts()
Reflection.getDeclaredMethod("getSubscriberId")
""",
    },
    {
        "name": "SuspiciousAdware_HIGH.apk",
        "manifest": b"""<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.free.games.lucky.win"
    android:versionCode="12" android:versionName="2.0">
    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33"/>
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
    <uses-permission android:name="android.permission.READ_CONTACTS"/>
    <uses-permission android:name="android.permission.CAMERA"/>
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
    <uses-permission android:name="android.permission.READ_PHONE_STATE"/>
    <application android:label="Lucky Win Games">
        <activity android:name=".MainActivity" android:exported="true"/>
        <service android:name=".TrackingService"/>
        <receiver android:name=".BootReceiver" android:exported="true">
            <intent-filter><action android:name="android.intent.action.BOOT_COMPLETED"/></intent-filter>
        </receiver>
    </application>
</manifest>""",
        "dex_content": b"""
https://ads.trackme-network.com/click?uid=
https://collect.analytics-sdk.io/events
http://192.168.1.100:9090/report
LocationManager.requestLocationUpdates(GPS_PROVIDER)
TelephonyManager.getDeviceId()
""",
    },
    {
        "name": "CleanCalendar_LOW.apk",
        "manifest": b"""<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.cleancalendar"
    android:versionCode="5" android:versionName="1.2">
    <uses-sdk android:minSdkVersion="24" android:targetSdkVersion="33"/>
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.VIBRATE"/>
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
    <application android:label="Clean Calendar">
        <activity android:name=".MainActivity" android:exported="true"/>
        <service android:name=".SyncService"/>
    </application>
</manifest>""",
        "dex_content": b"""
https://api.cleancalendar.com/sync
// Standard Android calendar API usage
CalendarContract.Events.CONTENT_URI
""",
    },
]


def create_apk(name: str, manifest: bytes, dex_content: bytes) -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("AndroidManifest.xml", manifest)
        zf.writestr("classes.dex", dex_content)
        zf.writestr("resources.arsc", b"mock android resources")
        zf.writestr("META-INF/MANIFEST.MF", b"Manifest-Version: 1.0\n")
    return buf.getvalue()


if __name__ == "__main__":
    out_dir = os.path.join(os.path.dirname(__file__), "sample_data")
    os.makedirs(out_dir, exist_ok=True)
    
    for apk in APKS:
        data = create_apk(apk["name"], apk["manifest"], apk["dex_content"])
        path = os.path.join(out_dir, apk["name"])
        with open(path, "wb") as f:
            f.write(data)
        print(f"✅ Created {apk['name']} ({len(data):,} bytes)")
    
    print(f"\n🚀 Sample APKs saved to: {out_dir}/")
    print("Upload them via the APKShield AI web interface at http://localhost:5173")
