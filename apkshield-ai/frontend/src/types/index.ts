// TypeScript types for APKShield AI

export type ScanStatus = 'pending' | 'analyzing' | 'complete' | 'error';
export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical' | 'Unknown';

export interface ScanListItem {
  id: number;
  filename: string;
  file_size: number | null;
  file_hash: string | null;
  upload_time: string;
  status: ScanStatus;
  risk_score: number | null;
  severity: SeverityLevel | null;
  package_name: string | null;
}

export interface SuspiciousString {
  string: string;
  pattern: string;
  description: string;
}

export interface DangerousApiCall {
  api: string;
  found_in: string;
}

export interface StaticFindings {
  analyzer: string;
  package_name: string;
  app_name: string;
  version_name: string;
  version_code: string;
  min_sdk: string;
  target_sdk: string;
  permissions: string[];
  dangerous_permissions: string[];
  activities: string[];
  services: string[];
  receivers: string[];
  providers: string[];
  urls: string[];
  suspicious_strings: SuspiciousString[];
  dangerous_api_calls: DangerousApiCall[];
  total_strings_scanned: number;
  note?: string;
}

export interface DetectedBehavior {
  behavior: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  mitre_technique: string;
  trigger: string;
  confidence: number;
}

export interface DynamicFindings {
  sandbox: string;
  simulation_time_ms: number;
  detected_behaviors: DetectedBehavior[];
  behavior_count: number;
  network_connections: string[];
  files_created: string[];
  execution_trace: { timestamp: string; event: string; details: string }[];
  syscalls_monitored: number;
  api_calls_intercepted: number;
}

export interface BehaviorExplanation {
  behavior: string;
  severity: string;
  explanation: string;
  mitre: string;
  confidence: number;
}

export interface AIReport {
  model: string;
  executive_summary: string;
  threat_classification: string;
  behavior_explanations: BehaviorExplanation[];
  code_behavior_analysis: string;
  recommendations: string[];
  ioc_summary: {
    hardcoded_urls: string[];
    dangerous_permissions: string[];
    critical_behaviors: string[];
  };
}

export interface ScanDetail extends ScanListItem {
  static_findings: StaticFindings | null;
  dynamic_findings: DynamicFindings | null;
  ai_report: AIReport | null;
  error_message: string | null;
}

export interface UploadResponse {
  scan_id: number;
  filename: string;
  message: string;
}

export interface AnalysisResponse {
  scan_id: number;
  status: string;
  message: string;
}
