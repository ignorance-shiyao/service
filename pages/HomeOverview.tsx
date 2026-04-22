import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  'bg-[#072654]/96 border border-[#16508f] rounded-md p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] h-full flex flex-col';

const sectionTitle = (title: string) => (
  <div className="mb-1 flex items-center border-b border-[#1f5b9b] pb-0.5 text-slate-200 shrink-0">
    <span className="mr-2 text-[#4fb6ff]">|</span>
    <span className="text-xs font-semibold tracking-wide">{title}</span>
  </div>
);

const metricCard = (label: string, value: string, icon: React.ReactNode) => (
  <div className="flex min-h-[56px] items-center justify-between rounded bg-[#0e3e7e]/70 p-2">
    <div>
      <div className="mb-0.5 text-[11px] text-[#8bc4ff]">{label}</div>
      <div className="font-mono text-[32px] font-black leading-none tracking-wide text-[#d8f1ff]">{value}</div>
    </div>
    <div className="rounded-full bg-[#2f78d4]/40 p-1.5 text-[#8fd3ff]">{icon}</div>
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

export const HomeOverview: React.FC = () => {
  const [mapSvgMarkup, setMapSvgMarkup] = useState('');
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [cityAnchors, setCityAnchors] = useState<Array<{ name: string; xPct: number; yPct: number }>>([]);
  const mapSvgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let canceled = false;
    fetch('/ah_map.svg')
      .then((res) => res.text())
      .then((text) => {
        if (canceled) return;
        // Preprocess SVG colors before first paint to avoid flashing original colors.
        const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
        const svg = doc.querySelector('svg');
        if (svg) {
          svg.setAttribute('width', '100%');
          svg.setAttribute('height', '100%');
          svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          svg.style.overflow = 'hidden';
          const cityGroups = Array.from(svg.querySelectorAll('g[id$="市"]')) as SVGGElement[];
          cityGroups.forEach((g) => g.classList.add('ah-city'));
          const styleNode = doc.createElement('style');
          styleNode.textContent = `
            @keyframes homeCityGlow {
              0% { filter: drop-shadow(0 0 5px rgba(130,190,255,0.3)); }
              50% { filter: drop-shadow(0 0 11px rgba(130,190,255,0.95)); }
              100% { filter: drop-shadow(0 0 5px rgba(130,190,255,0.3)); }
            }
            .ah-city path, .ah-city polygon, .ah-city polyline {
              transition: fill 180ms ease, stroke 180ms ease, filter 180ms ease, stroke-width 180ms ease, opacity 180ms ease;
              pointer-events: all;
            }
          `;
          svg.prepend(styleNode);
          const shapes = Array.from(svg.querySelectorAll('path, polygon, polyline')) as SVGElement[];
          shapes.forEach((shape) => {
            shape.style.fill = '#2756B5';
            shape.style.stroke = '#A9D7FF';
            shape.style.strokeWidth = '1.2';
            shape.style.strokeOpacity = '0.92';
            shape.style.transition =
              'fill 180ms ease, stroke 180ms ease, filter 180ms ease, stroke-width 180ms ease';
            shape.style.cursor = 'pointer';
          });
          setMapSvgMarkup(svg.outerHTML);
          return;
        }
        setMapSvgMarkup(text);
      })
      .catch(() => {
        if (!canceled) setMapSvgMarkup('');
      });
    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapSvgRef.current || !mapSvgMarkup) return;
    const svgRoot = mapSvgRef.current.querySelector('svg');
    if (!svgRoot) return;

    const shapes = Array.from(svgRoot.querySelectorAll('path, polygon, polyline')) as SVGElement[];
    if (shapes.length === 0) return;

    svgRoot.setAttribute('width', '100%');
    svgRoot.setAttribute('height', '100%');
    svgRoot.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svgRoot.style.overflow = 'hidden';

    shapes.forEach((shape) => {
      shape.style.fill = '#2756B5';
      shape.style.stroke = '#A9D7FF';
      shape.style.strokeWidth = '1.2';
      shape.style.strokeOpacity = '0.92';
      shape.style.transition = 'fill 180ms ease, stroke 180ms ease, filter 180ms ease, stroke-width 180ms ease';
      shape.style.cursor = 'pointer';
    });

    const cityGroups = Array.from(svgRoot.querySelectorAll('g.ah-city, g[id$="市"]')) as SVGGElement[];
    cityGroups.forEach((group) => {
      group.style.transition = 'opacity 180ms ease, transform 180ms ease';
    });
    const syncHoverStyles = (activeCity: string | null) => {
      cityGroups.forEach((group) => {
        const city = group.id.replace(/市$/, '');
        const active = !!activeCity && activeCity === city;
        const dimmed = !!activeCity && activeCity !== city;
        const shapesInGroup = Array.from(group.querySelectorAll('path, polygon, polyline')) as SVGElement[];
        group.style.opacity = dimmed ? '0.3' : '1';
        group.style.transformOrigin = 'center center';
        group.style.transformBox = 'fill-box';
        group.style.transform = active ? 'scale(1.01)' : 'scale(1)';
        shapesInGroup.forEach((shape) => {
          shape.style.fill = active ? '#5b8ff0' : '#2756B5';
          shape.style.stroke = active ? '#ffffff' : '#A9D7FF';
          shape.style.strokeWidth = active ? '2.35' : '1.2';
          shape.style.animation = active ? 'homeCityGlow 1.25s ease-in-out infinite' : 'none';
          shape.style.filter = active
            ? 'drop-shadow(0 0 18px rgba(168,222,255,0.96)) brightness(1.12)'
            : dimmed
              ? 'brightness(0.72)'
              : 'none';
        });
      });
    };

    const handlePointerMove = (event: Event) => {
      const pe = event as PointerEvent;
      const target = document.elementFromPoint(pe.clientX, pe.clientY) as Element | null;
      const group = target?.closest?.('g.ah-city, g[id$="市"]') as SVGGElement | null;
      const city = group ? group.id.replace(/市$/, '') : null;
      setHoveredCity(city);
      syncHoverStyles(city);
    };

    const handlePointerLeave = () => {
      setHoveredCity(null);
      syncHoverStyles(null);
    };

    const calcAnchors = () => {
      const hostRect = mapSvgRef.current?.getBoundingClientRect();
      if (!hostRect || hostRect.width <= 0 || hostRect.height <= 0) return;
      const ctm = svgRoot.getScreenCTM();
      if (!ctm) return;
      const anchors = cityGroups
        .map((group) => {
          const box = group.getBBox();
          if (!Number.isFinite(box.width) || !Number.isFinite(box.height) || box.width < 1 || box.height < 1) {
            return null;
          }
          const p = svgRoot.createSVGPoint();
          p.x = box.x + box.width / 2;
          p.y = box.y + box.height / 2;
          const sp = p.matrixTransform(ctm);
          const xPct = ((sp.x - hostRect.left) / hostRect.width) * 100;
          const yPct = ((sp.y - hostRect.top) / hostRect.height) * 100;
          return { name: group.id.replace(/市$/, ''), xPct, yPct };
        })
        .filter(
          (a): a is { name: string; xPct: number; yPct: number } =>
            !!a &&
            Number.isFinite(a.xPct) &&
            Number.isFinite(a.yPct) &&
            a.xPct > 1 &&
            a.xPct < 99 &&
            a.yPct > 1 &&
            a.yPct < 99
        );
      // 只要有有效锚点就更新；单个异常点不会影响全部地市
      if (anchors.length > 0) setCityAnchors(anchors);
    };
    calcAnchors();
    const rafId = window.requestAnimationFrame(calcAnchors);
    const resizeObserver = new ResizeObserver(calcAnchors);
    resizeObserver.observe(svgRoot);

    const host = mapSvgRef.current;
    if (host) {
      host.addEventListener('pointermove', handlePointerMove);
      host.addEventListener('pointerleave', handlePointerLeave);
    } else {
      svgRoot.addEventListener('pointermove', handlePointerMove);
      svgRoot.addEventListener('pointerleave', handlePointerLeave);
    }
    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      if (host) {
        host.removeEventListener('pointermove', handlePointerMove);
        host.removeEventListener('pointerleave', handlePointerLeave);
      } else {
        svgRoot.removeEventListener('pointermove', handlePointerMove);
        svgRoot.removeEventListener('pointerleave', handlePointerLeave);
      }
    };
  }, [mapSvgMarkup]);

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
    <div className="h-full w-full overflow-auto rounded-lg border border-[#0c3d75] bg-[#031737] p-1.5">
      <div className="grid grid-cols-12 gap-1.5 xl:h-full xl:auto-rows-fr xl:grid-rows-[minmax(168px,0.72fr)_minmax(232px,1fr)_minmax(210px,0.92fr)]">
        <div className={`col-span-12 xl:col-span-3 xl:max-h-[238px] ${panelClass}`}>
          {sectionTitle('内网资源概览')}
          <div className="grid grid-cols-2 gap-1.5">
            {metricCard('站点数量(个)', '18', <Network size={16} />)}
            {metricCard('设备数量(个)', '54', <Server size={16} />)}
            {metricCard('端口数量(个)', '157', <Package size={16} />)}
            {metricCard('平均故障历时(小时)', '0', <AlertTriangle size={16} />)}
          </div>
          <div className="mt-1 rounded bg-[#0a3268] px-2 py-1 text-xs text-[#9bc8ff]">
            <div className="mb-0.5 flex items-center justify-between">
              <span>业务可用率</span>
              <span className="font-bold text-white">100%</span>
            </div>
            <div className="h-2 rounded-full bg-[#123d74]">
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
          {sectionTitle('站点流速')}
          <div className="flex-1 min-h-[128px] xl:min-h-0">
            <BaseChart option={flowOption} />
          </div>
        </div>

        <div className={`col-span-12 xl:col-span-3 xl:row-span-2 ${panelClass}`}>
          {sectionTitle('设备分布')}
          <div className="relative flex-1 min-h-[320px] xl:min-h-0 overflow-hidden rounded border border-[#2a67aa] bg-[radial-gradient(circle_at_50%_50%,#123f7f_0%,#0d3369_46%,#08284f_72%,#061e40_100%)]">
            <div className="absolute inset-0 p-2">
              <div
                ref={mapSvgRef}
                className="h-full w-full overflow-hidden [&>svg]:h-full [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: mapSvgMarkup }}
              />
            </div>
            {(cityAnchors.length > 0 ? cityAnchors : mapBubble.map((item) => ({ name: item.name, xPct: item.x, yPct: item.y }))).map((city) => {
              const site = mapBubbleByCity.get(city.name);
              const isHovered = hoveredCity === city.name;
              const hasSite = !!site;
              const left = `${city.xPct}%`;
              const top = `${city.yPct}%`;
              return (
                <div
                  key={city.name}
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left, top }}
                >
                  {hasSite && (
                    <div
                      className={`mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full border font-mono text-base font-bold text-white backdrop-blur-[1px] transition ${
                        isHovered
                          ? 'border-[#dff4ff] bg-[#3b79df]/92 shadow-[0_0_14px_rgba(120,190,255,0.95)]'
                          : 'border-[#97cdff] bg-[#2e66ca]/78 shadow-[0_0_10px_rgba(90,168,255,0.46)]'
                      }`}
                    >
                      {site.n}
                    </div>
                  )}
                  <div
                    className={`rounded-full border px-2 py-[2px] text-center text-[12px] font-semibold leading-none transition ${
                      isHovered
                        ? 'border-[#b7e1ff] bg-[#1b579f]/95 text-[#f2f9ff] shadow-[0_0_14px_rgba(120,190,255,0.55)]'
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
          {sectionTitle('设备带宽利用率')}
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
