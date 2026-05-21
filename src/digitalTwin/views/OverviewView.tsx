import React from 'react';
import { BaseChart } from '../../components/BaseChart';
import { Server, Wifi, Siren, Link as LinkIcon, LayoutGrid, Boxes, MapPin, Cpu, AlertTriangle } from 'lucide-react';
import { dtPanel, DtSectionTitle, DtStatusBadge, DtAlarmTag } from '../shared';
import { ASSET_OVERVIEW, BUSINESS_SYSTEMS, AREAS, CURRENT_ALARMS, ALARM_HISTORY_24H } from '../data';

const assetRows = [
  { key: 'totalDevices', label: '设备总数', value: ASSET_OVERVIEW.totalDevices, icon: <Server size={14} />, tone: 'text-[#d8f1ff]' },
  { key: 'online', label: '在线设备', value: ASSET_OVERVIEW.online, icon: <Wifi size={14} />, tone: 'text-[#6ce09a]' },
  { key: 'alarming', label: '告警设备', value: ASSET_OVERVIEW.alarming, icon: <Siren size={14} />, tone: 'text-[#ff8a7a]' },
  { key: 'offline', label: '离线设备', value: ASSET_OVERVIEW.offline, icon: <LinkIcon size={14} />, tone: 'text-[#ffb672]' },
  { key: 'racks', label: '机柜数量', value: ASSET_OVERVIEW.racks, icon: <LayoutGrid size={14} />, tone: 'text-[#9cd3ff]' },
  { key: 'biz', label: '业务系统数量', value: ASSET_OVERVIEW.bizSystems, icon: <Boxes size={14} />, tone: 'text-[#9cd3ff]' },
];

const alarmHistOption = {
  grid: { top: 18, left: 30, right: 6, bottom: 22 },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: { show: false },
  xAxis: {
    type: 'category',
    data: ALARM_HISTORY_24H.hours,
    axisLabel: { color: '#9fc8f2', fontSize: 9 },
  },
  yAxis: { type: 'value', axisLabel: { color: '#9fc8f2', fontSize: 9 } },
  series: [
    { name: '严重', type: 'bar', stack: 'a', data: ALARM_HISTORY_24H.critical, itemStyle: { color: '#ef5350' }, barWidth: 12 },
    { name: '一般', type: 'bar', stack: 'a', data: ALARM_HISTORY_24H.warning, itemStyle: { color: '#f5b963' } },
    { name: '提示', type: 'bar', stack: 'a', data: ALARM_HISTORY_24H.info, itemStyle: { color: '#3b8de1' } },
  ],
};

