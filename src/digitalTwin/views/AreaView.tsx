import React from 'react';
import { BaseChart } from '../../components/BaseChart';
import { dtPanel, DtSectionTitle, DtStatusBadge, DtAlarmTag, DtProgress } from '../shared';
import { B_AREA_CATEGORIES, B_AREA_KPIS, B_AREA_ENV, CURRENT_ALARMS } from '../data';
import { Gauge, Activity, Thermometer, Zap, Wifi, Network, Server, Camera, HardDrive, Wind, Cpu, Square, Database } from 'lucide-react';
import { DtSceneDefs, DataRackRow, Scene3DContainer } from '../scenery';
import { Scene3DCanvas, Box3D, GroundPlane, GroundShadow, Anchor3D } from '../iso3d';
import { useDtNav } from '../DigitalTwinDashboard';

// ── B 区机房（真3D） ─────────────────────────────────────────────────
const Rack3DSingle: React.FC<{ cx: number; cz: number; alarm?: boolean; onClick?: () => void }> = ({ cx, cz, alarm, onClick }) => (
  <Box3D
    cx={cx} cy={28} cz={cz} hw={14} hh={28} hd={14}
    colors={alarm
      ? { top: '#c14238', front: '#7a1a14', back: '#3e0b08', left: '#5a1410', right: '#3e0b08' }
      : { top: '#2f7ac4', front: '#0d2e5b', back: '#082040', left: '#102e54', right: '#0a1f3d' }}
    stroke={alarm ? '#ef5a4a' : '#5fb4ff'} strokeWidth={0.6}
    onClick={onClick}
    decorate={{
      front: (pts) => {
        const [tl, tr, br, bl] = pts;
        const items: React.ReactNode[] = [];
        for (let i = 0.5; i < 6; i++) {
          const py = tl.y + (bl.y - tl.y) * (i / 6);
          const lx = tl.x + (bl.x - tl.x) * (i / 6);
          const rx = tr.x + (br.x - tr.x) * (i / 6);
          items.push(<line key={i} x1={lx + 2} y1={py} x2={rx - 2} y2={py} stroke={alarm ? '#3a1014' : '#0a1322'} strokeWidth={1.5} />);
        }
        items.push(<circle key="led" cx={tr.x - 4} cy={tl.y + 4} r={2} fill={alarm ? '#ef5350' : '#6ce09a'}>
          {alarm && <animate attributeName="opacity" values="0.4;1;0.4" dur="1s" repeatCount="indefinite" />}
        </circle>);
        return <>{items}</>;
      }
    }}
  />
);

const RackRow3D: React.FC<{ cx: number; cz: number; count?: number; alarmIdx?: number; onRackClick?: () => void }> = ({ cx, cz, count = 8, alarmIdx = -1, onRackClick }) => {
  const items = [];
  const startX = cx - (count - 1) * 32 / 2;
  for (let i = 0; i < count; i++) {
    items.push(<Rack3DSingle key={i} cx={startX + i * 32} cz={cz} alarm={i === alarmIdx} onClick={onRackClick} />);
  }
  return <>{items}</>;
};

const FaultSwitch3D: React.FC<{ cx: number; cz: number }> = ({ cx, cz }) => (
  <>
    <Box3D
      cx={cx} cy={20} cz={cz} hw={90} hh={20} hd={36}
      colors={{ top: '#c14238', front: '#5a1414', back: '#3a0d0d', left: '#7a1f18', right: '#4a1310' }}
      stroke="#ef5a4a" strokeWidth={1.2}
      decorate={{
        front: (pts) => {
          const [tl, tr, br, bl] = pts;
          const items: React.ReactNode[] = [];
          // LCD
          items.push(<rect key="lcd" x={tl.x + 6} y={tl.y + 5} width={36} height={10} fill="#031022" stroke="#ef5350" strokeWidth={0.4} />);
          items.push(<text key="lcdt" x={tl.x + 24} y={tl.y + 12} textAnchor="middle" fontSize="6" fill="#ef5350" fontFamily="monospace">ERR</text>);
          // Ports row
          for (let i = 0; i < 14; i++) {
            const px = tl.x + 48 + i * 8;
            items.push(<rect key={`p${i}`} x={px} y={tl.y + 5} width={5} height={12} fill="#0a1726" stroke="#1a2538" strokeWidth={0.3} />);
            items.push(<circle key={`led${i}`} cx={px + 2.5} cy={tl.y + 8} r={0.8} fill={i % 3 === 0 ? '#ef5350' : '#3a1414'} />);
          }
          // Vents at bottom
          for (let i = 0; i < 12; i++) {
            const px = tl.x + 6 + i * 14;
            items.push(<rect key={`v${i}`} x={px} y={bl.y - 14} width={10} height={10} fill="#0a1322" stroke="#1a2538" strokeWidth={0.3} />);
          }
          return <>{items}</>;
        }
      }}
    />
    {/* 脉冲圈（顶部漂浮） */}
    <Anchor3D p={{ x: cx, y: 60, z: cz }}>
      {(p) => (
        <>
          <circle cx={p.x} cy={p.y} r={20} fill="#ef5350" stroke="#fff" strokeWidth={1.5} />
          <text x={p.x} y={p.y + 6} textAnchor="middle" fontSize="18" fontWeight="bold" fill="#fff">!</text>
          <circle cx={p.x} cy={p.y} r={20} fill="none" stroke="#ef5350" strokeOpacity={0.6}>
            <animate attributeName="r" values="18;38;18" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="stroke-opacity" values="0.7;0;0.7" dur="2.4s" repeatCount="indefinite" />
          </circle>
        </>
      )}
    </Anchor3D>
    <Anchor3D p={{ x: cx, y: -16, z: cz + 36 }}>
      {(p) => (
        <g>
          <rect x={p.x - 100} y={p.y - 12} width={200} height={22} rx={3} fill="rgba(80,18,18,0.92)" stroke="#ef5a4a" strokeWidth={0.8} />
          <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#ffe4df">SW-A-01 接入交换机离线</text>
        </g>
      )}
    </Anchor3D>
  </>
);

