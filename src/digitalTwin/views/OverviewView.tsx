import React from 'react';
import { Server, Wifi, Siren, Link as LinkIcon, LayoutGrid, Boxes, MapPin, Cpu, AlertTriangle } from 'lucide-react';
import { dtPanel, DtSectionTitle, DtStatusBadge, DtAlarmTag, DT } from '../shared';
import { ASSET_OVERVIEW, BUSINESS_SYSTEMS, AREAS, CURRENT_ALARMS } from '../data';
import { DtSceneDefs } from '../scenery';
import { Scene3DCanvas, Box3D, GroundPlane, GroundShadow, Anchor3D, Line3D } from '../iso3d';
import { useDtNav } from '../DigitalTwinDashboard';

// ── 资产概览 ───────────────────────────────────────────────────────────
const assetRows = [
  { key: 'totalDevices', label: '设备总数', value: ASSET_OVERVIEW.totalDevices, icon: Server,    tone: '#e8f3ff' },
  { key: 'online',       label: '在线设备', value: ASSET_OVERVIEW.online,       icon: Wifi,      tone: '#6ce09a' },
  { key: 'alarming',     label: '告警设备', value: ASSET_OVERVIEW.alarming,     icon: Siren,     tone: '#ff7d7d' },
  { key: 'offline',      label: '离线设备', value: ASSET_OVERVIEW.offline,      icon: LinkIcon,  tone: '#ffb672' },
  { key: 'racks',        label: '机柜数量', value: ASSET_OVERVIEW.racks,        icon: LayoutGrid, tone: '#e8f3ff' },
  { key: 'biz',          label: '业务系统数量', value: ASSET_OVERVIEW.bizSystems, icon: Boxes,   tone: '#e8f3ff' },
];

// ── 工厂建筑（3D 立方体） ──────────────────────────────────────────────
const Factory3DBuilding: React.FC<{
  cx: number; cz: number; w: number; h: number; d: number; alarm?: boolean; label: string;
  onClick?: () => void;
}> = ({ cx, cz, w, h, d, alarm, label, onClick }) => {
  const colors = alarm ? {
    top: '#c14238', front: '#7a1a14', back: '#5a0e0a', left: '#5a1410', right: '#3e0b08',
  } : {
    top: '#2f7ac4', front: '#1a4f86', back: '#0c3168', left: '#163f70', right: '#0d2c58',
  };
  const stroke = alarm ? '#ef5a4a' : '#3f86c8';

  return (
    <>
      <GroundShadow cx={cx} cz={cz} rx={w / 2 + 4} rz={d / 2 + 4} />
      <Box3D
        cx={cx} cy={h / 2} cz={cz}
        hw={w / 2} hh={h / 2} hd={d / 2}
        colors={colors}
        stroke={stroke}
        strokeWidth={0.8}
        onClick={onClick}
        decorate={{
          // 屋顶纹理 - 设备
          top: (pts) => {
            // 在顶面 4 顶点中找几何中心，画机械设备
            const cxs = pts.reduce((s, p) => s + p.x, 0) / 4;
            const cys = pts.reduce((s, p) => s + p.y, 0) / 4;
            return (
              <>
                <rect x={cxs - 18} y={cys - 6} width={14} height={4} fill="#243a55" opacity={0.85} />
                <rect x={cxs + 4} y={cys - 4} width={16} height={6} fill="#243a55" opacity={0.85} />
              </>
            );
          },
          // 正面 窗户矩阵
          front: (pts) => {
            // 用 4 个屏幕顶点构造矩形区域填窗户
            const [tl, tr, br, bl] = pts;
            const w = Math.hypot(tr.x - tl.x, tr.y - tl.y);
            const h = Math.hypot(bl.x - tl.x, bl.y - tl.y);
            const cols = Math.max(4, Math.round(w / 14));
            const rows = Math.max(3, Math.round(h / 12));
            // 用 transform 拼成网格（窗户必然平行于面）
            const ux = (tr.x - tl.x) / cols, uy = (tr.y - tl.y) / cols;
            const vx = (bl.x - tl.x) / rows, vy = (bl.y - tl.y) / rows;
            const items: React.ReactNode[] = [];
            for (let r = 1; r < rows - 0.5; r++) {
              for (let c = 0.5; c < cols - 0.5; c++) {
                const px = tl.x + ux * c + vx * r;
                const py = tl.y + uy * c + vy * r;
                const wcol = alarm ? '#ffd0c0' : '#9bd1ff';
                items.push(<rect key={`${r}-${c}`} x={px - 3} y={py - 2.5} width={6} height={3.5} fill={wcol} opacity={0.55} />);
              }
            }
            return <>{items}</>;
          },
          // 左/右侧面也加窗户行
          left: (pts) => {
            const [tl, tr, br, bl] = pts;
            const w = Math.hypot(tr.x - tl.x, tr.y - tl.y);
            const h = Math.hypot(bl.x - tl.x, bl.y - tl.y);
            const cols = Math.max(3, Math.round(w / 14));
            const rows = Math.max(3, Math.round(h / 12));
            const ux = (tr.x - tl.x) / cols, uy = (tr.y - tl.y) / cols;
            const vx = (bl.x - tl.x) / rows, vy = (bl.y - tl.y) / rows;
            const items: React.ReactNode[] = [];
            for (let r = 1; r < rows - 0.5; r++) {
              for (let c = 0.5; c < cols - 0.5; c++) {
                const px = tl.x + ux * c + vx * r;
                const py = tl.y + uy * c + vy * r;
                const wcol = alarm ? '#ffd0c0' : '#79b8e8';
                items.push(<rect key={`${r}-${c}`} x={px - 2.5} y={py - 2} width={5} height={3} fill={wcol} opacity={0.45} />);
              }
            }
            return <>{items}</>;
          },
          right: (pts) => {
            const [tl, tr, br, bl] = pts;
            const w = Math.hypot(tr.x - tl.x, tr.y - tl.y);
            const h = Math.hypot(bl.x - tl.x, bl.y - tl.y);
            const cols = Math.max(3, Math.round(w / 14));
            const rows = Math.max(3, Math.round(h / 12));
            const ux = (tr.x - tl.x) / cols, uy = (tr.y - tl.y) / cols;
            const vx = (bl.x - tl.x) / rows, vy = (bl.y - tl.y) / rows;
            const items: React.ReactNode[] = [];
            for (let r = 1; r < rows - 0.5; r++) {
              for (let c = 0.5; c < cols - 0.5; c++) {
                const px = tl.x + ux * c + vx * r;
                const py = tl.y + uy * c + vy * r;
                const wcol = alarm ? '#ffd0c0' : '#79b8e8';
                items.push(<rect key={`${r}-${c}`} x={px - 2.5} y={py - 2} width={5} height={3} fill={wcol} opacity={0.4} />);
              }
            }
            return <>{items}</>;
          },
        }}
      />
      {/* 顶上漂浮标签 */}
      <Anchor3D p={{ x: cx, y: h + 20, z: cz }}>
        {(p) => (
          <g>
            <rect x={p.x - 75} y={p.y - 14} width={150} height={24} rx={3}
              fill={alarm ? 'rgba(80,20,20,0.92)' : 'rgba(8,28,58,0.92)'}
              stroke={alarm ? '#ef5a4a' : '#3f86c8'} strokeWidth={0.8} />
            <text x={p.x} y={p.y + 3} textAnchor="middle" fontSize="12" fontWeight="bold"
              fill={alarm ? '#ffe4df' : '#cfe5ff'}>{label}</text>
          </g>
        )}
      </Anchor3D>
    </>
  );
};

