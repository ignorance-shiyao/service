// 数字孪生大屏共享数据

export type AlarmLevel = 'critical' | 'warning' | 'info';

export interface AlarmItem {
  id: string;
  level: AlarmLevel;
  time: string;
  title: string;
  scope: string;
}

export const CURRENT_ALARMS: AlarmItem[] = [
  {
    id: 'a-001',
    level: 'critical',
    time: '14:28:19',
    title: 'SW-A-01 接入交换机离线',
    scope: 'A区视觉检测工位 / 8台终端',
  },
  {
    id: 'a-002',
    level: 'warning',
    time: '14:22:47',
    title: 'B03机柜温度偏高',
    scope: '3号机房B区',
  },
  {
    id: 'a-003',
    level: 'info',
    time: '14:18:03',
    title: '链路利用率超过80%',
    scope: '算力模块A - 核心交换机',
  },
];

export const ASSET_OVERVIEW = {
  totalDevices: 286,
  online: 273,
  alarming: 9,
  offline: 4,
  racks: 38,
  bizSystems: 12,
};

export const BUSINESS_SYSTEMS: { name: string; status: '正常' | '受影响' | '降级' }[] = [
  { name: 'MES', status: '正常' },
  { name: '视频监控', status: '受影响' },
  { name: 'AGV调度', status: '降级' },
  { name: '视觉检测', status: '受影响' },
  { name: '办公网', status: '正常' },
];

export const AREAS = [
  { id: 'line1', name: '1号产线', health: 95.1, alarms: 0, devices: 68 },
  { id: 'idc3', name: '3号机房', health: 68.3, alarms: 3, devices: 86, highlight: true },
  { id: 'cmpA', name: '算力模块A', health: 96.8, alarms: 0, devices: 48 },
  { id: 'agv', name: 'AGV调度区', health: 85.2, alarms: 1, devices: 32 },
  { id: 'vision', name: '视觉检测区', health: 78.6, alarms: 2, devices: 28 },
  { id: 'office', name: '办公网区', health: 97.3, alarms: 0, devices: 24 },
];

// 24小时告警柱状图样本
export const ALARM_HISTORY_24H = {
  hours: ['14:30', '18:30', '22:30', '02:30', '06:30', '10:30', '14:30'],
  // 每个时间点近似的三级数值
  critical: [2, 3, 1, 5, 6, 2, 3],
  warning: [6, 9, 8, 10, 14, 11, 8],
  info: [4, 6, 7, 9, 17, 8, 6],
};

// B区设备分类
export const B_AREA_CATEGORIES = [
  { name: '交换机', count: 18, alarm: 1 },
  { name: '服务器', count: 42, alarm: 0 },
  { name: 'PLC', count: 16, alarm: 0 },
  { name: '摄像头', count: 64, alarm: 4 },
  { name: 'UPS', count: 4, alarm: 0 },
  { name: '空调', count: 6, alarm: 1 },
];

export const B_AREA_KPIS = [
  { label: '网络平均时延', value: '18', unit: 'ms' },
  { label: '丢包率', value: '1.8', unit: '%' },
  { label: '核心链路利用率', value: '83', unit: '%' },
  { label: '机房温度', value: '29.6', unit: '°C' },
  { label: '当前功耗', value: '42', unit: 'kW' },
];

export const B_AREA_ENV = [
  { name: '温度', status: '偏高', critical: true },
  { name: '湿度', status: '正常', critical: false },
  { name: '烟感', status: '正常', critical: false },
  { name: '水浸', status: '正常', critical: false },
  { name: 'UPS', status: '正常', critical: false },
  { name: '空调', status: '告警', critical: true },
];

// 机柜内U位布局（自顶向下）
export const RACK_LAYOUT = [
  { u: '30-32U', name: '配线架', status: 'normal' as const },
  { u: '26-28U', name: '核心接入交换机', status: 'normal' as const },
  { u: '24U', name: 'SW-B03-01', status: 'critical' as const, selected: true },
  { u: '22U', name: '应用服务器-01', status: 'normal' as const },
  { u: '18-20U', name: '应用服务器-02', status: 'normal' as const },
  { u: '14-16U', name: '视觉检测服务器', status: 'warning' as const },
  { u: '12U', name: 'UPS模块', status: 'warning' as const },
  { u: '8-10U', name: '空闲位', status: 'idle' as const },
  { u: '6U', name: '空闲位', status: 'idle' as const },
  { u: '4U', name: '空闲位', status: 'idle' as const },
  { u: '1-2U', name: '空闲位', status: 'idle' as const },
];

export const RACK_DETAIL = {
  name: 'SW-B03-01',
  type: '接入交换机',
  ip: '192.168.10.21',
  status: '离线',
  rack: 'B03',
  attached: 8,
  bizScope: '视觉检测、AGV调度',
};

// 拓扑节点 / 链路
export const TOPO_NODES = {
  core: { id: 'core', name: '核心交换机 Core-01', status: 'normal' as const },
  agg: [
    { id: 'agg-01', name: '汇聚交换机 AGG-01', status: 'normal' as const },
    { id: 'agg-02', name: '汇聚交换机 AGG-02', status: 'normal' as const },
  ],
  access: [
    { id: 'sw-a-01', name: 'SW-A-01', status: 'critical' as const },
    { id: 'sw-b03-01', name: 'SW-B03-01', status: 'normal' as const },
    { id: 'sw-c-02', name: 'SW-C-02', status: 'normal' as const },
    { id: 'sw-d-04', name: 'SW-D-04', status: 'normal' as const },
  ],
  terminal: [
    { id: 't-server', name: '服务器', icon: 'server' },
    { id: 't-plc', name: 'PLC', icon: 'plc' },
    { id: 't-camera', name: '摄像头', icon: 'camera' },
    { id: 't-agv', name: 'AGV', icon: 'agv' },
    { id: 't-vision', name: '视觉检测终端', icon: 'vision', alarm: true },
    { id: 't-office', name: '办公终端', icon: 'office' },
  ],
};

// 推演时间轴
export const DEDUCE_TIMELINE = [
  { time: '14:30', title: '故障发生', desc: 'SW-A-01 离线', status: 'critical' as const },
  { time: '14:35', title: '终端离线', desc: '8台终端受影响', status: 'critical' as const },
  { time: '14:45', title: '业务降级', desc: '3项业务降级运行', status: 'warning' as const },
  { time: '15:00', title: '备用链路恢复', desc: '影响逐步消除', status: 'recovered' as const },
];

export const DEDUCE_PLANS = [
  { id: 'A', name: '方案A', method: '切换备用链路', eta: '15 分钟', risk: '低' as const },
  { id: 'B', name: '方案B', method: '现场更换光模块', eta: '45 分钟', risk: '中' as const },
  { id: 'C', name: '方案C', method: '人工旁路', eta: '30 分钟', risk: '中' as const },
];