const AccessSwitch3D: React.FC<{ cx: number; cz: number; label: string }> = ({ cx, cz, label }) => (
  <>
    <Box3D
      cx={cx} cy={14} cz={cz} hw={40} hh={14} hd={20}
      colors={{ top: '#2f7ac4', front: '#1a2538', back: '#0d1a2e', left: '#243a55', right: '#10182a' }}
      stroke="#5fb4ff" strokeWidth={0.6}
      decorate={{
        front: (pts) => {
          const [tl, tr, br, bl] = pts;
          const items: React.ReactNode[] = [];
          items.push(<rect key="lcd" x={tl.x + 4} y={tl.y + 4} width={14} height={6} fill="#031022" />);
          for (let i = 0; i < 8; i++) {
            items.push(<rect key={`p${i}`} x={tl.x + 22 + i * 7} y={tl.y + 4} width={5} height={10} fill="#0a1726" stroke="#1a2538" strokeWidth={0.3} />);
            items.push(<circle key={`l${i}`} cx={tl.x + 24.5 + i * 7} cy={tl.y + 6} r={0.6} fill={i % 2 === 0 ? '#6ce09a' : '#1e5b3b'} />);
          }
          return <>{items}</>;
        }
      }}
    />
    <Anchor3D p={{ x: cx, y: -8, z: cz + 20 }}>
      {(p) => <text x={p.x} y={p.y} textAnchor="middle" fontSize="10" fill="#cfe5ff">{label}</text>}
    </Anchor3D>
  </>
);

const PLC3D: React.FC<{ cx: number; cz: number; label: string }> = ({ cx, cz, label }) => (
  <>
    <Box3D
      cx={cx} cy={22} cz={cz} hw={16} hh={22} hd={16}
      colors={{ top: '#2f7ac4', front: '#1a2538', back: '#0d1a2e', left: '#243a55', right: '#10182a' }}
      stroke="#5fb4ff" strokeWidth={0.5}
      decorate={{
        front: (pts) => {
          const [tl, tr, br, bl] = pts;
          const items: React.ReactNode[] = [];
          for (let i = 0; i < 3; i++) {
            const yy = tl.y + 6 + i * 12;
            items.push(<rect key={i} x={tl.x + 4} y={yy} width={tr.x - tl.x - 8} height={8} fill="#0a1322" stroke="#3a557a" strokeWidth={0.4} />);
            for (let j = 0; j < 5; j++) {
              items.push(<circle key={`${i}-${j}`} cx={tl.x + 8 + j * 5} cy={yy + 4} r={0.8} fill="#6ce09a" />);
            }
          }
          return <>{items}</>;
        }
      }}
    />
    <Anchor3D p={{ x: cx, y: -8, z: cz + 16 }}>
      {(p) => <text x={p.x} y={p.y} textAnchor="middle" fontSize="10" fill="#cfe5ff">{label}</text>}
    </Anchor3D>
  </>
);

const Workstation3D: React.FC<{ cx: number; cz: number; label: string; alarm?: boolean }> = ({ cx, cz, label, alarm }) => (
  <>
    <Box3D
      cx={cx} cy={14} cz={cz} hw={22} hh={14} hd={16}
      colors={{ top: '#2f7ac4', front: '#1a2538', back: '#0d1a2e', left: '#243a55', right: '#10182a' }}
      stroke={alarm ? '#ef5a4a' : '#5fb4ff'} strokeWidth={0.5}
      decorate={{
        front: (pts) => {
          const [tl, tr, br, bl] = pts;
          const cxv = (tl.x + tr.x) / 2;
          return (
            <>
              <rect x={tl.x + 4} y={tl.y + 3} width={tr.x - tl.x - 8} height={10} fill="#031022" stroke="#3f86c8" strokeWidth={0.4} />
              <text x={cxv} y={tl.y + 10} textAnchor="middle" fontSize="5" fill={alarm ? '#ef5350' : '#79d0ff'} fontFamily="monospace">{alarm ? 'OFFLINE' : 'RUNNING'}</text>
              {alarm && <circle cx={tr.x - 3} cy={tl.y + 4} r={2} fill="#ef5350"><animate attributeName="opacity" values="0.4;1;0.4" dur="1s" repeatCount="indefinite" /></circle>}
            </>
          );
        }
      }}
    />
    <Anchor3D p={{ x: cx, y: -8, z: cz + 16 }}>
      {(p) => <text x={p.x} y={p.y} textAnchor="middle" fontSize="10" fill={alarm ? '#ffd4cf' : '#cfe5ff'}>{label}</text>}
    </Anchor3D>
  </>
);

