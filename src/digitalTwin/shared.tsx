import React from 'react';

// 数字孪生大屏共享样式与小组件

export const dtPanel =
  'bg-[#072654]/96 border border-[#16508f] rounded-md p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] h-full flex flex-col';

export const DtSectionTitle: React.FC<{ title: string; right?: React.ReactNode }> = ({ title, right }) => (
  <div className="mb-1 flex items-center justify-between border-b border-[#1f5b9b] pb-0.5 text-slate-200 shrink-0">
    <div className="flex items-center">
      <span className="mr-2 text-[#4fb6ff]">|</span>
      <span className="text-xs font-semibold tracking-wide">{title}</span>
    </div>
    {right}
  </div>
);

export const DtStatusBadge: React.FC<{ status: '正常' | '受影响' | '降级' | '告警' | '偏高' | '中断' | '待切换' | '离线' }> = ({ status }) => {
  const map: Record<string, string> = {
    正常: 'text-[#7dd6a4] border-[#1d6a45] bg-[#0d3a26]',
    受影响: 'text-[#ff9a5a] border-[#7a3f1c] bg-[#3a1d0d]',
    降级: 'text-[#f5b963] border-[#7a5c1d] bg-[#3a2c0d]',
    告警: 'text-[#ff7d7d] border-[#7a2e2e] bg-[#3a1414]',
    偏高: 'text-[#ff9a5a] border-[#7a3f1c] bg-[#3a1d0d]',
    中断: 'text-[#ff7d7d] border-[#7a2e2e] bg-[#3a1414]',
    待切换: 'text-[#f5b963] border-[#7a5c1d] bg-[#3a2c0d]',
    离线: 'text-[#ff7d7d] border-[#7a2e2e] bg-[#3a1414]',
  };
  return (
    <span className={`inline-flex items-center justify-center rounded px-2 py-[1px] text-[10px] font-semibold border ${map[status] || map['正常']}`}>
      {status}
    </span>
  );
};

export const DtAlarmTag: React.FC<{ level: 'critical' | 'warning' | 'info' }> = ({ level }) => {
  const map = {
    critical: { label: '严重', cls: 'bg-[#9c2d2d] text-white' },
    warning: { label: '一般', cls: 'bg-[#a06b1e] text-white' },
    info: { label: '提示', cls: 'bg-[#1f5f9c] text-white' },
  } as const;
  const m = map[level];
  return <span className={`inline-flex h-[18px] items-center rounded px-1.5 text-[10px] font-bold ${m.cls}`}>{m.label}</span>;
};

// 进度条
export const DtProgress: React.FC<{ value: number; color?: string }> = ({ value, color = '#3fa5ff' }) => (
  <div className="h-1.5 w-full overflow-hidden rounded bg-[#0c2f5e]">
    <div className="h-full rounded" style={{ width: `${Math.min(100, value)}%`, background: color, boxShadow: `0 0 6px ${color}88` }} />
  </div>
);

// KPI 卡片
export const DtKpiCard: React.FC<{ label: string; value: string | number; unit?: string; tone?: 'green' | 'red' | 'blue' | 'orange'; icon?: React.ReactNode }> = ({ label, value, unit, tone = 'blue', icon }) => {
  const tones: Record<string, string> = {
    green: 'text-[#6ce09a]',
    red: 'text-[#ff8a7a]',
    blue: 'text-[#d8f1ff]',
    orange: 'text-[#ffb672]',
  };
  return (
    <div className="flex items-center justify-between rounded bg-[#0e3e7e]/70 p-2.5">
      <div>
        <div className="mb-0.5 text-[11px] text-[#8bc4ff]">{label}</div>
        <div className={`font-mono text-[24px] font-black leading-none ${tones[tone]}`}>
          {value}
          {unit && <span className="ml-1 text-[11px] font-normal text-[#8bc4ff]">{unit}</span>}
        </div>
      </div>
      {icon && <div className="text-[#9cd3ff]">{icon}</div>}
    </div>
  );
};
