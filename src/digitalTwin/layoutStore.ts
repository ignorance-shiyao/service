// 数字孪生场景布局：用户自定义版本（持久化到 localStorage）
// 编辑器和运行时视图都从这里读取覆盖配置

import { AssetKey } from './sceneAssets';
import { loadCustomAssets } from './customAssets';
import {
  FOLDER_PALETTE_GROUPS,
  FOLDER_SCENE_DEFAULT_BG,
  FOLDER_SCENE_LAYOUTS,
  FOLDER_SCENE_NAMES,
  FolderSceneId,
} from './svgSceneRegistry';

export type SceneId = 'overview' | 'line1' | 'idc3' | 'cmpA' | 'agv' | 'vision' | 'office' | FolderSceneId;

export interface SceneItem {
  id: string;          // 唯一 ID
  asset: AssetKey;     // 资源名（内置 ASSETS 或自定义素材 key）
  cx: number;          // 中心 x（%）
  cy: number;          // 中心 y（%）
  w: number;           // 宽度（%）
  h?: number;          // 高度（%）- 不设则按资源原始比例自动
  lockAspect?: boolean;// 是否锁定宽高比（默认 true）
  sx?: 1 | -1;         // 水平翻转（旧字段，等价于 yaw=180，保留兼容）
  sy?: 1 | -1;         // 垂直翻转
  rotate?: number;     // 平面 Z 轴旋转角度 (-180~180)
  yaw?: number;        // 水平 Y 轴 360° 无极旋转 (-180~180)
  pitch?: number;      // X 轴 360° 无极旋转（前后俯仰，-180~180）
  opacity?: number;    // 透明度 0~1（默认 1）
  hidden?: boolean;    // 是否隐藏（不在运行时渲染，编辑器内半透明显示）
  locked?: boolean;    // 是否锁定（编辑器中不能拖拽/缩放/旋转）
  filter?: string;     // CSS filter（着色/告警等）
  label?: string;      // 浮窗标签
  zone?: string;       // 点击下钻到的 zone（仅 overview 场景使用）
  drillTargets?: string[]; // 客户侧树形选择的下钻目标，兼容 zone
  alarm?: boolean;     // 是否告警状态
  tone?: 'normal' | 'warn' | 'alarm';
  anchorBottom?: boolean;
  /** 2.5D 深度（px） */
  zOffset?: number;
}

export interface SceneLayout {
  sceneId: SceneId;
  /** 底图（若不指定则用场景默认） */
  baseMap?: string;
  /** 底图平面旋转角度（度） */
  baseMapRotate?: number;
  /** 底图缩放 */
  baseMapScale?: number;
  /** 底图平移 X（%） */
  baseMapOffsetX?: number;
  /** 底图平移 Y（%） */
  baseMapOffsetY?: number;
  /** 2.5D 相机：场景偏航（Y） */
  cameraYaw?: number;
  /** 2.5D 相机：场景俯仰（X） */
  cameraPitch?: number;
  /** 2.5D 相机：场景缩放 */
  cameraScale?: number;
  /** 2.5D 相机：透视距离（px） */
  cameraPerspective?: number;
  /** 2.5D 相机：水平平移（%） */
  cameraOffsetX?: number;
  /** 2.5D 相机：垂直平移（%） */
  cameraOffsetY?: number;
  /** 场景画布的设计宽高（保持比例用） */
  width: number;
  height: number;
  items: SceneItem[];
}

const KEY = (sceneId: SceneId) => `dt-scene:${sceneId}`;
const DEFAULT_KEY = (sceneId: SceneId) => `dt-scene-default:${sceneId}`;
const LEGACY_SCENE_ALIAS: Partial<Record<SceneId, string>> = {
  rack: 'rackInternal',
};

