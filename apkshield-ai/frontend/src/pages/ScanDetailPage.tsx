import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Brain,
  Code2,
  Download,
  ExternalLink,
  FileJson,
  FileScan,
  Loader2,
  Network,
  Package,
  Shield,
  ShieldAlert,
  Terminal,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { getScan, downloadJSONReport, downloadPDFReport } from '../api/client';
import type { ScanDetail } from '../types';
import RiskGauge from '../components/RiskGauge';
import SeverityBadge from '../components/SeverityBadge';
import PermissionList from '../components/PermissionList';
import FindingCard from '../components/FindingCard';

type Tab = 'overview' | 'static' | 'dynamic' | 'ai';

const TAB_CONFIG: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <Shield size={15} /> },
  { id: 'static', label: 'Static Analysis', icon: <FileScan size={15} /> },
  { id: 'dynamic', label: 'Dynamic Analysis', icon: <Zap size={15} /> },
  { id: 'ai', label: 'AI Report', icon: <Brain size={15} /> },
];

const BEHAVIOR_COLORS: Record<string, string> = {
  CRITICAL: 'text-red-400 bg-red-500/10 border-red-500/25',
  HIGH: 'text-orange-400 bg-orange-500/10 border-orange-500/25',
  MEDIUM: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25',
  LOW: 'text-green-400 bg-green-500/10 border-green-500/25',
};

