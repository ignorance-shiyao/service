import React from 'react';
import { BaseChart } from '../../components/BaseChart';
import { dtPanel, DtSectionTitle, DtStatusBadge, DtProgress } from '../shared';
import { Server, Cpu, Camera, Car, Monitor, CheckCircle2 } from 'lucide-react';

const scaleDonut = {
  series: [{
    type: 'pie',
    radius: ['55%', '80%'],
    avoidLabelOverlap: false,
    label: { show: false },
    silent: true,
    data: [
      { value: 2,   name: '核心',   itemStyle: { color: '#4fc1ff' } },
      { value: 6,   name: '汇聚',   itemStyle: { color: '#6ce09a' } },
      { value: 28,  name: '接入',   itemStyle: { color: '#f5b963' } },
      { value: 186, name: '终端',   itemStyle: { color: '#ff7d7d' } },
    ],
  }],
};

const sparkArea = (data: number[], color: string) => ({
  grid: { top: 4, left: 0, right: 0, bottom: 4 },
  xAxis: { type: 'category', show: false, data },
  yAxis: { type: 'value', show: false },
  series: [{ type: 'line', data, smooth: true, symbol: 'none', lineStyle: { color, width: 1.5 }, areaStyle: { color: `${color}33` } }],
});

const alarmLine = {
  grid: { top: 18, left: 28, right: 6, bottom: 22 },
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: ['14:30','16:30','18:30','20:30','22:30','00:30','02:30','04:30','06:30','08:30','10:30','12:30','14:30'], axisLabel: { color: '#7e9fc8', fontSize: 9 }, axisLine: { lineStyle: { color: '#234c7c' } } },
  yAxis: { type: 'value', max: 15, axisLabel: { color: '#7e9fc8', fontSize: 9 }, splitLine: { lineStyle: { color: 'rgba(35,76,124,0.4)' } } },
  series: [{ type: 'line', data: [4,6,5,7,6,8,5,4,7,6,5,7,7], lineStyle: { color: '#ef5350', width: 1.5 }, symbol: 'circle', symbolSize: 4, smooth: true, areaStyle: { color: 'rgba(239,83,80,0.18)' } }],
};

// ── 拓扑节点 ─────────────────────────────────────────────────────────
const NodeBox: React.FC<{ x: number; y: number; label: string; sub: string; status: 'normal' | 'critical' }> = ({ x, y, label, sub, status }) => {
  const c = status === 'critical'
    ? { bg: 'linear-gradient(180deg,#5a1414 0%,#3a0d0d 100%)', border: '#ef5a4a', text: '#ffe4df', dot: '#ef5350' }
    : { bg: 'linear-gradient(180deg,#114a8a 0%,#0a2f63 100%)', border: '#5fb4ff', text: '#cfe5ff', dot: '#6ce09a' };
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="-58" y="-26" width="116" height="52" rx="6"
        fill={c.border === '#ef5a4a' ? '#3a0d0d' : '#0a2f63'} stroke={c.border} strokeWidth={status === 'critical' ? 2 : 1} />
      {/* 节点图标 */}
      <g transform="translate(-44, -16)" fill="none" stroke={c.text}>
        <rect x="0" y="0" width="22" height="14" rx="2" stroke={c.border} fill={c.border === '#ef5a4a' ? '#5a1414' : '#114a8a'} />
        <line x1="3" y1="4" x2="19" y2="4" />
        <line x1="3" y1="8" x2="19" y2="8" />
      </g>
      <text x="14" y="-6" textAnchor="middle" fontSize="10" fill={c.text}>{label}</text>
      <text x="14" y="14" textAnchor="middle" fontSize="11" fontWeight="bold" fill={c.text}>{sub}</text>
      <circle cx="40" cy="-14" r="3" fill={c.dot} />
      {status === 'critical' && (
        <g transform="translate(54, -26)">
          <circle r="10" fill="#ef5350" stroke="#fff" strokeWidth="1.5" />
          <text textAnchor="middle" y="4" fontSize="13" fill="#fff" fontWeight="bold">!</text>
        </g>
      )}
    </g>
  );
};

