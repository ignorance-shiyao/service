import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Bell,
  BookOpen,
  Briefcase,
  Gauge,
  LayoutDashboard,
  Network,
  Package,
  Server,
  ShieldAlert,
  Wifi,
} from 'lucide-react';
import { BaseChart } from '../components/BaseChart';

const panelClass =
  'bg-[linear-gradient(180deg,rgba(13,59,114,0.95)_0%,rgba(8,44,90,0.94)_56%,rgba(7,37,77,0.94)_100%)] border border-[#2a6fb2]/90 rounded-md p-2 shadow-[inset_0_1px_0_rgba(220,241,255,0.12),0_8px_22px_rgba(3,24,54,0.26)] h-full flex flex-col';

const sectionTitle = (title: string, action?: React.ReactNode) => (
  <div className="mb-1 flex items-center justify-between border-b border-[#2d6fb3] pb-0.5 text-[#d7ebff] shrink-0">
    <div className="flex items-center">
      <span className="mr-2 text-[#4fb6ff]">|</span>
      <span className="text-xs font-semibold tracking-wide">{title}</span>
    </div>
    {action ? <div className="ml-2">{action}</div> : null}
  </div>
);

const metricCard = (label: string, value: string, icon: React.ReactNode) => (
  <div className="flex min-h-[56px] items-center justify-between rounded border border-[#3e7fbe]/55 bg-[linear-gradient(180deg,rgba(29,86,152,0.82)_0%,rgba(19,63,121,0.85)_100%)] p-2">
    <div>
      <div className="mb-0.5 text-[11px] text-[#a9d5ff]">{label}</div>
      <div className="font-mono text-[32px] font-black leading-none tracking-wide text-[#d8f1ff]">{value}</div>
    </div>
    <div className="rounded-full border border-[#77beff]/45 bg-[#2f78d4]/35 p-1.5 text-[#b7e4ff]">{icon}</div>
  </div>
);

const lineOption = {
  grid: { top: 22, left: 28, right: 10, bottom: 20 },
  legend: {
    top: 0,
    textStyle: { color: '#9fc8f2', fontSize: 10 },
    itemWidth: 10,
    itemHeight: 6,
  },
  xAxis: {
    type: 'category',
    data: ['04-06', '04-07', '04-08', '04-09', '04-10', '04-11', '04-12', '04-13', '04-14', '04-15'],
  },
  yAxis: { type: 'value' },
  series: [
    {
      name: '池州',
      type: 'bar',
      data: [12.1, 12.4, 11.6, 12.2, 12.0, 12.3, 12.1, 12.0, 11.9, 12.2],
      itemStyle: { color: '#2ea8ff' },
      barWidth: 8,
    },
    {
      name: '宿州',
      type: 'bar',
      data: [11.8, 12.0, 11.9, 11.7, 11.9, 11.8, 12.1, 11.7, 12.2, 11.8],
      itemStyle: { color: '#6f8ef7' },
      barWidth: 8,
    },
    {
      name: '亳州',
      type: 'bar',
      data: [12.0, 11.9, 12.3, 11.8, 12.2, 11.9, 12.0, 12.1, 11.8, 11.9],
      itemStyle: { color: '#5cc5ef' },
      barWidth: 8,
    },
  ],
};

const lossOption = {
  grid: { top: 22, left: 35, right: 12, bottom: 22 },
  legend: {
    top: 0,
    textStyle: { color: '#9fc8f2', fontSize: 10 },
    itemWidth: 10,
    itemHeight: 6,
  },
  xAxis: {
    type: 'category',
    data: ['04-01', '04-02', '04-03', '04-04', '04-05', '04-06', '04-07', '04-08', '04-09', '04-10', '04-11', '04-12', '04-13', '04-14', '04-15'],
  },
  yAxis: { type: 'value', min: 0, max: 0.03 },
  series: [
    { name: '池州', type: 'line', smooth: true, symbol: 'none', data: [0.021, 0.022, 0.021, 0.02, 0.023, 0.024, 0.022, 0.021, 0.023, 0.022, 0.023, 0.021, 0.022, 0.021, 0.022], lineStyle: { color: '#32c9c5', width: 2 } },
    { name: '亳州', type: 'line', smooth: true, symbol: 'none', data: [0.022, 0.021, 0.023, 0.022, 0.021, 0.022, 0.023, 0.022, 0.022, 0.021, 0.022, 0.023, 0.022, 0.021, 0.022], lineStyle: { color: '#f2c24f', width: 2 } },
    { name: '滁州', type: 'line', smooth: true, symbol: 'none', data: [0.02, 0.021, 0.022, 0.021, 0.02, 0.021, 0.022, 0.023, 0.022, 0.021, 0.022, 0.021, 0.022, 0.023, 0.022], lineStyle: { color: '#7ea2d7', width: 2 } },
  ],
};

