import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Building2, KeyRound, Link2, PlugZap, Server, ShieldCheck, Timer } from 'lucide-react';
import { BaseChart } from '../components/BaseChart';
import { Select } from '../components/UI';

type MapTab = 'map' | 'topology';
type PerfTab = 'latency' | 'loss' | 'jitter' | 'throughput';
type TopTab = 'bandwidth' | 'device' | 'key';
type AlarmOverviewTab = 'level' | 'realtime';
type AlarmAnalysisTab = 'reason' | 'highfreq';
type AlarmTrendTab = 'history' | 'keyUpdate';
type AutoPlayConfig = { enabled: boolean; intervalSec: number };

type SitePoint = {
  name: string;
  x: number;
  y: number;
  count: number;
  status: 'online' | 'warning' | 'offline';
  quantum: boolean;
  type: 'CPE' | 'POP';
  model: string;
  tunnels: number;
};
type CityAnchor = {
  name: string;
  cx: number;
  cy: number;
  bbox: { x: number; y: number; width: number; height: number };
};
type MapViewBox = { x: number; y: number; width: number; height: number };
type HoveredSiteState = {
  site: SitePoint;
  x: number;
  y: number;
};

const panelClass =
  'bg-[var(--comp-panel-background)]/96 border border-[var(--comp-panel-border)] rounded-md p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] h-full flex flex-col min-h-0 overflow-hidden';

const COLOR_STATE_SUCCESS = 'var(--sys-state-success)';
const COLOR_STATE_WARNING = 'var(--sys-state-warning)';
const COLOR_STATE_DANGER = 'var(--sys-state-danger)';
const COLOR_STATE_INFO = 'var(--sys-state-info)';
const COLOR_STATE_QUANTUM = 'var(--sys-state-quantum)';
const COLOR_FLYLINE_NORMAL = 'var(--biz-map-flyline-normal)';
const COLOR_FLYLINE_QUANTUM = 'var(--biz-map-flyline-quantum)';
const COLOR_CITY_FILL = 'var(--biz-map-city-fill-default)';
const COLOR_CITY_FILL_HOVER = 'var(--biz-map-city-fill-hover)';
const COLOR_CITY_STROKE = 'var(--biz-map-city-stroke-default)';
const COLOR_CITY_STROKE_HOVER = 'var(--biz-map-city-stroke-hover)';

const sectionTitle = (title: string) => (
  <div className="mb-1 flex items-center border-b border-[var(--comp-panel-border)] pb-1 text-[var(--comp-panel-title)] shrink-0">
    <span className="mr-2 text-[var(--comp-panel-title-accent)]">|</span>
    <span className="whitespace-nowrap text-[clamp(12px,0.92vw,14px)] font-semibold tracking-wide">{title}</span>
  </div>
);

const sectionTitleInline = (
  title: string,
  tabs?: React.ReactNode,
  controls?: React.ReactNode
) => (
  <div className="mb-1 flex items-center justify-between gap-2 border-b border-[var(--comp-panel-border)] pb-1 text-[var(--comp-panel-title)] shrink-0">
    <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
      <span className="text-[var(--comp-panel-title-accent)]">|</span>
      <span className="shrink-0 whitespace-nowrap text-[clamp(12px,0.92vw,14px)] font-semibold tracking-wide">{title}</span>
      {tabs}
    </div>
    {controls}
  </div>
);

const tabClass = (active: boolean) =>
  `relative inline-flex items-center whitespace-nowrap rounded-full px-1.5 py-0.5 text-[clamp(10px,0.72vw,11px)] transition ${
    active ? 'bg-[var(--comp-panel-tab-active-bg)] text-[var(--sys-state-info)]' : 'text-[var(--comp-panel-tab-text)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--comp-panel-title)]'
  }`;

const buildMapPoints = (): SitePoint[] => {
  let state = 20260423 >>> 0;
  const rng = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const anhuiCities = [
    '合肥',
    '芜湖',
    '蚌埠',
    '淮南',
    '马鞍山',
    '淮北',
    '铜陵',
    '安庆',
    '黄山',
    '滁州',
    '阜阳',
    '宿州',
    '六安',
    '亳州',
    '池州',
    '宣城',
  ];
  const cityCoords: Record<string, { x: number; y: number }> = {
    合肥: { x: 56, y: 52 },
    芜湖: { x: 67, y: 64 },
    蚌埠: { x: 56, y: 33 },
    淮南: { x: 49, y: 45 },
    马鞍山: { x: 78, y: 61 },
    淮北: { x: 52, y: 20 },
    铜陵: { x: 57, y: 75 },
    安庆: { x: 36, y: 71 },
    黄山: { x: 66, y: 88 },
    滁州: { x: 66, y: 45 },
    阜阳: { x: 27, y: 43 },
    宿州: { x: 62, y: 28 },
    六安: { x: 36, y: 62 },
    亳州: { x: 20, y: 30 },
    池州: { x: 56, y: 84 },
    宣城: { x: 73, y: 81 },
  };

  const targetTotal = 640;
  const baseEach = 12;
  const weights = anhuiCities.map((name) => {
    const w = 0.9 + rng() * 1.05;
    return name === '合肥' ? w * 2.8 : w;
  });
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const remainder = targetTotal - baseEach * anhuiCities.length;
  const counts = anhuiCities.map((_, i) => baseEach + Math.round((remainder * weights[i]) / weightSum));
  let diff = targetTotal - counts.reduce((a, b) => a + b, 0);
  while (diff !== 0) {
    const idx = diff > 0 ? 0 : counts.findIndex((c, i) => c > 8 && i !== 0);
    const safeIdx = idx >= 0 ? idx : 1;
    counts[safeIdx] += diff > 0 ? 1 : -1;
    diff += diff > 0 ? -1 : 1;
  }

  return anhuiCities.map((name, i) => {
    const statusRoll = rng();
    const status: SitePoint['status'] = statusRoll < 0.08 ? 'offline' : statusRoll < 0.25 ? 'warning' : 'online';
    const quantum = name === '合肥' ? true : rng() > 0.46;
    const count = counts[i];
    return {
      name,
      x: cityCoords[name]?.x ?? 50,
      y: cityCoords[name]?.y ?? 50,
      count,
      status,
      quantum,
      type: name === '合肥' ? 'POP' : 'CPE',
      model: name === '合肥' ? 'WTSDK-8600' : rng() > 0.5 ? 'WTSDK-4200' : 'WTSDK-4100',
      tunnels: name === '合肥' ? 32 : Math.max(8, Math.round(6 + Math.log2(count + 1) * 4)),
    };
  });
};

const mapPoints: SitePoint[] = buildMapPoints();

const qssList = [
  { name: 'QSS-HEF-01', endpoint: '111.39.251.120:6001', status: '已连接', keepAlive: '7ms', version: 'v1.2', app: 'qkapp', zone: '合肥主中心' },
  { name: 'QSS-WHU-02', endpoint: '111.39.251.121:6001', status: '已连接', keepAlive: '10ms', version: 'v1.2', app: 'qkapp', zone: '芜湖灾备点' },
  { name: 'QSS-MAS-03', endpoint: '111.39.251.122:6001', status: '已连接', keepAlive: '9ms', version: 'v1.1', app: 'qkapp', zone: '马鞍山汇聚点' },
  { name: 'QSS-AQ-04', endpoint: '111.39.251.123:6001', status: '断连', keepAlive: '-', version: 'v1.1', app: 'qkapp', zone: '安庆边缘点' },
  { name: 'QSS-CHZ-05', endpoint: '111.39.251.124:6001', status: '已连接', keepAlive: '11ms', version: 'v1.1', app: 'qkapp', zone: '滁州业务区' },
];

const realtimeAlarms = [
  { level: '二级', site: '合肥-HUB-01', reason: '主备隧道切换', time: '10:23:08' },
  { level: '三级', site: '芜湖-CPE-07', reason: '量子密钥更新重试', time: '10:21:55' },
  { level: '三级', site: '滁州-CPE-11', reason: '链路抖动接近阈值', time: '10:19:12' },
  { level: '四级', site: '马鞍山-CPE-03', reason: 'QSS短时重连', time: '10:15:46' },
  { level: '四级', site: '安庆-CPE-09', reason: '站点离线恢复', time: '10:11:27' },
  { level: '二级', site: '铜陵-CPE-05', reason: '备隧道切换频繁', time: '10:07:49' },
  { level: '一级', site: '阜阳-CPE-02', reason: '核心链路中断 43s', time: '10:03:32' },
  { level: '三级', site: '黄山-CPE-13', reason: '出向丢包率升高', time: '09:58:44' },
  { level: '四级', site: '蚌埠-CPE-04', reason: '时延恢复至基线', time: '09:55:18' },
];

type TopologyNode = {
  id: string;
  x: number;
  y: number;
  type: 'HQ' | 'CITY';
  status: 'online' | 'warning' | 'offline';
};

type TopologyLink = {
  from: string;
  to: string;
  quantum: boolean;
};

const pad2 = (n: number) => String(n).padStart(2, '0');

const createSeededRng = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

const clampPercent = (v: number, min = 6, max = 94) => Math.max(min, Math.min(max, v));

const ANHUI_CITIES = [
  '合肥',
  '芜湖',
  '蚌埠',
  '淮南',
  '马鞍山',
  '淮北',
  '铜陵',
  '安庆',
  '黄山',
  '滁州',
  '阜阳',
  '宿州',
  '六安',
  '亳州',
  '池州',
  '宣城',
];

const buildTopologyData = (): { nodes: TopologyNode[]; links: TopologyLink[] } => {
  const rng = createSeededRng(20260422);
  const nodes: TopologyNode[] = [];
  const links: TopologyLink[] = [];

  const HQ_ID = '总部-01';
  const centerX = 46;
  const centerY = 45;

  nodes.push({ id: HQ_ID, x: centerX, y: centerY, type: 'HQ', status: 'online' });

  const shuffledCities = [...ANHUI_CITIES];
  for (let i = shuffledCities.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffledCities[i], shuffledCities[j]] = [shuffledCities[j], shuffledCities[i]];
  }
  const selectedCityCount = 6 + Math.floor(rng() * 5);
  const selectedCities = shuffledCities.slice(0, selectedCityCount);

  selectedCities.forEach((cityName, cityIdx) => {
    const cityAngle = -Math.PI / 2 + (cityIdx * 2 * Math.PI) / selectedCities.length + (rng() - 0.5) * 0.32;
    const cityR = 30 + rng() * 3.5;
    const cityAnchorX = centerX + Math.cos(cityAngle) * cityR;
    const cityAnchorY = centerY + Math.sin(cityAngle) * cityR;
    const siteCount = 1 + Math.floor(rng() * 3);

    for (let siteIdx = 1; siteIdx <= siteCount; siteIdx++) {
      const localAngle = -Math.PI / 3 + (siteIdx * 2 * Math.PI) / (siteCount + 1) + (rng() - 0.5) * 0.45;
      const localR = 2.8 + rng() * 2.2;
      const x = clampPercent(cityAnchorX + Math.cos(localAngle) * localR);
      const y = clampPercent(cityAnchorY + Math.sin(localAngle) * localR);
      const statusRoll = rng();
      const status = statusRoll < 0.12 ? 'offline' : statusRoll < 0.3 ? 'warning' : 'online';
      const id = `${cityName}-${pad2(siteIdx)}`;
      nodes.push({ id, x: Number(x.toFixed(2)), y: Number(y.toFixed(2)), type: 'CITY', status });
      links.push({ from: HQ_ID, to: id, quantum: rng() > 0.42 });
    }
  });

  return { nodes, links };
};