const TerminalIcon: React.FC<{ x: number; y: number; label: string; type: string; alarm?: boolean }> = ({ x, y, label, type, alarm }) => {
  const ico: Record<string, React.ReactNode> = {
    server: <Server size={22} />,
    plc: <Cpu size={22} />,
    camera: <Camera size={22} />,
    agv: <Car size={22} />,
    vision: <Monitor size={22} />,
    office: <Monitor size={22} />,
  };
  return (
    <foreignObject x={x - 38} y={y - 18} width="76" height="72">
      <div
        className="flex h-full w-full flex-col items-center justify-center gap-1 rounded border px-2 py-1.5"
        style={{
          background: alarm ? 'linear-gradient(180deg,#3a1310 0%,#220a08 100%)' : 'linear-gradient(180deg,#0e3a72 0%,#0a2c5e 100%)',
          borderColor: alarm ? '#ef5a4a' : '#2b6aa8',
          color: alarm ? '#ff8a7a' : '#cfe5ff',
        }}
      >
        {ico[type]}
        <div className="text-[10px] font-semibold leading-tight">{label}</div>
      </div>
    </foreignObject>
  );
};

const TopoSvg: React.FC = () => (
  <svg viewBox="0 0 980 540" className="h-full w-full">
    <defs>
      <pattern id="topoGrid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M40 0 L0 0 0 40" fill="none" stroke="rgba(35,76,124,0.3)" strokeWidth="0.5" />
      </pattern>
    </defs>
    <rect width="980" height="540" fill="#03132a" />
    <rect width="980" height="540" fill="url(#topoGrid)" />

    {/* === 链路 === */}
    <g fill="none" strokeWidth="1.4">
      {/* core → agg */}
      <path d="M490 70 V130" stroke="#4fc1ff" />
      <path d="M490 144 L320 230" stroke="#4fc1ff" />
      <path d="M490 144 L660 230" stroke="#4fc1ff" />
      {/* agg → access */}
      <path d="M320 256 L180 340" stroke="#ef5350" strokeDasharray="6 4" />
      <path d="M320 256 L420 340" stroke="#4fc1ff" />
      <path d="M660 256 L600 340" stroke="#4fc1ff" />
      <path d="M660 256 L800 340" stroke="#4fc1ff" />
      {/* access → terminals */}
      <path d="M180 366 L120 450" stroke="#ef5350" strokeDasharray="6 4" />
      <path d="M180 366 L240 450" stroke="#ef5350" strokeDasharray="6 4" />
      <path d="M420 366 L400 450" stroke="#4fc1ff" />
      <path d="M420 366 L520 450" stroke="#4fc1ff" />
      <path d="M600 366 L660 450" stroke="#4fc1ff" />
      <path d="M800 366 L800 450" stroke="#4fc1ff" />
    </g>

    {/* 故障光环 */}
    <circle cx="180" cy="340" r="44" fill="none" stroke="#ef5350" strokeOpacity="0.6">
      <animate attributeName="r" values="36;56;36" dur="2.2s" repeatCount="indefinite" />
      <animate attributeName="stroke-opacity" values="0.7;0;0.7" dur="2.2s" repeatCount="indefinite" />
    </circle>

    {/* 节点 */}
    <NodeBox x={490} y={92}  label="核心交换机"  sub="Core-01"     status="normal" />
    <NodeBox x={320} y={242} label="汇聚交换机"  sub="AGG-01"      status="normal" />
    <NodeBox x={660} y={242} label="汇聚交换机"  sub="AGG-02"      status="normal" />
    <NodeBox x={180} y={340} label="接入交换机"  sub="SW-A-01"     status="critical" />
    <NodeBox x={420} y={340} label="接入交换机"  sub="SW-B03-01"   status="normal" />
    <NodeBox x={600} y={340} label="接入交换机"  sub="SW-C-02"     status="normal" />
    <NodeBox x={800} y={340} label="接入交换机"  sub="SW-D-04"     status="normal" />

    {/* 终端 */}
    <TerminalIcon x={120} y={464} label="服务器" type="server" />
    <TerminalIcon x={240} y={464} label="PLC" type="plc" />
    <TerminalIcon x={400} y={464} label="摄像头" type="camera" />
    <TerminalIcon x={520} y={464} label="AGV" type="agv" />
    <TerminalIcon x={660} y={464} label="视觉检测终端" type="vision" alarm />
    <TerminalIcon x={800} y={464} label="办公终端" type="office" />

    {/* 图例 */}
    <g transform="translate(280, 528)" fontSize="10" fill="#7e9fc8">
      <line x1="0" y1="-3" x2="26" y2="-3" stroke="#4fc1ff" strokeWidth="1.5" /><text x="32" y="0">正常链路</text>
      <line x1="110" y1="-3" x2="136" y2="-3" stroke="#ef5350" strokeDasharray="4 3" strokeWidth="1.5" /><text x="142" y="0">异常链路</text>
      <circle cx="220" cy="-3" r="3.5" fill="#6ce09a" /><text x="228" y="0">正常</text>
      <circle cx="270" cy="-3" r="3.5" fill="#f5b963" /><text x="278" y="0">告警</text>
      <circle cx="320" cy="-3" r="3.5" fill="#ef5350" /><text x="328" y="0">严重</text>
      <circle cx="370" cy="-3" r="3.5" fill="#7a96b6" /><text x="378" y="0">离线</text>
    </g>
  </svg>
);