// ── 平台（ground slab，含上面的小物件） ─────────────────────────────
const FactorySlab: React.FC<{
  cx: number; cz: number; w: number; h: number; d: number; label: string;
  children?: React.ReactNode;
}> = ({ cx, cz, w, h, d, label, children }) => {
  const colors = { top: '#1a3f6e', front: '#0d2e5b', back: '#082040', left: '#102e54', right: '#0a1f3d' };
  return (
    <>
      <GroundShadow cx={cx} cz={cz} rx={w / 2 + 2} rz={d / 2 + 2} />
      <Box3D
        cx={cx} cy={h / 2} cz={cz}
        hw={w / 2} hh={h / 2} hd={d / 2}
        colors={colors} stroke="#3f86c8" strokeWidth={0.7}
      />
      {children}
      <Anchor3D p={{ x: cx, y: -8, z: cz + d / 2 + 4 }}>
        {(p) => (
          <g>
            <rect x={p.x - 70} y={p.y - 12} width={140} height={22} rx={3}
              fill="rgba(8,28,58,0.92)" stroke="#3f86c8" strokeWidth={0.6} />
            <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#cfe5ff">{label}</text>
          </g>
        )}
      </Anchor3D>
    </>
  );
};

// ── 工位（视觉检测）：小型立方体阵列 ──────────────────────────────
const VisionWorkstation: React.FC<{ cx: number; cz: number }> = ({ cx, cz }) => (
  <Box3D
    cx={cx} cy={14} cz={cz}
    hw={9} hh={14} hd={11}
    colors={{ top: '#0e3a72', front: '#1a4f86', back: '#0a2547', left: '#102e54', right: '#0a1f3d' }}
    stroke="#5fb4ff" strokeWidth={0.5}
    decorate={{
      front: (pts) => {
        const [tl, tr, br, bl] = pts;
        const cx = (tl.x + tr.x + br.x + bl.x) / 4;
        const cy = (tl.y + tr.y + br.y + bl.y) / 4;
        return <circle cx={cx} cy={cy} r={2.2} fill="#6ce09a" />;
      }
    }}
  />
);