const BAreaScene3D: React.FC = () => {
  const { setView } = useDtNav();
  const drill = () => setView('rack');
  return (
  <Scene3DCanvas width={960} height={560} cx={480} cy={330} defaultYaw={20} defaultPitch={55} defaultScale={0.95}
    background={
      <>
        <defs>
          <radialGradient id="bAreaG" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#0b2a55" />
            <stop offset="100%" stopColor="#020a18" />
          </radialGradient>
        </defs>
        <rect width="960" height="560" fill="url(#bAreaG)" />
      </>
    }
  >
    {/* 机房地板 */}
    <GroundPlane x={-300} z={0} w={600} d={380} fill="#04162e" stroke="#163f70" />
    {/* B01 / B02 机柜列（点击进入机柜内部） */}
    <RackRow3D cx={0}  cz={-100} count={9} onRackClick={drill} />
    <RackRow3D cx={0}  cz={-40}  count={9} onRackClick={drill} />
    {/* 中央故障交换机 */}
    <FaultSwitch3D cx={0} cz={40} />
    {/* 左右接入交换机 */}
    <AccessSwitch3D cx={-200} cz={40}  label="接入交换机-01" />
    <AccessSwitch3D cx={200}  cz={40}  label="接入交换机-02" />
    {/* PLC */}
    <PLC3D cx={-140} cz={70} label="PLC-01" />
    <PLC3D cx={140}  cz={70} label="PLC-02" />
    {/* 视觉检测工位 */}
    <Workstation3D cx={-110} cz={130} label="视觉工位-01" alarm />
    <Workstation3D cx={0}    cz={130} label="视觉工位-02" alarm />
    <Workstation3D cx={110}  cz={130} label="视觉工位-03" alarm />
    {/* AGV 终端 */}
    <Workstation3D cx={-220} cz={140} label="AGV 终端" />
    {/* 精密空调 / UPS */}
    <Workstation3D cx={170}  cz={140} label="精密空调-01" alarm />
    <Workstation3D cx={240}  cz={140} label="UPS-01" />
  </Scene3DCanvas>
  );
};

const categoryIcons = [Network, Server, Cpu, Camera, HardDrive, Wind];
const kpiIcons = [Gauge, Activity, Wifi, Thermometer, Zap];

const sparkline = (data: number[], color: string) => ({
  grid: { top: 4, left: 0, right: 0, bottom: 4 },
  xAxis: { type: 'category', show: false, data: data.map((_, i) => i) },
  yAxis: { type: 'value', show: false },
  series: [{
    type: 'line', data, smooth: true, symbol: 'none',
    lineStyle: { width: 1.5, color },
    areaStyle: { color: `${color}33` },
  }],
});

