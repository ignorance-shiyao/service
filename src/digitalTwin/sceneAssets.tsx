import React from 'react';
import { loadCustomAssets } from './customAssets';
import { FOLDER_SCENE_ASSETS } from './svgSceneRegistry';

// ╭─────────────────────────────────────────────────────────────────────╮
// │ 数字孪生场景资源管理                                                  │
// │ 所有 SVG 资源来自 /public/svg/（基于 PNG 包装的伪 3D 图像）          │
// ╰─────────────────────────────────────────────────────────────────────╯

const path = (name: string) => `/svg/${name}.svg`;

// 资源名 → 自然宽高（仅保留代码中真正引用的资源；其余原图移至 public/others/）
const bldg = (name: string) => `/svg/buildings/${name}.svg`;
const idc = (name: string) => `/svg/idc/${name}.svg`;

export const ASSETS = {
  // 园区建筑（透明背景，可叠加在底图上）
  parkFactory:        { src: bldg('park_factory_building'),       w: 768, h: 576 },
  parkOffice:         { src: bldg('park_office_building'),        w: 768, h: 694 },
  parkSubstation:     { src: bldg('park_transformer_substation'), w: 768, h: 594 },
  parkChiller:        { src: bldg('park_hvac_chiller'),           w: 768, h: 648 },
  parkLoadingDock:    { src: bldg('park_loading_dock'),           w: 768, h: 604 },
  parkEvCharger:      { src: bldg('park_ev_charger_parking'),     w: 768, h: 614 },
  parkGate:           { src: bldg('park_security_gatehouse'),     w: 768, h: 708 },
  zoneDatacenter:     { src: bldg('zone_datacenter'),             w: 768, h: 574 },
  zoneFactory:        { src: bldg('zone_factory'),                w: 768, h: 532 },

  // 园区底图（无建筑，可叠加自己的建筑/标记/链路）
  parkBaseMap:        { src: path('sim_park_base_map_no_buildings'), w: 1672, h: 941 },

  // 环境
  glassPartition:     { src: path('env_glass_partition'),         w: 768, h: 675 },
  doorDouble:         { src: path('env_door_double'),             w: 512, h: 476 },
  floorRaisedTile:    { src: path('env_floor_raised_tile'),       w: 768, h: 499 },
  floorRoomSlab:      { src: path('env_floor_room_slab'),         w: 768, h: 450 },

  // 车间设备
  workshopAssembly:   { src: path('workshop_assembly_station'),   w: 658, h: 768 },
  workshopCNC:        { src: path('workshop_cnc_machine'),        w: 687, h: 768 },
  workshopConveyor:   { src: path('workshop_conveyor'),           w: 768, h: 547 },
  workshopRobotArm:   { src: path('workshop_robot_arm'),          w: 653, h: 768 },
  workshopFence:      { src: path('workshop_safety_fence'),       w: 768, h: 608 },
  workshopCtrlCab:    { src: path('workshop_control_cabinet'),    w: 246, h: 512 },
  workstationVision:  { src: path('workstation_vision'),          w: 475, h: 512 },

  // 现场设备
  deviceAgv:          { src: path('device_agv'),                  w: 512, h: 371 },
  deviceCamera:       { src: path('device_camera'),               w: 512, h: 411 },
  deviceServer2u:     { src: path('device_server_2u'),            w: 512, h: 246 },
  devicePrecisionAcW: { src: path('device_precision_ac_warning'), w: 280, h: 512 },

  // 机房基础设施
  rackSingle:         { src: path('rack_single_42u'),             w: 259, h: 512 },
  rackRow:            { src: path('rack_row'),                    w: 768, h: 472 },
  acInrow:            { src: path('infra_ac_inrow'),              w: 197, h: 512 },
  acRoomPrecision:    { src: path('infra_ac_room_precision'),     w: 390, h: 512 },
  atsCabinet:         { src: path('infra_ats_cabinet'),           w: 369, h: 512 },
  upsMain:            { src: path('infra_ups_main'),              w: 288, h: 512 },
  upsBattery:         { src: path('infra_ups_battery_cabinet'),   w: 242, h: 512 },
  pduStrip:           { src: path('infra_pdu_strip'),             w:  62, h: 512 },
  powerDistribution:  { src: path('infra_power_distribution_cabinet'), w: 400, h: 512 },
  fireCylinders:      { src: path('infra_fire_suppression_cylinders'), w: 299, h: 512 },

  cableTray:          { src: path('facility_cable_tray'),         w: 768, h: 552 },

  // IDC 机房重建素材（public/svg/idc）
  idcBaseRoom:        { src: idc('room_base_no_equipment'),       w: 1672, h: 941 },
  idcRackRow:         { src: idc('rack_row_long'),                w: 506, h: 449 },
  idcRackSingle:      { src: idc('rack_single_42u'),              w: 216, h: 406 },
  idcServerCabFront:  { src: idc('server_cabinet_front'),         w: 177, h: 392 },
  idcPrecisionAc:     { src: idc('room_precision_ac'),            w: 261, h: 394 },
  idcInrowAc:         { src: idc('inrow_precision_cooling'),      w: 162, h: 401 },
  idcUpsMain:         { src: idc('ups_main_cabinet'),             w: 263, h: 389 },
  idcBatteryCab:      { src: idc('ups_battery_cabinet'),          w: 206, h: 382 },
  idcPowerCab:        { src: idc('power_distribution_cabinet'),   w: 327, h: 406 },
  idcAtsCab:          { src: idc('power_distribution_cabinet'),   w: 327, h: 406 },
  idcFireCyl:         { src: idc('fire_suppression_cylinders'),   w: 257, h: 390 },
  idcSmokeSensor:     { src: idc('smoke_detector'),               w: 211, h: 201 },
  idcTempHumSensor:   { src: idc('temperature_humidity_sensor'),  w: 166, h: 273 },
  idcWaterLeakSensor: { src: idc('water_leak_sensor_cable'),      w: 375, h: 228 },
  idcWallLight:       { src: idc('wall_light_strip'),             w: 347, h: 203 },
  idcAccessDoor:      { src: idc('access_door_double'),           w: 306, h: 390 },
  idcPduStrip:        { src: idc('pdu_power_strip'),              w: 369, h: 251 },
  idcAlarmBeacon:     { src: idc('alarm_beacon_pole'),            w: 132, h: 344 },
  ...FOLDER_SCENE_ASSETS,
} as const;