const normalizeLoadedLayout = (layout: SceneLayout, sceneId: SceneId): SceneLayout => ({
  ...layout,
  sceneId,
  items: layout.items.map(item => ({
    ...item,
    id: sceneId === 'rack' ? item.id.replace(/^rackInternal-/, 'rack-') : item.id,
  })),
});

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
  line1:  {
    sceneId: 'line1',
    width: 1200,
    height: 720,
    items: [
      { id: 'line1-floor', asset: 'floorRoomSlab', cx: 50, cy: 66, w: 84, anchorBottom: false, opacity: 0.9 },
      { id: 'line1-cam-1', asset: 'deviceCamera', cx: 12, cy: 15, w: 3.6, label: '摄像头' },
      { id: 'line1-cam-2', asset: 'deviceCamera', cx: 88, cy: 15, w: 3.6, label: '摄像头' },
      { id: 'line1-door', asset: 'doorDouble', cx: 8.5, cy: 84, w: 4, label: '物料入口（卷帘门）' },
      { id: 'line1-conveyor', asset: 'workshopConveyor', cx: 55, cy: 48, w: 68, label: '主装配线传送带' },
      { id: 'line1-arm-a', asset: 'workshopRobotArm', cx: 22, cy: 52, w: 9, label: '上料机械臂' },
      { id: 'line1-cnc-a', asset: 'workshopCNC', cx: 40, cy: 54, w: 11, label: 'CNC 数控机床 A' },
      { id: 'line1-cnc-b', asset: 'workshopCNC', cx: 56, cy: 54, w: 11, label: 'CNC 数控机床 B' },
      { id: 'line1-assembly-main', asset: 'workshopAssembly', cx: 72, cy: 54, w: 10, label: '装配工位' },
      { id: 'line1-arm-b', asset: 'workshopRobotArm', cx: 86, cy: 52, w: 9, label: '下料机械臂' },
      { id: 'line1-ctrl-main', asset: 'workshopCtrlCab', cx: 20, cy: 82, w: 4, label: '车间主控柜' },
      { id: 'line1-pack-1', asset: 'workshopAssembly', cx: 32, cy: 82, w: 8, label: '包装工位 1' },
      { id: 'line1-pack-2', asset: 'workshopAssembly', cx: 46, cy: 82, w: 8, label: '包装工位 2' },
      { id: 'line1-pack-3', asset: 'workshopAssembly', cx: 60, cy: 82, w: 8, label: '包装工位 3' },
      { id: 'line1-plc', asset: 'workshopCtrlCab', cx: 72, cy: 82, w: 4, label: 'PLC 柜' },
      { id: 'line1-agv', asset: 'deviceAgv', cx: 84, cy: 82, w: 9, label: '出货 AGV' },
      { id: 'line1-fence', asset: 'workshopFence', cx: 55, cy: 72, w: 66, anchorBottom: false, opacity: 0.5 },
    ],
  },
  idc3:   {
    sceneId: 'idc3',
    baseMap: '/svg/idc/layer_base_empty_room.svg',
    width: 1672,
    height: 941,
    items: [
      // 四排机柜（参考图）
      { id: 'idc3-rack-1', asset: 'idcRackRow', cx: 36.78, cy: 80.77, w: 13.16, label: '机柜排1' },
      { id: 'idc3-rack-2', asset: 'idcRackRow', cx: 50.54, cy: 80.77, w: 13.16, label: '机柜排2' },
      { id: 'idc3-rack-3', asset: 'idcRackRow', cx: 65.19, cy: 80.45, w: 13.16, label: '机柜排3' },
      { id: 'idc3-rack-4', asset: 'idcRackRow', cx: 78.65, cy: 80.45, w: 13.16, label: '机柜排4' },
      // 列间空调（冷/热通道中）
      { id: 'idc3-inrow-cold', asset: 'idcInrowAc', cx: 42.73, cy: 62.70, w: 6.28, label: '列间空调-冷通道' },
      { id: 'idc3-inrow-hot', asset: 'idcInrowAc', cx: 69.35, cy: 62.70, w: 6.28, label: '列间空调-热通道', tone: 'warn' },
      // 左侧 UPS 区
      { id: 'idc3-ups-main', asset: 'idcUpsMain', cx: 10.47, cy: 81.30, w: 12.56, label: 'UPS主机' },
      { id: 'idc3-battery', asset: 'idcBatteryCab', cx: 20.33, cy: 81.30, w: 12.56, label: '电池柜' },
      { id: 'idc3-aux-left', asset: 'idcAtsCab', cx: 16.00, cy: 50.05, w: 10.47, label: '辅助电气柜' },
      // 左上配电
      { id: 'idc3-power', asset: 'idcPowerCab', cx: 27.96, cy: 39.85, w: 12.86, label: '配电柜' },
      // 右上精密空调 / 右下灭火
      { id: 'idc3-precision', asset: 'idcPrecisionAc', cx: 83.73, cy: 42.51, w: 12.56, label: '精密空调' },
      { id: 'idc3-fire', asset: 'idcFireCyl', cx: 91.06, cy: 82.36, w: 8.67, label: '气体灭火钢瓶' },
      // 传感器
      { id: 'idc3-smoke-1', asset: 'idcSmokeSensor', cx: 46.53, cy: 20.30, w: 2.69, label: '烟感1' },
      { id: 'idc3-smoke-2', asset: 'idcSmokeSensor', cx: 64.77, cy: 20.30, w: 2.69, label: '烟感2' },
      { id: 'idc3-temp-hum', asset: 'idcTempHumSensor', cx: 90.91, cy: 47.82, w: 2.99, label: '温湿度传感器' },
      { id: 'idc3-water', asset: 'idcWaterLeakSensor', cx: 32.30, cy: 91.29, w: 4.19, h: 2.6, anchorBottom: false, label: '水浸传感器' },
    ],
  },
  cmpA:   {
    sceneId: 'cmpA',
    baseMap: '/svg/idc/layer_base_empty_room.svg',
    width: 1672,
    height: 941,
    items: [
      { id: 'cmpA-rack-1', asset: 'idcRackRow', cx: 36.78, cy: 80.77, w: 13.16, label: '机柜排1' },
      { id: 'cmpA-rack-2', asset: 'idcRackRow', cx: 50.54, cy: 80.77, w: 13.16, label: '机柜排2' },
      { id: 'cmpA-rack-3', asset: 'idcRackRow', cx: 65.19, cy: 80.45, w: 13.16, label: '机柜排3', tone: 'warn' },
      { id: 'cmpA-rack-4', asset: 'idcRackRow', cx: 78.65, cy: 80.45, w: 13.16, label: '机柜排4' },
      { id: 'cmpA-inrow-cold', asset: 'idcInrowAc', cx: 42.73, cy: 62.70, w: 6.28, label: '列间空调-冷通道' },
      { id: 'cmpA-inrow-hot', asset: 'idcInrowAc', cx: 69.35, cy: 62.70, w: 6.28, label: '列间空调-热通道', tone: 'alarm' },
      { id: 'cmpA-ups-main', asset: 'idcUpsMain', cx: 10.47, cy: 81.30, w: 12.56, label: 'UPS主机' },
      { id: 'cmpA-battery', asset: 'idcBatteryCab', cx: 20.33, cy: 81.30, w: 12.56, label: '电池柜' },
      { id: 'cmpA-aux-left', asset: 'idcAtsCab', cx: 16.00, cy: 50.05, w: 10.47, label: '辅助电气柜' },
      { id: 'cmpA-power', asset: 'idcPowerCab', cx: 27.96, cy: 39.85, w: 12.86, label: '配电柜' },
      { id: 'cmpA-precision', asset: 'idcPrecisionAc', cx: 83.73, cy: 42.51, w: 12.56, label: '精密空调', tone: 'warn' },
      { id: 'cmpA-fire', asset: 'idcFireCyl', cx: 91.06, cy: 82.36, w: 8.67, label: '气体灭火钢瓶' },
      { id: 'cmpA-smoke-1', asset: 'idcSmokeSensor', cx: 46.53, cy: 20.30, w: 2.69, label: '烟感1' },
      { id: 'cmpA-smoke-2', asset: 'idcSmokeSensor', cx: 64.77, cy: 20.30, w: 2.69, label: '烟感2' },
      { id: 'cmpA-temp-hum', asset: 'idcTempHumSensor', cx: 90.91, cy: 47.82, w: 2.99, label: '温湿度传感器' },
      { id: 'cmpA-water', asset: 'idcWaterLeakSensor', cx: 32.30, cy: 91.29, w: 4.19, h: 2.6, anchorBottom: false, label: '水浸传感器' },
    ],
  },
  agv:    {
    sceneId: 'agv',
    width: 1200,
    height: 700,
    items: [
      { id: 'agv-floor', asset: 'floorRoomSlab', cx: 50, cy: 62, w: 92, anchorBottom: false },
      { id: 'agv-charge-a', asset: 'parkEvCharger', cx: 30, cy: 38, w: 22, label: '充电桩 A' },
      { id: 'agv-charge-b', asset: 'parkEvCharger', cx: 70, cy: 38, w: 22, label: '充电桩 B' },
      { id: 'agv-01', asset: 'deviceAgv', cx: 15, cy: 78, w: 8, label: 'AGV-01' },
      { id: 'agv-02', asset: 'deviceAgv', cx: 30, cy: 82, w: 8, label: 'AGV-02' },
      { id: 'agv-03', asset: 'deviceAgv', cx: 45, cy: 78, w: 8, label: 'AGV-03' },
      { id: 'agv-04', asset: 'deviceAgv', cx: 60, cy: 82, w: 8, label: 'AGV-04（告警）', tone: 'warn', filter: 'drop-shadow(0 0 6px rgba(255,180,114,0.55))' },
      { id: 'agv-05', asset: 'deviceAgv', cx: 75, cy: 78, w: 8, label: 'AGV-05' },
      { id: 'agv-06', asset: 'deviceAgv', cx: 88, cy: 82, w: 8, label: 'AGV-06' },
      { id: 'agv-ctrl', asset: 'workshopCtrlCab', cx: 6, cy: 58, w: 5, label: '调度控制柜' },
      { id: 'agv-cam', asset: 'deviceCamera', cx: 94, cy: 20, w: 4.5, label: '监控摄像头' },
    ],
  },
  vision: {
    sceneId: 'vision',
    width: 1200,
    height: 700,
    items: [
      { id: 'vision-floor', asset: 'floorRoomSlab', cx: 50, cy: 62, w: 92, anchorBottom: false },
      { id: 'vision-conveyor', asset: 'workshopConveyor', cx: 50, cy: 42, w: 72, label: '检测传送带' },
      { id: 'vision-ws-01', asset: 'workstationVision', cx: 18, cy: 82, w: 7, label: '视觉工位-01' },
      { id: 'vision-ws-02', asset: 'workstationVision', cx: 33, cy: 82, w: 7, label: '视觉工位-02', tone: 'alarm', filter: 'drop-shadow(0 0 6px rgba(239,90,74,0.65))' },
      { id: 'vision-ws-03', asset: 'workstationVision', cx: 50, cy: 82, w: 7, label: '视觉工位-03' },
      { id: 'vision-ws-04', asset: 'workstationVision', cx: 67, cy: 82, w: 7, label: '视觉工位-04', tone: 'alarm', filter: 'drop-shadow(0 0 6px rgba(239,90,74,0.65))' },
      { id: 'vision-ws-05', asset: 'workstationVision', cx: 82, cy: 82, w: 7, label: '视觉工位-05' },
      { id: 'vision-ctrl-l', asset: 'workshopCtrlCab', cx: 6, cy: 58, w: 5, label: '视觉控制柜' },
      { id: 'vision-ctrl-r', asset: 'workshopCtrlCab', cx: 94, cy: 58, w: 5, label: '视觉控制柜' },
    ],
  },
  office: {
    sceneId: 'office',
    width: 1200,
    height: 700,
    items: [
      { id: 'office-floor', asset: 'floorRoomSlab', cx: 50, cy: 62, w: 92, anchorBottom: false },
      { id: 'office-partition', asset: 'glassPartition', cx: 50, cy: 42, w: 64, opacity: 0.85, label: '玻璃隔断' },
      { id: 'office-door', asset: 'doorDouble', cx: 50, cy: 62, w: 8, label: '双开门' },
      { id: 'office-switch', asset: 'deviceServer2u', cx: 15, cy: 88, w: 9, label: '办公网汇聚交换机' },
      { id: 'office-pd', asset: 'powerDistribution', cx: 32, cy: 92, w: 6, label: '弱电柜' },
      { id: 'office-ats', asset: 'atsCabinet', cx: 50, cy: 92, w: 6, label: 'ATS' },
      { id: 'office-ups', asset: 'upsMain', cx: 68, cy: 92, w: 5.5, label: '办公网 UPS' },
      { id: 'office-cam', asset: 'deviceCamera', cx: 86, cy: 20, w: 4.5, label: '办公区监控' },
    ],
  },
  ...(FOLDER_SCENE_LAYOUTS as Record<FolderSceneId | 'line1' | 'idc3' | 'cmpA' | 'agv' | 'vision' | 'office', SceneLayout>),
};

