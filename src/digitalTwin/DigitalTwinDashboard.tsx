import React, { createContext, useContext, useMemo, useState } from 'react';
import { Home, ChevronRight, ShieldCheck, PlayCircle, FileText, Network, Activity } from 'lucide-react';
import { OverviewView } from './views/OverviewView';
import { AreaView } from './views/AreaView';
import { RackView } from './views/RackView';
import { TopologyView } from './views/TopologyView';
import { DeductionView } from './views/DeductionView';

export type DtViewKey = 'overview' | 'area' | 'rack' | 'topology' | 'deduction';

// ── 视图导航 Context ────────────────────────────────────────────────────
interface DtNavCtx {
  view: DtViewKey;
  setView: (v: DtViewKey) => void;
}
const NavContext = createContext<DtNavCtx>({ view: 'overview', setView: () => {} });
export const useDtNav = () => useContext(NavContext);

const breadcrumbs: Record<DtViewKey, string[]> = {
  overview:  ['总览'],
  area:      ['总览', '3号机房', 'B区'],
  rack:      ['总览', '3号机房', 'B区', 'B03机柜'],
  topology:  ['总览', '网络拓扑'],
  deduction: ['总览', '故障推演'],
};

const healthByView: Record<DtViewKey, number> = {
  overview: 92.6, area: 82.4, rack: 76.8, topology: 84.7, deduction: 76.8,
};

const crumbToView: Record<string, DtViewKey> = {
  '总览': 'overview',
  '3号机房': 'area',
  'B区': 'area',
  'B03机柜': 'rack',
  '网络拓扑': 'topology',
  '故障推演': 'deduction',
};

// ── 顶部导航条 ─────────────────────────────────────────────────────────
const DtTopBar: React.FC<{ view: DtViewKey; setView: (v: DtViewKey) => void; health: number }> = ({ view, setView, health }) => {
  const crumbs = breadcrumbs[view];
  const healthColor = health >= 90 ? '#6ce09a' : health >= 80 ? '#f5d263' : '#ff7d7d';
  return (
    <div className="flex h-9 shrink-0 items-center justify-between gap-3 rounded-md border border-[#1b4378] bg-[linear-gradient(180deg,#0a2547_0%,#082040_100%)] px-3">
      {/* 左：面包屑 */}
      <div className="flex min-w-0 items-center gap-2 text-[12.5px] text-[#a9c8ee]">
        <Home
          size={14}
          className="cursor-pointer text-[#79d0ff] shrink-0 hover:text-[#cfe9ff]"
          onClick={() => setView('overview')}
        />
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            <ChevronRight size={12} className="text-[#3f86c8] shrink-0" />
            <span
              className={`cursor-pointer truncate ${i === crumbs.length - 1 ? 'font-semibold text-[#e8f3ff]' : 'hover:text-[#cfe9ff]'}`}
              onClick={() => { const t = crumbToView[c]; if (t) setView(t); }}
            >{c}</span>
          </React.Fragment>
        ))}
      </div>

      {/* 右：健康度 + 视图切换 + 操作 */}
      <div className="flex shrink-0 items-center gap-1.5">
        {/* 健康度 */}
        <div className="flex h-7 items-center gap-1.5 rounded border border-[#244871] bg-[#0d2a52]/85 px-2.5">
          <ShieldCheck size={12} className="text-[#79d0ff]" />
          <span className="text-[10.5px] text-[#a9c8ee]">健康度</span>
          <span
            className="font-mono text-[14px] font-black leading-none"
            style={{ color: healthColor, textShadow: `0 0 6px ${healthColor}88` }}
          >{health.toFixed(1)}</span>
        </div>

        {/* 拓扑 / 推演 视图快捷 */}
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

        {/* 主操作 */}
        <div className="ml-1 h-5 w-px bg-[#1b4378]" />
        <button
          type="button"
          onClick={() => setView('deduction')}
          className="inline-flex h-7 items-center gap-1.5 rounded border-2 border-[#4fc1ff] bg-[linear-gradient(180deg,#114a8a_0%,#0a2f63_100%)] px-3 text-[12px] font-bold text-[#cfe9ff] shadow-[0_0_8px_rgba(79,193,255,0.32)] transition hover:brightness-110"
        >
          <PlayCircle size={13} className="text-[#79d0ff]" />进入故障推演
        </button>
        <button
          type="button"
          className="inline-flex h-7 items-center gap-1.5 rounded border-2 border-[#2b8a6a] bg-[linear-gradient(180deg,#0e4c3a_0%,#0a2f25_100%)] px-3 text-[12px] font-bold text-[#cfeedf] shadow-[0_0_8px_rgba(108,224,154,0.28)] transition hover:brightness-110"
        >
          <FileText size={13} className="text-[#6ce09a]" />生成巡检报告
        </button>
      </div>
    </div>
  );
};

export const DigitalTwinDashboard: React.FC = () => {
  const [view, setView] = useState<DtViewKey>('overview');
  const ctx = useMemo(() => ({ view, setView }), [view]);
  const health = healthByView[view];

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
        className="relative flex h-full w-full flex-col gap-1.5 overflow-hidden rounded-lg border border-[#0c3d75] p-1.5"
        style={{
          background: 'radial-gradient(ellipse at top, rgba(20,68,140,0.25) 0%, transparent 55%), linear-gradient(180deg, #03132a 0%, #021026 100%)',
        }}
      >
        {/* 顶部导航条 */}
        <DtTopBar view={view} setView={setView} health={health} />

        {/* 主体视图 */}
        <div className="relative min-h-0 flex-1 overflow-hidden">{ActiveView}</div>
      </div>
    </NavContext.Provider>
  );
};

export default DigitalTwinDashboard;
