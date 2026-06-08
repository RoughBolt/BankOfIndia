import { useEffect, useRef, useState } from 'react';

interface Props {
  score: number; // 0–100
  size?: number; // px diameter
  animationDuration?: number; // ms
}

const getColor = (score: number) => {
  if (score >= 75) return { stroke: '#ef4444', glow: 'rgba(239,68,68,0.4)', text: '#ef4444' };
  if (score >= 50) return { stroke: '#f97316', glow: 'rgba(249,115,22,0.4)', text: '#f97316' };
  if (score >= 25) return { stroke: '#eab308', glow: 'rgba(234,179,8,0.4)', text: '#eab308' };
  return { stroke: '#22c55e', glow: 'rgba(34,197,94,0.4)', text: '#22c55e' };
};

const getSeverityLabel = (score: number) => {
  if (score >= 75) return 'CRITICAL';
  if (score >= 50) return 'HIGH';
  if (score >= 25) return 'MEDIUM';
  return 'LOW';
};

export default function RiskGauge({ score, size = 200, animationDuration = 1500 }: Props) {
  const [displayed, setDisplayed] = useState(0);
  const animRef = useRef<number | null>(null);

  const colors = getColor(score);
  const radius = (size / 2) * 0.8;
  const strokeWidth = size * 0.06;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Animate number counter
  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / animationDuration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * score));
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };
    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [score, animationDuration]);

  // SVG arc progress
  const progressFraction = score / 100;
  const dashOffset = circumference * (1 - progressFraction);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Glow layer */}
        <div
          className="absolute inset-0 rounded-full transition-all duration-1000"
          style={{
            boxShadow: score > 0 ? `0 0 ${size * 0.2}px ${colors.glow}` : 'none',
            opacity: 0.6,
          }}
        />

        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(30, 41, 59, 0.8)"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{
              transition: `stroke-dashoffset ${animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
              filter: `drop-shadow(0 0 6px ${colors.glow})`,
            }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-bold font-mono tabular-nums"
            style={{ fontSize: size * 0.22, color: colors.text, lineHeight: 1 }}
          >
            {displayed}
          </span>
          <span className="text-cyber-muted font-mono" style={{ fontSize: size * 0.07 }}>
            / 100
          </span>
        </div>
      </div>

      {/* Label */}
      <div className="text-center">
        <div
          className="text-xs font-bold font-mono tracking-widest uppercase"
          style={{ color: colors.text }}
        >
          {getSeverityLabel(score)} RISK
        </div>
      </div>
    </div>
  );
}