const { nodes: topologyNodes, links: topologyLinks } = buildTopologyData();

const metricCards = [
  { label: '服务站点(个)', value: '18', icon: Building2, iconBg: 'bg-[#06374d]', iconColor: 'text-[var(--sys-state-info)]' },
  { label: '接入设备(台)', value: '54', icon: Activity, iconBg: 'bg-[#053c39]', iconColor: 'text-[var(--sys-state-success)]' },
  { label: '业务通道(条)', value: '167', icon: Link2, iconBg: 'bg-[#2a1d54]', iconColor: 'text-[var(--sys-state-quantum)]' },
  { label: '量子保护通道(条)', value: '113', icon: KeyRound, iconBg: 'bg-[#3b2438]', iconColor: 'text-[#f97316]' },
];

const dateShort = ['04-10', '04-11', '04-12', '04-13', '04-14', '04-15', '04-16'];
const dateMonth = ['03-18', '03-22', '03-26', '03-30', '04-03', '04-07', '04-11', '04-15'];

const siteBandwidthTopData = mapPoints
  .map((site) => {
    const base = 28 + site.tunnels * 1.9 + Math.log2(site.count + 1) * 8;
    const statusAdjust = site.status === 'offline' ? -18 : site.status === 'warning' ? -8 : 0;
    const quantumAdjust = site.quantum ? 6 : 0;
    const value = Math.max(22, Math.min(96, Math.round(base + statusAdjust + quantumAdjust)));
    return {
      name: `${site.name}-${site.type}`,
      value,
    };
  })
  .sort((a, b) => b.value - a.value)
  .slice(0, 5);

const MAP_TAB_ORDER: MapTab[] = ['map', 'topology'];
const PERF_TAB_ORDER: PerfTab[] = ['latency', 'loss', 'jitter', 'throughput'];
const TOP_TAB_ORDER: TopTab[] = ['bandwidth', 'device', 'key'];
const ALARM_OVERVIEW_TAB_ORDER: AlarmOverviewTab[] = ['level', 'realtime'];
const ALARM_ANALYSIS_TAB_ORDER: AlarmAnalysisTab[] = ['reason', 'highfreq'];
const ALARM_TREND_TAB_ORDER: AlarmTrendTab[] = ['history', 'keyUpdate'];

const nextTabValue = <T extends string>(order: readonly T[], current: T): T => {
  const index = order.indexOf(current);
  return order[(index + 1) % order.length];
};

const buildPerfOption = (tab: PerfTab) => {
  if (tab === 'latency') {
    return {
      legend: { top: 6, textStyle: { color: '#90c4e8', fontSize: 10 } },
      xAxis: { type: 'category', data: dateShort },
      yAxis: { type: 'value', name: 'ms' },
      grid: { top: 30, left: 28, right: 12, bottom: 20 },
      series: [
        { name: '合肥', type: 'bar', barWidth: 6, data: [18.5, 19.1, 18.8, 19.6, 19.2, 18.7, 18.9], itemStyle: { color: '#3b82f6' } },
        { name: '芜湖', type: 'bar', barWidth: 6, data: [20.4, 20.9, 21.1, 20.7, 20.3, 19.9, 20.2], itemStyle: { color: '#00d4ff' } },
        { name: '滁州', type: 'bar', barWidth: 6, data: [22.2, 21.8, 22.5, 23.1, 22.8, 22.4, 22.6], itemStyle: { color: '#a855f7' } },
        { name: '马鞍山', type: 'bar', barWidth: 6, data: [17.8, 18.2, 18.0, 18.4, 18.1, 17.9, 18.0], itemStyle: { color: '#00ff88' } },
        { name: '全网平均时延', type: 'line', smooth: true, symbol: 'none', data: [19.7, 20.0, 20.1, 20.4, 20.1, 19.7, 19.9], lineStyle: { color: '#fbbf24', width: 2 } },
      ],
    };
  }
  if (tab === 'loss') {
    return {
      legend: { top: 6, textStyle: { color: '#90c4e8', fontSize: 10 } },
      xAxis: { type: 'category', data: dateShort },
      yAxis: { type: 'value', name: '%' },
      grid: { top: 30, left: 28, right: 12, bottom: 20 },
      series: [
        { name: '合肥', type: 'line', smooth: true, symbol: 'none', areaStyle: { opacity: 0.16 }, data: [0.12, 0.14, 0.13, 0.15, 0.14, 0.13, 0.12], lineStyle: { color: '#3b82f6', width: 2 } },
        { name: '芜湖', type: 'line', smooth: true, symbol: 'none', areaStyle: { opacity: 0.12 }, data: [0.18, 0.19, 0.2, 0.21, 0.2, 0.18, 0.19], lineStyle: { color: '#00ff88', width: 2 } },
        { name: '滁州', type: 'line', smooth: true, symbol: 'none', areaStyle: { opacity: 0.1 }, data: [0.2, 0.19, 0.21, 0.22, 0.2, 0.19, 0.18], lineStyle: { color: '#f97316', width: 2 } },
        { name: '马鞍山', type: 'line', smooth: true, symbol: 'none', data: [0.15, 0.14, 0.15, 0.16, 0.15, 0.14, 0.14], lineStyle: { color: '#a855f7', width: 2 } },
      ],
    };
  }
  if (tab === 'jitter') {
    return {
      legend: { top: 6, textStyle: { color: '#90c4e8', fontSize: 10 } },
      xAxis: { type: 'category', data: dateShort },
      yAxis: { type: 'value', name: 'ms' },
      grid: { top: 30, left: 28, right: 12, bottom: 20 },
      series: [
        { name: '合肥', type: 'line', smooth: true, symbol: 'none', data: [4.1, 4.4, 4.3, 4.6, 4.5, 4.2, 4.3], lineStyle: { color: '#3b82f6', width: 2 } },
        { name: '芜湖', type: 'line', smooth: true, symbol: 'none', data: [4.8, 4.9, 4.7, 4.9, 4.8, 4.6, 4.7], lineStyle: { color: '#00ff88', width: 2 } },
        { name: '滁州', type: 'bar', barWidth: 7, data: [5.2, 5.0, 5.3, 5.4, 5.1, 5.0, 5.2], itemStyle: { color: '#a855f7' } },
        { name: '马鞍山', type: 'line', smooth: true, symbol: 'none', data: [3.9, 4.0, 4.1, 4.2, 4.0, 3.8, 3.9], lineStyle: { color: '#fbbf24', width: 2 } },
      ],
    };
  }
  return {
    legend: { top: 6, textStyle: { color: '#90c4e8', fontSize: 10 } },
    xAxis: { type: 'category', data: dateShort },
    yAxis: { type: 'value', name: 'Mbps' },
    grid: { top: 30, left: 28, right: 12, bottom: 20 },
    series: [
      { name: '入向峰值', type: 'bar', barWidth: 8, data: [52, 55, 53, 58, 56, 54, 55], itemStyle: { color: '#00d4ff' } },
      { name: '入向均值', type: 'line', smooth: true, symbol: 'none', areaStyle: { opacity: 0.14 }, data: [43, 45, 44, 47, 46, 44, 45], lineStyle: { color: '#3b82f6', width: 2 } },
      { name: '出向均值', type: 'line', smooth: true, symbol: 'none', areaStyle: { opacity: 0.1 }, data: [37, 39, 38, 41, 40, 38, 39], lineStyle: { color: '#00ff88', width: 2 } },
    ],
  };
};

const buildTopOption = (tab: TopTab) => {
  if (tab === 'device') {
    return {
      legend: { top: 6, textStyle: { color: '#90c4e8', fontSize: 10 }, data: ['设备健康指数'] },
      grid: { top: 24, left: 108, right: 12, bottom: 16, containLabel: false },
      xAxis: { type: 'value', axisLabel: { color: '#88b5e4' } },
      yAxis: {
        type: 'category',
        data: ['HEF-CPE-19', 'WHU-CPE-08', 'MAS-CPE-05', 'CHZ-CPE-13', 'ANQ-CPE-11'],
        axisLabel: { color: '#9fc8f2', fontSize: 10, width: 68, overflow: 'truncate', margin: 8 },
      },
      series: [{ name: '设备健康指数', type: 'bar', data: [88, 84, 81, 78, 74], barWidth: 10, itemStyle: { color: '#f97316' } }],
    };
  }
  if (tab === 'key') {
    return {
      legend: { top: 6, textStyle: { color: '#90c4e8', fontSize: 10 }, data: ['密钥剩余比例'] },
      grid: { top: 24, left: 108, right: 12, bottom: 16, containLabel: false },
      xAxis: { type: 'value', max: 100 },
      yAxis: {
        type: 'category',
        data: ['FUY-CPE-06', 'BBB-CPE-04', 'TL-CPE-05', 'ANQ-CPE-09', 'WHU-CPE-07'],
        axisLabel: { color: '#9fc8f2', fontSize: 10, width: 68, overflow: 'truncate', margin: 8 },
      },
      series: [
        {
          name: '密钥剩余比例',
          type: 'bar',
          data: [22, 27, 31, 36, 42],
          barWidth: 10,
          itemStyle: {
            color: (params: { data: number }) => (params.data < 20 ? '#ef4444' : '#3b82f6'),
          },
          label: { show: true, position: 'right', color: '#d9eeff', formatter: '{c}%' },
        },
      ],
    };
  }
  return {
    legend: { top: 6, textStyle: { color: '#90c4e8', fontSize: 10 }, data: ['带宽利用率'] },
    grid: { top: 24, left: 108, right: 12, bottom: 16, containLabel: false },
    xAxis: { type: 'value', max: 100 },
    yAxis: {
      type: 'category',
      data: siteBandwidthTopData.map((item) => item.name).reverse(),
      axisLabel: { color: '#9fc8f2', fontSize: 10, width: 72, overflow: 'truncate', margin: 8 },
    },
    series: [
      {
        name: '带宽利用率',
        type: 'bar',
        data: siteBandwidthTopData.map((item) => item.value).reverse(),
        barWidth: 10,
        itemStyle: { color: '#3b82f6' },
      },
    ],
  };
};