export function loadLayout(sceneId: SceneId): SceneLayout {
  try {
    const raw = localStorage.getItem(KEY(sceneId));
    if (raw) return normalizeLoadedLayout(JSON.parse(raw), sceneId);
  } catch {}
  try {
    const rawDefault = localStorage.getItem(DEFAULT_KEY(sceneId));
    if (rawDefault) return normalizeLoadedLayout(JSON.parse(rawDefault), sceneId);
  } catch {}
  const legacySceneId = LEGACY_SCENE_ALIAS[sceneId];
  if (legacySceneId) {
    try {
      const raw = localStorage.getItem(`dt-scene:${legacySceneId}`);
      if (raw) return normalizeLoadedLayout(JSON.parse(raw), sceneId);
    } catch {}
    try {
      const rawDefault = localStorage.getItem(`dt-scene-default:${legacySceneId}`);
      if (rawDefault) return normalizeLoadedLayout(JSON.parse(rawDefault), sceneId);
    } catch {}
  }
  return DEFAULT_LAYOUTS[sceneId];
}

export function saveLayout(layout: SceneLayout) {
  try {
    localStorage.setItem(KEY(layout.sceneId), JSON.stringify(layout));
  } catch {}
}

export function resetLayout(sceneId: SceneId): SceneLayout {
  try { localStorage.removeItem(KEY(sceneId)); } catch {}
  const legacySceneId = LEGACY_SCENE_ALIAS[sceneId];
  if (legacySceneId) {
    try { localStorage.removeItem(`dt-scene:${legacySceneId}`); } catch {}
  }
  try {
    const rawDefault = localStorage.getItem(DEFAULT_KEY(sceneId));
    if (rawDefault) return normalizeLoadedLayout(JSON.parse(rawDefault), sceneId);
  } catch {}
  return DEFAULT_LAYOUTS[sceneId];
}

