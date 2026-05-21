import React from 'react';
import { BaseChart } from '../../components/BaseChart';
import { dtPanel, DtSectionTitle, DtStatusBadge, DtAlarmTag } from '../shared';
import { B_AREA_CATEGORIES, B_AREA_KPIS, B_AREA_ENV, CURRENT_ALARMS } from '../data';
import { Gauge, Activity, Thermometer, Zap, Wifi } from 'lucide-react';

const kpiIcons = [Gauge, Activity, Wifi, Thermometer, Zap];

const sparkline = (data: number[], color: string) => ({
  grid: { top: 4, left: 4, right: 4, bottom: 4 },
  xAxis: { type: 'category', show: false, data: data.map((_, i) => i) },
  yAxis: { type: 'value', show: false },
  series: [{
    type: 'line', data, smooth: true, symbol: 'none',
    lineStyle: { width: 1.5, color },
    areaStyle: { color: `${color}33` }
  }],
});

const alarmTrendOption = {
  grid: { top: 20, left: 28, right: 6, bottom: 22 },
  tooltip: { trigger: 'axis' },
  legend: { show: false },
  xAxis: { type: 'category', data: ['14:30', '16:30', '18:30', '20:30', '22:30', '00:30', '02:30', '04:30', '06:30', '08:30', '10:30', '12:30', '14:30'], axisLabel: { color: '#9fc8f2', fontSize: 9 } },
  yAxis: { type: 'value', max: 30, axisLabel: { color: '#9fc8f2', fontSize: 9 } },
  series: [
    { name: '严重', type: 'line', data: [2, 4, 6, 8, 10, 6, 4, 5, 3, 4, 5, 7, 3], lineStyle: { color: '#ef5350' }, smooth: true, symbol: 'none' },
    { name: '一般', type: 'line', data: [5, 8, 12, 18, 22, 14, 10, 12, 9, 13, 14, 16, 8], lineStyle: { color: '#f5b963' }, smooth: true, symbol: 'none' },
    { name: '提示', type: 'line', data: [3, 6, 11, 17, 25, 18, 12, 14, 15, 17, 13, 15, 15], lineStyle: { color: '#3b8de1' }, smooth: true, symbol: 'none' },
  ],
};