const RowSm: React.FC<{ icon?: React.ReactNode; color?: string; label: string; v: string }> = ({ icon, color = '#79d0ff', label, v }) => (
  <div className="flex items-center justify-between text-[12px] text-[#a9c8ee]">
    <span className="flex items-center gap-2">
      {icon || <span className="h-2 w-2 rounded-sm" style={{ background: color }} />}
      {label}
    </span>
    <span className="font-mono text-[14px] font-bold text-[#e8f3ff]">{v}</span>
  </div>
);

const KpiBlock: React.FC<{ label: string; value: string; unit?: string; color: string; data: number[] }> = ({ label, value, unit, color, data }) => (
  <div className="rounded border border-[#143258] bg-[#081f3d]/65 p-2 text-center">
    <div className="text-[10.5px] text-[#a9c8ee]">{label}</div>
    <div className="font-mono text-[18px] font-black leading-tight" style={{ color }}>
      {value}{unit && <span className="ml-0.5 text-[9px] font-normal text-[#7e9fc8]">{unit}</span>}
    </div>
    <div className="h-6"><BaseChart option={sparkArea(data, color)} /></div>
  </div>
);

export const TopologyView: React.FC = () => {
  return (
    <div
      className="grid h-full min-h-0 gap-1.5"
      style={{ gridTemplateColumns: 'minmax(220px, clamp(220px, 18vw, 320px)) minmax(0, 1fr) minmax(240px, clamp(260px, 20vw, 340px))' }}
    >
      {/* ===== 左列 ===== */}
      <div className="flex min-h-0 flex-col gap-1.5">
        <div className={dtPanel + ' flex-[3] min-h-0 overflow-hidden'}>
          <DtSectionTitle title="网络规模" />
          <div className="flex flex-1 gap-2 overflow-auto custom-scrollbar pr-0.5">
            <div className="h-[120px] w-[120px] shrink-0"><BaseChart option={scaleDonut} /></div>
            <div className="flex-1 space-y-1.5">
              <RowSm color="#4fc1ff" label="核心交换机" v="2" />
              <RowSm color="#6ce09a" label="汇聚交换机" v="6" />
              <RowSm color="#f5b963" label="接入交换机" v="28" />
              <RowSm color="#ff7d7d" label="终端设备"   v="186" />
              <RowSm color="#9c6dff" label="链路总数"   v="72" />
            </div>
          </div>
        </div>

        <div className={dtPanel + ' flex-[3] min-h-0 overflow-hidden'}>
          <DtSectionTitle title="链路利用率" />
          <div className="flex-1 space-y-2.5 overflow-auto text-[12px] text-[#a9c8ee] custom-scrollbar pr-0.5">
            {[
              { label: '核心链路', value: 83, color: '#ef5350' },
              { label: '接入链路', value: 67, color: '#f5b963' },
              { label: '备用链路', value: 12, color: '#4fc1ff' },
            ].map(r => (
              <div key={r.label}>
                <div className="mb-1 flex items-center justify-between">
                  <span>{r.label}</span>
                  <span className="font-mono font-bold text-[#e8f3ff]">{r.value}%</span>
                </div>
                <DtProgress value={r.value} color={r.color} />
              </div>
            ))}
          </div>
        </div>

        <div className={dtPanel + ' grid flex-[2] min-h-0 grid-cols-3 gap-1.5 overflow-hidden'}>
          <KpiBlock label="平均时延" value="18" unit="ms" color="#4fc1ff" data={[15,16,17,16,18,18,19,18]} />
          <KpiBlock label="丢包率"   value="1.8" unit="%" color="#f5b963" data={[1.2,1.4,1.6,1.5,1.7,1.8,1.9,1.8]} />
          <KpiBlock label="异常链路" value="3"            color="#ef5350" data={[1,1,2,2,3,3,3,3]} />
        </div>
      </div>

      {/* ===== 中间拓扑 ===== */}
      <div className={dtPanel + ' min-h-0 overflow-hidden'}>
        <DtSectionTitle title="网络拓扑" />
        <div className="relative mb-1.5 min-h-0 flex-[4] overflow-hidden rounded border border-[#1b4378] bg-[#03132a]">
          <TopoSvg />
        </div>
        <div className="flex min-h-0 flex-[1] shrink-0 flex-col rounded border border-[#1b4378] bg-[#081c3a] p-2">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center text-[11.5px] text-[#a9c8ee]">
              <span className="mr-2 inline-block h-2.5 w-[3px] rounded-sm bg-[#4fc1ff]" />
              最近24小时告警数量变化
            </div>
            <span className="text-[10px] text-[#7e9fc8]">告警数 <span className="text-[#ff8a7a] font-bold">7</span></span>
          </div>
          <div className="min-h-0 flex-1"><BaseChart option={alarmLine} /></div>
        </div>
      </div>

      {/* ===== 右列 ===== */}
      <div className="flex min-h-0 flex-col gap-1.5">
        <div className={dtPanel + ' flex-[5] min-h-0 overflow-hidden'}>
          <DtSectionTitle title="受影响业务清单" />
          <div className="flex-1 space-y-1.5 overflow-auto custom-scrollbar pr-0.5">
            {[
              { name: '视觉检测', s: '严重' as const },
              { name: 'AGV调度', s: '降级' as const },
              { name: '视频监控', s: '受影响' as const },
              { name: 'MES',     s: '正常' as const },
              { name: '办公网',  s: '正常' as const },
            ].map(r => (
              <div key={r.name} className="flex items-center justify-between rounded border border-[#143258] bg-[#081f3d]/65 px-2.5 py-1.5 text-[12.5px] text-[#e8f3ff]">
                <span>{r.name}</span>
                <DtStatusBadge status={r.s} />
              </div>
            ))}
          </div>
        </div>

        <div className={dtPanel + ' flex-[3] min-h-0 overflow-hidden'}>
          <DtSectionTitle title="当前告警摘要" />
          <div className="flex-1 space-y-1.5 overflow-auto text-[11.5px] custom-scrollbar pr-0.5">
            <div className="rounded border bg-[#0a1f3d]/85 p-2" style={{ borderColor: 'rgba(239,83,80,0.35)', borderLeftWidth: 4, borderLeftColor: '#ef5350' }}>
              <div className="flex items-center justify-between">
                <span className="rounded bg-[#b53737] px-1.5 py-[1px] text-[10.5px] font-bold text-white">严重</span>
                <span className="font-mono text-[11px] text-[#7e9fc8]">14:29:58</span>
              </div>
              <div className="mt-0.5 text-[12.5px] text-[#e8f3ff]">SW-A-01 接入交换机离线</div>
            </div>
            <div className="rounded border bg-[#0a1f3d]/85 p-2" style={{ borderColor: 'rgba(59,141,225,0.35)', borderLeftWidth: 4, borderLeftColor: '#3b8de1' }}>
              <div className="flex items-center justify-between">
                <span className="rounded bg-[#2b6da8] px-1.5 py-[1px] text-[10.5px] font-bold text-white">提示</span>
                <span className="font-mono text-[11px] text-[#7e9fc8]">14:28:12</span>
              </div>
              <div className="mt-0.5 text-[12.5px] text-[#e8f3ff]">链路利用率超过80%</div>
            </div>
          </div>
        </div>

        <div className={dtPanel + ' flex-[1.5] min-h-0 overflow-hidden'}>
          <DtSectionTitle title="影响范围" />
          <div className="grid grid-cols-3 gap-1.5">
            <Cell t="影响区域" v="A区视觉检测工位" small />
            <Cell t="影响终端" v="8台" />
            <Cell t="影响业务" v="3项" />
          </div>
        </div>

        <div className={dtPanel + ' flex-[3] min-h-0 overflow-hidden'}>
          <DtSectionTitle title="处理建议" />
          <ul className="flex-1 space-y-1.5 overflow-auto text-[12px] text-[#e8f3ff] custom-scrollbar pr-0.5">
            {['切换备用链路', '检查上联光模块', '派发网络运维工单'].map((t, i) => (
              <li key={i} className="flex items-center gap-2 rounded border border-[#143258] bg-[#081f3d]/65 px-2.5 py-1.5">
                <CheckCircle2 size={13} className="text-[#6ce09a]" />{t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const Cell: React.FC<{ t: string; v: string; small?: boolean }> = ({ t, v, small }) => (
  <div className="rounded border border-[#143258] bg-[#081f3d]/65 p-2 text-center">
    <div className="text-[10px] text-[#7e9fc8]">{t}</div>
    <div className={`font-bold text-[#e8f3ff] ${small ? 'text-[11px]' : 'text-[14px]'}`}>{v}</div>
  </div>
);