// 工厂全景示意 SVG
const FactoryScene: React.FC = () => (
  <svg viewBox="0 0 800 420" className="h-full w-full">
    <defs>
      <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#0a2748" />
        <stop offset="1" stopColor="#061a36" />
      </linearGradient>
      <linearGradient id="bldNormal" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1c4f88" />
        <stop offset="1" stopColor="#0d2f5d" />
      </linearGradient>
      <linearGradient id="bldAlarm" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#a93a2d" />
        <stop offset="1" stopColor="#5a1410" />
      </linearGradient>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M40 0 L0 0 0 40" fill="none" stroke="#163d6c" strokeWidth="0.6" />
      </pattern>
    </defs>
    <rect x="0" y="0" width="800" height="420" fill="url(#ground)" />
    <rect x="0" y="0" width="800" height="420" fill="url(#grid)" />

    {/* 三栋主厂房 */}
    <g>
      {/* 1号产线 */}
      <polygon points="60,180 220,180 240,210 80,210" fill="url(#bldNormal)" stroke="#3f86c8" />
      <polygon points="60,180 60,260 80,290 80,210" fill="#0a2a52" stroke="#3f86c8" />
      <polygon points="240,210 240,290 80,290 80,210" fill="#0d3567" stroke="#3f86c8" />
      <text x="150" y="170" fill="#cce6ff" fontSize="11" textAnchor="middle">1号产线</text>
      {/* 3号机房，告警高亮 */}
      <polygon points="320,180 480,180 500,210 340,210" fill="url(#bldAlarm)" stroke="#ff5a4a" />
      <polygon points="320,180 320,260 340,290 340,210" fill="#411414" stroke="#ff5a4a" />
      <polygon points="500,210 500,290 340,290 340,210" fill="#5a1c1c" stroke="#ff5a4a" />
      <text x="410" y="170" fill="#ffd4cf" fontSize="11" textAnchor="middle">3号机房</text>
      <text x="410" y="252" fill="#ffe4df" fontSize="10" textAnchor="middle">B区 (告警 3)</text>
      {/* 算力模块A */}
      <polygon points="580,180 740,180 760,210 600,210" fill="url(#bldNormal)" stroke="#3f86c8" />
      <polygon points="580,180 580,260 600,290 600,210" fill="#0a2a52" stroke="#3f86c8" />
      <polygon points="760,210 760,290 600,290 600,210" fill="#0d3567" stroke="#3f86c8" />
      <text x="670" y="170" fill="#cce6ff" fontSize="11" textAnchor="middle">算力模块A</text>
    </g>

    {/* 下排三个区域 */}
    <g>
      {/* AGV调度区 */}
      <rect x="60" y="320" width="200" height="80" fill="#0d3567" stroke="#3f86c8" />
      <text x="160" y="312" fill="#cce6ff" fontSize="11" textAnchor="middle">AGV调度区</text>
      <path d="M80 380 Q120 340 200 360 T240 380" stroke="#4fc1ff" strokeDasharray="3 3" fill="none" />
      <circle cx="120" cy="370" r="4" fill="#4fc1ff" />
      <circle cx="190" cy="360" r="4" fill="#4fc1ff" />
      {/* 视觉检测区 */}
      <rect x="300" y="320" width="200" height="80" fill="#0d3567" stroke="#3f86c8" />
      <text x="400" y="312" fill="#cce6ff" fontSize="11" textAnchor="middle">视觉检测区</text>
      <g>
        <rect x="320" y="350" width="20" height="30" fill="#1d4d85" stroke="#5ea6e5" />
        <rect x="350" y="350" width="20" height="30" fill="#1d4d85" stroke="#5ea6e5" />
        <rect x="380" y="350" width="20" height="30" fill="#1d4d85" stroke="#5ea6e5" />
        <rect x="410" y="350" width="20" height="30" fill="#1d4d85" stroke="#5ea6e5" />
        <rect x="440" y="350" width="20" height="30" fill="#1d4d85" stroke="#5ea6e5" />
      </g>
      {/* 办公网区 */}
      <rect x="540" y="320" width="200" height="80" fill="#0d3567" stroke="#3f86c8" />
      <text x="640" y="312" fill="#cce6ff" fontSize="11" textAnchor="middle">办公网区</text>
    </g>

    {/* 链路 */}
    <g stroke="#4fc1ff" strokeWidth="1.2" fill="none">
      <path d="M160 290 V320" />
      <path d="M400 290 V320" />
      <path d="M640 290 V320" />
      <path d="M240 245 H320" />
      <path d="M500 245 H580" />
      <path d="M400 290 V305" />
    </g>
    <circle cx="400" cy="305" r="6" fill="#0e3e7e" stroke="#4fc1ff" />
    <text x="400" y="308" fontSize="6" fill="#9cd3ff" textAnchor="middle">⇄</text>
  </svg>
);