const buildAlarmOverviewOption = () => ({
  legend: { top: 6, textStyle: { color: '#90c4e8', fontSize: 10 } },
  series: [
    {
      type: 'pie',
      radius: ['46%', '72%'],
      center: ['50%', '56%'],
      data: [
        { name: '一级', value: 2 },
        { name: '二级', value: 6 },
        { name: '三级', value: 11 },
        { name: '四级', value: 17 },
      ],
      label: { color: '#a9d3ff', fontSize: 10, formatter: '{b}:{c}' },
      itemStyle: { borderColor: '#0a2b57', borderWidth: 2 },
    },
  ],
  color: ['#ef4444', '#f59e0b', '#facc15', '#60a5fa'],
});

const buildAlarmAnalysisOption = (tab: AlarmAnalysisTab) => {
  if (tab === 'highfreq') {
    return {
      grid: { top: 34, left: 36, right: 28, bottom: 20 },
      legend: { top: 6, textStyle: { color: '#90c4e8', fontSize: 10 } },
      xAxis: { type: 'category', data: ['合肥', '芜湖', '滁州', '马鞍山', '安庆'] },
      yAxis: [{ type: 'value', name: '告警数' }, { type: 'value', name: '分钟' }],
      series: [
        { name: '告警数', type: 'bar', barWidth: 10, data: [9, 8, 7, 6, 5], itemStyle: { color: '#00d4ff' } },
        { name: '平均故障时长', type: 'line', yAxisIndex: 1, smooth: true, symbol: 'circle', symbolSize: 6, data: [36, 31, 28, 24, 19], lineStyle: { color: '#fbbf24', width: 2 } },
      ],
    };
  }
  return {
    legend: { top: 6, textStyle: { color: '#9fc8f2', fontSize: 10 } },
    series: [
      {
        type: 'pie',
        radius: ['50%', '72%'],
        center: ['50%', '50%'],
        data: [
          { name: '网络侧', value: 29 },
          { name: '设备侧', value: 22 },
          { name: '客户侧', value: 18 },
          { name: '量子服务侧', value: 17 },
          { name: '链路侧', value: 14 },
        ],
        label: { color: '#a9d3ff', fontSize: 10, formatter: '{b}:{d}%' },
        itemStyle: { borderColor: '#0a2b57', borderWidth: 2 },
      },
    ],
    color: ['#3b82f6', '#00ff88', '#f97316', '#a855f7', '#4a6fa5'],
  };
};

const buildAlarmTrendOption = (tab: AlarmTrendTab) => {
  if (tab === 'keyUpdate') {
    return {
      grid: { top: 34, left: 32, right: 28, bottom: 18 },
      legend: { top: 6, textStyle: { color: '#90c4e8', fontSize: 10 } },
      xAxis: { type: 'category', data: dateMonth },
      yAxis: [{ type: 'value', name: '成功' }, { type: 'value', name: '失败' }],
      series: [
        { name: '入向成功', type: 'line', smooth: true, symbol: 'none', data: [18, 17, 19, 18, 20, 21, 19, 22], lineStyle: { color: '#2563eb', width: 2 } },
        { name: '出向成功', type: 'line', smooth: true, symbol: 'none', data: [16, 15, 16, 17, 17, 18, 17, 18], lineStyle: { color: '#00ff88', width: 2 } },
        { name: '更新失败', type: 'bar', yAxisIndex: 1, barWidth: 10, data: [1, 1, 2, 1, 2, 1, 1, 2], itemStyle: { color: '#f97316' } },
      ],
    };
  }
  return {
    legend: { top: 6, textStyle: { color: '#90c4e8', fontSize: 10 }, data: ['历史告警数'] },
    grid: { top: 34, left: 32, right: 12, bottom: 18 },
    xAxis: { type: 'category', data: dateMonth },
    yAxis: { type: 'value', name: '条' },
    series: [
      {
        name: '历史告警数',
        type: 'bar',
        barWidth: 14,
        data: [12, 15, 13, 18, 16, 14, 11, 13],
        itemStyle: { color: '#3b82f6' },
      },
    ],
  };
};

const keyHealthRatio = 75.4;
const quantumCoverage = 67.66;
const gmRate = 72;
const internationalRate = 28;