export type AssetDef = { src: string; w: number; h: number };
export type StaticAssetKey = keyof typeof ASSETS;
export type AssetKey = StaticAssetKey | `custom:${string}`;

export function getAsset(asset: AssetKey | string): AssetDef | undefined {
  const staticAsset = (ASSETS as Record<string, AssetDef>)[asset];
  if (staticAsset) return staticAsset;
  return loadCustomAssets().find(item => item.key === asset)?.asset;
}

export function getAllAssets(): Record<string, AssetDef> {
  const customEntries = loadCustomAssets().map(item => [item.key, { src: item.src, w: item.w, h: item.h }] as const);
  return {
    ...(ASSETS as Record<string, AssetDef>),
    ...FOLDER_SCENE_ASSETS,
    ...Object.fromEntries(customEntries),
  };
}

// ╭─────────────────────────────────────────────────────────────────────╮
// │ SceneStage —— 场景容器（按设计稿宽高保持比例，子元素用百分比定位）   │
// ╰─────────────────────────────────────────────────────────────────────╯
export const SceneStage: React.FC<{
  width: number;          // 设计稿宽（设计像素）
  height: number;         // 设计稿高
  className?: string;
  children: React.ReactNode;
}> = ({ width, height, className = '', children }) => {
  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      <div
        className="relative mx-auto"
        style={{
          aspectRatio: `${width} / ${height}`,
          height: '100%',
          maxWidth: '100%',
        }}
      >
        {children}
      </div>
    </div>
  );
};

// ╭─────────────────────────────────────────────────────────────────────╮
// │ SceneSprite —— 在 SceneStage 内按百分比绝对定位一个 SVG               │
// │  x/y/width 都是百分比（相对设计稿宽 / 高）                            │
// │  以图像底部中心为锚点 (像素世界的 "脚下")                              │
// ╰─────────────────────────────────────────────────────────────────────╯
export const SceneSprite: React.FC<{
  asset: AssetKey | { src: string; w: number; h: number };
  /** 锚点 x 百分比（脚下中心） */
  x: number;
  /** 锚点 y 百分比 */
  y: number;
  /** 显示宽度（百分比，相对舞台宽） */
  width: number;
  /** 显示高度（百分比，相对舞台高）；不传则按资源原始比例计算 */
  height?: number;
  /** 自定义层级（默认基于 y） */
  z?: number;
  className?: string;
  filter?: string;
  opacity?: number;
  onClick?: () => void;
  title?: string;
  /** Z 轴平面旋转（度） */
  rotate?: number;
  /** Y 轴水平旋转（度，0~360） */
  yaw?: number;
  /** X 轴俯仰旋转（度，0~360） */
  pitch?: number;
  /** 锚点是否在底部中心，默认 true */
  anchorBottom?: boolean;
  sx?: 1 | -1;
  sy?: 1 | -1;
}> = ({ asset, x, y, width, height, z, className = '', filter, opacity, onClick, title, rotate, yaw, pitch, anchorBottom = true, sx = 1, sy = 1 }) => {
  const a = typeof asset === 'string' ? getAsset(asset) : asset;
  if (!a) return null;
  // 计算显示高度按图像原始比例（width 是百分比，所以 height 也是相对舞台高度的百分比）
  // 由于舞台宽和高比例不同，我们需要把图像保持等比例
  // 这里采用：width% 表达图像宽度（相对舞台宽），height 由 aspectRatio 决定
  const aspect = a.w / a.h;
  const zIndex = z ?? Math.round(y * 10);
  return (
    <div
      className={`absolute ${className} ${onClick ? 'cursor-pointer' : ''}`}
      title={title}
      onClick={e => {
        if (!onClick) return;
        e.stopPropagation();
        onClick();
      }}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${width}%`,
        ...(height != null ? { height: `${height}%` } : { aspectRatio: `${a.w} / ${a.h}` }),
        transform: `translate(-50%, ${anchorBottom ? '-100%' : '-50%'}) rotate(${rotate ?? 0}deg) rotateY(${yaw ?? 0}deg) rotateX(${pitch ?? 0}deg) scale(${sx}, ${sy})`,
        transformOrigin: anchorBottom ? '50% 100%' : '50% 50%',
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'visible',
        zIndex,
        filter,
        opacity,
      }}
    >
      <img src={a.src} alt={typeof asset === 'string' ? asset : ''} draggable={false} className="h-full w-full select-none object-contain" />
    </div>
  );
};

// ╭─────────────────────────────────────────────────────────────────────╮
// │ SceneLot —— 园区"地块"，用底色高亮一块矩形区域作为视觉边界          │
// │  x/y 是地块中心；w/h 是地块尺寸（百分比）                              │
// ╰─────────────────────────────────────────────────────────────────────╯
export const SceneLot: React.FC<{
  x: number; y: number; w: number; h: number;
  tone?: 'plain' | 'alarm' | 'highlight';
  z?: number;
}> = ({ x, y, w, h, tone = 'plain', z = 3 }) => {
  const styles = tone === 'alarm'
    ? { background: 'radial-gradient(ellipse at center, rgba(80,18,18,0.35), rgba(40,8,8,0.12))', border: '1px solid rgba(239,90,74,0.4)' }
    : tone === 'highlight'
    ? { background: 'radial-gradient(ellipse at center, rgba(15,68,42,0.35), rgba(8,40,24,0.12))', border: '1px solid rgba(108,224,154,0.3)' }
    : { background: 'radial-gradient(ellipse at center, rgba(20,60,110,0.32), rgba(8,28,58,0.10))', border: '1px solid rgba(63,134,200,0.25)' };
  return (
    <div
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-[14px]"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${w}%`,
        height: `${h}%`,
        ...styles,
        zIndex: z,
      }}
    />
  );
};

