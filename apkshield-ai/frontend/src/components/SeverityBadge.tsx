import type { SeverityLevel } from '../types';

interface Props {
  severity: SeverityLevel | string | null;
  size?: 'sm' | 'md' | 'lg';
}

const config: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
  Low: {
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    border: 'border-green-500/30',
    dot: 'bg-green-400',
    label: 'LOW',
  },
  Medium: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    border: 'border-yellow-500/30',
    dot: 'bg-yellow-400',
    label: 'MEDIUM',
  },
  High: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
    dot: 'bg-orange-400',
    label: 'HIGH',
  },
  Critical: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/30',
    dot: 'bg-red-400',
    label: 'CRITICAL',
  },
  Unknown: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
    dot: 'bg-slate-400',
    label: 'UNKNOWN',
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-3 py-1 text-sm gap-1.5',
  lg: 'px-4 py-2 text-base gap-2',
};

const dotSizes = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

export default function SeverityBadge({ severity, size = 'md' }: Props) {
  const key = severity || 'Unknown';
  const c = config[key] || config.Unknown;

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold font-mono border
        ${c.bg} ${c.text} ${c.border} ${sizeClasses[size]}`}
    >
      <span className={`rounded-full ${c.dot} ${dotSizes[size]} ${key === 'Critical' ? 'animate-pulse' : ''}`} />
      {c.label}
    </span>
  );
}