// B 区机房（写实风格：3D 机柜列 + 设备 + 走线 + 防静电地板）
const BAreaScene: React.FC = () => (
  <svg viewBox="0 0 960 560" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
    <DtSceneDefs />
    <defs>
      {/* 防静电地板格子 */}
      <pattern id="aFloor" width="34" height="34" patternUnits="userSpaceOnUse">
        <rect width="34" height="34" fill="#04162e" />
        <path d="M0 0 L34 0 M0 0 L0 34" stroke="rgba(79,193,255,0.15)" strokeWidth="0.4" />
        <circle cx="0.5" cy="0.5" r="0.5" fill="rgba(79,193,255,0.3)" />
      </pattern>
      <linearGradient id="aWall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0d2e5b" />
        <stop offset="100%" stopColor="#05122a" />
      </linearGradient>
    </defs>

    {/* 房间地板（防静电地板） */}
    <rect x="0" y="0" width="960" height="560" fill="url(#aFloor)" />

    {/* 房间四面墙（透视边框） */}
    <polygon points="20,40 940,40 920,60 40,60" fill="url(#aWall)" stroke="#2b6aa8" strokeWidth={0.6} />
    <polygon points="20,520 940,520 920,500 40,500" fill="url(#aWall)" stroke="#2b6aa8" strokeWidth={0.6} />
    <polygon points="20,40 40,60 40,500 20,520" fill="#03132a" stroke="#2b6aa8" strokeWidth={0.6} />
    <polygon points="940,40 920,60 920,500 940,520" fill="#03132a" stroke="#2b6aa8" strokeWidth={0.6} />

    {/* 顶部摄像头与控制柜 */}
    <g>
      {[{ x: 70, label: '摄像头-01' }, { x: 870, label: '摄像头-02' }].map(c => (
        <g key={c.label}>
          {/* 三脚架支柱 */}
          <line x1={c.x} y1={88} x2={c.x} y2={104} stroke="#5a8fc9" strokeWidth={1.2} />
          {/* 摄像头本体 */}
          <rect x={c.x - 18} y={72} width={36} height={16} rx={3} fill="#243a55" stroke="#79d0ff" strokeWidth={0.6} />
          <circle cx={c.x - 6} cy={80} r={4} fill="#03101e" stroke="#79d0ff" strokeWidth={0.6} />
          <circle cx={c.x - 6} cy={80} r={1.5} fill="#5fb4ff" />
          <circle cx={c.x + 8} cy={80} r={3} fill="#03101e" stroke="#79d0ff" strokeWidth={0.5} />
          <circle cx={c.x + 16} cy={72} r={2.5} fill="#6ce09a">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
          </circle>
          <text x={c.x} y={118} textAnchor="middle" fontSize="10" fill="#cfe5ff">{c.label}</text>
        </g>
      ))}
      {/* 控制柜 */}
      <g transform="translate(820 70)">
        <ellipse cx={20} cy={48} rx={26} ry={4} fill="rgba(0,0,0,0.5)" />
        <polygon points="40,0 56,-10 56,40 40,50" fill="#0d1a2e" stroke="#3a557a" strokeWidth={0.5} />
        <polygon points="0,0 40,0 56,-10 16,-10" fill="#1a2c45" stroke="#3a557a" strokeWidth={0.5} />
        <rect x={0} y={0} width={40} height={50} fill="url(#rackBezel)" stroke="#3f86c8" strokeWidth={0.8} />
        {/* 控制面板 */}
        <rect x={4} y={5} width={32} height={14} fill="#03101e" stroke="#2a3a52" strokeWidth={0.4} />
        <text x={20} y={15} textAnchor="middle" fontSize="6" fill="#79d0ff" fontFamily="monospace">CTRL</text>
        {/* 按钮组 */}
        {[0,1,2].map(i => (
          <circle key={i} cx={10 + i * 10} cy={28} r={2.5} fill="#10202f" stroke="#5fb4ff" strokeWidth={0.4} />
        ))}
        <rect x={4} y={38} width={32} height={8} fill="#0a1726" stroke="#1a2538" strokeWidth={0.4} />
        <circle cx={50} cy={4} r={2.5} fill="#6ce09a" />
        <text x={20} y={66} textAnchor="middle" fontSize="10" fill="#cfe5ff">控制柜</text>
      </g>
    </g>

    {/* === B01 / B02 机柜阵列（3D 风格） === */}
    <g>
      <text x={480} y={150} textAnchor="middle" fontSize="11" fill="#79d0ff" fontWeight="bold">B01机柜 row</text>
      <g transform="translate(200 156)">
        <DataRackRow x={0} y={0} count={10} />
      </g>
    </g>
    <g>
      <text x={480} y={250} textAnchor="middle" fontSize="11" fill="#79d0ff" fontWeight="bold">B02机柜 row</text>
      <g transform="translate(200 256)">
        <DataRackRow x={0} y={0} count={10} />
      </g>
    </g>

    {/* === 中央故障接入交换机（写实硬件外形） === */}
    <g transform="translate(380 350)">
      {/* 脉冲圈 */}
      <circle cx={100} cy={28} r={84} fill="none" stroke="#ef5a4a" strokeOpacity={0.55}>
        <animate attributeName="r" values="70;104;70" dur="2.4s" repeatCount="indefinite" />
        <animate attributeName="stroke-opacity" values="0.8;0;0.8" dur="2.4s" repeatCount="indefinite" />
      </circle>
      {/* 阴影 */}
      <ellipse cx={104} cy={66} rx={94} ry={6} fill="rgba(0,0,0,0.7)" />
      {/* 立体外壳 */}
      <polygon points="200,0 216,-10 216,52 200,62" fill="#3a0d0d" stroke="#ef5a4a" strokeWidth={0.8} />
      <polygon points="0,0 200,0 216,-10 16,-10" fill="#5a1414" stroke="#ef5a4a" strokeWidth={0.8} />
      <rect x={0} y={0} width={200} height={62} fill="#3a0d0d" stroke="#ef5a4a" strokeWidth={1.2} />
      {/* LCD 面板 */}
      <rect x={8} y={4} width={48} height={12} fill="#031022" stroke="#ef5a4a" strokeWidth={0.6} />
      <text x={32} y={13} textAnchor="middle" fontSize="7" fill="#ef5350" fontFamily="monospace">! ERR</text>
      {/* 端口阵列 */}
      <rect x={64} y={6} width={130} height={26} fill="#0a1322" stroke="#3a0d0d" strokeWidth={0.5} />
      {Array.from({ length: 16 }).map((_, i) => (
        <g key={i}>
          <rect x={68 + i * 8} y={10} width={6} height={18} fill="#0a1726" stroke="#1a2538" strokeWidth={0.3} />
          <circle cx={71 + i * 8} cy={13} r={0.9} fill={i % 3 === 0 ? '#ef5350' : '#3a1414'} />
        </g>
      ))}
      {/* 散热孔 */}
      {Array.from({ length: 12 }).map((_, i) => (
        <rect key={i} x={8 + i * 16} y={38} width={12} height={16} fill="#0a1322" stroke="#1a2538" strokeWidth={0.3} />
      ))}
      {/* 顶部告警圆 */}
      <circle cx={208} cy={-14} r={11} fill="#ef5350" stroke="#fff" strokeWidth={1.5} />
      <text x={208} y={-10} textAnchor="middle" fontSize="14" fill="#fff" fontWeight="bold">!</text>
      {/* 告警标牌 */}
      <rect x={0} y={72} width={200} height={22} rx={3} fill="rgba(80,18,18,0.92)" stroke="#ef5a4a" strokeWidth={0.8} />
      <text x={100} y={88} textAnchor="middle" fontSize="11" fill="#ffe4df" fontWeight="bold">SW-A-01 接入交换机离线</text>
    </g>

    {/* === 左右接入交换机（写实小机型） === */}
    {[
      { x: 60,  label: '接入交换机-01', alarm: false },
      { x: 800, label: '接入交换机-02', alarm: false },
    ].map(s => (
      <g key={s.label} transform={`translate(${s.x} 360)`}>
        <ellipse cx={50} cy={42} rx={50} ry={4} fill="rgba(0,0,0,0.45)" />
        <polygon points="100,0 114,-8 114,36 100,44" fill="#0d1a2e" stroke="#3a557a" strokeWidth={0.5} />
        <polygon points="0,0 100,0 114,-8 14,-8" fill="#1a2c45" stroke="#3a557a" strokeWidth={0.5} />
        <rect x={0} y={0} width={100} height={44} fill="url(#rackBezel)" stroke="#5fb4ff" strokeWidth={0.8} />
        {/* LCD */}
        <rect x={5} y={6} width={20} height={10} fill="#031022" stroke="#2a3a52" strokeWidth={0.4} />
        <text x={15} y={14} textAnchor="middle" fontSize="6" fill="#6ce09a" fontFamily="monospace">OK</text>
        {/* 端口 */}
        {Array.from({ length: 8 }).map((_, i) => (
          <g key={i}>
            <rect x={30 + i * 8} y={5} width={6} height={14} fill="#0a1726" stroke="#1a2538" strokeWidth={0.3} />
            <circle cx={33 + i * 8} cy={8} r={0.9} fill={i % 2 === 0 ? '#6ce09a' : '#1e5b3b'} />
          </g>
        ))}
        {/* 散热孔 */}
        {Array.from({ length: 8 }).map((_, i) => (
          <rect key={i} x={5 + i * 12} y={26} width={8} height={12} fill="#0a1322" stroke="#1a2538" strokeWidth={0.3} />
        ))}
        <circle cx={108} cy={-4} r={3.5} fill="#6ce09a" />
        <text x={50} y={62} textAnchor="middle" fontSize="10" fill="#cfe5ff">{s.label}</text>
      </g>
    ))}

    {/* === PLC（写实小柜） === */}
    {[
      { x: 200, label: 'PLC-01' },
      { x: 660, label: 'PLC-02' },
    ].map(p => (
      <g key={p.label} transform={`translate(${p.x} 360)`}>
        <ellipse cx={30} cy={84} rx={32} ry={4} fill="rgba(0,0,0,0.5)" />
        <polygon points="60,0 74,-10 74,80 60,90" fill="#0d1a2e" stroke="#3a557a" strokeWidth={0.5} />
        <polygon points="0,0 60,0 74,-10 14,-10" fill="#1a2c45" stroke="#3a557a" strokeWidth={0.5} />
        <rect x={0} y={0} width={60} height={90} fill="url(#rackBezel)" stroke="#5fb4ff" strokeWidth={0.8} />
        {/* 三段 I/O 模块 */}
        {[12, 36, 60].map((yy, i) => (
          <g key={i}>
            <rect x={5} y={yy - 6} width={50} height={14} fill="#0a1322" stroke="#3a557a" strokeWidth={0.5} />
            <text x={10} y={yy + 2} fontSize="6" fill="#79d0ff" fontFamily="monospace">DI/DO</text>
            {/* 通道 LED */}
            {Array.from({ length: 6 }).map((_, j) => (
              <circle key={j} cx={30 + j * 4} cy={yy + 2} r={0.8} fill={j === 2 && i === 1 ? '#f5b963' : '#6ce09a'} />
            ))}
          </g>
        ))}
        <circle cx={68} cy={-4} r={3.5} fill="#6ce09a" />
        <text x={30} y={108} textAnchor="middle" fontSize="10" fill="#cfe5ff">{p.label}</text>
      </g>
    ))}

    {/* === AGV 终端（写实小车形） === */}
    <g transform="translate(60 460)">
      <ellipse cx={36} cy={28} rx={36} ry={4} fill="rgba(0,0,0,0.5)" />
      {/* 车体 */}
      <polygon points="0,0 72,0 78,-6 6,-6" fill="#1a3a64" stroke="#5fb4ff" strokeWidth={0.6} />
      <rect x={0} y={0} width={72} height={28} rx={4} fill="url(#bFront)" stroke="#5fb4ff" strokeWidth={0.8} />
      {/* 顶面屏幕 */}
      <rect x={14} y={-4} width={44} height={6} rx={1} fill="#03101e" stroke="#79d0ff" strokeWidth={0.4} />
      {/* 货物指示灯 */}
      <rect x={8} y={4} width={56} height={12} rx={1} fill="#03101e" stroke="#3a557a" strokeWidth={0.4} />
      {Array.from({ length: 5 }).map((_, i) => (
        <circle key={i} cx={14 + i * 11} cy={10} r={1.5} fill="#6ce09a" />
      ))}
      {/* 轮子 */}
      <circle cx={14} cy={30} r={5} fill="#0a1322" stroke="#5fb4ff" strokeWidth={0.6} />
      <circle cx={14} cy={30} r={2.5} fill="#1a2c45" />
      <circle cx={58} cy={30} r={5} fill="#0a1322" stroke="#5fb4ff" strokeWidth={0.6} />
      <circle cx={58} cy={30} r={2.5} fill="#1a2c45" />
      {/* 顶部信号灯 */}
      <circle cx={36} cy={-14} r={4} fill="#6ce09a" filter="url(#scGlow)" />
      <text x={36} y={56} textAnchor="middle" fontSize="10" fill="#cfe5ff">AGV终端</text>
    </g>

    {/* === 视觉检测工位 3（写实工位形） === */}
    {[0, 1, 2].map(i => (
      <g key={i} transform={`translate(${220 + i * 130} 450)`}>
        <ellipse cx={48} cy={48} rx={48} ry={4} fill="rgba(0,0,0,0.55)" />
        {/* 工位平台 */}
        <polygon points="0,0 96,0 102,-6 6,-6" fill="#1a3a64" stroke="#5fb4ff" strokeWidth={0.5} />
        <rect x={0} y={0} width={96} height={48} fill="url(#bFront)" stroke="#5fb4ff" strokeWidth={0.8} />
        {/* 视觉显示器 */}
        <rect x={6} y={4} width={50} height={26} fill="#03101e" stroke="#79d0ff" strokeWidth={0.5} />
        <rect x={8} y={6} width={46} height={22} fill="#0a1f3d" />
        <text x={31} y={20} textAnchor="middle" fontSize="7" fill="#ef5350" fontFamily="monospace">OFFLINE</text>
        {/* 摄像支架 */}
        <line x1={78} y1={4} x2={78} y2={-14} stroke="#5a8fc9" strokeWidth={1.5} />
        <rect x={70} y={-22} width={20} height={8} fill="#243a55" stroke="#79d0ff" strokeWidth={0.5} />
        <circle cx={80} cy={-18} r={2.5} fill="#03101e" stroke="#79d0ff" strokeWidth={0.4} />
        {/* 物料平台 */}
        <rect x={60} y={32} width={30} height={10} fill="#0a1322" stroke="#3a557a" strokeWidth={0.4} />
        {/* 告警圆 */}
        <circle cx={100} cy={-8} r={5} fill="#ef5350" stroke="#fff" strokeWidth={0.8}>
          <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <text x={48} y={68} textAnchor="middle" fontSize="10" fill="#ffd4cf">视觉检测工位-0{i + 1}</text>
      </g>
    ))}

    {/* === 精密空调（写实立式空调） === */}
    <g transform="translate(620 440)">
      <ellipse cx={45} cy={68} rx={48} ry={4} fill="rgba(0,0,0,0.55)" />
      <polygon points="90,0 104,-10 104,60 90,70" fill="#0d1a2e" stroke="#3a557a" strokeWidth={0.5} />
      <polygon points="0,0 90,0 104,-10 14,-10" fill="#1a2c45" stroke="#3a557a" strokeWidth={0.5} />
      <rect x={0} y={0} width={90} height={70} fill="url(#rackBezel)" stroke="#5fb4ff" strokeWidth={0.8} />
      {/* 出风格栅 */}
      {Array.from({ length: 8 }).map((_, i) => (
        <line key={i} x1={6} y1={8 + i * 7} x2={84} y2={8 + i * 7} stroke="#3a557a" strokeWidth={0.4} />
      ))}
      {/* 液晶显示 */}
      <rect x={28} y={50} width={34} height={14} fill="#03101e" stroke="#79d0ff" strokeWidth={0.5} />
      <text x={45} y={60} textAnchor="middle" fontSize="7" fill="#ef5350" fontFamily="monospace">31.2°C !</text>
      {/* 告警 LED */}
      <circle cx={98} cy={-4} r={4} fill="#ef5350">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1s" repeatCount="indefinite" />
      </circle>
      <text x={45} y={88} textAnchor="middle" fontSize="10" fill="#ffd4cf">精密空调-01</text>
    </g>

    {/* === UPS（电池柜） === */}
    <g transform="translate(800 444)">
      <ellipse cx={28} cy={62} rx={32} ry={4} fill="rgba(0,0,0,0.5)" />
      <polygon points="56,0 70,-10 70,56 56,66" fill="#0d1a2e" stroke="#3a557a" strokeWidth={0.5} />
      <polygon points="0,0 56,0 70,-10 14,-10" fill="#1a2c45" stroke="#3a557a" strokeWidth={0.5} />
      <rect x={0} y={0} width={56} height={66} fill="url(#rackBezel)" stroke="#5fb4ff" strokeWidth={0.8} />
      {/* LCD */}
      <rect x={4} y={4} width={48} height={12} fill="#031022" stroke="#2a3a52" strokeWidth={0.4} />
      <text x={28} y={13} textAnchor="middle" fontSize="6.5" fill="#6ce09a" fontFamily="monospace">100% OK</text>
      {/* 电池槽 */}
      {[0, 1, 2, 3].map(i => (
        <g key={i}>
          <rect x={5} y={22 + i * 10} width={46} height={7} fill="#0a1322" stroke="#3a557a" strokeWidth={0.4} />
          <rect x={6} y={23 + i * 10} width={38} height={5} fill="#1e5b3b" />
        </g>
      ))}
      <circle cx={64} cy={-4} r={3} fill="#6ce09a" />
      <text x={28} y={84} textAnchor="middle" fontSize="10" fill="#cfe5ff">UPS-01</text>
    </g>

    {/* === 走线（在地板槽内的电缆） === */}
    <g fill="none" strokeWidth={1.4}>
      {/* 正常链路 */}
      <path d="M170 380 H380" stroke="#4fc1ff" strokeOpacity={0.85} />
      <path d="M580 380 H800" stroke="#4fc1ff" strokeOpacity={0.85} />
      <path d="M260 380 H380" stroke="#4fc1ff" strokeOpacity={0.7} />
      <path d="M580 380 H660" stroke="#4fc1ff" strokeOpacity={0.7} />
      {/* 异常链路（虚线 + 红） */}
      <path d="M480 460 V470 H145 V465" stroke="#ef5350" strokeDasharray="5 3" />
      <path d="M480 460 L296 460" stroke="#ef5350" strokeDasharray="5 3" />
      <path d="M480 460 L470 450" stroke="#ef5350" strokeDasharray="5 3" />
      <path d="M480 460 L680 460" stroke="#ef5350" strokeDasharray="5 3" opacity={0.6} />
      {/* 流动光点 */}
      <circle r="2.5" fill="#79d0ff">
        <animateMotion path="M170 380 H380" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle r="2.5" fill="#79d0ff">
        <animateMotion path="M800 380 H580" dur="2.4s" repeatCount="indefinite" />
      </circle>
    </g>
  </svg>
);