// ── 办公桌（小立方体） ─────────────────────────────────────────────
const OfficeDesk: React.FC<{ cx: number; cz: number }> = ({ cx, cz }) => (
  <Box3D
    cx={cx} cy={6} cz={cz}
    hw={14} hh={6} hd={6}
    colors={{ top: '#1a4f86', front: '#0d2e5b', back: '#082040', left: '#102e54', right: '#0a1f3d' }}
    stroke="#5fb4ff" strokeWidth={0.4}
  />
);

// ── AGV 小车（立方体 + 上盖） ──────────────────────────────────────
const AGVUnit: React.FC<{ cx: number; cz: number }> = ({ cx, cz }) => (
  <Box3D
    cx={cx} cy={6} cz={cz}
    hw={12} hh={6} hd={8}
    colors={{ top: '#2f7ac4', front: '#1f5a9b', back: '#0c3168', left: '#143f70', right: '#0a2c58' }}
    stroke="#5fb4ff" strokeWidth={0.5}
    decorate={{
      top: (pts) => {
        const cxv = pts.reduce((s, p) => s + p.x, 0) / 4;
        const cyv = pts.reduce((s, p) => s + p.y, 0) / 4;
        return (
          <>
            <rect x={cxv - 6} y={cyv - 2} width={12} height={4} fill="#03101e" />
            <circle cx={cxv} cy={cyv} r={1.2} fill="#6ce09a" />
          </>
        );
      }
    }}
  />
);

// ── 主舞台：基于真伪3D 的园区场景 ─────────────────────────────────────
const FactoryScene: React.FC = () => {
  const { setView } = useDtNav();
  // 园区坐标系：x 横向，z 纵深（屏幕外为正），y 竖直
  // 上排 3 个建筑（z=-80）、下排 3 个平台（z=+80）
  const upZ = -80, downZ = 100;
  const xs = [-260, 0, 260];
  const drill = () => setView('area');

  return (
  <Scene3DCanvas width={960} height={560} cx={480} cy={330} defaultYaw={28} defaultPitch={48} defaultScale={0.9}
    background={
      <>
        <defs>
          <radialGradient id="ovGround" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#0b2a55" />
            <stop offset="60%" stopColor="#061a36" />
            <stop offset="100%" stopColor="#020a18" />
          </radialGradient>
        </defs>
        <rect width="960" height="560" fill="url(#ovGround)" />
      </>
    }
  >
    {/* 地面网格 */}
    <GroundPlane x={-460} z={0} w={920} d={520} fill="#04162e" stroke="#163f70" />
    {/* 水平/垂直路面 */}
    <GroundPlane x={-460} z={10} w={920} d={22} fill="#15233e" />
    <GroundPlane x={-12} z={-260} w={24} d={520} fill="#15233e" />

    {/* === 上排：1号产线 / 3号机房（告警）/ 算力模块A === */}
    <Factory3DBuilding cx={xs[0]} cz={upZ} w={150} h={100} d={110} label="1号产线"   onClick={drill} />
    <Factory3DBuilding cx={xs[1]} cz={upZ} w={150} h={110} d={110} label="3号机房"   onClick={drill} alarm />
    <Factory3DBuilding cx={xs[2]} cz={upZ} w={150} h={100} d={110} label="算力模块A" onClick={drill} />

    {/* === 下排：3 个平台 === */}
    <FactorySlab cx={xs[0]} cz={downZ} w={170} h={14} d={120} label="AGV调度区">
      <AGVUnit cx={xs[0] - 40} cz={downZ - 20} />
      <AGVUnit cx={xs[0] + 30} cz={downZ + 20} />
    </FactorySlab>
    <FactorySlab cx={xs[1]} cz={downZ} w={170} h={14} d={120} label="视觉检测区">
      {[-3, -1, 1, 3].map(i => (
        <VisionWorkstation key={i} cx={xs[1] + i * 22} cz={downZ} />
      ))}
    </FactorySlab>
    <FactorySlab cx={xs[2]} cz={downZ} w={170} h={14} d={120} label="办公网区">
      {[-1, 0, 1].map(r => [-1.5, -0.5, 0.5, 1.5].map(c => (
        <OfficeDesk key={`${r}-${c}`} cx={xs[2] + c * 36} cz={downZ + r * 26} />
      )))}
    </FactorySlab>
  </Scene3DCanvas>
  );
};