const flowOption = {
  grid: { top: 22, left: 28, right: 10, bottom: 20 },
  legend: {
    top: 0,
    textStyle: { color: '#9fc8f2', fontSize: 10 },
  },
  xAxis: { type: 'category', data: ['04-06', '04-07', '04-08', '04-09', '04-10', '04-11', '04-12', '04-13', '04-14', '04-15'] },
  yAxis: { type: 'value', min: 3, max: 6.2 },
  series: [
    {
      name: '黄山',
      type: 'line',
      smooth: true,
      symbol: 'none',
      areaStyle: { color: 'rgba(54, 133, 255, 0.5)' },
      lineStyle: { color: '#5d92ff', width: 2 },
      data: [5.0, 5.0, 5.2, 5.5, 4.6, 5.6, 5.0, 5.2, 5.1, 5.3],
    },
    {
      name: '淮南',
      type: 'line',
      smooth: true,
      symbol: 'none',
      areaStyle: { color: 'rgba(33, 208, 255, 0.32)' },
      lineStyle: { color: '#2ed0ff', width: 2 },
      data: [4.9, 4.8, 5.0, 5.1, 4.9, 5.0, 5.4, 5.3, 5.2, 5.1],
    },
  ],
};

const donutOption = {
  tooltip: { trigger: 'item' },
  legend: {
    show: false,
  },
  series: [
    {
      type: 'pie',
      roseType: 'radius',
      radius: ['22%', '66%'],
      center: ['50%', '54%'],
      data: [
        { value: 82, name: '合肥市' },
        { value: 41, name: '芜湖市' },
        { value: 34, name: '阜阳市' },
        { value: 28, name: '宿州市' },
        { value: 23, name: '滁州市' },
      ],
      label: { color: '#a9d3ff', fontSize: 10, formatter: '{b}:{c}' },
      labelLine: { lineStyle: { color: '#5ea4e3' }, length: 10, length2: 12 },
      itemStyle: {
        borderColor: '#0a2b57',
        borderWidth: 2,
      },
      minAngle: 12,
    },
  ],
  color: ['#f66c47', '#f7bc3f', '#63d7cc', '#6b91ec', '#62cdf4'],
};

const barLineOption = {
  grid: { top: 30, left: 30, right: 34, bottom: 24 },
  legend: { top: 0, textStyle: { color: '#9fc8f2', fontSize: 10 } },
  xAxis: {
    type: 'category',
    data: ['合肥市', '芜湖市', '滁州市', '阜阳市', '六安市', '安庆', '马鞍山', '黄山'],
    axisLabel: { rotate: 45, color: '#9fc8f2', fontSize: 10 },
  },
  yAxis: [{ type: 'value', name: '次数(次)' }, { type: 'value', name: '时长(分钟)' }],
  series: [
    {
      name: '故障次数',
      type: 'bar',
      data: [22, 12, 12, 11, 11, 10, 10, 10],
      itemStyle: { color: '#29c2ea' },
      barWidth: 14,
    },
    {
      name: '平均故障时长',
      type: 'line',
      yAxisIndex: 1,
      smooth: true,
      data: [280, 270, 265, 190, 150, 130, 165, 195],
      lineStyle: { color: '#f5ae57', width: 2 },
      symbolSize: 6,
    },
  ],
};

const reasonOption = {
  series: [
    {
      type: 'pie',
      radius: ['62%', '80%'],
      data: [
        { value: 84.58, name: '客户侧' },
        { value: 15.42, name: '移动侧' },
      ],
      label: {
        color: '#a9d3ff',
        formatter: '{b}:{d}%',
        fontSize: 11,
      },
      itemStyle: { borderColor: '#0a2b57', borderWidth: 2 },
    },
  ],
  color: ['#f56f72', '#f2cc5a'],
};