export const QuantumSDWANOverview: React.FC = () => {
  const [mapSvgMarkup, setMapSvgMarkup] = useState('');
  const [mapTab, setMapTab] = useState<MapTab>('map');
  const [perfTab, setPerfTab] = useState<PerfTab>('latency');
  const [topTab, setTopTab] = useState<TopTab>('bandwidth');
  const [alarmOverviewTab, setAlarmOverviewTab] = useState<AlarmOverviewTab>('level');
  const [alarmAnalysisTab, setAlarmAnalysisTab] = useState<AlarmAnalysisTab>('reason');
  const [alarmTrendTab, setAlarmTrendTab] = useState<AlarmTrendTab>('history');
  const [mapAuto, setMapAuto] = useState<AutoPlayConfig>({ enabled: true, intervalSec: 30 });
  const [perfAuto, setPerfAuto] = useState<AutoPlayConfig>({ enabled: true, intervalSec: 30 });
  const [topAuto, setTopAuto] = useState<AutoPlayConfig>({ enabled: true, intervalSec: 30 });
  const [alarmOverviewAuto, setAlarmOverviewAuto] = useState<AutoPlayConfig>({ enabled: true, intervalSec: 30 });
  const [alarmAnalysisAuto, setAlarmAnalysisAuto] = useState<AutoPlayConfig>({ enabled: true, intervalSec: 30 });
  const [alarmTrendAuto, setAlarmTrendAuto] = useState<AutoPlayConfig>({ enabled: true, intervalSec: 30 });
  const [hoveredSite, setHoveredSite] = useState<HoveredSiteState | null>(null);
  const [drillCity, setDrillCity] = useState<string | null>(null);
  const [drillCityId, setDrillCityId] = useState<string | null>(null);
  const [cityAnchors, setCityAnchors] = useState<CityAnchor[]>([]);
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [originViewBox, setOriginViewBox] = useState<MapViewBox | null>(null);
  const [currentViewBox, setCurrentViewBox] = useState<MapViewBox | null>(null);
  const [topologyHoverNode, setTopologyHoverNode] = useState<string | null>(null);
  const [topologyActiveNode, setTopologyActiveNode] = useState<string | null>(null);
  const mapSvgRef = useRef<HTMLDivElement>(null);
  const bizPanelRef = useRef<HTMLDivElement>(null);
  const qssScrollRef = useRef<HTMLDivElement>(null);
  const realtimeAlarmScrollRef = useRef<HTMLDivElement>(null);
  const [bizCompactLevel, setBizCompactLevel] = useState<0 | 1 | 2>(0);
  const mapPreserveAspectRatio = 'xMidYMid meet';

  useEffect(() => {
    const styleId = 'ah-city-hover-keyframes';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes ahCityGlow {
        0% { filter: drop-shadow(0 0 4px rgba(148,208,255,0.45)); }
        50% { filter: drop-shadow(0 0 10px rgba(148,208,255,0.9)); }
        100% { filter: drop-shadow(0 0 4px rgba(148,208,255,0.45)); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, []);

  useEffect(() => {
    let canceled = false;
    fetch('/ah_map.svg')
      .then((res) => res.text())
      .then((text) => {
        if (canceled) return;
        const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
        const svg = doc.querySelector('svg');
        if (!svg) {
          setMapSvgMarkup(text);
          return;
        }
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        const cityGroups = Array.from(svg.querySelectorAll('g[id$="市"]')) as SVGGElement[];
        cityGroups.forEach((g) => g.classList.add('ah-city'));
        const styleNode = doc.createElement('style');
        styleNode.textContent = `
          .ah-city path, .ah-city polygon, .ah-city polyline {
            transition: fill 180ms ease, stroke 180ms ease, filter 180ms ease, stroke-width 180ms ease;
            pointer-events: all;
          }
          .ah-city:hover path, .ah-city:hover polygon, .ah-city:hover polyline {
            fill: #4f83ea !important;
            stroke: #ecf8ff !important;
            stroke-width: 2.2 !important;
            filter: drop-shadow(0 0 12px rgba(148,208,255,0.95));
          }
        `;
        svg.prepend(styleNode);
        const vb = svg.getAttribute('viewBox');
        if (vb) {
          const [x, y, width, height] = vb.split(/\s+/).map(Number);
          if ([x, y, width, height].every((v) => Number.isFinite(v))) {
            setOriginViewBox({ x, y, width, height });
            setCurrentViewBox({ x, y, width, height });
          }
        }
        svg.style.overflow = 'hidden';
        const shapes = Array.from(svg.querySelectorAll('path, polygon, polyline')) as SVGElement[];
        shapes.forEach((shape) => {
          shape.style.fill = '#2756B5';
          shape.style.stroke = '#A9D7FF';
          shape.style.strokeWidth = '1.2';
          shape.style.strokeOpacity = '0.92';
          shape.style.transition = 'fill 180ms ease, stroke 180ms ease, filter 180ms ease, stroke-width 180ms ease';
          shape.style.cursor = 'pointer';
        });
        setMapSvgMarkup(svg.outerHTML);
      })
      .catch(() => {
        if (!canceled) setMapSvgMarkup('');
      });
    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    if (mapTab !== 'map') return;
    if (!mapSvgRef.current || !mapSvgMarkup) return;
    const host = mapSvgRef.current;
    const svgRoot = host.querySelector('svg') as SVGSVGElement | null;
    if (!svgRoot) return;
    const cityGroups = Array.from(svgRoot.querySelectorAll('g.ah-city, g[id$="市"]')) as SVGGElement[];
    const nameToId = new Map<string, string>();
    cityGroups.forEach((g) => nameToId.set(g.id.replace(/市$/, ''), g.id));
    cityGroups.forEach((group) => {
      const shapes = Array.from(group.querySelectorAll('path, polygon, polyline')) as SVGElement[];
      shapes.forEach((shape) => {
        shape.style.cursor = 'pointer';
      });
    });

    const pickCityByClientPoint = (clientX: number, clientY: number) => {
      const el = document.elementFromPoint(clientX, clientY) as Element | null;
      const group = el?.closest?.('g.ah-city') as SVGGElement | null;
      if (!group) return null;
      const cityName = group.id.replace(/市$/, '');
      if (!cityName) return null;
      if (drillCity && cityName !== drillCity) return null;
      return cityName;
    };

    const handlePointerMove = (event: Event) => {
      const pe = event as PointerEvent;
      const cityName = pickCityByClientPoint(pe.clientX, pe.clientY);
      if (!cityName) {
        setHoveredCity(null);
        return;
      }
      setHoveredCity(cityName);
    };
    const handleClick = () => {
      // Drilldown temporarily disabled.
    };
    const handleSvgLeave = () => {
      setHoveredCity(null);
      setHoveredSite(null);
    };
    host.addEventListener('pointermove', handlePointerMove);
    host.addEventListener('click', handleClick);
    host.addEventListener('mouseleave', handleSvgLeave);
    return () => {
      host.removeEventListener('pointermove', handlePointerMove);
      host.removeEventListener('click', handleClick);
      host.removeEventListener('mouseleave', handleSvgLeave);
    };
  }, [mapSvgMarkup, drillCity, mapTab]);

  useEffect(() => {
    if (mapTab !== 'map') return;
    const host = mapSvgRef.current;
    if (!host || !mapSvgMarkup) return;
    const svgRoot = host.querySelector('svg') as SVGSVGElement | null;
    if (!svgRoot) return;

    const calcAnchors = () => {
      const cityGroups = Array.from(svgRoot.querySelectorAll('g[id$="市"]')) as SVGGElement[];
      const ctm = svgRoot.getScreenCTM();
      if (!ctm) return false;
      const inv = ctm.inverse();
      const anchors: CityAnchor[] = cityGroups.map((group) => {
        const name = group.id.replace(/市$/, '');
        const rect = group.getBoundingClientRect();
        const point = svgRoot.createSVGPoint();
        point.x = rect.left + rect.width / 2;
        point.y = rect.top + rect.height / 2;
        const center = point.matrixTransform(inv);
        const p1 = svgRoot.createSVGPoint();
        p1.x = rect.left;
        p1.y = rect.top;
        const p2 = svgRoot.createSVGPoint();
        p2.x = rect.right;
        p2.y = rect.bottom;
        const sp1 = p1.matrixTransform(inv);
        const sp2 = p2.matrixTransform(inv);
        const bbox = {
          x: Math.min(sp1.x, sp2.x),
          y: Math.min(sp1.y, sp2.y),
          width: Math.abs(sp2.x - sp1.x),
          height: Math.abs(sp2.y - sp1.y),
        };
        return {
          name,
          cx: center.x,
          cy: center.y,
          bbox: { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height },
        };
      });
      const validCount = anchors.filter((a) => Number.isFinite(a.cx) && Number.isFinite(a.cy) && a.bbox.width > 0.5 && a.bbox.height > 0.5).length;
      if (validCount > 0) {
        setCityAnchors(anchors);
      }
      return validCount > 0;
    };

    const okNow = calcAnchors();
    let raf1 = 0;
    let raf2 = 0;
    let t1: number | null = null;
    let t2: number | null = null;
    if (!okNow) {
      raf1 = window.requestAnimationFrame(() => {
        const ok1 = calcAnchors();
        if (!ok1) {
          raf2 = window.requestAnimationFrame(() => calcAnchors());
        }
      });
      t1 = window.setTimeout(() => calcAnchors(), 120);
      t2 = window.setTimeout(() => calcAnchors(), 360);
    }

    const ro = new ResizeObserver(() => calcAnchors());
    ro.observe(host);
    return () => {
      if (raf1) window.cancelAnimationFrame(raf1);
      if (raf2) window.cancelAnimationFrame(raf2);
      if (t1) window.clearTimeout(t1);
      if (t2) window.clearTimeout(t2);
      ro.disconnect();
    };
  }, [mapSvgMarkup, drillCity, originViewBox, mapTab]);

  useEffect(() => {
    if (mapTab !== 'map') return;
    if (!mapSvgRef.current || !mapSvgMarkup) return;
    const host = mapSvgRef.current;
    const svgRoot = host.querySelector('svg') as SVGSVGElement | null;
    if (!svgRoot || !originViewBox) return;
    let nextViewBox = originViewBox;
    if (drillCity) {
      const groups = Array.from(svgRoot.querySelectorAll('g[id$="市"]')) as SVGGElement[];
      const targetGroup = (drillCityId
        ? groups.find((g) => g.id === drillCityId)
        : groups.find((g) => g.id.replace(/市$/, '') === drillCity)) || null;
      const targetBBox = targetGroup?.getBBox();
      const target =
        targetBBox && targetBBox.width > 0.1 && targetBBox.height > 0.1
          ? {
              bbox: {
                x: targetBBox.x,
                y: targetBBox.y,
                width: targetBBox.width,
                height: targetBBox.height,
              },
            }
          : cityAnchors.find((c) => c.name === drillCity);
      if (target) {
        const hostRect = host.getBoundingClientRect();
        const hostRatio = Math.max(0.2, hostRect.width / Math.max(1, hostRect.height));
        const padX = Math.max(0.8, target.bbox.width * 0.004);
        const padY = Math.max(0.8, target.bbox.height * 0.004);
        let width = Math.max(4, target.bbox.width + padX * 2);
        let height = Math.max(4, target.bbox.height + padY * 2);
        const boxRatio = width / height;
        if (boxRatio > hostRatio) {
          height = width / hostRatio;
        } else {
          width = height * hostRatio;
        }
        const cx = target.bbox.x + target.bbox.width / 2;
        const cy = target.bbox.y + target.bbox.height / 2;
        nextViewBox = {
          x: cx - width / 2,
          y: cy - height / 2,
          width,
          height,
        };
      }
    }
    svgRoot.setAttribute('viewBox', `${nextViewBox.x} ${nextViewBox.y} ${nextViewBox.width} ${nextViewBox.height}`);
    svgRoot.setAttribute('preserveAspectRatio', mapPreserveAspectRatio);
    setCurrentViewBox(nextViewBox);
  }, [drillCity, drillCityId, mapSvgMarkup, originViewBox, cityAnchors, mapTab, mapPreserveAspectRatio]);

  useEffect(() => {
    if (mapTab !== 'map') return;
    if (!mapSvgRef.current || !mapSvgMarkup) return;
    const svgRoot = mapSvgRef.current.querySelector('svg');
    if (!svgRoot) return;
    const cityGroups = Array.from(svgRoot.querySelectorAll('g[id$="市"]')) as SVGGElement[];
    const hasDrillId = !!drillCityId && cityGroups.some((group) => group.id === drillCityId);
    cityGroups.forEach((group) => {
      const cityName = group.id.replace(/市$/, '');
      const isActive = !drillCity || (hasDrillId ? group.id === drillCityId : cityName === drillCity);
      const isHovered = hoveredCity === cityName;
      group.style.display = isActive ? '' : drillCity ? 'none' : '';
      const dimmedByHover = !!hoveredCity && !isHovered && !drillCity;
      group.style.opacity = isActive ? (dimmedByHover ? '0.48' : '1') : drillCity ? '0' : '0.16';
      group.style.pointerEvents = isActive ? 'auto' : 'none';
      const shapes = Array.from(group.querySelectorAll('path, polygon, polyline')) as SVGElement[];
      shapes.forEach((shape) => {
        shape.style.fill = isActive ? (isHovered ? COLOR_CITY_FILL_HOVER : COLOR_CITY_FILL) : '#173159';
        shape.style.stroke = isActive ? (isHovered ? COLOR_CITY_STROKE_HOVER : COLOR_CITY_STROKE) : '#355a88';
        shape.style.strokeWidth = isHovered ? '2.1' : '1.2';
        shape.style.animation = isHovered ? 'ahCityGlow 1.2s ease-in-out infinite' : 'none';
        shape.style.filter = isHovered ? 'drop-shadow(0 0 12px rgba(148,208,255,0.95))' : dimmedByHover ? 'brightness(0.86)' : 'none';
      });
    });
  }, [drillCity, drillCityId, mapSvgMarkup, hoveredCity, mapTab]);

  const anchorsToUse = useMemo(
    () =>
      cityAnchors.length > 0
        ? cityAnchors
        : originViewBox
          ? mapPoints.map((p) => ({
              name: p.name,
              cx: originViewBox.x + (originViewBox.width * p.x) / 100,
              cy: originViewBox.y + (originViewBox.height * p.y) / 100,
              bbox: {
                x: originViewBox.x + (originViewBox.width * p.x) / 100 - 10,
                y: originViewBox.y + (originViewBox.height * p.y) / 100 - 10,
                width: 20,
                height: 20,
              },
            }))
          : [],
    [cityAnchors, originViewBox]
  );

  const mapOverlayItems = useMemo(
    () =>
      anchorsToUse
        .filter((city) => !drillCity || city.name === drillCity)
        .map((city) => {
          const citySites = mapPoints.filter((p) => p.name === city.name);
          const siteCount = citySites.reduce((sum, p) => sum + p.count, 0);
          const hasQuantum = citySites.some((p) => p.quantum);
          const siteForTooltip = citySites[0] || null;
          const offline = citySites.some((p) => p.status === 'offline');
          const warning = citySites.some((p) => p.status === 'warning');
          const bubbleColor = offline ? COLOR_STATE_DANGER : warning ? COLOR_STATE_WARNING : COLOR_STATE_SUCCESS;
          const bubbleStroke = offline ? '#fecaca' : warning ? '#fed7aa' : '#bbf7d0';
          return {
            ...city,
            siteCount,
            hasQuantum,
            siteForTooltip,
            bubbleColor,
            bubbleStroke,
            showBubble: siteCount > 0,
            isHovered: hoveredCity === city.name,
          };
        }),
    [anchorsToUse, drillCity, hoveredCity]
  );

  const mapOverlayCountRange = useMemo(() => {
    const values = mapOverlayItems.filter((c) => c.showBubble).map((c) => c.siteCount);
    if (!values.length) return { min: 0, max: 1 };
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [mapOverlayItems]);

  useEffect(() => {
    if (mapTab !== 'map') return;
    const host = mapSvgRef.current;
    const vb = currentViewBox || originViewBox;
    if (!host || !vb) return;

    const bubbleOffsetY = -16.5;
    const bubbleHitRadius = 12;
    const onMove = (evt: MouseEvent) => {
      const rect = host.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const sx = vb.x + ((evt.clientX - rect.left) / rect.width) * vb.width;
      const sy = vb.y + ((evt.clientY - rect.top) / rect.height) * vb.height;

      let target: (typeof mapOverlayItems)[number] | null = null;
      let minDist = Infinity;
      for (const item of mapOverlayItems) {
        if (!item.siteForTooltip || !item.showBubble) continue;
        const dx = sx - item.cx;
        const dy = sy - (item.cy + bubbleOffsetY);
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < bubbleHitRadius && d < minDist) {
          minDist = d;
          target = item;
        }
      }

      if (!target || !target.siteForTooltip) {
        setHoveredSite((cur) => (cur ? null : cur));
        return;
      }
      const x = ((evt.clientX - rect.left) / rect.width) * 100;
      const y = ((evt.clientY - rect.top) / rect.height) * 100;
      setHoveredSite({
        site: target.siteForTooltip,
        x: Math.max(4, Math.min(96, x)),
        y: Math.max(6, Math.min(94, y)),
      });
    };
    const onLeave = () => setHoveredSite(null);
    host.addEventListener('mousemove', onMove);
    host.addEventListener('mouseleave', onLeave);
    return () => {
      host.removeEventListener('mousemove', onMove);
      host.removeEventListener('mouseleave', onLeave);
    };
  }, [mapTab, mapOverlayItems, currentViewBox, originViewBox]);

  useEffect(() => {
    if (mapTab !== 'map') {
      setHoveredSite(null);
      setHoveredCity(null);
      setDrillCityId(null);
    }
  }, [mapTab]);

  useEffect(() => {
    if (!mapAuto.enabled || MAP_TAB_ORDER.length <= 1) return;
    const timer = window.setInterval(() => {
      setMapTab((current) => nextTabValue(MAP_TAB_ORDER, current));
    }, mapAuto.intervalSec * 1000);
    return () => window.clearInterval(timer);
  }, [mapAuto.enabled, mapAuto.intervalSec]);

  useEffect(() => {
    if (!perfAuto.enabled || PERF_TAB_ORDER.length <= 1) return;
    const timer = window.setInterval(() => {
      setPerfTab((current) => nextTabValue(PERF_TAB_ORDER, current));
    }, perfAuto.intervalSec * 1000);
    return () => window.clearInterval(timer);
  }, [perfAuto.enabled, perfAuto.intervalSec]);

  useEffect(() => {
    if (!topAuto.enabled || TOP_TAB_ORDER.length <= 1) return;
    const timer = window.setInterval(() => {
      setTopTab((current) => nextTabValue(TOP_TAB_ORDER, current));
    }, topAuto.intervalSec * 1000);
    return () => window.clearInterval(timer);
  }, [topAuto.enabled, topAuto.intervalSec]);

  useEffect(() => {
    if (!alarmOverviewAuto.enabled || ALARM_OVERVIEW_TAB_ORDER.length <= 1) return;
    const timer = window.setInterval(() => {
      setAlarmOverviewTab((current) => nextTabValue(ALARM_OVERVIEW_TAB_ORDER, current));
    }, alarmOverviewAuto.intervalSec * 1000);
    return () => window.clearInterval(timer);
  }, [alarmOverviewAuto.enabled, alarmOverviewAuto.intervalSec]);

  useEffect(() => {
    if (!alarmAnalysisAuto.enabled || ALARM_ANALYSIS_TAB_ORDER.length <= 1) return;
    const timer = window.setInterval(() => {
      setAlarmAnalysisTab((current) => nextTabValue(ALARM_ANALYSIS_TAB_ORDER, current));
    }, alarmAnalysisAuto.intervalSec * 1000);
    return () => window.clearInterval(timer);
  }, [alarmAnalysisAuto.enabled, alarmAnalysisAuto.intervalSec]);

  useEffect(() => {
    if (!alarmTrendAuto.enabled || ALARM_TREND_TAB_ORDER.length <= 1) return;
    const timer = window.setInterval(() => {
      setAlarmTrendTab((current) => nextTabValue(ALARM_TREND_TAB_ORDER, current));
    }, alarmTrendAuto.intervalSec * 1000);
    return () => window.clearInterval(timer);
  }, [alarmTrendAuto.enabled, alarmTrendAuto.intervalSec]);

  useEffect(() => {
    const el = qssScrollRef.current;
    if (!el) return;
    const timer = window.setInterval(() => {
      const step = 84;
      const next = el.scrollTop + step;
      if (next + el.clientHeight >= el.scrollHeight - 8) {
        el.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        el.scrollTo({ top: next, behavior: 'smooth' });
      }
    }, 3200);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const el = realtimeAlarmScrollRef.current;
    if (!el) return;
    const timer = window.setInterval(() => {
      const step = 30;
      const next = el.scrollTop + step;
      if (next + el.clientHeight >= el.scrollHeight - 6) {
        el.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        el.scrollTo({ top: next, behavior: 'smooth' });
      }
    }, 2600);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const el = bizPanelRef.current;
    if (!el) return;
    const updateCompact = () => {
      const h = el.clientHeight;
      if (h < 285) setBizCompactLevel(2);
      else if (h < 340) setBizCompactLevel(1);
      else setBizCompactLevel(0);
    };
    updateCompact();
    const observer = new ResizeObserver(updateCompact);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const topologyNodeMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    topologyNodes.forEach((n) => map.set(n.id, { x: n.x, y: n.y }));
    return map;
  }, []);

  const topologyNodeInfoMap = useMemo(() => {
    const map = new Map<string, { type: string; model: string; tunnels: number; quantum: string }>();
    topologyNodes.forEach((n) => {
      const matchedLink = topologyLinks.find((l) => l.to === n.id);
      const siteSeq = Number(n.id.split('-').pop() || 1);
      map.set(n.id, {
        type: n.type === 'HQ' ? '总部节点' : '地市站点',
        model: n.type === 'HQ' ? 'QSR-HQ-8600' : siteSeq % 2 === 0 ? 'WTSDK-4200' : 'WTSDK-4100',
        tunnels: n.type === 'HQ' ? 32 : 6 + siteSeq * 2,
        quantum: n.type === 'HQ' ? '核心量子汇聚' : matchedLink?.quantum ? '已启用' : '未启用',
      });
    });
    return map;
  }, []);

  const keyHealthOption = useMemo(
    () => ({
      series: [
        {
          type: 'pie',
          radius: ['58%', '78%'],
          center: ['50%', '50%'],
          silent: true,
          data: [
            { value: keyHealthRatio, name: '剩余比例' },
            { value: 100 - keyHealthRatio, name: '已消耗' },
          ],
          label: { show: false },
          itemStyle: { borderColor: '#0a2b57', borderWidth: 2 },
        },
      ],
      color: ['#00d4ff', keyHealthRatio < 20 ? '#ef4444' : '#0099cc'],
    }),
    []
  );

  const quantumCoverageOption = useMemo(
    () => ({
      series: [
        {
          type: 'pie',
          radius: ['52%', '74%'],
          center: ['50%', '50%'],
          data: [
            { name: '量子加密', value: 113 },
            { name: '普通IPSec', value: 54 },
          ],
          label: { color: '#a9d3ff', fontSize: 10, formatter: '{b}:{c}' },
          itemStyle: { borderColor: '#0a2b57', borderWidth: 2 },
        },
      ],
      color: ['#a855f7', '#4a6fa5'],
    }),
    []
  );

  const perfOption = useMemo(() => buildPerfOption(perfTab), [perfTab]);
  const topOption = useMemo(() => buildTopOption(topTab), [topTab]);
  const alarmOverviewOption = useMemo(() => buildAlarmOverviewOption(), []);
  const alarmAnalysisOption = useMemo(() => buildAlarmAnalysisOption(alarmAnalysisTab), [alarmAnalysisTab]);
  const alarmTrendOption = useMemo(() => buildAlarmTrendOption(alarmTrendTab), [alarmTrendTab]);

  const tabPills = (
    items: Array<{ id: string; label: string }>,
    active: string,
    onChange: (id: string) => void
  ) => (
    <div className="ml-1 flex min-w-0 items-center gap-1 overflow-x-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <button key={item.id} type="button" className={tabClass(isActive)} onClick={() => onChange(item.id)}>
            {item.label}
          </button>
        );
      })}
    </div>
  );

  const autoControls = (autoConfig: AutoPlayConfig, onAutoChange: (next: AutoPlayConfig) => void) => (
    <div className="flex shrink-0 items-center gap-1 whitespace-nowrap">
      <button
        type="button"
        className={`rounded-full border px-1.5 py-0.5 text-[clamp(10px,0.7vw,11px)] ${
          autoConfig.enabled
            ? 'border-[#4fb6ff] bg-[#144a85] text-[#d9f0ff]'
            : 'border-[var(--comp-panel-border)] bg-[#123d70] text-[#c3dcf6]'
        }`}
        onClick={() => onAutoChange({ ...autoConfig, enabled: !autoConfig.enabled })}
      >
        自动
      </button>
      <Select
        value={String(autoConfig.intervalSec)}
        onChange={(e) => onAutoChange({ ...autoConfig, intervalSec: Number(e.target.value) })}
        className="h-5 w-[78px] rounded-full border-[var(--comp-panel-border)] bg-[#123d70] px-1.5 py-0 text-[clamp(10px,0.7vw,11px)] text-[#e2f0ff]"
        options={[
          { value: '10', label: '10s' },
          { value: '30', label: '30s' },
          { value: '60', label: '1min' },
          { value: '300', label: '5min' },
        ]}
      />
    </div>
  );

  return (
    <div className="h-full w-full overflow-auto rounded-lg border border-[var(--comp-panel-border)] bg-[var(--sys-bg-page)] p-2">
      <div className="grid grid-cols-12 gap-2 xl:h-full xl:grid-rows-[minmax(196px,0.88fr)_minmax(250px,1fr)_minmax(240px,1fr)]">
        <div
          ref={bizPanelRef}
          className={`col-span-12 md:col-span-6 xl:col-span-3 ${panelClass} ${
            bizCompactLevel === 2 ? 'overflow-y-auto' : 'overflow-hidden'
          }`}
        >
          {sectionTitle('业务概况')}
          <div className={`grid min-h-0 flex-1 grid-rows-[1fr_1fr_minmax(56px,1fr)] ${bizCompactLevel === 2 ? 'gap-1' : 'gap-1.5'}`}>
          <div className={`grid grid-cols-2 ${bizCompactLevel === 2 ? 'gap-1' : 'gap-1.5'}`}>
            {metricCards.slice(0, 2).map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label} className={`h-full rounded border border-[#1f5b9b]/70 bg-[#0e3e7e]/70 ${bizCompactLevel === 0 ? 'p-2' : bizCompactLevel === 1 ? 'p-1.5' : 'p-1'}`}>
                  <div className={`flex items-center justify-between text-[var(--sys-text-secondary)] ${bizCompactLevel === 0 ? 'text-[11px]' : 'text-[10px]'}`}>
                    <span>{m.label}</span>
                    <span
                      className={`inline-flex items-center justify-center rounded-full ${m.iconBg} ${m.iconColor} shadow-[inset_0_0_0_1px_rgba(120,193,255,0.2)] ${
                        bizCompactLevel === 0 ? 'h-6 w-6' : bizCompactLevel === 1 ? 'h-5 w-5' : 'h-4 w-4'
                      }`}
                    >
                      <Icon size={bizCompactLevel === 0 ? 11 : bizCompactLevel === 1 ? 10 : 9} />
                    </span>
                  </div>
                  <div
                    className={`font-mono font-black leading-none text-[#d8f1ff] ${
                      bizCompactLevel === 0 ? 'mt-1 text-[22px]' : bizCompactLevel === 1 ? 'mt-0.5 text-[18px]' : 'mt-0.5 text-[16px]'
                    }`}
                  >
                    {m.value}
                  </div>
                </div>
              );
            })}
          </div>
          <div className={`grid grid-cols-2 ${bizCompactLevel === 2 ? 'gap-1' : 'gap-1.5'}`}>
            {metricCards.slice(2, 4).map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label} className={`h-full rounded border border-[#1f5b9b]/70 bg-[#0e3e7e]/70 ${bizCompactLevel === 0 ? 'p-2' : bizCompactLevel === 1 ? 'p-1.5' : 'p-1'}`}>
                  <div className={`flex items-center justify-between text-[var(--sys-text-secondary)] ${bizCompactLevel === 0 ? 'text-[11px]' : 'text-[10px]'}`}>
                    <span>{m.label}</span>
                    <span
                      className={`inline-flex items-center justify-center rounded-full ${m.iconBg} ${m.iconColor} shadow-[inset_0_0_0_1px_rgba(120,193,255,0.2)] ${
                        bizCompactLevel === 0 ? 'h-6 w-6' : bizCompactLevel === 1 ? 'h-5 w-5' : 'h-4 w-4'
                      }`}
                    >
                      <Icon size={bizCompactLevel === 0 ? 11 : bizCompactLevel === 1 ? 10 : 9} />
                    </span>
                  </div>
                  <div
                    className={`font-mono font-black leading-none text-[#d8f1ff] ${
                      bizCompactLevel === 0 ? 'mt-1 text-[22px]' : bizCompactLevel === 1 ? 'mt-0.5 text-[18px]' : 'mt-0.5 text-[16px]'
                    }`}
                  >
                    {m.value}
                  </div>
                </div>
              );
            })}
          </div>
          <div className={`min-h-[64px] rounded bg-[#0a3268] text-[#9bc8ff] ${bizCompactLevel === 0 ? 'px-2 py-1 text-xs' : 'px-2 py-0.5 text-[11px]'}`}>
            <div className="grid h-full min-h-[52px] grid-rows-[2fr_1fr]">
              <div className="flex items-center justify-between">
                <span>业务可用率</span>
                <span className={`font-bold text-[var(--sys-state-success)] ${bizCompactLevel === 0 ? 'text-[20px] leading-none' : 'text-[18px] leading-none'}`}>99.36%</span>
              </div>
              <div className="flex items-center">
                <div className={`w-full rounded-full bg-[#123d74] ${bizCompactLevel === 0 ? 'h-2' : 'h-1.5'}`}>
                  <div className={`w-[99.36%] rounded-full bg-gradient-to-r from-[#00b8ff] via-[var(--sys-state-info)] to-[var(--sys-state-success)] ${bizCompactLevel === 0 ? 'h-2' : 'h-1.5'}`} />
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('量子密钥健康度')}
          <div className="relative flex-1 min-h-[160px] xl:min-h-0">
            <div className="absolute inset-0">
              <BaseChart option={keyHealthOption} />
            </div>
            <div className="absolute left-2 top-2 flex items-center gap-2 text-[10px] text-[var(--sys-text-secondary)]">
              <span className="inline-flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-[#2dd4ff]" />剩余</span>
              <span className="inline-flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-[#1e3a8a]" />已消耗</span>
            </div>
            <div className="absolute left-1 top-6 text-[11px] text-[var(--sys-text-secondary)]">总量: 122880B</div>
            <div className="absolute right-1 top-6 text-right text-[11px] text-[var(--sys-text-secondary)]">剩余: 92640B</div>
            <div className="absolute left-1 bottom-2 text-[11px] text-[var(--sys-text-secondary)]">可用比例: 75.4%</div>
            <div className="absolute bottom-2 right-16 text-right text-[11px] text-[var(--sys-text-secondary)]">10分钟前更新</div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="text-[24px] font-black text-[#c9f5ff]">75.4%</div>
              <div className="text-[11px] text-[#7fdfff]">密钥健康</div>
            </div>
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('量子隧道覆盖率')}
          <div className="relative flex-1 min-h-[160px] xl:min-h-0">
            <BaseChart option={quantumCoverageOption} />
            <div className="absolute left-2 top-2 flex items-center gap-2 text-[10px] text-[var(--sys-text-secondary)]">
              <span className="inline-flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-[#7c3aed]" />量子</span>
              <span className="inline-flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-[#667085]" />普通</span>
            </div>
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="text-[24px] font-black text-[#d7c2ff]">{quantumCoverage.toFixed(2)}%</div>
              <div className="text-[11px] text-[#b89cff]">量子覆盖率</div>
            </div>
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('加密算法合规分布')}
          <div className="flex flex-1 flex-col justify-center gap-1.5 px-1">
            <div className="flex items-center justify-between text-[11px] text-[#a9d3ff]">
              <span className="inline-flex items-center gap-1">
                <i className="h-1.5 w-1.5 rounded-full bg-[#dc2626]" />
                国密 SM3+SM4
              </span>
              <span className="font-semibold text-[#ffcccc]">{gmRate}%</span>
            </div>
            <div className="h-5 overflow-hidden rounded border border-[#1f5b9b] bg-[#0a2f5e]">
              <div className="flex h-full w-full">
                <div className="flex items-center justify-center bg-[#dc2626] text-[10px] font-semibold text-white" style={{ width: `${gmRate}%` }}>
                  {gmRate}%
                </div>
                <div className="flex items-center justify-center bg-[#2563eb] text-[10px] font-semibold text-white" style={{ width: `${internationalRate}%` }}>
                  {internationalRate}%
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#a9d3ff]">
              <span className="inline-flex items-center gap-1">
                <i className="h-1.5 w-1.5 rounded-full bg-[#2563eb]" />
                国际 SHA256+AES256
              </span>
              <span className="font-semibold text-[#cde2ff]">{internationalRate}%</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[10px] text-[var(--sys-text-secondary)]">
              <div className="rounded-md bg-[#0d3b76]/70 px-2 py-1">国密隧道: 120</div>
              <div className="rounded-md bg-[#0d3b76]/70 px-2 py-1">国际隧道: 47</div>
            </div>
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 xl:row-span-2 ${panelClass}`}>
          {sectionTitleInline(
            '业务分布',
            tabPills(
              [
                { id: 'map', label: '站点地图' },
                { id: 'topology', label: '网络拓扑' },
              ],
              mapTab,
              (id) => setMapTab(id as MapTab)
            ),
            autoControls(mapAuto, setMapAuto)
          )}
          {mapTab === 'map' ? (
            <div className="flex h-full min-h-[420px] flex-col gap-1 xl:min-h-0">
              <div className="rounded border border-[var(--comp-panel-border)] bg-[var(--comp-panel-background)]/80 px-2 py-1 text-[10px] text-[#e0efff]">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" />正常</span>
                  <span className="inline-flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-[var(--sys-state-warning)]" />告警</span>
                  <span className="inline-flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-[var(--sys-state-danger)]" />离线</span>
                  <span className="inline-flex items-center gap-1">
                    <i className="relative h-2 w-2 rounded-full border border-[var(--sys-state-quantum)] bg-[#2a1652] shadow-[0_0_8px_rgba(168,85,247,0.65)]">
                      <span className="absolute -inset-1 rounded-full border border-[var(--sys-state-quantum)]/70" />
                    </i>
                    量子站点(Q)
                  </span>
                  <span className="inline-flex items-center gap-1"><i className="h-[2px] w-4 bg-[#3b82f6]" />普通隧道</span>
                  <span className="inline-flex items-center gap-1"><i className="h-[2px] w-4 bg-[#8b5cf6]" />量子隧道</span>
                  </div>
                  {/*<span className="text-[#8eb9e3]">地市下钻已暂时关闭</span>*/}
                </div>
              </div>
              <div className="relative flex-1 overflow-hidden rounded border border-[var(--comp-panel-border)] bg-[radial-gradient(circle_at_50%_50%,#123f7f_0%,#0d3369_46%,#08284f_72%,#061e40_100%)]">
              <div className="absolute inset-0 p-2">
                <div
                  ref={mapSvgRef}
                  className="h-full w-full overflow-hidden [&>svg]:h-full [&>svg]:w-full"
                  dangerouslySetInnerHTML={{ __html: mapSvgMarkup }}
                />
              </div>
              {originViewBox && (
                <svg
                  className="pointer-events-none absolute inset-0 z-[1] h-full w-full"
                  viewBox={`${(currentViewBox || originViewBox).x} ${(currentViewBox || originViewBox).y} ${(currentViewBox || originViewBox).width} ${(currentViewBox || originViewBox).height}`}
                  preserveAspectRatio={mapPreserveAspectRatio}
                >
                  {(() => {
                    const hefei = mapOverlayItems.find((c) => c.name === '合肥' && c.showBubble);
                    if (!hefei) return null;
                    const span = Math.max(1, mapOverlayCountRange.max - mapOverlayCountRange.min);
                    return (
                      <>
                        <defs>
                          <filter id="mapLinkGlow" x="-30%" y="-30%" width="160%" height="160%">
                            <feGaussianBlur stdDeviation="2.2" />
                          </filter>
                        </defs>
                        {mapOverlayItems
                          .filter((city) => city.showBubble && city.name !== '合肥')
                          .map((city, idx) => {
                            const weightRaw = (city.siteCount - mapOverlayCountRange.min) / span;
                            const weight = Math.max(0, Math.min(1, weightRaw));
                            const dx = hefei.cx - city.cx;
                            const dy = hefei.cy - city.cy;
                            const len = Math.max(0.001, Math.sqrt(dx * dx + dy * dy));
                            const nx = -dy / len;
                            const ny = dx / len;
                            const bend = (16 + weight * 30) * (idx % 2 === 0 ? 1 : -1);
                            const cx = (city.cx + hefei.cx) / 2 + nx * bend;
                            const cy = (city.cy + hefei.cy) / 2 + ny * bend;
                            const d = `M ${city.cx} ${city.cy - 6} Q ${cx} ${cy} ${hefei.cx} ${hefei.cy - 8}`;
                            const baseWidth = 0.9 + Math.pow(weight, 0.92) * 10.6;
                            const glowWidth = baseWidth + 2.9;
                            const flowWidth = 0.7 + weight * 3.3;
                            const shadowWidth = baseWidth + 0.9;
                            const color = city.hasQuantum ? COLOR_FLYLINE_QUANTUM : COLOR_FLYLINE_NORMAL;
                            const dashLen = 5 + weight * 8;
                            const gapLen = Math.max(2.2, 10 - weight * 4.6);
                            const duration = Math.max(1.1, 2.7 - weight * 1.25);
                            const orbDur = Math.max(0.9, 2.35 - weight * 1.1);
                            return (
                              <g key={`link-${city.name}`}>
                                <path
                                  d={d}
                                  transform="translate(0 1.15)"
                                  fill="none"
                                  stroke="#03122d"
                                  strokeOpacity={0.55}
                                  strokeWidth={shadowWidth}
                                  strokeLinecap="round"
                                />
                                <path
                                  d={d}
                                  fill="none"
                                  stroke={color}
                                  strokeOpacity={0.3}
                                  strokeWidth={glowWidth}
                                  filter="url(#mapLinkGlow)"
                                  strokeLinecap="round"
                                />
                                <path
                                  d={d}
                                  fill="none"
                                  stroke={color}
                                  strokeOpacity={0.72}
                                  strokeWidth={baseWidth}
                                  strokeLinecap="round"
                                />
                                <path
                                  d={d}
                                  fill="none"
                                  stroke={city.hasQuantum ? '#cdb6ff' : '#79c4ff'}
                                  strokeOpacity={0.92}
                                  strokeWidth={flowWidth}
                                  strokeDasharray={`${dashLen} ${gapLen}`}
                                  strokeLinecap="round"
                                >
                                  <animate
                                    attributeName="stroke-dashoffset"
                                    from="0"
                                    to={city.hasQuantum ? '-48' : '-40'}
                                    dur={`${duration}s`}
                                    repeatCount="indefinite"
                                  />
                                </path>
                                <circle r={0.7 + weight * 1.25} fill={city.hasQuantum ? '#dccbff' : '#9ed8ff'} fillOpacity={0.88}>
                                  <animateMotion
                                    path={d}
                                    dur={`${orbDur}s`}
                                    repeatCount="indefinite"
                                  />
                                </circle>
                              </g>
                            );
                          })}
                      </>
                    );
                  })()}
                  {mapOverlayItems.map((city) => {
                    const isDrillMode = !!drillCity;
                    const span = Math.max(1, mapOverlayCountRange.max - mapOverlayCountRange.min);
                    const weight = (city.siteCount - mapOverlayCountRange.min) / span;
                    const scale = city.showBubble ? 0.84 + weight * 0.66 : 0.84;
                    const nameFont = isDrillMode ? 7.2 : 8.8;
                    const nameHeight = isDrillMode ? 11.8 : 13.8;
                    const nameY = isDrillMode ? 3.2 : 3.9;
                    const nameWidth = Math.max(isDrillMode ? 24 : 30, city.name.length * (isDrillMode ? 8.2 : 9.4) + (isDrillMode ? 10 : 14));
                    const bubbleY = isDrillMode ? -13.2 : -16.5;
                    const outerR = (isDrillMode ? 10.2 : 12.1) * scale;
                    const hoverOuterR = (isDrillMode ? 10.8 : 12.8) * scale;
                    const innerR = (isDrillMode ? 7.6 : 8.5) * scale;
                    const hoverInnerR = (isDrillMode ? 8.2 : 9.2) * scale;
                    const bubbleNumFont = (isDrillMode ? 6.6 : 7.8) * (0.88 + weight * 0.5);
                    const qFont = (isDrillMode ? 4.8 : 5.6) * (0.9 + weight * 0.35);
                    return (
                      <g key={`overlay-${city.name}`} transform={`translate(${city.cx},${city.cy})`} pointerEvents="none">
                        {city.isHovered && city.showBubble && (
                          <g>
                            <circle cx={0} cy={bubbleY} r={isDrillMode ? 12 : 13.6} fill="none" stroke="#8fd9ff" strokeOpacity={0.85} strokeWidth={1.2}>
                              <animate attributeName="r" values={isDrillMode ? '10.5;14;10.5' : '12;18;12'} dur="1.1s" repeatCount="indefinite" />
                              <animate attributeName="stroke-opacity" values="0.85;0.22;0.85" dur="1.2s" repeatCount="indefinite" />
                            </circle>
                            <circle cx={0} cy={bubbleY} r={isDrillMode ? 9.6 : 11.5} fill="none" stroke="#4cc8ff" strokeOpacity={0.75} strokeWidth={1.1} />
                          </g>
                        )}
                        {city.showBubble && (
                        <g>
                          <circle
                            cx={0}
                            cy={bubbleY}
                            r={city.hasQuantum ? (city.isHovered ? hoverOuterR : outerR) : city.isHovered ? hoverOuterR - 0.8 : outerR - 0.9}
                            fill={city.hasQuantum ? 'rgba(88,28,135,0.34)' : 'rgba(15,84,156,0.25)'}
                            stroke={city.hasQuantum ? '#a855f7' : '#6bd6ff'}
                            strokeWidth={city.hasQuantum ? 1.8 : 1.4}
                            strokeOpacity={city.hasQuantum ? 0.95 : 0.8}
                          />
                          <circle cx={0} cy={bubbleY} r={city.isHovered ? hoverInnerR : innerR} fill={city.bubbleColor} stroke={city.bubbleStroke} strokeWidth={1.3} />
                          <text x={0} y={bubbleY + (isDrillMode ? 2.4 : 2.9)} textAnchor="middle" fontSize={bubbleNumFont} fontWeight={700} fill="#f8fdff">
                            {city.siteCount}
                          </text>
                          {city.hasQuantum && (
                            <text x={isDrillMode ? 8 : 9.4} y={bubbleY - (isDrillMode ? 7.1 : 8.4)} fontSize={qFont} fontWeight={700} fill="#e9d5ff">
                              Q
                            </text>
                          )}
                        </g>
                        )}

                        <rect
                          x={-nameWidth / 2}
                          y={isDrillMode ? -5.3 : -6.1}
                          width={nameWidth}
                          height={nameHeight}
                          rx={5.8}
                          fill={city.isHovered ? 'rgba(26,93,165,0.9)' : 'rgba(17,79,142,0.82)'}
                          stroke="#7dc6ff"
                          strokeOpacity={city.isHovered ? 0.85 : 0.55}
                          strokeWidth={1.15}
                        />
                        <text x={0} y={nameY} textAnchor="middle" fontSize={nameFont} fontWeight={700} fill="#ebf7ff">
                          {city.name}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}
              {drillCity && !mapPoints.some((p) => p.name === drillCity) && (
                <div className="absolute right-2 top-2 rounded border border-[#2b6cb3] bg-[var(--comp-panel-background)]/92 px-2 py-1 text-[10px] text-[#e8f4ff]">
                  {drillCity}暂无站点，已展示地市级地图。
                </div>
              )}
              {hoveredSite && (
                <div
                  className="pointer-events-none absolute z-[2] w-[188px] -translate-x-1/2 rounded border border-[#55a8ff]/75 bg-[linear-gradient(155deg,rgba(8,42,87,0.97)_0%,rgba(7,35,73,0.95)_58%,rgba(5,27,58,0.93)_100%)] p-2 text-[10px] text-[#e4f2ff] backdrop-blur-[2px] shadow-[0_0_22px_rgba(34,139,255,0.34)]"
                  style={{ left: `${hoveredSite.x}%`, top: `${hoveredSite.y - 9}%` }}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[11px] font-semibold tracking-[0.02em] text-[#f2f8ff]">{hoveredSite.site.name}</span>
                    <span className={`rounded border px-1 py-[1px] text-[9px] ${hoveredSite.site.quantum ? 'border-[#ba8bff]/60 bg-[#5b21b6]/72 text-[#f3e9ff]' : 'border-[#75c7ff]/55 bg-[#0b4d85]/78 text-[#d5eeff]'}`}>
                      {hoveredSite.site.quantum ? '量子站点' : '普通站点'}
                    </span>
                  </div>
                  <div className="text-[#e4f2ff]/95">类型: {hoveredSite.site.type}</div>
                  <div className="text-[#e4f2ff]/95">设备型号: {hoveredSite.site.model}</div>
                  <div className="text-[#e4f2ff]/95">隧道数: {hoveredSite.site.tunnels}</div>
                  <div className="text-[#e4f2ff]/95">量子状态: {hoveredSite.site.quantum ? '已启用' : '未启用'}</div>
                </div>
              )}
            </div>
            </div>
          ) : (
            <div className="relative flex-1 min-h-[420px] xl:min-h-0 overflow-hidden rounded border border-[var(--comp-panel-border)] bg-[radial-gradient(circle_at_50%_42%,#0d2f62_0%,#072349_58%,#051832_100%)]">
              <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_center,rgba(86,182,255,0.2)_0%,transparent_64%)]" />
              <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(104,162,230,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(104,162,230,0.16)_1px,transparent_1px)] [background-size:7%_7%]" />
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <filter id="topoGlow" x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="1.6" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="topoSoftGlow" x="-60%" y="-60%" width="220%" height="220%">
                    <feGaussianBlur stdDeviation="2.6" />
                  </filter>
                  <linearGradient id="quantumLinkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7d5cff" />
                    <stop offset="55%" stopColor="#ad7eff" />
                    <stop offset="100%" stopColor="#7d5cff" />
                  </linearGradient>
                  <linearGradient id="normalLinkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2f89df" />
                    <stop offset="100%" stopColor="#59b5ff" />
                  </linearGradient>
                </defs>
                {topologyLinks.map((link, idx) => {
                  const from = topologyNodeMap.get(link.from);
                  const to = topologyNodeMap.get(link.to);
                  if (!from || !to) return null;
                  const active = topologyActiveNode && (topologyActiveNode === link.from || topologyActiveNode === link.to);
                  const hovered = topologyHoverNode && (topologyHoverNode === link.from || topologyHoverNode === link.to);
                  const dx = to.x - from.x;
                  const dy = to.y - from.y;
                  const len = Math.max(0.001, Math.sqrt(dx * dx + dy * dy));
                  const nx = -dy / len;
                  const ny = dx / len;
                  const curve = link.quantum ? 2.4 : 1.7;
                  const dir = idx % 2 === 0 ? 1 : -1;
                  const cx = (from.x + to.x) / 2 + nx * curve * dir;
                  const cy = (from.y + to.y) / 2 + ny * curve * dir;
                  const d = `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
                  return (
                    <g key={`${link.from}-${link.to}`}>
                      <path
                        d={d}
                        fill="none"
                        stroke={link.quantum ? '#8f63ff' : '#45a2ff'}
                        strokeWidth={active ? 2.05 : link.quantum ? 1.45 : 0.96}
                        strokeOpacity={active || hovered ? 0.95 : link.quantum ? 0.72 : 0.56}
                        filter={active || hovered ? 'url(#topoGlow)' : undefined}
                      />
                      <path
                        d={d}
                        fill="none"
                        stroke={link.quantum ? 'url(#quantumLinkGrad)' : 'url(#normalLinkGrad)'}
                        strokeWidth={active ? 1.58 : link.quantum ? 1.02 : 0.7}
                        strokeDasharray={link.quantum ? (active ? '6 2' : '4.4 2.8') : '2.2 2.8'}
                        strokeOpacity={active || hovered ? 1 : 0.86}
                      >
                        <animate
                          attributeName="stroke-dashoffset"
                          from={link.quantum ? '0' : '9'}
                          to={link.quantum ? '-26' : '0'}
                          dur={link.quantum ? '1.8s' : '2.7s'}
                          repeatCount="indefinite"
                        />
                      </path>
                    </g>
                  );
                })}
                {topologyNodes.map((node) => {
                  const active = topologyActiveNode === node.id;
                  const hovered = topologyHoverNode === node.id;
                  const isHq = node.type === 'HQ';
                  const outerR = isHq ? (active ? 2.6 : 2.35) : active ? 1.86 : 1.62;
                  const innerR = isHq ? (active ? 1.45 : 1.32) : active ? 1.06 : 0.92;
                  const fill = isHq ? '#1ccdf0' : node.status === 'offline' ? '#ff4d4f' : node.status === 'warning' ? '#ff9d2e' : '#1ce688';
                  const stroke = isHq ? '#81ecff' : node.status === 'offline' ? '#ff9ea3' : node.status === 'warning' ? '#ffd08a' : '#a5f5cb';
                  const labelWidth = Math.max(10, node.id.length * 0.82);
                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x},${node.y})`}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setTopologyHoverNode(node.id)}
                      onMouseLeave={() => setTopologyHoverNode((cur) => (cur === node.id ? null : cur))}
                      onClick={() => setTopologyActiveNode((cur) => (cur === node.id ? null : node.id))}
                    >
                      {(hovered || active) && (
                        <circle cx={0} cy={0} r={isHq ? 4.3 : 3.2} fill="none" stroke={stroke} strokeOpacity={0.62} strokeWidth={0.5} filter="url(#topoSoftGlow)">
                          <animate attributeName="r" values={isHq ? '3.2;4.5;3.2' : '2.4;3.4;2.4'} dur="1.3s" repeatCount="indefinite" />
                          <animate attributeName="stroke-opacity" values="0.68;0.18;0.68" dur="1.3s" repeatCount="indefinite" />
                        </circle>
                      )}
                      <circle cx={0} cy={0} r={outerR} fill={isHq ? 'rgba(20,157,196,0.22)' : 'rgba(12,58,112,0.28)'} stroke={stroke} strokeWidth={0.52} />
                      <circle cx={0} cy={0} r={innerR} fill={fill} stroke={isHq ? '#7ED8EE' : stroke} strokeWidth={0.42} filter={active ? 'url(#topoGlow)' : undefined} />
                      <circle cx={isHq ? -0.35 : -0.24} cy={isHq ? -0.35 : -0.24} r={isHq ? 0.28 : 0.18} fill={isHq ? '#9CEBFF' : '#8ED8FF'} fillOpacity={0.72} />
                      <circle cx={0} cy={0} r={isHq ? 0.35 : 0.24} fill={isHq ? '#78D5EE' : '#79C9F0'} fillOpacity={isHq ? 0.58 : 0.48} />
                      <rect
                        x={-labelWidth / 2}
                        y={isHq ? 3.5 : 2.9}
                        width={labelWidth}
                        height={isHq ? 2.5 : 2.3}
                        rx={1.1}
                        fill={active ? 'rgba(27,86,152,0.95)' : 'rgba(17,66,122,0.86)'}
                        stroke={active ? '#8dd6ff' : '#5a9ad9'}
                        strokeWidth={0.35}
                      />
                      <text
                        x={0}
                        y={isHq ? 5.2 : 4.45}
                        textAnchor="middle"
                        fontSize={isHq ? 1.42 : 1.26}
                        fontWeight={650}
                        fill={active ? '#eef9ff' : '#c8e7ff'}
                      >
                        {node.id}
                      </text>
                    </g>
                  );
                })}
              </svg>
              <div className="absolute bottom-2 left-2 rounded bg-[#0a2d5b]/78 px-2 py-1 text-[10px] text-[#b9dfff] backdrop-blur-[1px]">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1"><i className="h-[2px] w-4 bg-[#8b5cf6]" />量子隧道</span>
                  <span className="inline-flex items-center gap-1"><i className="h-[2px] w-4 border-t border-dashed border-[#2b74d1]" />普通隧道</span>
                  <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-[#18c7e8]" />总部节点</span>
                  <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-[#24e889]" />地市在线</span>
                  <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-[#ff4d4f]" />地市离线</span>
                </div>
              </div>
              {topologyHoverNode && (() => {
                const p = topologyNodeMap.get(topologyHoverNode);
                const info = topologyNodeInfoMap.get(topologyHoverNode);
                if (!p || !info) return null;
                return (
                  <div
                    className="pointer-events-none absolute z-[2] w-[180px] -translate-x-1/2 rounded border border-[#2b6cb3] bg-[var(--comp-panel-background)]/95 p-2 text-[10px] text-[#e8f4ff] shadow-[0_0_18px_rgba(34,139,255,0.28)]"
                    style={{ left: `${p.x}%`, top: `${Math.max(6, p.y - 10)}%` }}
                  >
                    <div className="mb-1 text-[11px] font-semibold text-[#e6f3ff]">{topologyHoverNode}</div>
                    <div>类型: {info.type}</div>
                    <div>设备型号: {info.model}</div>
                    <div>隧道数: {info.tunnels}</div>
                    <div>量子状态: {info.quantum}</div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('量子服务器连接状态')}
          <div ref={qssScrollRef} className="flex-1 min-h-[170px] xl:min-h-0 space-y-1.5 overflow-auto pr-1">
            {qssList.map((qss) => (
              <div key={qss.name} className="rounded border border-[var(--comp-panel-border)] bg-[rgba(17,56,100,0.78)] p-2 text-[11px] text-[#e3f0ff]">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 font-semibold">
                    <Server size={11} className="text-[#8cd2ff]" />
                    {qss.name}
                  </span>
                  <span className={`flex items-center gap-1 ${qss.status === '已连接' ? 'text-[#31cfb7]' : 'text-[var(--sys-state-danger)]'}`}>
                    <i className={`h-1.5 w-1.5 rounded-full ${qss.status === '已连接' ? 'bg-[#31cfb7]' : 'animate-pulse bg-[var(--sys-state-danger)]'}`} />
                    {qss.status}
                  </span>
                </div>
                <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[var(--sys-text-secondary)]">
                  <span className="inline-flex items-center gap-1"><PlugZap size={10} className="text-[#67b7ff]" />接入点: {qss.zone}</span>
                  <span className="inline-flex items-center gap-1"><Timer size={10} className="text-[#67b7ff]" />响应: {qss.keepAlive}</span>
                  <span>服务版本: {qss.version}</span>
                  <span className="inline-flex items-center gap-1"><ShieldCheck size={10} className="text-[#67b7ff]" />加密服务正常</span>
                  <span className="col-span-2 text-[#a7c8e9]">区域: {qss.zone}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 ${panelClass}`}>
          {sectionTitleInline(
            '业务性能',
            tabPills(
              [
                { id: 'latency', label: '时延' },
                { id: 'loss', label: '丢包' },
                { id: 'jitter', label: '抖动' },
                { id: 'throughput', label: '隧道流量' },
              ],
              perfTab,
              (id) => setPerfTab(id as PerfTab)
            ),
            autoControls(perfAuto, setPerfAuto)
          )}
          <div className="flex-1 min-h-[160px] xl:min-h-0">
            <BaseChart option={perfOption} />
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 ${panelClass}`}>
          {sectionTitleInline(
            'TOP排行',
            tabPills(
              [
                { id: 'bandwidth', label: '带宽' },
                { id: 'device', label: '设备性能' },
                { id: 'key', label: '密钥剩余' },
              ],
              topTab,
              (id) => setTopTab(id as TopTab)
            ),
            autoControls(topAuto, setTopAuto)
          )}
          <div className="flex-1 min-h-[160px] xl:min-h-0">
            <BaseChart option={topOption} />
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 ${panelClass}`}>
          {sectionTitleInline(
            '风险概况',
            tabPills(
              [
                { id: 'level', label: '风险等级' },
                { id: 'realtime', label: '实时风险' },
              ],
              alarmOverviewTab,
              (id) => setAlarmOverviewTab(id as AlarmOverviewTab)
            ),
            autoControls(alarmOverviewAuto, setAlarmOverviewAuto)
          )}
          {alarmOverviewTab === 'level' ? (
            <div className="relative flex-1 min-h-[160px] xl:min-h-0">
              <BaseChart option={alarmOverviewOption} />
              <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="text-[22px] font-black text-[#e5f2ff]">36</div>
                <div className="text-[11px] text-[var(--sys-text-secondary)]">需关注事项</div>
              </div>
            </div>
          ) : (
            <div ref={realtimeAlarmScrollRef} className="relative flex-1 min-h-[160px] xl:min-h-0 overflow-auto rounded border border-[var(--comp-panel-border)] bg-[rgba(17,56,100,0.78)]">
              <div className="sticky top-0 z-10 grid grid-cols-[38px_48px_1fr_1fr_66px] border-b border-[var(--comp-panel-border)] bg-[#174a81] px-2 py-1 text-[11px] text-[var(--sys-text-secondary)]">
                <span>#</span><span>级别</span><span>网元</span><span>原因</span><span>时间</span>
              </div>
              {realtimeAlarms.map((a, i) => (
                <div key={`${a.site}-${i}`} className="grid grid-cols-[38px_48px_1fr_1fr_66px] px-2 py-1 text-[11px] text-[#e3f0ff] odd:bg-[#123e70]/42">
                  <span>{i + 1}</span>
                  <span>
                    <i
                      className={`inline-flex min-w-[26px] items-center justify-center rounded px-1 py-[1px] text-[10px] font-semibold ${
                        a.level === '一级'
                          ? 'bg-[var(--sys-state-danger)]/25 text-[#ff7f7f]'
                          : a.level === '二级'
                            ? 'bg-[var(--sys-state-warning)]/25 text-[#ffd28a]'
                            : a.level === '三级'
                              ? 'bg-[#60a5fa]/25 text-[#9fc8ff]'
                              : 'bg-[#34d399]/20 text-[#8ce8c8]'
                      }`}
                    >
                      {a.level}
                    </i>
                  </span>
                  <span className="truncate">{a.site}</span>
                  <span className="truncate">{a.reason}</span>
                  <span>{a.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 ${panelClass}`}>
          {sectionTitleInline(
            '风险分析',
            tabPills(
              [
                { id: 'reason', label: '风险原因' },
                { id: 'highfreq', label: '高频站点' },
              ],
              alarmAnalysisTab,
              (id) => setAlarmAnalysisTab(id as AlarmAnalysisTab)
            ),
            autoControls(alarmAnalysisAuto, setAlarmAnalysisAuto)
          )}
          <div className="flex-1 min-h-[160px] xl:min-h-0">
            <BaseChart option={alarmAnalysisOption} />
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 ${panelClass}`}>
          {sectionTitleInline(
            '风险趋势',
            tabPills(
              [
                { id: 'history', label: '历史风险' },
                { id: 'keyUpdate', label: '密钥更新统计' },
              ],
              alarmTrendTab,
              (id) => setAlarmTrendTab(id as AlarmTrendTab)
            ),
            autoControls(alarmTrendAuto, setAlarmTrendAuto)
          )}
          <div className="flex-1 min-h-[160px] xl:min-h-0">
            <BaseChart option={alarmTrendOption} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuantumSDWANOverview;