export const OverviewView: React.FC = () => {
  return (
    <div
      className="grid h-full min-h-0 gap-1.5"
      style={{ gridTemplateColumns: 'minmax(220px, clamp(220px, 18vw, 320px)) minmax(0, 1fr) minmax(240px, clamp(260px, 20vw, 340px))' }}
    >
      {/* ===================== 左列 ===================== */}
      <div className="flex min-h-0 flex-col gap-1.5">
        {/* 资产概览 */}
        <div className={dtPanel + ' flex-[6] min-h-0 overflow-hidden'}>
          <DtSectionTitle title="资产概览" />
          <div className="flex-1 space-y-1.5">
            {assetRows.map(row => {
              const Ic = row.icon;
              return (
                <div key={row.key} className="flex items-center justify-between rounded border border-[#143258] bg-[#081f3d]/65 px-3 py-2">
                  <div className="flex items-center gap-2.5 text-[12.5px] text-[#a9c8ee]">
                    <span className="flex h-6 w-6 items-center justify-center rounded border border-[#244871] bg-[#0d2a52] text-[#79d0ff]">
                      <Ic size={13} />
                    </span>
                    {row.label}
                  </div>
                  <span className="font-mono text-[20px] font-black tracking-wide" style={{ color: row.tone }}>
                    {row.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 业务承载 */}
        <div className={dtPanel + ' flex-[5] min-h-0 overflow-hidden'}>
          <DtSectionTitle title="业务承载" />
          <div className="flex-1 space-y-1.5 overflow-auto custom-scrollbar pr-0.5">
            {BUSINESS_SYSTEMS.map(b => (
              <div key={b.name} className="flex items-center justify-between rounded border border-[#143258] bg-[#081f3d]/65 px-3 py-1.5 text-[12.5px] text-[#e8f3ff]">
                <span className="flex items-center gap-2">
                  <span className="text-[#79d0ff]">▣</span>
                  {b.name}
                </span>
                <DtStatusBadge status={b.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===================== 中间主舞台 ===================== */}
      <div className={dtPanel + ' min-h-0 overflow-hidden'}>
        <DtSectionTitle title="园区数字孪生 — 总览" right={<span className="text-[10px] text-[#7e9fc8]">真实数据 / 模拟数据混合</span>} />
        <div className="relative min-h-0 flex-1 overflow-hidden rounded border border-[#1b4378] bg-[#03132a]">
          <FactoryScene />
        </div>
      </div>

      {/* ===================== 右列 ===================== */}
      <div className="flex min-h-0 flex-col gap-1.5">
        {/* 当前告警 */}
        <div className={dtPanel + ' flex-[3] min-h-0 overflow-hidden'}>
          <DtSectionTitle title="当前告警" right={<button className="text-[11px] text-[#79d0ff] hover:underline">更多 ›</button>} />
          <div className="flex-1 space-y-1.5 overflow-auto custom-scrollbar pr-0.5">
            {CURRENT_ALARMS.map(al => {
              const borderColor = al.level === 'critical' ? '#ef5350' : al.level === 'warning' ? '#f5b963' : '#3b8de1';
              return (
                <div
                  key={al.id}
                  className="rounded border bg-[#0a1f3d]/85 p-2"
                  style={{ borderColor: `${borderColor}55`, borderLeftWidth: 4, borderLeftColor: borderColor }}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <DtAlarmTag level={al.level} />
                    <span className="font-mono text-[11px] text-[#7e9fc8]">{al.time}</span>
                  </div>
                  <div className="text-[12.5px] font-semibold text-[#e8f3ff]">{al.title}</div>
                  <div className="mt-0.5 text-[11px] text-[#7e9fc8]">影响范围：{al.scope}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 影响总览 */}
        <div className={dtPanel + ' flex-[2] min-h-0 overflow-hidden'}>
          <DtSectionTitle title="影响总览" />
          <div className="flex-1 space-y-1.5 overflow-auto text-[12px] custom-scrollbar pr-0.5">
            {[
              { icon: <MapPin size={12} />, label: '受影响区域', value: 'A区视觉检测工位', tone: '#ff8a7a' },
              { icon: <Cpu size={12} />,    label: '受影响设备', value: '8台终端',           tone: '#ff8a7a' },
              { icon: <Boxes size={12} />,  label: '受影响业务', value: '视觉检测、AGV调度、视频监控', tone: '#f5d263' },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between rounded border border-[#143258] bg-[#081f3d]/65 px-2.5 py-1.5">
                <span className="flex items-center gap-1.5 text-[#a9c8ee]">
                  <span className="text-[#79d0ff]">{r.icon}</span>{r.label}
                </span>
                <span className="font-semibold" style={{ color: r.tone }}>{r.value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between rounded border border-[#143258] bg-[#081f3d]/65 px-2.5 py-1.5">
              <span className="flex items-center gap-1.5 text-[#a9c8ee]">
                <AlertTriangle size={12} className="text-[#ff8a7a]" />风险等级
              </span>
              <DtStatusBadge status="严重" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