// B区机房示意
const BAreaScene: React.FC = () => (
  <svg viewBox="0 0 760 420" className="h-full w-full">
    <defs>
      <pattern id="floor" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M40 0L0 0 0 40" fill="none" stroke="#143458" strokeWidth="0.5" />
      </pattern>
    </defs>
    <rect x="0" y="0" width="760" height="420" fill="#04132c" />
    <rect x="0" y="0" width="760" height="420" fill="url(#floor)" />

    {/* 机柜列 B01 B02 */}
    <g>
      <rect x="220" y="60" width="320" height="50" rx="4" fill="#0b2f61" stroke="#3a82c8" />
      <text x="380" y="50" fill="#cce6ff" fontSize="11" textAnchor="middle">B01机柜 row</text>
      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={`r1-${i}`} x={230 + i * 38} y={70} width={30} height={30} fill="#0d3567" stroke="#5ea6e5" />
      ))}
      <rect x="220" y="140" width="320" height="50" rx="4" fill="#0b2f61" stroke="#3a82c8" />
      <text x="380" y="130" fill="#cce6ff" fontSize="11" textAnchor="middle">B02机柜 row</text>
      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={`r2-${i}`} x={230 + i * 38} y={150} width={30} height={30} fill="#0d3567" stroke="#5ea6e5" />
      ))}
    </g>

    {/* 中央故障交换机 SW-A-01 */}
    <g>
      <rect x="300" y="230" width="160" height="56" rx="6" fill="#5a1414" stroke="#ff5a4a" />
      <rect x="312" y="244" width="136" height="22" fill="#0b1a3d" stroke="#ff7d7d" />
      {Array.from({ length: 12 }).map((_, i) => (
        <rect key={`p-${i}`} x={316 + i * 10} y={248} width={6} height={14} fill="#ff8a7a" />
      ))}
      <circle cx="445" cy="225" r="8" fill="#ff5a4a" stroke="#fff" strokeWidth="1.5" />
      <text x="445" y="229" fontSize="11" fill="#fff" textAnchor="middle">!</text>
      <text x="380" y="305" fontSize="11" fill="#ffd4cf" textAnchor="middle">SW-A-01 接入交换机离线</text>
    </g>

    {/* 摄像头 / 接入交换机 / PLC / UPS / 视觉工位 / AGV / 精密空调 */}
    <g fill="#0d3567" stroke="#5ea6e5">
      <rect x="60" y="80" width="32" height="20" />
      <circle cx="76" cy="76" r="4" fill="#7dd6a4" stroke="none" />
      <text x="100" y="94" fontSize="10" fill="#cce6ff">摄像头-01</text>
      <rect x="640" y="80" width="32" height="20" />
      <circle cx="656" cy="76" r="4" fill="#7dd6a4" stroke="none" />
      <text x="610" y="94" fontSize="10" fill="#cce6ff" textAnchor="end">摄像头-02</text>

      {/* 接入交换机1/2 */}
      <rect x="60" y="180" width="60" height="22" />
      <text x="90" y="220" fontSize="10" fill="#cce6ff" textAnchor="middle">接入交换机-01</text>
      <rect x="640" y="180" width="60" height="22" />
      <text x="670" y="220" fontSize="10" fill="#cce6ff" textAnchor="middle">接入交换机-02</text>

      {/* 控制柜 */}
      <rect x="540" y="60" width="40" height="50" />
      <text x="560" y="50" fontSize="10" fill="#cce6ff" textAnchor="middle">控制柜</text>

      {/* PLC */}
      <rect x="170" y="240" width="40" height="50" />
      <text x="190" y="305" fontSize="10" fill="#cce6ff" textAnchor="middle">PLC-01</text>
      <rect x="550" y="240" width="40" height="50" />
      <text x="570" y="305" fontSize="10" fill="#cce6ff" textAnchor="middle">PLC-02</text>

      {/* UPS */}
      <rect x="640" y="270" width="40" height="40" />
      <text x="660" y="325" fontSize="10" fill="#cce6ff" textAnchor="middle">UPS-01</text>

      {/* AGV */}
      <rect x="60" y="320" width="48" height="32" rx="4" />
      <text x="84" y="370" fontSize="10" fill="#cce6ff" textAnchor="middle">AGV终端</text>

      {/* 视觉检测工位 */}
      {[0, 1, 2].map(i => (
        <g key={`vs-${i}`}>
          <rect x={170 + i * 90} y={330} width={70} height={28} />
          <text x={205 + i * 90} y={372} fontSize="10" fill="#cce6ff" textAnchor="middle">视觉检测工位-0{i+1}</text>
          <circle cx={235 + i * 90} cy={332} r="4" fill="#ef5350" stroke="none" />
        </g>
      ))}

      {/* 精密空调 */}
      <rect x="610" y="330" width="80" height="32" />
      <text x="650" y="372" fontSize="10" fill="#cce6ff" textAnchor="middle">精密空调-01</text>
      <circle cx="685" cy="333" r="4" fill="#ef5350" stroke="none" />
    </g>

    {/* 链路 */}
    <g fill="none">
      <path d="M120 191 H300" stroke="#4fc1ff" />
      <path d="M460 258 H640" stroke="#4fc1ff" />
      <path d="M300 258 H210" stroke="#4fc1ff" />
      <path d="M460 258 H550" stroke="#4fc1ff" />
      <path d="M90 200 V320" stroke="#4fc1ff" />
      <path d="M380 286 V330" stroke="#ef5350" strokeDasharray="4 3" />
      <path d="M380 286 H205" stroke="#ef5350" strokeDasharray="4 3" />
      <path d="M380 286 H285" stroke="#ef5350" strokeDasharray="4 3" />
      <path d="M380 286 H440" stroke="#ef5350" strokeDasharray="4 3" />
      <path d="M380 110 V230" stroke="#4fc1ff" strokeDasharray="2 2" />
    </g>

    {/* 状态点 */}
    {[[90, 200], [670, 200], [560, 110], [190, 246], [570, 246], [660, 274], [76, 76], [656, 76]].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r="4" fill="#7dd6a4" />
    ))}
  </svg>
);