const alarmTrendOption = {
  grid: { top: 20, left: 28, right: 6, bottom: 22 },
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    data: ['14:30','16:30','18:30','20:30','22:30','00:30','02:30','04:30','06:30','08:30','10:30','12:30','14:30'],
    axisLine: { lineStyle: { color: '#234c7c' } },
    axisLabel: { color: '#7e9fc8', fontSize: 9 },
  },
  yAxis: { type: 'value', max: 30, splitLine: { lineStyle: { color: 'rgba(35,76,124,0.4)' } }, axisLabel: { color: '#7e9fc8', fontSize: 9 } },
  series: [
    { name: '严重', type: 'line', data: [2,4,6,8,10,6,4,5,3,4,5,7,3], lineStyle: { color: '#ef5350', width: 1.5 }, smooth: true, symbol: 'none', areaStyle: { color: 'rgba(239,83,80,0.15)' } },
    { name: '一般', type: 'line', data: [5,8,12,18,22,14,10,12,9,13,14,16,8], lineStyle: { color: '#f5b963', width: 1.5 }, smooth: true, symbol: 'none' },
    { name: '提示', type: 'line', data: [3,6,11,17,25,18,12,14,15,17,13,15,15], lineStyle: { color: '#3b8de1', width: 1.5 }, smooth: true, symbol: 'none' },
  ],
};

