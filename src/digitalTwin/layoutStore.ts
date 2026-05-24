// 数字孪生场景布局：用户自定义版本（持久化到 localStorage）
// 编辑器和运行时视图都从这里读取覆盖配置

import { ASSETS, AssetKey } from './sceneAssets';

export type SceneId = 'overview' | 'line1' | 'idc3' | 'cmpA' | 'agv' | 'vision' | 'office';

export interface SceneItem {
  id: string;          // 唯一 ID
  asset: AssetKey;     // 资源名（必须在 ASSETS 中）
  cx: number;          // 中心 x（%）
  cy: number;          // 中心 y（%）
  w: number;           // 宽度（%）
  sx?: 1 | -1;         // 水平翻转（旧字段，等价于 yaw=180，保留兼容）
  rotate?: number;     // 平面 Z 轴旋转角度 (-180~180)
  yaw?: number;        // 水平 Y 轴 360° 无极旋转 (-180~180)
  pitch?: number;      // X 轴 360° 无极旋转（前后俯仰，-180~180）
  filter?: string;     // CSS filter（着色/告警等）
  label?: string;      // 浮窗标签
  zone?: string;       // 点击下钻到的 zone（仅 overview 场景使用）
  alarm?: boolean;     // 是否告警状态
  tone?: 'normal' | 'warn' | 'alarm';
  anchorBottom?: boolean;
}

export interface SceneLayout {
  sceneId: SceneId;
  /** 底图（若不指定则用场景默认） */
  baseMap?: string;
  /** 场景画布的设计宽高（保持比例用） */
  width: number;
  height: number;
  items: SceneItem[];
}

const KEY = (sceneId: SceneId) => `dt-scene:${sceneId}`;

// ── 默认布局：从原 OverviewView 抽取出来 ───────────────────────────────
export const DEFAULT_LAYOUTS: Record<SceneId, SceneLayout> = {
  overview: {
    sceneId: 'overview',
    baseMap: '/svg/sim_park_base_map_no_buildings.svg',
    width: 1672,
    height: 941,
    items: [
      { id: 'line1',  asset: 'parkFactory',    cx: 22, cy: 30, w: 24, zone: 'line1',  label: '生产厂房 · 健康 95.1' },
      { id: 'idc3',   asset: 'zoneDatacenter', cx: 55, cy: 28, w: 23, zone: 'idc3',   label: '3号机房 · 告警 3 · 健康 68.3', tone: 'alarm', alarm: true, filter: 'hue-rotate(-30deg) saturate(1.2) drop-shadow(0 0 16px rgba(239,90,74,0.45))' },
      { id: 'cmpA',   asset: 'parkSubstation', cx: 85, cy: 36, w: 16, zone: 'cmpA',   label: '能源区 · 告警 1', tone: 'warn' },
      { id: 'agv',    asset: 'parkLoadingDock', cx: 30, cy: 60, w: 22, zone: 'agv',    label: '物流装卸区 · 健康 85.2' },
      { id: 'vision', asset: 'parkChiller',     cx: 83, cy: 58, w: 17, zone: 'vision', label: '冷却区 · 健康 96.8' },
      { id: 'ev',     asset: 'parkEvCharger',   cx: 22, cy: 88, w: 20 },
      { id: 'gate',   asset: 'parkGate',        cx: 46, cy: 93, w: 8,  label: '主入口' },
      { id: 'office', asset: 'parkOffice',      cx: 65, cy: 82, w: 24, zone: 'office', label: '办公楼 · 健康 97.3' },
    ],
  },
  // 其它场景留空，编辑器里可以新建
  line1:  { sceneId: 'line1',  width: 1200, height: 720, items: [] },
  idc3:   { sceneId: 'idc3',   width: 1200, height: 720, items: [] },
  cmpA:   { sceneId: 'cmpA',   width: 1200, height: 720, items: [] },
  agv:    { sceneId: 'agv',    width: 1200, height: 720, items: [] },
  vision: { sceneId: 'vision', width: 1200, height: 720, items: [] },
  office: { sceneId: 'office', width: 1200, height: 720, items: [] },
};

