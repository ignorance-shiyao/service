import React from 'react';
import { BaseChart } from '../../components/BaseChart';
import { dtPanel, DtSectionTitle, DtStatusBadge } from '../shared';
import { Router, Server, Cpu, Camera, Car, Monitor, AlertTriangle } from 'lucide-react';

const scaleDonut = {
  series: [{
    type: 'pie', radius: ['52%', '78%'],
    label: { show: false },
    data: [
      { value: 2, name: '核心', itemStyle: { color: '#3fa5ff' } },
      { value: 6, name: '汇聚', itemStyle: { color: '#84d18d' } },
      { value: 28, name: '接入', itemStyle: { color: '#f5b963' } },
      { value: 186, name: '终端', itemStyle: { color: '#f56f72' } },
    ],
  }],
};

const sparkOpt = (data: number[], color: string) => ({
  grid: { top: 4, left: 4, right: 4, bottom: 4 },
  xAxis: { type: 'category', show: false, data },
  yAxis: { type: 'value', show: false },
  series: [{ type: 'line', data, smooth: true, symbol: 'none', lineStyle: { width: 1.5, color }, areaStyle: { color: `${color}33` } }],
});

const alarmLine = {
  grid: { top: 20, left: 28, right: 6, bottom: 22 },
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: ['14:30','16:30','18:30','20:30','22:30','00:30','02:30','04:30','06:30','08:30','10:30','12:30','14:30'], axisLabel: { color: '#9fc8f2', fontSize: 9 } },
  yAxis: { type: 'value', max: 15, axisLabel: { color: '#9fc8f2', fontSize: 9 } },
  series: [{ type: 'line', data: [4,6,5,7,6,8,5,4,7,6,5,7,7], lineStyle: { color: '#ef5350' }, symbol: 'none', smooth: true }],
};

const NodeBox: React.FC<{ x: number; y: number; label: string; sub: string; status: 'normal' | 'critical'; alarm?: boolean }> = ({ x, y, label, sub, status, alarm }) => {
  const color = status === 'critical' ? { bg: '#5a1414', border: '#ff5a4a', text: '#ffe4df' } : { bg: '#0d3567', border: '#5ea6e5', text: '#cfe5ff' };
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="-46" y="-22" width="92" height="44" rx="6" fill={color.bg} stroke={color.border} strokeWidth={status === 'critical' ? 2 : 1} />
      <text x="0" y="-4" textAnchor="middle" fontSize="10" fill={color.text}>{label}</text>
      <text x="0" y="10" textAnchor="middle" fontSize="11" fontWeight="bold" fill={color.text}>{sub}</text>
      <circle cx="32" cy="-12" r="3.5" fill={status === 'critical' ? '#ef5350' : '#7dd6a4'} />
      {alarm && <g transform="translate(40, -22)"><circle r="9" fill="#ef5350" /><text textAnchor="middle" y="3" fontSize="11" fill="#fff" fontWeight="bold">!</text></g>}
    </g>
  );
};

const TerminalIcon: React.FC<{ x: number; y: number; label: string; type: string; alarm?: boolean }> = ({ x, y, label, type, alarm }) => {
  const map: Record<string, React.ReactNode> = {
    server: <Server size={20} />,
    plc: <Cpu size={20} />,
    camera: <Camera size={20} />,
    agv: <Car size={20} />,
    vision: <Monitor size={20} />,
    office: <Monitor size={20} />,
  };
  return (
    <foreignObject x={x - 36} y={y - 18} width="72" height="68">
      <div className={`flex h-full w-full flex-col items-center justify-start gap-1 rounded border px-2 py-1.5 ${alarm ? 'border-[#ff5a4a] bg-[#3a1414] text-[#ff8a7a]' : 'border-[#3a82c8] bg-[#0d3567]/85 text-[#cfe5ff]'}`}>
        {map[type]}
        <div className="text-[10px] leading-tight text-center">{label}</div>
      </div>
    </foreignObject>
  );
};

