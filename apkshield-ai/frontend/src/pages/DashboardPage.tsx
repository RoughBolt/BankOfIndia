import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileArchive,
  Loader2,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { listScans } from '../api/client';
import type { ScanListItem } from '../types';
import SeverityBadge from '../components/SeverityBadge';

const formatBytes = (b: number | null) => {
  if (!b) return 'N/A';
  if (b > 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  return `${(b / 1024).toFixed(0)} KB`;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'complete') return <CheckCircle size={14} className="text-green-400" />;
  if (status === 'analyzing') return <Loader2 size={14} className="text-cyber-accent animate-spin" />;
  if (status === 'error') return <AlertTriangle size={14} className="text-red-400" />;
  return <Clock size={14} className="text-cyber-text-dim" />;
};

const SEVERITY_ORDER: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1, Unknown: 0 };

export default function DashboardPage() {
  const [scans, setScans] = useState<ScanListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');

  const fetchScans = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listScans();
      setScans(data);
    } catch {
      setError('Failed to load scans. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchScans(); }, []);

  const sorted = [...scans].sort((a, b) => {
    if (sortBy === 'score') {
      return (b.risk_score ?? 0) - (a.risk_score ?? 0);
    }
    return new Date(b.upload_time).getTime() - new Date(a.upload_time).getTime();
  });

  const stats = {
    total: scans.length,
    critical: scans.filter((s) => s.severity === 'Critical').length,
    high: scans.filter((s) => s.severity === 'High').length,
    avgScore: scans.filter((s) => s.risk_score !== null).length > 0
      ? Math.round(scans.filter((s) => s.risk_score !== null).reduce((a, s) => a + (s.risk_score ?? 0), 0) / scans.filter((s) => s.risk_score !== null).length)
      : 0,
  };

  return (
    <div className="min-h-screen pt-16 grid-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-cyber-text">Scan Dashboard</h1>
            <p className="text-cyber-muted mt-1">All APK analysis results</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchScans} className="cyber-btn-secondary gap-1.5">
              <RefreshCw size={15} />
              Refresh
            </button>
            <Link to="/" className="cyber-btn-primary">
              <Plus size={15} />
              New Scan
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Scans', value: stats.total, icon: <FileArchive size={20} />, color: 'text-cyber-accent' },
            { label: 'Critical Threats', value: stats.critical, icon: <AlertTriangle size={20} />, color: 'text-red-400' },
            { label: 'High Risk', value: stats.high, icon: <Activity size={20} />, color: 'text-orange-400' },
            { label: 'Avg Risk Score', value: `${stats.avgScore}/100`, icon: <Activity size={20} />, color: 'text-cyber-muted' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-4">
              <div className={`mb-2 ${stat.color}`}>{stat.icon}</div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Sort controls */}
        {scans.length > 0 && (
          <div className="flex items-center gap-2 mb-4 text-sm">
            <span className="text-cyber-text-dim">Sort by:</span>
            {(['date', 'score'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  sortBy === s
                    ? 'bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/40'
                    : 'text-cyber-muted hover:text-cyber-text'
                }`}
              >
                {s === 'date' ? 'Date' : 'Risk Score'}
              </button>
            ))}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-cyber-muted gap-3">
            <Loader2 size={24} className="animate-spin" />
            Loading scans…
          </div>
        ) : error ? (
          <div className="glass-card p-8 text-center text-red-400">
            <AlertTriangle size={32} className="mx-auto mb-3" />
            <p>{error}</p>
          </div>
        ) : scans.length === 0 ? (
          <div className="glass-card p-16 text-center animate-fade-in">
            <FileArchive size={48} className="mx-auto mb-4 text-cyber-text-dim" />
            <h3 className="text-xl font-semibold text-cyber-text mb-2">No Scans Yet</h3>
            <p className="text-cyber-muted mb-6">Upload an APK to get started.</p>
            <Link to="/" className="cyber-btn-primary">
              <Plus size={16} />
              Upload APK
            </Link>
          </div>
        ) : (
          <div className="glass-card overflow-hidden animate-slide-up">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cyber-border bg-cyber-surface/50">
                    {['#', 'Filename', 'Package', 'Size', 'Uploaded', 'Status', 'Risk Score', 'Severity', ''].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs text-cyber-text-dim uppercase tracking-wider font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-border/50">
                  {sorted.map((scan) => (
                    <tr
                      key={scan.id}
                      className="hover:bg-cyber-surface/60 transition-colors duration-150 group"
                    >
                      <td className="px-4 py-3 text-cyber-text-dim font-mono text-xs">{scan.id}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileArchive size={14} className="text-cyber-accent flex-shrink-0" />
                          <span className="font-medium text-cyber-text truncate max-w-[160px]" title={scan.filename}>
                            {scan.filename}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs text-cyber-muted truncate max-w-[160px] block" title={scan.package_name ?? ''}>
                          {scan.package_name ?? '—'}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-cyber-text-dim">{formatBytes(scan.file_size)}</td>
                      <td className="px-4 py-3 text-cyber-text-dim whitespace-nowrap">{formatDate(scan.upload_time)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <StatusIcon status={scan.status} />
                          <span className="capitalize text-cyber-muted">{scan.status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {scan.risk_score !== null ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-cyber-border rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full"
                                style={{
                                  width: `${scan.risk_score}%`,
                                  backgroundColor:
                                    scan.risk_score >= 75 ? '#ef4444' :
                                    scan.risk_score >= 50 ? '#f97316' :
                                    scan.risk_score >= 25 ? '#eab308' : '#22c55e',
                                }}
                              />
                            </div>
                            <span className="font-mono text-xs text-cyber-text">{scan.risk_score}</span>
                          </div>
                        ) : (
                          <span className="text-cyber-text-dim">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {scan.severity ? (
                          <SeverityBadge severity={scan.severity} size="sm" />
                        ) : (
                          <span className="text-cyber-text-dim">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/scan/${scan.id}`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-cyber-accent hover:underline whitespace-nowrap"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
