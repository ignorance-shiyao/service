import React from 'react';

export const HealthRing: React.FC<{ value: number; status: 'normal' | 'warning' | 'fault'; size?: number }> = ({ value, status, size = 70 }) => {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const color = status === 'normal' ? '#10b981' : status === 'warning' ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ width: size, height: size }} className="relative">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth="6" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-100">{value}</div>
    </div>
  );
};