const TopoSvg: React.FC = () => (
  <svg viewBox="0 0 920 460" className="h-full w-full">
    {/* 链路 */}
    <g fill="none" strokeWidth="1.4">
      <path d="M460 60 V120" stroke="#4fc1ff" />
      <path d="M460 130 L310 200" stroke="#4fc1ff" />
      <path d="M460 130 L610 200" stroke="#4fc1ff" />
      {/* AGG to access */}
      <path d="M310 220 L180 290" stroke="#ef5350" strokeDasharray="5 4" />
      <path d="M310 220 L390 290" stroke="#4fc1ff" />
      <path d="M610 220 L560 290" stroke="#4fc1ff" />
      <path d="M610 220 L740 290" stroke="#4fc1ff" />
      {/* access to terminals */}
      <path d="M180 320 L120 400" stroke="#ef5350" strokeDasharray="5 4" />
      <path d="M180 320 L250 400" stroke="#ef5350" strokeDasharray="5 4" />
      <path d="M390 320 L380 400" stroke="#4fc1ff" />
      <path d="M390 320 L500 400" stroke="#4fc1ff" />
      <path d="M560 320 L620 400" stroke="#4fc1ff" />
      <path d="M740 320 L740 400" stroke="#4fc1ff" />
    </g>

    {/* 故障光环 */}
    <circle cx="180" cy="305" r="36" fill="none" stroke="#ef5350" strokeOpacity="0.55" strokeWidth="2">
      <animate attributeName="r" values="30;48;30" dur="2s" repeatCount="indefinite" />
      <animate attributeName="stroke-opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
    </circle>

    {/* 核心 */}
    <NodeBox x={460} y={80} label="核心交换机" sub="Core-01" status="normal" />
    {/* 汇聚 */}
    <NodeBox x={310} y={210} label="汇聚交换机" sub="AGG-01" status="normal" />
    <NodeBox x={610} y={210} label="汇聚交换机" sub="AGG-02" status="normal" />
    {/* 接入 */}
    <NodeBox x={180} y={305} label="接入交换机" sub="SW-A-01" status="critical" alarm />
    <NodeBox x={390} y={305} label="接入交换机" sub="SW-B03-01" status="normal" />
    <NodeBox x={560} y={305} label="接入交换机" sub="SW-C-02" status="normal" />
    <NodeBox x={740} y={305} label="接入交换机" sub="SW-D-04" status="normal" />
    {/* 终端 */}
    <TerminalIcon x={120} y={418} label="服务器" type="server" />
    <TerminalIcon x={250} y={418} label="PLC" type="plc" />
    <TerminalIcon x={380} y={418} label="摄像头" type="camera" />
    <TerminalIcon x={500} y={418} label="AGV" type="agv" />
    <TerminalIcon x={620} y={418} label="视觉检测终端" type="vision" alarm />
    <TerminalIcon x={740} y={418} label="办公终端" type="office" />

    {/* 图例 */}
    <g transform="translate(280, 458)" fontSize="10" fill="#9fc8f2">
      <line x1="0" y1="-2" x2="22" y2="-2" stroke="#4fc1ff" strokeWidth="1.5" />
      <text x="28" y="2">正常链路</text>
      <line x1="100" y1="-2" x2="122" y2="-2" stroke="#ef5350" strokeDasharray="4 3" strokeWidth="1.5" />
      <text x="128" y="2">异常链路</text>
      <circle cx="200" cy="-2" r="3" fill="#7dd6a4" /><text x="206" y="2">正常</text>
      <circle cx="244" cy="-2" r="3" fill="#f5b963" /><text x="250" y="2">告警</text>
      <circle cx="288" cy="-2" r="3" fill="#ef5350" /><text x="294" y="2">严重</text>
      <circle cx="332" cy="-2" r="3" fill="#7a96b6" /><text x="338" y="2">离线</text>
    </g>
  </svg>
);