export const OverviewView: React.FC = () => {
  return (
    <div className="grid h-full grid-cols-12 gap-1.5">
      {/* 左列 */}
      <div className="col-span-3 flex flex-col gap-1.5">
        <div className={dtPanel}>
          <DtSectionTitle title="资产概览" />
          <div className="flex-1 space-y-1.5">
            {assetRows.map(row => (
              <div key={row.key} className="flex items-center justify-between rounded bg-[#0e3e7e]/70 px-2.5 py-1.5">
                <div className="flex items-center gap-2 text-[12px] text-[#bedaf8]">
                  <span className="text-[#9cd3ff]">{row.icon}</span>
                  {row.label}
                </div>
                <span className={`font-mono text-[18px] font-black ${row.tone}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={dtPanel}>
          <DtSectionTitle title="业务承载" />
          <div className="flex-1 space-y-1.5">
            {BUSINESS_SYSTEMS.map(b => (
              <div key={b.name} className="flex items-center justify-between rounded bg-[#0e3e7e]/55 px-2.5 py-1.5 text-[12px] text-[#d8eaff]">
                <span>{b.name}</span>
                <DtStatusBadge status={b.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 中间主视图 */}
      <div className="col-span-6 flex flex-col gap-1.5">
        <div className={`${dtPanel} flex-1`}>
          <DtSectionTitle title="数字孪生 — 总览" right={<span className="text-[10px] text-[#9bc4eb]">真实数据 / 模拟数据混合</span>} />
          <div className="relative flex-1 overflow-hidden rounded border border-[#16508f] bg-[#03132a]">
            <FactoryScene />
            {/* 区域健康度浮窗 */}
            <div className="pointer-events-none absolute inset-x-2 top-2 grid grid-cols-3 gap-1.5">
              {AREAS.slice(0, 3).map(a => (
                <div
                  key={a.id}
                  className={`rounded border px-2 py-1 text-[10px] leading-tight backdrop-blur-sm ${
                    a.highlight ? 'border-[#ff5a4a] bg-[#481414]/85 text-[#ffe4df]' : 'border-[#2b6aa8] bg-[#0b2f61]/88 text-[#cfe5ff]'
                  }`}
                >
                  <div className="text-[11px] font-bold">{a.name}</div>
                  <div className="flex items-center justify-between">
                    <span>健康度 <span className="font-mono">{a.health}</span></span>
                    <span>告警 <span className={a.alarms ? 'text-[#ff7d7d]' : 'text-[#6ce09a]'}>{a.alarms}</span></span>
                    <span>设备 {a.devices}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-x-2 bottom-2 grid grid-cols-3 gap-1.5">
              {AREAS.slice(3).map(a => (
                <div key={a.id} className="rounded border border-[#2b6aa8] bg-[#0b2f61]/88 px-2 py-1 text-[10px] leading-tight text-[#cfe5ff] backdrop-blur-sm">
                  <div className="text-[11px] font-bold">{a.name}</div>
                  <div className="flex items-center justify-between">
                    <span>健康度 <span className="font-mono">{a.health}</span></span>
                    <span>告警 <span className={a.alarms ? 'text-[#ff7d7d]' : 'text-[#6ce09a]'}>{a.alarms}</span></span>
                    <span>设备 {a.devices}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className={`${dtPanel}`} style={{ height: 168 }}>
          <DtSectionTitle title="最近24小时告警数量变化" right={<div className="flex items-center gap-2 text-[10px] text-[#9fc8f2]"><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#ef5350]"/>严重</span><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#f5b963]"/>一般</span><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#3b8de1]"/>提示</span></div>} />
          <div className="flex-1 min-h-0">
            <BaseChart option={alarmHistOption} />
          </div>
        </div>
      </div>

      {/* 右列 */}
      <div className="col-span-3 flex flex-col gap-1.5">
        <div className={dtPanel}>
          <DtSectionTitle title="当前告警" right={<span className="cursor-pointer text-[10px] text-[#79d0ff] hover:underline">更多 ›</span>} />
          <div className="flex-1 space-y-1.5">
            {CURRENT_ALARMS.map(al => (
              <div key={al.id} className="rounded border-l-4 border-l-[#ef5350] bg-[#0c2f5e]/85 px-2 py-1.5 text-[11px]" style={{
                borderLeftColor: al.level === 'critical' ? '#ef5350' : al.level === 'warning' ? '#f5b963' : '#3b8de1'
              }}>
                <div className="mb-0.5 flex items-center justify-between">
                  <DtAlarmTag level={al.level} />
                  <span className="text-[10px] text-[#9bc4eb]">{al.time}</span>
                </div>
                <div className="text-[12px] font-semibold text-[#eaf6ff]">{al.title}</div>
                <div className="text-[10px] text-[#9bc4eb]">影响范围：{al.scope}</div>
              </div>
            ))}
          </div>
        </div>
        <div className={dtPanel}>
          <DtSectionTitle title="影响总览" />
          <div className="flex-1 space-y-1.5 text-[11px] text-[#d8eaff]">
            <div className="flex items-center justify-between rounded bg-[#0e3e7e]/55 px-2.5 py-1.5"><span className="flex items-center gap-1.5"><MapPin size={12}/>受影响区域</span><span className="text-[#ff8a7a] font-semibold">A区视觉检测工位</span></div>
            <div className="flex items-center justify-between rounded bg-[#0e3e7e]/55 px-2.5 py-1.5"><span className="flex items-center gap-1.5"><Cpu size={12}/>受影响设备</span><span className="text-[#ff8a7a] font-semibold">8台终端</span></div>
            <div className="flex items-center justify-between rounded bg-[#0e3e7e]/55 px-2.5 py-1.5"><span className="flex items-center gap-1.5"><Boxes size={12}/>受影响业务</span><span className="text-[#f5b963]">视觉检测、AGV调度、视频监控</span></div>
            <div className="flex items-center justify-between rounded bg-[#0e3e7e]/55 px-2.5 py-1.5"><span className="flex items-center gap-1.5"><AlertTriangle size={12}/>风险等级</span><DtStatusBadge status="告警" /></div>
          </div>
        </div>
      </div>
    </div>
  );
};