export const AreaView: React.FC = () => {
  return (
    <div
      className="grid h-full min-h-0 gap-1.5"
      style={{ gridTemplateColumns: 'minmax(220px, clamp(220px, 18vw, 320px)) minmax(0, 1fr) minmax(240px, clamp(260px, 20vw, 340px))' }}
    >
      {/* ===== 左列 ===== */}
      <div className="flex min-h-0 flex-col gap-1.5">
        <div className={dtPanel + ' flex-[6] min-h-0 overflow-hidden'}>
          <DtSectionTitle title="设备分类" />
          <div className="flex-1 space-y-1.5 overflow-auto custom-scrollbar pr-0.5">
            {B_AREA_CATEGORIES.map((c, i) => {
              const Ic = categoryIcons[i] || Server;
              const hasAlarm = c.alarm > 0;
              return (
                <div key={c.name} className="grid grid-cols-[24px_1fr_auto_auto] items-center gap-2 rounded border border-[#143258] bg-[#081f3d]/65 px-2.5 py-1.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded border border-[#244871] bg-[#0d2a52] text-[#79d0ff]">
                    <Ic size={12} />
                  </span>
                  <span className="text-[12.5px] text-[#e8f3ff]">{c.name}</span>
                  <span className="font-mono text-[16px] font-black text-[#cfe9ff]">{c.count}</span>
                  <span
                    className="rounded-[3px] border px-2 py-[1px] text-[10.5px] font-bold leading-none"
                    style={{
                      color: hasAlarm ? '#ff7d7d' : '#6ce09a',
                      borderColor: hasAlarm ? '#7a2e2e' : '#1d6a45',
                      background: hasAlarm ? 'rgba(82,28,28,0.6)' : 'rgba(15,68,42,0.55)',
                    }}
                  >
                    告警 {c.alarm}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className={dtPanel + ' flex-[5] min-h-0 overflow-hidden'}>
          <DtSectionTitle title="关键指标" />
          <div className="flex-1 space-y-1.5 overflow-auto custom-scrollbar pr-0.5">
            {B_AREA_KPIS.map((k, i) => {
              const Ic = kpiIcons[i] || Gauge;
              const colors = ['#5b8def', '#9c6dff', '#ffb672', '#ff7d7d', '#6ce09a'];
              return (
                <div key={k.label} className="rounded border border-[#143258] bg-[#081f3d]/65 px-2.5 py-2">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[11.5px] text-[#a9c8ee]">
                      <Ic size={12} className="text-[#79d0ff]" />
                      {k.label}
                    </span>
                    <span className="font-mono text-[15px] font-black text-[#e8f3ff]">
                      {k.value}<span className="ml-0.5 text-[10px] font-normal text-[#7e9fc8]">{k.unit}</span>
                    </span>
                  </div>
                  <div className="h-5"><BaseChart option={sparkline([10,12,9,14,16,13,18,15,17,18], colors[i % colors.length])} /></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== 中间主舞台 ===== */}
      <div className={dtPanel + ' min-h-0 overflow-hidden'}>
        <DtSectionTitle
          title="3号机房  B区"
          right={
            <div className="flex items-center gap-2 text-[11px] text-[#7e9fc8]">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#6ce09a]" />正常</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#ef5350]" />严重</span>
            </div>
          }
        />
        <div className="relative mb-1.5 min-h-0 flex-[4] overflow-hidden rounded border border-[#1b4378] bg-[#03132a]">
          <BAreaScene3D />
        </div>
        <div className="flex min-h-0 flex-[1] shrink-0 flex-col rounded border border-[#1b4378] bg-[#081c3a] p-2">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center text-[11.5px] text-[#a9c8ee]">
              <span className="mr-2 inline-block h-2.5 w-[3px] rounded-sm bg-[#4fc1ff]" />
              最近24小时告警数量变化
            </div>
            <div className="flex items-center gap-3 text-[10px] text-[#7e9fc8]">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#ef5350]" />严重 <span className="text-[#ff8a7a] font-bold">3</span></span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#f5b963]" />一般 <span className="text-[#f5d263] font-bold">8</span></span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#3b8de1]" />提示 <span className="text-[#79d0ff] font-bold">15</span></span>
            </div>
          </div>
          <div className="min-h-0 flex-1"><BaseChart option={alarmTrendOption} /></div>
        </div>
      </div>

      {/* ===== 右列 ===== */}
      <div className="flex min-h-0 flex-col gap-1.5">
        <div className={dtPanel + ' flex-[4] min-h-0 overflow-hidden'}>
          <DtSectionTitle title="当前告警" />
          <div className="flex-1 space-y-1.5 overflow-auto custom-scrollbar pr-0.5">
            {CURRENT_ALARMS.map(al => {
              const c = al.level === 'critical' ? '#ef5350' : al.level === 'warning' ? '#f5b963' : '#3b8de1';
              return (
                <div key={al.id} className="rounded border bg-[#0a1f3d]/85 p-2" style={{ borderColor: `${c}55`, borderLeftWidth: 4, borderLeftColor: c }}>
                  <div className="mb-0.5 flex items-center justify-between">
                    <DtAlarmTag level={al.level} />
                    <span className="font-mono text-[11px] text-[#7e9fc8]">{al.time}</span>
                  </div>
                  <div className="text-[12.5px] font-semibold text-[#e8f3ff]">{al.title}</div>
                  <div className="text-[10.5px] text-[#7e9fc8]">影响范围：{al.scope}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={dtPanel + ' flex-[3] min-h-0 overflow-hidden'}>
          <DtSectionTitle title="处理建议" />
          <ul className="flex-1 space-y-1.5 overflow-auto text-[12px] text-[#e8f3ff] custom-scrollbar pr-0.5">
            {[
              '检查上联光模块',
              '切换备用链路',
              '通知一号产线负责人',
              '派发网络运维工单',
            ].map((t, i) => (
              <li key={i} className="flex items-center gap-2 rounded border border-[#143258] bg-[#081f3d]/65 px-2.5 py-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1f5f9c] text-[10px] font-bold text-white">{i + 1}</span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className={dtPanel + ' flex-[2] min-h-0 overflow-hidden'}>
          <DtSectionTitle title="环境状态" />
          <div className="flex-1 grid grid-cols-2 gap-1.5 content-start overflow-auto custom-scrollbar pr-0.5">
            {B_AREA_ENV.map(e => (
              <div key={e.name} className="flex items-center justify-between rounded border border-[#143258] bg-[#081f3d]/65 px-2.5 py-1.5 text-[12px] text-[#e8f3ff]">
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
