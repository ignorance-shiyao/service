import React from 'react';

// 数字孪生大屏 - 共享样式与小组件（依据 public/cut 设计稿精细对齐）

// ── 颜色令牌 ────────────────────────────────────────────────────────────
export const DT = {
  bgPage: '#03132a',
  bgPanel: '#0a2547',
  bgPanelInner: '#081c3a',
  bgCard: '#0d2a52',
  bgCardSoft: 'rgba(13, 42, 82, 0.55)',
  borderPanel: '#1b4378',
  borderSoft: '#143258',
  borderAccent: '#2b6aa8',
  textPrimary: '#e8f3ff',
  textSecondary: '#a9c8ee',
  textMuted: '#7796bd',
  textLabel: '#7e9fc8',
  cyan: '#4fc1ff',
  cyanSoft: '#79d0ff',
  green: '#6ce09a',
  greenDark: '#1d6a45',
  greenBg: 'rgba(18,68,42,0.55)',
  orange: '#ffb672',
  orangeStrong: '#ff9a5a',
  orangeBg: 'rgba(82,42,12,0.55)',
  red: '#ff7d7d',
  redStrong: '#ef5350',
  redBg: 'rgba(90,20,20,0.65)',
  yellow: '#f5d263',
};

// ── 面板 ────────────────────────────────────────────────────────────────
// 面板：内描边 + 细微高光，圆角与切图一致
export const dtPanel =
  'relative flex h-full flex-col rounded-md border border-[#1b4378] bg-[linear-gradient(180deg,#0a2547_0%,#082040_100%)] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_0_rgba(0,0,0,0.4)]';

// 面板：紧凑型
export const dtPanelTight = dtPanel + ' p-2';

// ── 标题条 ─────────────────────────────────────────────────────────────
export const DtSectionTitle: React.FC<{ title: string; right?: React.ReactNode }> = ({ title, right }) => (
  <div className="mb-2 flex shrink-0 items-center justify-between">
    <div className="flex items-center">
      <span className="mr-2 inline-block h-3 w-[3px] rounded-sm bg-[#4fc1ff] shadow-[0_0_6px_#4fc1ff]" />
      <span className="text-[13px] font-semibold tracking-wide text-[#e8f3ff]">{title}</span>
    </div>
    {right}
  </div>
);

// ── 状态徽章 ───────────────────────────────────────────────────────────
type BadgeKind = '正常' | '受影响' | '降级' | '告警' | '偏高' | '中断' | '待切换' | '离线' | '严重';

export const DtStatusBadge: React.FC<{ status: BadgeKind }> = ({ status }) => {
  const map: Record<BadgeKind, { color: string; border: string; bg: string }> = {
    正常:   { color: '#6ce09a', border: '#1d6a45', bg: 'rgba(15,68,42,0.55)' },
    受影响: { color: '#ffb672', border: '#7a4a1c', bg: 'rgba(82,42,12,0.55)' },
    降级:   { color: '#f5d263', border: '#7a5c1d', bg: 'rgba(80,60,16,0.55)' },
    告警:   { color: '#ff7d7d', border: '#7a2e2e', bg: 'rgba(82,28,28,0.6)' },
    偏高:   { color: '#ffb672', border: '#7a4a1c', bg: 'rgba(82,42,12,0.55)' },
    中断:   { color: '#ff7d7d', border: '#7a2e2e', bg: 'rgba(82,28,28,0.6)' },
    待切换: { color: '#f5d263', border: '#7a5c1d', bg: 'rgba(80,60,16,0.55)' },
    离线:   { color: '#ff7d7d', border: '#7a2e2e', bg: 'rgba(82,28,28,0.6)' },
    严重:   { color: '#ff7d7d', border: '#7a2e2e', bg: 'rgba(82,28,28,0.6)' },
  };
  const m = map[status];
  return (
    <span
      className="inline-flex h-[20px] items-center justify-center rounded-[3px] border px-2 text-[11px] font-semibold leading-none tracking-wide"
      style={{ color: m.color, borderColor: m.border, background: m.bg }}
    >
      {status}
    </span>
  );
};

// ── 告警等级标签（左上小色块） ─────────────────────────────────────────
export const DtAlarmTag: React.FC<{ level: 'critical' | 'warning' | 'info' }> = ({ level }) => {
  const map = {
    critical: { label: '严重', bg: '#b53737', text: '#fff' },
    warning:  { label: '一般', bg: '#b07a2a', text: '#fff' },
    info:     { label: '提示', bg: '#2b6da8', text: '#fff' },
  } as const;
  const m = map[level];
  return (
    <span
      className="inline-flex h-[18px] items-center rounded-[2px] px-1.5 text-[11px] font-bold leading-none"
      style={{ background: m.bg, color: m.text }}
    >
      {m.label}
    </span>
  );
};

// ── 进度条 ─────────────────────────────────────────────────────────────
export const DtProgress: React.FC<{ value: number; color?: string; height?: number }> = ({ value, color = '#4fc1ff', height = 6 }) => (
  <div className="w-full overflow-hidden rounded-full bg-[#0a1f3d]" style={{ height }}>
    <div
      className="h-full rounded-full transition-all"
      style={{
        width: `${Math.min(100, Math.max(0, value))}%`,
        background: `linear-gradient(90deg, ${color}cc, ${color})`,
        boxShadow: `0 0 8px ${color}99`,
      }}
    />
  </div>
);

// ── 小工具 ─────────────────────────────────────────────────────────────
export const DtPill: React.FC<{ children: React.ReactNode; tone?: 'cyan' | 'green' | 'orange' | 'red' | 'slate' }> = ({ children, tone = 'cyan' }) => {
  const tones = {
    cyan:   { c: '#79d0ff', b: '#2b6aa8', bg: 'rgba(20,52,96,0.5)' },
    green:  { c: '#6ce09a', b: '#1d6a45', bg: 'rgba(15,68,42,0.5)' },
    orange: { c: '#ffb672', b: '#7a4a1c', bg: 'rgba(82,42,12,0.5)' },
    red:    { c: '#ff7d7d', b: '#7a2e2e', bg: 'rgba(82,28,28,0.6)' },
    slate:  { c: '#a9c8ee', b: '#244871', bg: 'rgba(14,38,72,0.5)' },
  } as const;
  const t = tones[tone];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-[3px] border px-1.5 py-[1px] text-[11px] font-semibold leading-none"
      style={{ color: t.c, borderColor: t.b, background: t.bg }}
    >
      {children}
    </span>
  );
};