export default function ScanDetailPage() {
  const { scanId } = useParams<{ scanId: string }>();
  const [scan, setScan] = useState<ScanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchScan = useCallback(async () => {
    if (!scanId) return;
    try {
      const data = await getScan(Number(scanId));
      setScan(data);
      if (data.status === 'complete' || data.status === 'error') {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch {
      setError('Failed to load scan data.');
      if (pollRef.current) clearInterval(pollRef.current);
    } finally {
      setLoading(false);
    }
  }, [scanId]);

  useEffect(() => {
    fetchScan();
    // Poll every 2 seconds while analysis is in progress
    pollRef.current = setInterval(fetchScan, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchScan]);

  if (loading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center grid-bg">
        <div className="text-center text-cyber-muted">
          <Loader2 size={40} className="animate-spin mx-auto mb-4 text-cyber-accent" />
          <p>Loading scan results…</p>
        </div>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center grid-bg">
        <div className="glass-card p-8 text-center max-w-md">
          <AlertTriangle size={40} className="mx-auto mb-4 text-red-400" />
          <p className="text-red-400">{error || 'Scan not found.'}</p>
          <Link to="/" className="cyber-btn-primary mt-4 inline-flex">Back to Upload</Link>
        </div>
      </div>
    );
  }

  const isAnalyzing = scan.status === 'analyzing' || scan.status === 'pending';
  const sf = scan.static_findings;
  const df = scan.dynamic_findings;
  const ai = scan.ai_report;

  return (
    <div className="min-h-screen pt-16 grid-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back + Header */}
        <div className="mb-6 animate-fade-in">
          <Link to="/dashboard" className="flex items-center gap-1.5 text-sm text-cyber-muted hover:text-cyber-text mb-4 transition-colors">
            <ArrowLeft size={15} /> Back to Dashboard
          </Link>

          <div className="flex flex-wrap items-start gap-4 justify-between">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-cyber-text">{scan.filename}</h1>
                {scan.severity && <SeverityBadge severity={scan.severity} size="md" />}
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-cyber-text-dim">
                {scan.package_name && (
                  <span className="flex items-center gap-1.5">
                    <Package size={13} />
                    <code>{scan.package_name}</code>
                  </span>
                )}
                {scan.file_hash && (
                  <span className="flex items-center gap-1.5">
                    <Shield size={13} />
                    <code className="text-xs">{scan.file_hash.slice(0, 16)}…</code>
                  </span>
                )}
              </div>
            </div>

            {scan.status === 'complete' && (
              <div className="flex gap-2">
                <button onClick={() => downloadJSONReport(scan.id)} className="cyber-btn-secondary">
                  <FileJson size={15} />
                  JSON
                </button>
                <button onClick={() => downloadPDFReport(scan.id)} className="cyber-btn-primary">
                  <Download size={15} />
                  PDF Report
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Analyzing state */}
        {isAnalyzing && (
          <div className="glass-card p-8 text-center mb-6 scan-line animate-fade-in">
            <Loader2 size={36} className="mx-auto mb-4 text-cyber-accent animate-spin" />
            <h3 className="text-lg font-semibold text-cyber-text mb-1">Analysis in Progress</h3>
            <p className="text-cyber-muted text-sm">
              Running static & dynamic analysis pipeline… This may take a moment.
            </p>
          </div>
        )}

        {/* Error state */}
        {scan.status === 'error' && (
          <div className="glass-card p-6 mb-6 border-red-500/25 bg-red-500/5">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-400">Analysis Failed</h3>
                <p className="text-sm text-red-300/80 mt-1">{scan.error_message || 'Unknown error occurred.'}</p>
              </div>
            </div>
          </div>
        )}

        {scan.status === 'complete' && (
          <>
            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-cyber-border">
              {TAB_CONFIG.map((tab) => (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 -mb-px ${
                    activeTab === tab.id
                      ? 'border-cyber-accent text-cyber-accent'
                      : 'border-transparent text-cyber-muted hover:text-cyber-text'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── OVERVIEW TAB ─────────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
                {/* Risk gauge */}
                <div className="glass-card p-8 flex flex-col items-center justify-center">
                  <RiskGauge score={scan.risk_score ?? 0} size={200} />
                  <div className="mt-6 w-full border-t border-cyber-border pt-4">
                    <p className="text-xs text-cyber-text-dim text-center mb-3">Score Breakdown</p>
                    {sf && (
                      <div className="space-y-1.5">
                        {[
                          { label: 'Dangerous Permissions', val: sf.dangerous_permissions?.length ?? 0, max: 10, color: '#ef4444' },
                          { label: 'Hardcoded URLs', val: sf.urls?.length ?? 0, max: 10, color: '#f97316' },
                          { label: 'Suspicious Strings', val: sf.suspicious_strings?.length ?? 0, max: 15, color: '#eab308' },
                          { label: 'Dynamic Behaviors', val: df?.behavior_count ?? 0, max: 10, color: '#6366f1' },
                        ].map((item) => (
                          <div key={item.label}>
                            <div className="flex justify-between text-xs text-cyber-text-dim mb-0.5">
                              <span>{item.label}</span>
                              <span>{item.val}</span>
                            </div>
                            <div className="h-1 bg-cyber-border rounded-full">
                              <div
                                className="h-1 rounded-full transition-all duration-700"
                                style={{ width: `${Math.min((item.val / item.max) * 100, 100)}%`, backgroundColor: item.color }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Metadata + Threat Classification */}
                <div className="lg:col-span-2 space-y-4">
                  {/* App metadata */}
                  <div className="glass-card p-5">
                    <h3 className="section-title">APK Metadata</h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                      {[
                        { label: 'App Name', value: sf?.app_name },
                        { label: 'Package', value: sf?.package_name },
                        { label: 'Version', value: sf?.version_name },
                        { label: 'Version Code', value: sf?.version_code },
                        { label: 'Min SDK', value: sf?.min_sdk },
                        { label: 'Target SDK', value: sf?.target_sdk },
                        { label: 'File Size', value: scan.file_size ? `${(scan.file_size / 1024 / 1024).toFixed(2)} MB` : 'N/A' },
                        { label: 'Analyzer', value: sf?.analyzer },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <div className="stat-label">{label}</div>
                          <div className="text-sm text-cyber-text font-medium mt-0.5 truncate" title={String(value ?? 'N/A')}>
                            {value ?? 'N/A'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Threat classification */}
                  {ai && (
                    <div className={`glass-card p-5 border ${(scan.risk_score ?? 0) >= 50 ? 'border-red-500/25 bg-red-500/3' : 'border-cyber-border'}`}>
                      <h3 className="section-title">Threat Classification</h3>
                      <div className="flex items-center gap-3">
                        <ShieldAlert size={24} className={`flex-shrink-0 ${(scan.risk_score ?? 0) >= 50 ? 'text-red-400' : 'text-yellow-400'}`} />
                        <div>
                          <p className="font-bold text-cyber-text">{ai.threat_classification}</p>
                          <p className="text-xs text-cyber-text-dim mt-0.5">
                            SHA-256: <code>{scan.file_hash}</code>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* IOC summary */}
                  {ai?.ioc_summary && (
                    <div className="glass-card p-5">
                      <h3 className="section-title">Indicators of Compromise (IOC)</h3>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        {[
                          { label: 'C&C URLs', val: ai.ioc_summary.hardcoded_urls.length, color: 'text-red-400' },
                          { label: 'Dangerous Perms', val: ai.ioc_summary.dangerous_permissions.length, color: 'text-orange-400' },
                          { label: 'Critical Behaviors', val: ai.ioc_summary.critical_behaviors.length, color: 'text-yellow-400' },
                        ].map((ioc) => (
                          <div key={ioc.label}>
                            <div className={`text-3xl font-bold ${ioc.color}`}>{ioc.val}</div>
                            <div className="text-xs text-cyber-text-dim mt-1">{ioc.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── STATIC ANALYSIS TAB ──────────────────────────────────────── */}
            {activeTab === 'static' && sf && (
              <div className="space-y-6 animate-slide-up">
                {/* Permissions */}
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="section-title mb-0">Permissions ({sf.permissions.length})</h3>
                    <span className="tag-danger">{sf.dangerous_permissions.length} Dangerous</span>
                  </div>
                  <PermissionList permissions={sf.permissions} dangerous={sf.dangerous_permissions} />
                </div>

                {/* Components */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Activities', items: sf.activities, icon: <Code2 size={15} /> },
                    { label: 'Services', items: sf.services, icon: <Terminal size={15} /> },
                    { label: 'Receivers', items: sf.receivers, icon: <Network size={15} /> },
                    { label: 'Providers', items: sf.providers || [], icon: <Package size={15} /> },
                  ].map((comp) => (
                    <FindingCard
                      key={comp.label}
                      title={comp.label}
                      subtitle={`${comp.items.length} components`}
                      icon={comp.icon}
                      badge={comp.items.length > 0 ? (
                        <span className="tag-info">{comp.items.length}</span>
                      ) : undefined}
                    >
                      {comp.items.length === 0 ? (
                        <p className="text-cyber-text-dim text-xs">None detected.</p>
                      ) : (
                        <ul className="space-y-1">
                          {comp.items.map((item, i) => (
                            <li key={i} className="text-xs font-mono text-cyber-muted bg-cyber-surface px-2 py-1 rounded">
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </FindingCard>
                  ))}
                </div>

                {/* URLs */}
                {sf.urls.length > 0 && (
                  <FindingCard
                    title={`Hardcoded URLs & IPs (${sf.urls.length})`}
                    subtitle="Potential C2 communication endpoints"
                    icon={<ExternalLink size={15} />}
                    defaultOpen
                    danger
                    badge={<span className="tag-danger">IOC</span>}
                  >
                    <ul className="space-y-1.5">
                      {sf.urls.map((url, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs font-mono bg-red-500/5 border border-red-500/15 px-3 py-2 rounded-lg text-red-300">
                          <ExternalLink size={11} />
                          {url}
                        </li>
                      ))}
                    </ul>
                  </FindingCard>
                )}

                {/* Suspicious strings */}
                {sf.suspicious_strings.length > 0 && (
                  <FindingCard
                    title={`Suspicious Strings (${sf.suspicious_strings.length})`}
                    subtitle="Hardcoded credentials, shell commands, obfuscated code"
                    icon={<AlertTriangle size={15} />}
                    danger
                    badge={<span className="tag-warning">Obfuscation Indicators</span>}
                  >
                    <div className="space-y-2">
                      {sf.suspicious_strings.map((s, i) => (
                        <div key={i} className="bg-cyber-surface border border-cyber-border rounded-lg p-3">
                          <p className="text-xs text-orange-400 mb-1 font-medium">{s.description}</p>
                          <code className="text-xs text-cyber-muted break-all">{s.string}</code>
                        </div>
                      ))}
                    </div>
                  </FindingCard>
                )}

                {/* Dangerous APIs */}
                {sf.dangerous_api_calls.length > 0 && (
                  <FindingCard
                    title={`Dangerous API Calls (${sf.dangerous_api_calls.length})`}
                    subtitle="Runtime execution, reflection, telephony abuse"
                    icon={<ShieldAlert size={15} />}
                    danger
                  >
                    <div className="space-y-1.5">
                      {sf.dangerous_api_calls.map((api, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs bg-red-500/5 border border-red-500/10 px-3 py-2 rounded">
                          <code className="text-red-300 flex-1">{api.api}</code>
                          <span className="text-cyber-text-dim">in {api.found_in}</span>
                        </div>
                      ))}
                    </div>
                  </FindingCard>
                )}
              </div>
            )}

            {/* ── DYNAMIC ANALYSIS TAB ─────────────────────────────────────── */}
            {activeTab === 'dynamic' && df && (
              <div className="space-y-6 animate-slide-up">
                {/* Sandbox stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Behaviors Detected', value: df.behavior_count, icon: <Zap size={16} /> },
                    { label: 'Simulation Time', value: `${df.simulation_time_ms}ms`, icon: <Terminal size={16} /> },
                    { label: 'Syscalls Monitored', value: df.syscalls_monitored.toLocaleString(), icon: <Code2 size={16} /> },
                    { label: 'API Calls Intercepted', value: df.api_calls_intercepted, icon: <Network size={16} /> },
                  ].map((stat) => (
                    <div key={stat.label} className="glass-card p-4">
                      <div className="text-cyber-accent mb-2">{stat.icon}</div>
                      <div className="stat-value text-xl">{stat.value}</div>
                      <div className="stat-label mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Detected behaviors */}
                <div className="glass-card p-6">
                  <h3 className="section-title">Detected Behaviors</h3>
                  <div className="space-y-3">
                    {df.detected_behaviors.length === 0 ? (
                      <p className="text-cyber-text-dim text-sm">No suspicious behaviors detected.</p>
                    ) : (
                      df.detected_behaviors.map((b, i) => (
                        <div
                          key={i}
                          className={`border rounded-xl p-4 ${BEHAVIOR_COLORS[b.severity] || BEHAVIOR_COLORS.LOW}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-bold font-mono text-sm">{b.behavior}</span>
                                <span className={`tag border ${BEHAVIOR_COLORS[b.severity]}`}>{b.severity}</span>
                                {b.mitre_technique && (
                                  <span className="tag-info">{b.mitre_technique}</span>
                                )}
                              </div>
                              <p className="text-xs opacity-80">{b.description}</p>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <div className="text-sm font-bold">{b.confidence}%</div>
                              <div className="text-xs opacity-60">confidence</div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Network connections */}
                {df.network_connections.length > 0 && (
                  <div className="glass-card p-6">
                    <h3 className="section-title">Network Connections</h3>
                    <div className="space-y-1.5">
                      {df.network_connections.map((url, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs font-mono bg-red-500/5 border border-red-500/15 px-3 py-2 rounded">
                          <Network size={11} className="text-red-400" />
                          <span className="text-red-300">{url}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Execution trace */}
                {df.execution_trace.length > 0 && (
                  <div className="glass-card p-6">
                    <h3 className="section-title">Execution Trace</h3>
                    <div className="space-y-2 font-mono text-xs">
                      {df.execution_trace.map((entry, i) => (
                        <div key={i} className="flex gap-3 items-start">
                          <span className="text-cyber-text-dim flex-shrink-0">[{new Date(entry.timestamp).toLocaleTimeString()}]</span>
                          <span className="text-cyber-accent flex-shrink-0">{entry.event}</span>
                          <span className="text-cyber-muted">{entry.details}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Files created */}
                {df.files_created.length > 0 && (
                  <div className="glass-card p-6">
                    <h3 className="section-title">Files Created</h3>
                    <ul className="space-y-1.5">
                      {df.files_created.map((f, i) => (
                        <li key={i} className="text-xs font-mono text-orange-300 bg-orange-500/5 border border-orange-500/15 px-3 py-2 rounded">
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* ── AI REPORT TAB ────────────────────────────────────────────── */}
            {activeTab === 'ai' && ai && (
              <div className="space-y-6 animate-slide-up">
                {/* Model badge */}
                <div className="flex items-center gap-2 text-xs text-cyber-text-dim">
                  <Brain size={13} className="text-cyber-accent" />
                  <span>Generated by: <code className="text-cyber-accent">{ai.model}</code></span>
                </div>

                {/* Executive summary */}
                <div className="glass-card p-6 border border-cyber-accent/20">
                  <h3 className="section-title">Executive Summary</h3>
                  <p className="text-cyber-text leading-relaxed whitespace-pre-wrap">{ai.executive_summary}</p>
                </div>

                {/* Code behavior analysis */}
                {ai.code_behavior_analysis && (
                  <div className="glass-card p-6">
                    <h3 className="section-title">Code Behavior Analysis</h3>
                    <p className="text-cyber-muted text-sm leading-relaxed">{ai.code_behavior_analysis}</p>
                  </div>
                )}

                {/* Behavior explanations */}
                {ai.behavior_explanations.length > 0 && (
                  <div className="glass-card p-6">
                    <h3 className="section-title">Behavior Explanations</h3>
                    <div className="space-y-3">
                      {ai.behavior_explanations.map((b, i) => (
                        <div key={i} className={`border rounded-lg p-4 ${BEHAVIOR_COLORS[b.severity] || BEHAVIOR_COLORS.LOW}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <code className="font-bold text-sm">{b.behavior}</code>
                            <span className={`tag border ${BEHAVIOR_COLORS[b.severity]}`}>{b.severity}</span>
                            {b.mitre && <span className="tag-info">{b.mitre}</span>}
                          </div>
                          <p className="text-xs opacity-80">{b.explanation}</p>
                          <p className="text-xs opacity-50 mt-1">Confidence: {b.confidence}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {ai.recommendations.length > 0 && (
                  <div className="glass-card p-6">
                    <h3 className="section-title">Remediation Recommendations</h3>
                    <ol className="space-y-3">
                      {ai.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyber-accent/20 text-cyber-accent text-xs font-bold flex items-center justify-center">
                            {i + 1}
                          </span>
                          <p className="text-sm text-cyber-text leading-relaxed">{rec}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* IOC Table */}
                {ai.ioc_summary.hardcoded_urls.length > 0 && (
                  <div className="glass-card p-6">
                    <h3 className="section-title">IOC Summary</h3>
                    <div className="space-y-2">
                      {ai.ioc_summary.hardcoded_urls.map((url, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs font-mono text-red-300 bg-red-500/5 border border-red-500/15 px-3 py-2 rounded">
                          <AlertTriangle size={11} />
                          {url}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Download actions */}
                <div className="flex gap-3">
                  <button onClick={() => downloadJSONReport(scan.id)} className="cyber-btn-secondary">
                    <FileJson size={15} />
                    Download JSON Report
                  </button>
                  <button onClick={() => downloadPDFReport(scan.id)} className="cyber-btn-primary">
                    <Download size={15} />
                    Download PDF Report
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
