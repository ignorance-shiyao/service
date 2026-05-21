import React, { useEffect, useState } from 'react';
import { LayoutGrid, Map, Server, Network, Activity, ChevronRight, Home, ShieldCheck, PlayCircle, FileText } from 'lucide-react';
import { OverviewView } from './views/OverviewView';
import { AreaView } from './views/AreaView';
import { RackView } from './views/RackView';
import { TopologyView } from './views/TopologyView';
import { DeductionView } from './views/DeductionView';

type ViewKey = 'overview' | 'area' | 'rack' | 'topology' | 'deduction';

const VIEWS: { key: ViewKey; label: string; icon: React.ComponentType<any> }[] = [
  { key: 'overview', label: '总览', icon: LayoutGrid },
  { key: 'area', label: '区域', icon: Map },
  { key: 'rack', label: '机柜', icon: Server },
  { key: 'topology', label: '拓扑', icon: Network },
  { key: 'deduction', label: '推演', icon: Activity },
];

const breadcrumbMap: Record<ViewKey, string[]> = {
  overview: ['总览'],
  area: ['总览', '3号机房', 'B区'],
  rack: ['总览', '3号机房', 'B区', 'B03机柜'],
  topology: ['总览', '网络拓扑'],
  deduction: ['总览', '故障推演'],
};

const useNow = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
};

export const DigitalTwinDashboard: React.FC = () => {
  const [view, setView] = useState<ViewKey>('overview');
  const now = useNow();
  const health = view === 'rack' ? '76.8' : view === 'area' ? '82.4' : view === 'deduction' ? '76.8' : view === 'topology' ? '84.7' : '92.6';
  const crumbs = breadcrumbMap[view];

  const ActiveView = (() => {
    switch (view) {
      case 'overview': return <OverviewView />;
      case 'area': return <AreaView />;
      case 'rack': return <RackView />;
      case 'topology': return <TopologyView />;
      case 'deduction': return <DeductionView />;
    }
  })();

  return (
    <div className="flex h-full w-full flex-col gap-1.5 overflow-hidden rounded-lg border border-[#0c3d75] bg-[var(--sys-bg-page)] p-1.5">
      {/* 顶部标题栏 */}
      <div className="flex h-10 shrink-0 items-center justify-between rounded border border-[#16508f] bg-[linear-gradient(180deg,#0b2f61_0%,#082a59_100%)] px-3">
        <div className="flex items-center gap-3 text-[12px] text-[#9bc4eb]">
          <Home size={14} className="text-[#79d0ff]" />
          {crumbs.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight size={12} className="text-[#3f86c8]" />}
              <span className={i === crumbs.length - 1 ? 'text-[#cfe9ff] font-semibold' : ''}>{c}</span>
            </React.Fragment>
          ))}
        </div>
        <div className="absolute left-1/2 -translate-x-1/2">
          <span className="text-[18px] font-black tracking-[0.18em] text-[#cfe9ff]" style={{ textShadow: '0 0 12px rgba(79,193,255,0.45)' }}>
            轻量数字孪生运维大屏
          </span>
        </div>
        <div className="flex items-center gap-3 text-[12px]">
          <span className="flex items-center gap-1 text-[#9bc4eb]"><span className="text-[#79d0ff]">●</span>{now}</span>
          <span className="flex items-center gap-1.5 rounded border border-[#1d6a45] bg-[#0d3a26]/60 px-2 py-[2px] text-[#7dd6a4]">
            <ShieldCheck size={12} /> 健康度 <span className="font-mono font-bold">{health}</span>
          </span>
          <span className="rounded border border-[#2d6ab1] bg-[#0b2f61] px-2 py-[2px] text-[#bde3ff]">半真实运行</span>
          <span className="text-[#9bc4eb]">数据来源 <span className="text-[#7dd6a4]">●</span> 真实数据 / 模拟数据混合</span>
        </div>
      </div>

      {/* 主体视图 */}
      <div className="flex-1 overflow-hidden">{ActiveView}</div>

      {/* 底部视图导航 */}
      <div className="flex h-[68px] shrink-0 items-center justify-between rounded border border-[#16508f] bg-[#072654]/96 px-3">
        <div className="text-[12px] text-[#bedaf8]">
          <div className="mb-0.5 text-[#79d0ff]">当前视图</div>
          <div className="text-[11px] text-[#9bc4eb]">点击下方按钮在不同视图间切换</div>
        </div>
        <div className="flex items-center gap-1.5">
          {VIEWS.map(v => {
            const active = v.key === view;
            const Ic = v.icon;
            return (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                className={`flex w-[80px] flex-col items-center justify-center gap-1 rounded border px-2 py-1.5 transition ${active ? 'border-[#4fc1ff] bg-[#0f3f7a] text-[#79d0ff] shadow-[0_0_10px_rgba(79,193,255,0.28)]' : 'border-[#2d6ab1] bg-[#0b2f61] text-[#bde3ff] hover:border-[#4ea4ff] hover:bg-[#12407e]'}`}
              >
                <Ic size={18} />
                <span className="text-[11px] font-semibold">{v.label}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded border border-[#4fc1ff] bg-[#0f3f7a] px-3 py-1.5 text-[12px] font-semibold text-[#79d0ff] hover:bg-[#12467f]">
            <PlayCircle size={14} /> 进入故障推演
          </button>
          <button className="flex items-center gap-1.5 rounded border border-[#1d6a45] bg-[#0d3a26] px-3 py-1.5 text-[12px] font-semibold text-[#7dd6a4] hover:bg-[#0f4730]">
            <FileText size={14} /> 生成巡检报告
          </button>
        </div>
      </div>
      <div className="text-center text-[10px] text-[#7799c0]">
        数据说明：<span className="text-[#ffb672]">橙色</span>角标表示模拟数据，<span className="text-[#7dd6a4]">绿色</span>角标表示真实数据
      </div>
    </div>
  );
};

export default DigitalTwinDashboard;
