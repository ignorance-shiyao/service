import React, { createContext, useContext, useMemo, useState } from 'react';
import { Home, ChevronRight, ShieldCheck, Network, Activity } from 'lucide-react';
import { OverviewView } from './views/OverviewView';
import { AreaView } from './views/AreaView';
import { RackView } from './views/RackView';
import { TopologyView } from './views/TopologyView';
import { DeductionView } from './views/DeductionView';

export type DtViewKey = 'overview' | 'area' | 'rack' | 'topology' | 'deduction';

// ── 视图导航 Context ────────────────────────────────────────────────────
export type ZoneId = 'line1' | 'idc3' | 'cmpA' | 'agv' | 'vision' | 'office';
interface DtNavCtx {
  view: DtViewKey;
  setView: (v: DtViewKey) => void;
  zone: ZoneId;
  setZone: (z: ZoneId) => void;
}
const NavContext = createContext<DtNavCtx>({
  view: 'overview', setView: () => {}, zone: 'idc3', setZone: () => {},
});
export const useDtNav = () => useContext(NavContext);

const zoneCrumbs: Record<ZoneId, string[]> = {
  line1:  ['生产厂房'],
  idc3:   ['3号机房', 'B区'],
  cmpA:   ['能源区'],
  agv:    ['物流装卸区'],
  vision: ['冷却区'],
  office: ['办公楼'],
};

const healthByView: Record<DtViewKey, number> = {
  overview: 92.6, area: 82.4, rack: 76.8, topology: 84.7, deduction: 76.8,
};

const buildCrumbs = (view: DtViewKey, zone: ZoneId): string[] => {
  switch (view) {
    case 'overview':  return ['总览'];
    case 'area':      return ['总览', ...zoneCrumbs[zone]];
    case 'rack':      return ['总览', ...zoneCrumbs[zone], '机柜'];
    case 'topology':  return ['总览', '网络拓扑'];
    case 'deduction': return ['总览', '故障推演'];
  }
};

const crumbToView: Record<string, DtViewKey> = {
  '总览': 'overview',
  '生产厂房': 'area',
  '3号机房': 'area',
  'B区': 'area',
  '能源区': 'area',
  '物流装卸区': 'area',
  '冷却区': 'area',
  '办公楼': 'area',
  '机柜': 'rack',
  '网络拓扑': 'topology',
  '故障推演': 'deduction',
};

// ╭─────────────────────────────────────────────────────────────────────╮
// │ DtSceneHeader —— 每个视图主舞台面板的标题栏                          │
// │ 左：面包屑（Home + 路径段，可点击）                                   │
// │ 右：健康度 + 拓扑/推演 视图切换                                       │
// ╰─────────────────────────────────────────────────────────────────────╯
export const DtSceneHeader: React.FC<{ title?: string; right?: React.ReactNode }> = ({ title, right }) => {
  const { view, setView, zone } = useDtNav();
  const crumbs = buildCrumbs(view, zone);
  const health = healthByView[view];
  const healthColor = health >= 90 ? '#6ce09a' : health >= 80 ? '#f5d263' : '#ff7d7d';

  return (
    <div className="mb-2 flex shrink-0 items-center justify-between gap-3">
      {/* 左：面包屑 + 可选标题 */}
      <div className="flex min-w-0 items-center gap-2 text-[12.5px] text-[#a9c8ee]">
        <Home
          size={14}
          className="cursor-pointer shrink-0 text-[#79d0ff] hover:text-[#cfe9ff]"
          onClick={() => setView('overview')}
        />
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            <ChevronRight size={12} className="shrink-0 text-[#3f86c8]" />
            <span
              className={`cursor-pointer truncate ${i === crumbs.length - 1 ? 'font-semibold text-[#e8f3ff]' : 'hover:text-[#cfe9ff]'}`}
              onClick={() => { const t = crumbToView[c]; if (t) setView(t); }}
            >{c}</span>
          </React.Fragment>
        ))}
        {title && (
          <>
            <span className="mx-1 text-[#1b4378]">|</span>
            <span className="truncate text-[12.5px] text-[#7e9fc8]">{title}</span>
          </>
        )}
      </div>

      {/* 右：健康度 + 拓扑/推演 + 自定义内容 */}
      <div className="flex shrink-0 items-center gap-1.5">
        <div className="flex h-7 items-center gap-1.5 rounded border border-[#244871] bg-[#0d2a52]/85 px-2.5">
          <ShieldCheck size={12} className="text-[#79d0ff]" />
          <span className="text-[10.5px] text-[#a9c8ee]">健康度</span>
          <span
            className="font-mono text-[14px] font-black leading-none"
            style={{ color: healthColor, textShadow: `0 0 6px ${healthColor}88` }}
          >{health.toFixed(1)}</span>
        </div>
        <button
          type="button"
          onClick={() => setView('topology')}
          className={`inline-flex h-7 items-center gap-1.5 rounded border px-2.5 text-[12px] font-semibold transition ${
            view === 'topology'
              ? 'border-[#4fc1ff] bg-[#114a8a] text-[#cfe9ff] shadow-[0_0_8px_rgba(79,193,255,0.35)]'
              : 'border-[#2b6aa8] bg-[#0d2e5b] text-[#a9c8ee] hover:border-[#4fc1ff] hover:text-[#cfe9ff]'
          }`}
        >
          <Network size={12} />拓扑
        </button>
        <button
          type="button"
          onClick={() => setView('deduction')}
          className={`inline-flex h-7 items-center gap-1.5 rounded border px-2.5 text-[12px] font-semibold transition ${
            view === 'deduction'
              ? 'border-[#4fc1ff] bg-[#114a8a] text-[#cfe9ff] shadow-[0_0_8px_rgba(79,193,255,0.35)]'
              : 'border-[#2b6aa8] bg-[#0d2e5b] text-[#a9c8ee] hover:border-[#4fc1ff] hover:text-[#cfe9ff]'
          }`}
        >
          <Activity size={12} />推演
        </button>
        {right}
      </div>
    </div>
  );
};

export const DigitalTwinDashboard: React.FC = () => {
  const [view, setView] = useState<DtViewKey>('overview');
  const [zone, setZone] = useState<ZoneId>('idc3');
  const ctx = useMemo(() => ({ view, setView, zone, setZone }), [view, zone]);

  const ActiveView = useMemo(() => {
    switch (view) {
      case 'overview':  return <OverviewView />;
      case 'area':      return <AreaView />;
      case 'rack':      return <RackView />;
      case 'topology':  return <TopologyView />;
      case 'deduction': return <DeductionView />;
    }
  }, [view]);

  return (
    <NavContext.Provider value={ctx}>
      <div
        className="relative h-full w-full overflow-hidden rounded-lg border border-[#0c3d75]"
        style={{
          background: 'radial-gradient(ellipse at top, rgba(20,68,140,0.25) 0%, transparent 55%), linear-gradient(180deg, #03132a 0%, #021026 100%)',
        }}
      >
        {/* 主体视图占满整个仪表盘 */}
        <div className="absolute inset-0 p-1.5">{ActiveView}</div>
      </div>
    </NavContext.Provider>
  );
};

export default DigitalTwinDashboard;
