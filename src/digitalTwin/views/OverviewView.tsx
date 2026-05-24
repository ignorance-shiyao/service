import React from 'react';
import { Server, Wifi, Siren, Link as LinkIcon, LayoutGrid, Boxes, MapPin, Cpu, AlertTriangle } from 'lucide-react';
import { dtPanel, DtSectionTitle, DtStatusBadge, DtAlarmTag, DT, DtAlarm24hPanel } from '../shared';
import { ASSET_OVERVIEW, BUSINESS_SYSTEMS, AREAS, CURRENT_ALARMS } from '../data';
import { SceneStage, SceneSprite, SceneLabel, SceneAlarmPulse, SceneLot, ScenePath } from '../sceneAssets';
import { loadLayout } from '../layoutStore';
import { useDtNav, DtSceneHeader } from '../DigitalTwinDashboard';

// ── 资产概览 ───────────────────────────────────────────────────────────
const assetRows = [
  { key: 'totalDevices', label: '设备总数', value: ASSET_OVERVIEW.totalDevices, icon: Server,    tone: '#e8f3ff' },
  { key: 'online',       label: '在线设备', value: ASSET_OVERVIEW.online,       icon: Wifi,      tone: '#6ce09a' },
  { key: 'alarming',     label: '告警设备', value: ASSET_OVERVIEW.alarming,     icon: Siren,     tone: '#ff7d7d' },
  { key: 'offline',      label: '离线设备', value: ASSET_OVERVIEW.offline,      icon: LinkIcon,  tone: '#ffb672' },
  { key: 'racks',        label: '机柜数量', value: ASSET_OVERVIEW.racks,        icon: LayoutGrid, tone: '#e8f3ff' },
  { key: 'biz',          label: '业务系统数量', value: ASSET_OVERVIEW.bizSystems, icon: Boxes,   tone: '#e8f3ff' },
];

// ── 主舞台：园区俯视图（基于伪3D SVG 素材） ────────────────────────────
// 园区"绿色定位针"：参照参考图的小圆点 + 浮动标签
const ParkPin: React.FC<{ x: number; y: number; label: string; onClick?: () => void; alarm?: boolean; tone?: 'normal' | 'alarm' | 'warn' }> = ({ x, y, label, onClick, alarm, tone = 'normal' }) => {
  const dotColor = alarm ? '#ef5a4a' : tone === 'warn' ? '#f5b963' : '#6ce09a';
  const bgColor = tone === 'alarm' ? 'rgba(80,20,20,0.95)' : tone === 'warn' ? 'rgba(80,60,16,0.95)' : 'rgba(8,28,58,0.95)';
  const borderColor = tone === 'alarm' ? '#ef5a4a' : tone === 'warn' ? '#f5b963' : '#3f86c8';
  const textColor = tone === 'alarm' ? '#ffe4df' : tone === 'warn' ? '#fff0d4' : '#cfe5ff';
  return (
    <div
      className={`absolute -translate-x-1/2 ${onClick ? 'cursor-pointer' : ''}`}
      style={{ left: `${x}%`, top: `${y}%`, zIndex: 80 }}
      onClick={onClick}
    >
      {/* 标签气泡 */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded px-2.5 py-1 text-[12px] font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
        style={{ background: bgColor, border: `1px solid ${borderColor}`, color: textColor, bottom: 14 }}
      >
        {label}
      </div>
      {/* 杆 */}
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-[1px]" style={{ width: 1, height: 12, background: dotColor }} />
      {/* 圆点 */}
      <div className="relative h-3 w-3 rounded-full" style={{ background: dotColor, boxShadow: `0 0 8px ${dotColor}` }}>
        {alarm && (
          <span className="absolute inset-0 rounded-full" style={{ border: `2px solid ${dotColor}`, animation: 'dtPulse 1.6s ease-out infinite' }} />
        )}
      </div>
    </div>
  );
};


// ── 主舞台：底图 + 用户布局（从 layoutStore 加载，可被编辑器覆盖） ────
const FactoryScene: React.FC = () => {
  const { setView, setZone } = useDtNav();
  const enter = (zone: string) => () => { setZone(zone); setView('area'); };
  const layout = loadLayout('overview');
  const baseSrc = layout.baseMap || '/svg/sim_park_base_map_no_buildings.svg';

  return (
    <SceneStage width={layout.width} height={layout.height} className="bg-[#020a18]">
      {/* 底图 */}
      <img
        src={baseSrc}
        alt="园区底图"
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
        style={{ zIndex: 1 }}
      />

      {/* 建筑叠加 */}
      {layout.items.map((b, i) => (
        <SceneSprite
          key={b.id}
          asset={b.asset}
          x={b.cx}
          y={b.cy}
          width={b.w}
          z={20 + i}
          rotate={b.rotate}
          yaw={b.yaw ?? (b.sx === -1 ? 180 : 0)}
          pitch={b.pitch}
          opacity={1}
          onClick={b.zone ? enter(b.zone) : undefined}
          filter={b.filter}
          title={b.label ?? b.asset}
          anchorBottom={b.anchorBottom !== false}
        />
      ))}

      {/* 浮在建筑上方的绿色定位针 + 健康/告警标签 */}
      {layout.items.filter(i => i.label && (i.zone || /主入口|入口|门岗/.test(i.label))).map(i => {
        // 标签位于建筑顶部上方
        const pinY = Math.max(2, i.cy - 16);
        return (
          <ParkPin
            key={'pin-' + i.id}
            x={i.cx}
            y={pinY}
            label={i.label!}
            tone={i.tone}
            alarm={i.alarm}
            onClick={i.zone ? enter(i.zone) : undefined}
          />
        );
      })}
    </SceneStage>
  );
};

// ── 工厂建筑（已不再使用，保留占位） ──────────────────────────────────────

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
        <DtSceneHeader title="园区数字孪生" right={<span className="ml-2 text-[10px] text-[#7e9fc8]">真实数据 / 模拟数据混合</span>} />
        <div className="relative mb-1.5 min-h-0 flex-[4] overflow-hidden rounded border border-[#1b4378] bg-[#03132a]">
          <FactoryScene />
        </div>
        <DtAlarm24hPanel />
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
