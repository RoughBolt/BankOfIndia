import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  danger?: boolean;
}

export default function FindingCard({
  title,
  subtitle,
  icon,
  badge,
  children,
  defaultOpen = false,
  danger = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
        danger
          ? 'border-red-500/20 bg-red-500/5 hover:border-red-500/40'
          : 'border-cyber-border bg-cyber-card hover:border-cyber-accent/30'
      }`}
    >
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={() => setOpen(!open)}
      >
        {icon && (
          <div className={`flex-shrink-0 ${danger ? 'text-red-400' : 'text-cyber-accent'}`}>
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-medium text-sm ${danger ? 'text-red-300' : 'text-cyber-text'}`}>
              {title}
            </span>
            {badge}
          </div>
          {subtitle && <p className="text-xs text-cyber-text-dim mt-0.5 truncate">{subtitle}</p>}
        </div>
        <div className={`flex-shrink-0 transition-transform duration-200 ${danger ? 'text-red-400' : 'text-cyber-muted'}`}>
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>

      {open && (
        <div className={`px-4 pb-4 border-t ${danger ? 'border-red-500/15' : 'border-cyber-border'}`}>
          <div className="pt-3">{children}</div>
        </div>
      )}
    </div>
  );
}