export function loadLayout(sceneId: SceneId): SceneLayout {
  try {
    const raw = localStorage.getItem(KEY(sceneId));
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_LAYOUTS[sceneId];
}

export function saveLayout(layout: SceneLayout) {
  try {
    localStorage.setItem(KEY(layout.sceneId), JSON.stringify(layout));
  } catch {}
}

export function resetLayout(sceneId: SceneId): SceneLayout {
  try { localStorage.removeItem(KEY(sceneId)); } catch {}
  return DEFAULT_LAYOUTS[sceneId];
}

// 资源面板：可拖入的素材库
export const PALETTE_GROUPS: { title: string; items: { key: AssetKey; name: string }[] }[] = [
  {
    title: '园区建筑',
    items: [
      { key: 'parkFactory',     name: '生产厂房' },
      { key: 'zoneDatacenter',  name: '机房' },
      { key: 'parkOffice',      name: '办公楼' },
      { key: 'parkSubstation',  name: '变电站' },
      { key: 'parkChiller',     name: '冷却塔' },
      { key: 'parkLoadingDock', name: '物流装卸' },
      { key: 'parkEvCharger',   name: 'EV停车场' },
      { key: 'parkGate',        name: '安保门岗' },
      { key: 'zoneFactory',     name: '车间模块' },
    ],
  },
  {
    title: '车间设备',
    items: [
      { key: 'workshopConveyor',  name: '传送带' },
      { key: 'workshopRobotArm',  name: '机械臂' },
      { key: 'workshopCNC',       name: 'CNC' },
      { key: 'workshopAssembly',  name: '装配工位' },
      { key: 'workshopFence',     name: '安全栏' },
      { key: 'workshopCtrlCab',   name: '控制柜' },
      { key: 'workstationVision', name: '视觉工位' },
      { key: 'deviceAgv',         name: 'AGV' },
      { key: 'deviceCamera',      name: '摄像头' },
    ],
  },
  {
    title: '机房基础设施',
    items: [
      { key: 'rackRow',          name: '机柜行' },
      { key: 'rackSingle',       name: '单机柜' },
      { key: 'acInrow',          name: '行内空调' },
      { key: 'acRoomPrecision',  name: '精密空调' },
      { key: 'devicePrecisionAcW', name: '精密空调(告警)' },
      { key: 'atsCabinet',       name: 'ATS' },
      { key: 'upsMain',          name: 'UPS主机' },
      { key: 'upsBattery',       name: '电池柜' },
      { key: 'pduStrip',         name: 'PDU' },
      { key: 'powerDistribution', name: '配电柜' },
      { key: 'fireCylinders',    name: '气体灭火' },
      { key: 'cableTray',        name: '桥架' },
      { key: 'deviceServer2u',   name: '2U 服务器' },
    ],
  },
  {
    title: '环境/结构',
    items: [
      { key: 'floorRaisedTile', name: '机房地板' },
      { key: 'floorRoomSlab',   name: '室内地坪' },
      { key: 'doorDouble',      name: '双开门' },
      { key: 'glassPartition',  name: '玻璃隔断' },
    ],
  },
];

// 用于编辑器/标签：场景名映射
export const SCENE_NAMES: Record<SceneId, string> = {
  overview: '园区总览',
  line1:    '生产厂房',
  idc3:     '3号机房 B区',
  cmpA:     '能源区',
  agv:      '物流装卸区',
  vision:   '冷却区',
  office:   '办公楼',
};

export const SCENE_DEFAULT_BG: Record<SceneId, string> = {
  overview: '/svg/sim_park_base_map_no_buildings.svg',
  line1:    '', // 视图自带渐变
  idc3:     '',
  cmpA:     '',
  agv:      '',
  vision:   '',
  office:   '',
};

let _idCounter = 0;
export function newItemId() {
  _idCounter += 1;
  return `item-${Date.now().toString(36)}-${_idCounter}`;
}