// ── 一段路面（水平/垂直），自己渲染为半透明深色矩形 ─────────────────────
export const ScenePath: React.FC<{
  x: number; y: number; w: number; h: number; z?: number;
}> = ({ x, y, w, h, z = 4 }) => (
  <div
    className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
    style={{
      left: `${x}%`,
      top: `${y}%`,
      width: `${w}%`,
      height: `${h}%`,
      background: 'linear-gradient(180deg, #15233e 0%, #0b1830 100%)',
      borderTop: '1px solid rgba(63,134,200,0.18)',
      borderBottom: '1px solid rgba(63,134,200,0.18)',
      boxShadow: 'inset 0 0 18px rgba(0,0,0,0.5)',
      zIndex: z,
    }}
  >
    {/* 中央虚线 */}
    {w > h ? (
      <div
        className="absolute left-0 right-0 top-1/2 -translate-y-1/2"
        style={{
          height: 1.5,
          background: 'repeating-linear-gradient(90deg, rgba(255,232,160,0.55) 0 12px, transparent 12px 24px)',
        }}
      />
    ) : (
      <div
        className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2"
        style={{
          width: 1.5,
          background: 'repeating-linear-gradient(180deg, rgba(255,232,160,0.55) 0 12px, transparent 12px 24px)',
        }}
      />
    )}
  </div>
);

// 一个浮在精灵上方的文字/徽标标签
export const SceneLabel: React.FC<{
  x: number; y: number;
  children: React.ReactNode;
  tone?: 'normal' | 'alarm' | 'warn';
  className?: string;
  z?: number;
}> = ({ x, y, children, tone = 'normal', className = '', z = 60 }) => {
  const color = tone === 'alarm' ? 'rgba(80,20,20,0.92)' : tone === 'warn' ? 'rgba(80,60,16,0.92)' : 'rgba(8,28,58,0.92)';
  const border = tone === 'alarm' ? '#ef5a4a' : tone === 'warn' ? '#f5b963' : '#3f86c8';
  const text = tone === 'alarm' ? '#ffe4df' : tone === 'warn' ? '#fff0d4' : '#cfe5ff';
  return (
    <div
      className={`pointer-events-none absolute -translate-x-1/2 rounded border px-2 py-1 text-[11px] font-semibold whitespace-nowrap ${className}`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        background: color,
        borderColor: border,
        color: text,
        boxShadow: tone === 'alarm' ? `0 0 12px ${border}55` : undefined,
        zIndex: z,
      }}
    >
      {children}
    </div>
  );
};

// 告警脉冲圈（围绕一个精灵）
export const SceneAlarmPulse: React.FC<{ x: number; y: number; size: number; z?: number }> = ({ x, y, size, z = 50 }) => (
  <div
    className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
    style={{
      left: `${x}%`,
      top: `${y}%`,
      width: `${size}%`,
      aspectRatio: '1 / 1',
      border: '2px solid #ef5a4a',
      animation: 'dtPulse 2.4s ease-out infinite',
      zIndex: z,
    }}
  />
);
