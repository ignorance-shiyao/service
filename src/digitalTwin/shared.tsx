import React from 'react';
import { BaseChart } from '../components/BaseChart';

// ── 24h 告警折线图（每个视图主面板底部固定展示）─────────────────────────
const alarmTrend24h = {
  grid: { top: 18, left: 30, right: 12, bottom: 22 },
  tooltip: { trigger: 'axis' },
  legend: { show: false },
  xAxis: {
    type: 'category',
    data: ['14:30','16:30','18:30','20:30','22:30','00:30','02:30','04:30','06:30','08:30','10:30','12:30','14:30'],
    axisLine: { lineStyle: { color: '#234c7c' } },
    axisLabel: { color: '#7e9fc8', fontSize: 9 },
  },
  yAxis: {
    type: 'value', max: 30,
    splitLine: { lineStyle: { color: 'rgba(35,76,124,0.4)' } },
    axisLabel: { color: '#7e9fc8', fontSize: 9 },
  },
  series: [
    { name: '严重', type: 'line', data: [2,4,6,8,10,6,4,5,3,4,5,7,3], smooth: true, symbol: 'none',
      lineStyle: { color: '#ef5350', width: 1.5 }, areaStyle: { color: 'rgba(239,83,80,0.12)' } },
    { name: '一般', type: 'line', data: [5,8,12,18,22,14,10,12,9,13,14,16,8], smooth: true, symbol: 'none',
      lineStyle: { color: '#f5b963', width: 1.5 } },
    { name: '提示', type: 'line', data: [3,6,11,17,25,18,12,14,15,17,13,15,15], smooth: true, symbol: 'none',
      lineStyle: { color: '#3b8de1', width: 1.5 } },
  ],
};

// 固定显示在主舞台面板底部的"最近 24 小时告警"小图
export const DtAlarm24hPanel: React.FC = () => (
  <div className="flex min-h-0 flex-[1] shrink-0 flex-col rounded border border-[#1b4378] bg-[#081c3a] p-2">
    <div className="mb-1 flex items-center justify-between">
      <div className="flex items-center text-[11.5px] text-[#a9c8ee]">
        <span className="mr-2 inline-block h-2.5 w-[3px] rounded-sm bg-[#4fc1ff] shadow-[0_0_4px_#4fc1ff]" />
        最近 24 小时告警数量变化
      </div>
      <div className="flex items-center gap-3 text-[10px] text-[#7e9fc8]">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#ef5350]" />严重 <b className="text-[#ff8a7a]">3</b></span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#f5b963]" />一般 <b className="text-[#f5d263]">8</b></span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#3b8de1]" />提示 <b className="text-[#79d0ff]">15</b></span>
      </div>
    </div>
    <div className="min-h-0 flex-1">
      <BaseChart option={alarmTrend24h} />
    </div>
  </div>
);


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