export function resetToBundledLayout(sceneId: SceneId): SceneLayout {
  try { localStorage.removeItem(KEY(sceneId)); } catch {}
  try { localStorage.removeItem(DEFAULT_KEY(sceneId)); } catch {}
  const legacySceneId = LEGACY_SCENE_ALIAS[sceneId];
  if (legacySceneId) {
    try { localStorage.removeItem(`dt-scene:${legacySceneId}`); } catch {}
    try { localStorage.removeItem(`dt-scene-default:${legacySceneId}`); } catch {}
  }
  return DEFAULT_LAYOUTS[sceneId];
}

export function setLayoutAsDefault(layout: SceneLayout) {
  try {
    localStorage.setItem(DEFAULT_KEY(layout.sceneId), JSON.stringify(layout));
  } catch {}
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
  ...(FOLDER_PALETTE_GROUPS as { title: string; items: { key: AssetKey; name: string }[] }[]),
];

export function getPaletteGroups(): { title: string; items: { key: AssetKey; name: string; custom?: boolean; filename?: string }[] }[] {
  const customByGroup = new Map<string, { key: AssetKey; name: string; custom: true; filename: string }[]>();
  loadCustomAssets().forEach(asset => {
    const group = asset.group || '自定义素材';
    const items = customByGroup.get(group) || [];
    items.push({ key: asset.key, name: asset.name, custom: true, filename: asset.filename });
    customByGroup.set(group, items);
  });

  return [
    ...PALETTE_GROUPS,
    ...Array.from(customByGroup.entries()).map(([title, items]) => ({ title, items })),
  ];
}

// 用于编辑器/标签：场景名映射
export const SCENE_NAMES: Record<SceneId, string> = {
  overview: '园区总览',
  line1:    '生产厂房',
  idc3:     '3号机房 B区',
  cmpA:     '能源区',
  agv:      'AGV调度区',
  vision:   '视觉检测区',
  office:   '办公楼',
  ...FOLDER_SCENE_NAMES,
};

export const SCENE_DEFAULT_BG: Record<SceneId, string> = {
  overview: '/svg/sim_park_base_map_no_buildings.svg',
  line1:    '', // 视图自带渐变
  idc3:     '',
  cmpA:     '',
  agv:      '',
  vision:   '',
  office:   '',
  ...FOLDER_SCENE_DEFAULT_BG,
};

let _idCounter = 0;
export function newItemId() {
  _idCounter += 1;
  return `item-${Date.now().toString(36)}-${_idCounter}`;
}