const bandwidthTrendOption = (titleA: string, titleB: string, titleC: string) => ({
  grid: { top: 25, left: 28, right: 10, bottom: 20 },
  legend: {
    top: 0,
    textStyle: { color: '#9fc8f2', fontSize: 10 },
    data: [titleA, titleB, titleC],
  },
  xAxis: { type: 'category', data: ['04-01', '04-02', '04-03', '04-04', '04-05', '04-06', '04-07', '04-08', '04-09', '04-10', '04-11', '04-12', '04-13', '04-14', '04-15'] },
  yAxis: { type: 'value' },
  series: [
    {
      name: titleA,
      type: 'line',
      smooth: true,
      symbol: 'none',
      areaStyle: { color: 'rgba(56, 208, 190, 0.2)' },
      lineStyle: { color: '#38d0be', width: 2 },
      data: [45, 44, 42, 43, 46, 47, 45, 44, 43, 42, 44, 46, 47, 46, 45],
    },
    {
      name: titleB,
      type: 'line',
      smooth: true,
      symbol: 'none',
      lineStyle: { color: '#f6c35b', width: 2 },
      data: [42, 39, 38, 41, 43, 46, 39, 40, 51, 38, 37, 38, 39, 45, 41],
    },
    {
      name: titleC,
      type: 'line',
      smooth: true,
      symbol: 'none',
      lineStyle: { color: '#7f92af', width: 2 },
      data: [40, 41, 55, 42, 42, 43, 44, 41, 42, 46, 41, 40, 41, 47, 43],
    },
  ],
});

const memoryStackOption = (titleA: string, titleB: string, titleC: string) => ({
  grid: { top: 26, left: 28, right: 10, bottom: 20 },
  legend: {
    top: 0,
    textStyle: { color: '#9fc8f2', fontSize: 10 },
    data: [titleA, titleB, titleC],
  },
  xAxis: { type: 'category', data: ['04-01', '04-03', '04-05', '04-07', '04-09', '04-11', '04-13', '04-15'] },
  yAxis: { type: 'value', name: '(%)' },
  series: [
    {
      name: titleA,
      type: 'bar',
      stack: 'mem',
      data: [22, 21, 23, 24, 22, 21, 23, 22],
      itemStyle: { color: '#2ed0ff' },
      barWidth: 14,
    },
    {
      name: titleB,
      type: 'bar',
      stack: 'mem',
      data: [25, 24, 23, 22, 24, 25, 23, 24],
      itemStyle: { color: '#6f8ef7' },
      barWidth: 14,
    },
    {
      name: titleC,
      type: 'bar',
      stack: 'mem',
      data: [27, 28, 26, 25, 27, 28, 26, 27],
      itemStyle: { color: '#5ad8a6' },
      barWidth: 14,
    },
  ],
});

const cpuRadarOption = (titleA: string, titleB: string, titleC: string) => ({
  legend: {
    top: 0,
    textStyle: { color: '#9fc8f2', fontSize: 10 },
    data: [titleA, titleB, titleC],
  },
  radar: {
    center: ['50%', '58%'],
    radius: '62%',
    splitNumber: 4,
    axisName: { color: '#9fc8f2', fontSize: 10 },
    indicator: [
      { name: '核心1', max: 100 },
      { name: '核心2', max: 100 },
      { name: '核心3', max: 100 },
      { name: '核心4', max: 100 },
      { name: '核心5', max: 100 },
      { name: '核心6', max: 100 },
    ],
    splitLine: { lineStyle: { color: 'rgba(104, 170, 238, 0.45)' } },
    axisLine: { lineStyle: { color: 'rgba(104, 170, 238, 0.3)' } },
    splitArea: { areaStyle: { color: ['rgba(18,58,111,0.2)', 'rgba(18,58,111,0.08)'] } },
  },
  series: [
    {
      type: 'radar',
      symbol: 'none',
      data: [
        {
          name: titleA,
          value: [46, 52, 44, 49, 47, 50],
          lineStyle: { color: '#2ed0ff', width: 2 },
          areaStyle: { color: 'rgba(46, 208, 255, 0.18)' },
        },
        {
          name: titleB,
          value: [42, 45, 47, 44, 43, 46],
          lineStyle: { color: '#f6c35b', width: 2 },
          areaStyle: { color: 'rgba(246, 195, 91, 0.12)' },
        },
        {
          name: titleC,
          value: [38, 41, 39, 42, 40, 43],
          lineStyle: { color: '#7f92af', width: 2 },
          areaStyle: { color: 'rgba(127, 146, 175, 0.12)' },
        },
      ],
    },
  ],
});