export const AreaView: React.FC = () => {
  return (
    <div className="grid h-full grid-cols-12 gap-1.5">
      {/* 左列 */}
      <div className="col-span-3 flex flex-col gap-1.5">
        <div className={dtPanel}>
          <DtSectionTitle title="设备分类" />
          <div className="flex-1 space-y-1.5">
            {B_AREA_CATEGORIES.map(c => (
              <div key={c.name} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded bg-[#0e3e7e]/55 px-2.5 py-1.5 text-[12px]">
                <span className="text-[#d8eaff]">{c.name}</span>
                <span className="font-mono text-[14px] font-bold text-[#cfe9ff]">{c.count}</span>
                <span className={`rounded px-1.5 py-[1px] text-[10px] font-bold ${c.alarm > 0 ? 'bg-[#5a1414] text-[#ff8a7a] border border-[#7a2e2e]' : 'bg-[#0d3a26] text-[#7dd6a4] border border-[#1d6a45]'}`}>
                  告警 {c.alarm}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className={dtPanel}>
          <DtSectionTitle title="关键指标" />
          <div className="flex-1 space-y-1">
            {B_AREA_KPIS.map((k, i) => {
              const Ic = kpiIcons[i] || Gauge;
              const colors = ['#5b8def', '#9c6dff', '#ffb672', '#ff7d7d', '#7dd6a4'];
              return (
                <div key={k.label} className="grid grid-cols-[16px_1fr_60px_64px] items-center gap-1.5 rounded bg-[#0e3e7e]/55 px-2 py-1">
                  <Ic size={13} className="text-[#9cd3ff]" />
                  <span className="text-[11px] text-[#bedaf8]">{k.label}</span>
                  <div className="h-5"><BaseChart option={sparkline([10,12,9,14,16,13,18,15,17,18], colors[i % colors.length])} /></div>
                  <span className="text-right font-mono text-[14px] font-bold text-[#d8f1ff]">{k.value}<span className="ml-0.5 text-[9px] text-[#8bc4ff]">{k.unit}</span></span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 中间主视图 */}
      <div className="col-span-6 flex flex-col gap-1.5">
        <div className={`${dtPanel} flex-1`}>
          <DtSectionTitle title="3号机房 B区" />
          <div className="relative flex-1 overflow-hidden rounded border border-[#16508f] bg-[#03132a]">
            <BAreaScene />
          </div>
        </div>
        <div className={dtPanel} style={{ height: 168 }}>
          <DtSectionTitle title="最近24小时告警数量变化" right={<div className="flex items-center gap-2 text-[10px] text-[#9fc8f2]"><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#ef5350]"/>严重 3</span><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#f5b963]"/>一般 8</span><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#3b8de1]"/>提示 15</span></div>} />
          <div className="flex-1 min-h-0">
            <BaseChart option={alarmTrendOption} />
          </div>
        </div>
      </div>

      {/* 右列 */}
      <div className="col-span-3 flex flex-col gap-1.5">
        <div className={dtPanel}>
          <DtSectionTitle title="当前告警" />
          <div className="flex-1 space-y-1.5">
            {CURRENT_ALARMS.map(al => (
              <div key={al.id} className="rounded border-l-4 bg-[#0c2f5e]/85 px-2 py-1.5 text-[11px]" style={{ borderLeftColor: al.level === 'critical' ? '#ef5350' : al.level === 'warning' ? '#f5b963' : '#3b8de1' }}>
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
          <DtSectionTitle title="处理建议" />
          <ul className="flex-1 space-y-1.5 text-[11.5px] text-[#d8eaff]">
            <li className="flex items-center gap-2 rounded bg-[#0e3e7e]/55 px-2 py-1.5"><span className="text-[#79d0ff]">·</span>检查上联光模块</li>
            <li className="flex items-center gap-2 rounded bg-[#0e3e7e]/55 px-2 py-1.5"><span className="text-[#79d0ff]">·</span>切换备用链路</li>
            <li className="flex items-center gap-2 rounded bg-[#0e3e7e]/55 px-2 py-1.5"><span className="text-[#79d0ff]">·</span>通知一号产线负责人</li>
            <li className="flex items-center gap-2 rounded bg-[#0e3e7e]/55 px-2 py-1.5"><span className="text-[#79d0ff]">·</span>派发网络运维工单</li>
          </ul>
        </div>
        <div className={dtPanel}>
          <DtSectionTitle title="环境状态" />
          <div className="grid grid-cols-2 gap-1.5">
            {B_AREA_ENV.map(e => (
              <div key={e.name} className="flex items-center justify-between rounded bg-[#0e3e7e]/55 px-2 py-1 text-[11px] text-[#d8eaff]">
                <span>{e.name}</span>
                <DtStatusBadge status={e.status as any} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