export const TopologyView: React.FC = () => {
  return (
    <div className="grid h-full grid-cols-12 gap-1.5">
      {/* 左列 */}
      <div className="col-span-3 flex flex-col gap-1.5">
        <div className={dtPanel}>
          <DtSectionTitle title="网络规模" />
          <div className="flex gap-2">
            <div className="h-[120px] w-[120px]"><BaseChart option={scaleDonut} /></div>
            <div className="flex-1 space-y-1 text-[11.5px] text-[#d8eaff]">
              <RowSm label="核心交换机" v="2" />
              <RowSm label="汇聚交换机" v="6" />
              <RowSm label="接入交换机" v="28" />
              <RowSm label="终端设备" v="186" />
              <RowSm label="链路总数" v="72" />
            </div>
          </div>
        </div>
        <div className={dtPanel}>
          <DtSectionTitle title="链路利用率" />
          <div className="space-y-2 text-[11.5px] text-[#d8eaff]">
            {[
              { label: '核心链路', value: 83, color: '#ef5350' },
              { label: '接入链路', value: 67, color: '#f5b963' },
              { label: '备用链路', value: 12, color: '#3fa5ff' },
            ].map(r => (
              <div key={r.label}>
                <div className="mb-1 flex items-center justify-between"><span>{r.label}</span><span className="font-mono font-bold">{r.value}%</span></div>
                <div className="h-1.5 rounded bg-[#0c2f5e] overflow-hidden">
                  <div className="h-full rounded" style={{ width: `${r.value}%`, background: r.color, boxShadow: `0 0 6px ${r.color}88` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={`${dtPanel} grid grid-cols-3 gap-1.5`}>
          <KpiBlock label="平均时延" value="18" unit="ms" color="#3fa5ff" data={[15,16,17,16,18,18,19,18]} />
          <KpiBlock label="丢包率" value="1.8" unit="%" color="#f5b963" data={[1.2,1.4,1.6,1.5,1.7,1.8,1.9,1.8]} />
          <KpiBlock label="异常链路" value="3" color="#ef5350" data={[1,1,2,2,3,3,3,3]} />
        </div>
      </div>

      {/* 中间拓扑 */}
      <div className="col-span-6 flex flex-col gap-1.5">
        <div className={`${dtPanel} flex-1`}>
          <DtSectionTitle title="网络拓扑" />
          <div className="relative flex-1 overflow-hidden rounded border border-[#16508f] bg-[#03132a]">
            <TopoSvg />
          </div>
        </div>
        <div className={dtPanel} style={{ height: 148 }}>
          <DtSectionTitle title="最近24小时告警数量变化" />
          <div className="flex-1 min-h-0"><BaseChart option={alarmLine} /></div>
        </div>
      </div>

      {/* 右列 */}
      <div className="col-span-3 flex flex-col gap-1.5">
        <div className={dtPanel}>
          <DtSectionTitle title="受影响业务清单" />
          <div className="space-y-1.5">
            {[
              { name: '视觉检测', s: '告警' as const },
              { name: 'AGV调度', s: '降级' as const },
              { name: '视频监控', s: '受影响' as const },
              { name: 'MES', s: '正常' as const },
              { name: '办公网', s: '正常' as const },
            ].map(r => (
              <div key={r.name} className="flex items-center justify-between rounded bg-[#0e3e7e]/55 px-2.5 py-1.5 text-[12px] text-[#d8eaff]">
                <span>{r.name}</span>
                <DtStatusBadge status={r.s} />
              </div>
            ))}
          </div>
        </div>
        <div className={dtPanel}>
          <DtSectionTitle title="当前告警摘要" />
          <div className="space-y-1.5 text-[11px]">
            <div className="rounded border-l-4 border-[#ef5350] bg-[#0c2f5e]/85 px-2 py-1.5">
              <div className="flex items-center justify-between"><span className="font-bold text-[#ff8a7a]">严重</span><span className="text-[10px] text-[#9bc4eb]">14:29:58</span></div>
              <div className="text-[12px] text-[#eaf6ff]">SW-A-01 接入交换机离线</div>
            </div>
            <div className="rounded border-l-4 border-[#3b8de1] bg-[#0c2f5e]/85 px-2 py-1.5">
              <div className="flex items-center justify-between"><span className="font-bold text-[#79d0ff]">提示</span><span className="text-[10px] text-[#9bc4eb]">14:28:12</span></div>
              <div className="text-[12px] text-[#eaf6ff]">链路利用率超过80%</div>
            </div>
          </div>
        </div>
        <div className={dtPanel}>
          <DtSectionTitle title="影响范围" />
          <div className="grid grid-cols-3 gap-1.5 text-center text-[11px] text-[#d8eaff]">
            <Cell t="影响范围" v="A区视觉检测工位" small />
            <Cell t="影响终端" v="8台" />
            <Cell t="影响业务" v="3项" />
          </div>
        </div>
        <div className={dtPanel}>
          <DtSectionTitle title="处理建议" />
          <ul className="space-y-1 text-[11.5px] text-[#d8eaff]">
            {['切换备用链路', '检查上联光模块', '派发网络运维工单'].map((t, i) => (
              <li key={i} className="flex items-center gap-2 rounded bg-[#0e3e7e]/55 px-2 py-1.5"><span className="text-[#79d0ff]">✓</span>{t}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const RowSm: React.FC<{ label: string; v: string }> = ({ label, v }) => (
  <div className="flex items-center justify-between"><span className="text-[#bedaf8]">{label}</span><span className="font-mono text-[14px] font-bold text-[#cfe9ff]">{v}</span></div>
);

const KpiBlock: React.FC<{ label: string; value: string; unit?: string; color: string; data: number[] }> = ({ label, value, unit, color, data }) => (
  <div className="rounded bg-[#0e3e7e]/55 p-1.5 text-center">
    <div className="text-[10px] text-[#8bc4ff]">{label}</div>
    <div className="font-mono text-[18px] font-bold" style={{ color }}>{value}{unit && <span className="text-[9px] font-normal text-[#8bc4ff]">{unit}</span>}</div>
    <div className="h-6"><BaseChart option={sparkOpt(data, color)} /></div>
  </div>
);

const Cell: React.FC<{ t: string; v: string; small?: boolean }> = ({ t, v, small }) => (
  <div className="rounded bg-[#0e3e7e]/55 p-1.5">
    <div className="text-[10px] text-[#8bc4ff]">{t}</div>
    <div className={`font-bold text-[#cfe9ff] ${small ? 'text-[11px]' : 'text-[14px]'}`}>{v}</div>
  </div>
);