const mapBubbleBase = [
  { name: '合肥', x: 56, y: 52, n: 11 },
  { name: '芜湖', x: 67, y: 64, n: 3 },
  { name: '蚌埠', x: 56, y: 33, n: 1 },
  { name: '马鞍山', x: 78, y: 61, n: 3 },
  { name: '安庆', x: 36, y: 71, n: 1 },
  { name: '阜阳', x: 27, y: 43, n: 3 },
  { name: '淮南', x: 49, y: 58, n: 3 },
  { name: '滁州', x: 66, y: 45, n: 5 },
  { name: '黄山', x: 66, y: 88, n: 5 },
  { name: '铜陵', x: 57, y: 75, n: 2 },
];

const panelSelect = (value: string) => (
  <div className="inline-flex h-5 min-w-[68px] items-center justify-between gap-1 rounded border border-[#3b79ba] bg-[linear-gradient(180deg,rgba(27,84,149,0.85)_0%,rgba(19,62,116,0.92)_100%)] px-1.5 text-[10px] font-medium text-[#c9e6ff]">
    <span>{value}</span>
    <span className="text-[#83c4ff]">▼</span>
  </div>
);

export const HomeOverview: React.FC = () => {
  const [mapSvgMarkup, setMapSvgMarkup] = useState('');
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;
    fetch('/ah_map.svg')
      .then((res) => res.text())
      .then((text) => {
        if (canceled) return;
        const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
        const svg = doc.querySelector('svg');
        if (!svg) {
          setMapSvgMarkup('');
          return;
        }
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.style.overflow = 'hidden';
        const shapes = Array.from(svg.querySelectorAll('path, polygon, polyline')) as SVGElement[];
        shapes.forEach((shape) => {
          shape.style.fill = '#2a60b8';
          shape.style.stroke = '#a8d7ff';
          shape.style.strokeWidth = '1.15';
          shape.style.strokeOpacity = '0.9';
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

  const mapBubble = useMemo(
    () =>
      mapBubbleBase.map((city) => ({
        ...city,
        // 随机一次后固定，避免数字漂移/跳动
        n: Math.floor(Math.random() * 12) + 1,
      })),
    []
  );
  const mapBubbleByCity = useMemo(
    () => new Map(mapBubble.map((item) => [item.name, item])),
    [mapBubble]
  );

  return (
    <div className="h-full w-full overflow-auto rounded-lg border border-[#1f5f9f] bg-[linear-gradient(180deg,#06264e_0%,#042144_46%,#031d3b_100%)] p-1.5">
      <div className="grid grid-cols-12 gap-1.5 xl:h-full xl:auto-rows-fr xl:grid-rows-[minmax(168px,0.72fr)_minmax(232px,1fr)_minmax(210px,0.92fr)]">
        <div className={`col-span-12 xl:col-span-3 xl:max-h-[238px] ${panelClass}`}>
          {sectionTitle('内网资源概览')}
          <div className="grid grid-cols-2 gap-1.5">
            {metricCard('站点数量(个)', '18', <Network size={16} />)}
            {metricCard('设备数量(个)', '54', <Server size={16} />)}
            {metricCard('端口数量(个)', '157', <Package size={16} />)}
            {metricCard('平均故障历时(小时)', '0', <AlertTriangle size={16} />)}
          </div>
          <div className="mt-1 rounded border border-[#2f6ca9]/60 bg-[linear-gradient(180deg,rgba(20,77,139,0.78)_0%,rgba(12,58,109,0.84)_100%)] px-2 py-1 text-xs text-[#b6d9ff]">
            <div className="mb-0.5 flex items-center justify-between">
              <span>业务可用率</span>
              <span className="font-bold text-white">100%</span>
            </div>
            <div className="h-2 rounded-full bg-[#184d8b]">
              <div className="h-2 w-full rounded-full bg-gradient-to-r from-[#3d88ff] to-[#7ac7ff]" />
            </div>
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 xl:max-h-[238px] ${panelClass}`}>
          {sectionTitle('站点时延')}
          <div className="flex-1 min-h-[128px] xl:min-h-0">
            <BaseChart option={lineOption} />
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 xl:max-h-[238px] ${panelClass}`}>
          {sectionTitle('站点丢包')}
          <div className="flex-1 min-h-[128px] xl:min-h-0">
            <BaseChart option={lossOption} />
          </div>
        </div>

        <div className={`col-span-12 xl:col-span-3 xl:max-h-[238px] ${panelClass}`}>
          {sectionTitle('站点流速', panelSelect('流入'))}
          <div className="flex-1 min-h-[128px] xl:min-h-0">
            <BaseChart option={flowOption} />
          </div>
        </div>

        <div className={`col-span-12 xl:col-span-3 xl:row-span-2 ${panelClass}`}>
          {sectionTitle('设备分布')}
          <div className="relative flex-1 min-h-[320px] xl:min-h-0 overflow-hidden rounded border border-[var(--comp-panel-border)] bg-[radial-gradient(circle_at_50%_50%,#123f7f_0%,#0d3369_46%,#08284f_72%,#061e40_100%)]">
            {mapSvgMarkup ? (
              <div
                className="pointer-events-none absolute inset-0 h-full w-full p-2 [&>svg]:h-full [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: mapSvgMarkup }}
              />
            ) : (
              <img
                src="/ah_map.svg"
                alt="安徽地图"
                className="pointer-events-none absolute inset-0 h-full w-full object-contain p-2 opacity-[0.88] [filter:brightness(0.9)_saturate(0.8)]"
              />
            )}
            {mapBubble.map((city) => {
              const site = mapBubbleByCity.get(city.name);
              const isHovered = hoveredCity === city.name;
              const hasSite = !!site;
              const left = `${city.x}%`;
              const top = `${city.y}%`;
              return (
                <div
                  key={city.name}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left, top }}
                  onMouseEnter={() => setHoveredCity(city.name)}
                  onMouseLeave={() => setHoveredCity(null)}
                >
                  {hasSite && (
                    <div
                      className={`mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full border font-mono text-base font-bold text-white backdrop-blur-[1px] transition ${
                        isHovered
                          ? 'border-[#76BFFF] bg-[#3b79df]/92 shadow-[0_0_14px_rgba(120,190,255,0.95)]'
                          : 'border-[#5FA8E8] bg-[#2e66ca]/78 shadow-[0_0_10px_rgba(90,168,255,0.46)]'
                      }`}
                    >
                      {site.n}
                    </div>
                  )}
                  <div
                    className={`rounded-full border px-2 py-[2px] text-center text-[12px] font-semibold leading-none transition ${
                      isHovered
                        ? 'border-[#6FB8F6] bg-[#1b579f]/95 text-[#d9ecff] shadow-[0_0_14px_rgba(120,190,255,0.55)]'
                        : hasSite
                          ? 'border-[#4b9ce0] bg-[#1a4d91]/76 text-[#d3ebff]'
                          : 'border-[#3a83c8] bg-[#15457f]/65 text-[#bddfff]'
                    }`}
                  >
                    {city.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('短信发送TOP5')}
          <div className="flex-1 min-h-[154px] xl:min-h-0">
            <BaseChart option={donutOption} />
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('故障高频区县')}
          <div className="flex-1 min-h-[154px] xl:min-h-0">
            <BaseChart option={barLineOption} />
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('故障原因分析')}
          <div className="flex-1 min-h-[154px] xl:min-h-0">
            <BaseChart option={reasonOption} />
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('设备带宽利用率', panelSelect('流入'))}
          <div className="flex-1 min-h-[160px] xl:min-h-0">
            <BaseChart option={bandwidthTrendOption('11楼02机房3号路由器', '3楼08机房4号路由器', '4楼05机房3号路由器')} />
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('设备内存利用率')}
          <div className="flex-1 min-h-[160px] xl:min-h-0">
            <BaseChart option={memoryStackOption('13楼01机房1号路由器', '5楼03机房4号交换机', '4楼05机房4号路由器')} />
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('设备CPU利用率')}
          <div className="flex-1 min-h-[160px] xl:min-h-0">
            <BaseChart option={cpuRadarOption('13楼01机房1号路由器', '16楼01机房3号路由器', '4楼05机房3号路由器')} />
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed left-4 top-[8px] z-10 flex items-center gap-2 text-[#9fd5ff] opacity-60">
        <LayoutDashboard size={14} />
        <Activity size={14} />
        <Wifi size={14} />
        <Bell size={14} />
        <ShieldAlert size={14} />
        <BookOpen size={14} />
        <Briefcase size={14} />
        <Gauge size={14} />
      </div>
    </div>
  );
};
