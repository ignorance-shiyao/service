import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BaseChart } from '../components/BaseChart';

const panelClass =
  'bg-[#072654]/96 border border-[#16508f] rounded-md p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] h-full flex flex-col';

const sectionTitle = (title: string) => (
  <div className="mb-1 flex items-center border-b border-[#1f5b9b] pb-0.5 text-slate-200 shrink-0">
    <span className="mr-2 text-[#4fb6ff]">|</span>
    <span className="text-xs font-semibold tracking-wide">{title}</span>
  </div>
);

const metricRow = [
  { label: '站点总数', value: '86' },
  { label: 'CPE设备数', value: '312' },
  { label: '隧道总数', value: '1248' },
  { label: '量子隧道占比', value: '68.4%' },
];

const keyHealth = [
  { label: '已充注密钥总量', value: '1480 KB' },
  { label: '当前剩余密钥', value: '912 KB' },
  { label: '更新成功率(24h)', value: '99.21%' },
  { label: '最近更新', value: '19:42:15' },
];

const netPerf = [
  { label: '平均时延', value: '21.6 ms' },
  { label: '平均丢包率', value: '0.19%' },
  { label: '平均抖动', value: '4.2 ms' },
  { label: 'SLA达标率', value: '98.72%' },
];

const alarmOverview = [
  { label: '待处理告警', value: 47 },
  { label: '严重告警', value: 9 },
  { label: '24h新增告警', value: 62 },
  { label: '平均处理时长', value: '18 min' },
];

const quantumTunnelOption = {
  legend: { bottom: 0, textStyle: { color: '#9fc8f2', fontSize: 10 } },
  series: [
    {
      type: 'pie',
      radius: ['42%', '72%'],
      center: ['50%', '44%'],
      label: { color: '#a9d3ff', fontSize: 10, formatter: '{b}\n{d}%' },
      data: [
        { name: '量子隧道', value: 853 },
        { name: '普通IPSec', value: 346 },
        { name: '未加密', value: 49 },
      ],
      itemStyle: { borderColor: '#0a2b57', borderWidth: 2 },
    },
  ],
  color: ['#8f6dff', '#31cfb7', '#7e8ba8'],
};

const keyTrendOption = {
  grid: { top: 24, left: 32, right: 30, bottom: 20 },
  legend: { top: 0, textStyle: { color: '#9fc8f2', fontSize: 10 } },
  xAxis: { type: 'category', data: ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22'] },
  yAxis: [{ type: 'value', name: '成功次数' }, { type: 'value', name: '失败次数' }],
  series: [
    { name: '入向成功', type: 'line', smooth: true, symbol: 'none', data: [31, 30, 31, 32, 30, 31, 33, 32, 31, 30, 32, 31], lineStyle: { color: '#8f6dff', width: 2 } },
    { name: '出向成功', type: 'line', smooth: true, symbol: 'none', data: [30, 29, 30, 31, 30, 30, 32, 31, 30, 30, 31, 30], lineStyle: { color: '#31cfb7', width: 2 } },
    { name: '失败次数', type: 'bar', yAxisIndex: 1, data: [1, 0, 1, 2, 1, 0, 1, 1, 0, 1, 2, 1], itemStyle: { color: '#f5b963' }, barWidth: 10 },
  ],
};

const top5BandwidthOption = {
  grid: { top: 20, left: 78, right: 20, bottom: 20 },
  xAxis: { type: 'value', axisLabel: { color: '#88b5e4', fontSize: 10 } },
  yAxis: { type: 'category', data: ['合肥政务云A', '芜湖智造园区', '滁州应急中心', '马鞍山钢铁集团', '安庆卫健专网'], axisLabel: { color: '#9fc8f2', fontSize: 10 } },
  series: [
    {
      type: 'bar',
      data: [91, 84, 79, 73, 68],
      barWidth: 12,
      itemStyle: { color: '#4ba8ff', borderRadius: [0, 6, 6, 0] },
      label: { show: true, position: 'right', color: '#cfe7ff', fontSize: 10, formatter: '{c}%' },
    },
  ],
};

const qualityRadarOption = {
  radar: {
    center: ['50%', '55%'],
    radius: '65%',
    splitNumber: 4,
    indicator: [
      { name: '时延', max: 100 },
      { name: '丢包', max: 100 },
      { name: '抖动', max: 100 },
      { name: '可用率', max: 100 },
      { name: '切换稳定性', max: 100 },
    ],
    axisName: { color: '#9fc8f2', fontSize: 10 },
    splitLine: { lineStyle: { color: 'rgba(98,164,233,0.45)' } },
    axisLine: { lineStyle: { color: 'rgba(98,164,233,0.35)' } },
    splitArea: { areaStyle: { color: ['rgba(17,55,105,0.25)', 'rgba(17,55,105,0.08)'] } },
  },
  series: [
    {
      type: 'radar',
      data: [
        {
          value: [88, 82, 79, 95, 84],
          areaStyle: { color: 'rgba(143,109,255,0.28)' },
          lineStyle: { color: '#8f6dff', width: 2 },
          symbol: 'none',
        },
      ],
    },
  ],
};

const tunnelMatrixOption = {
  series: [
    {
      type: 'pie',
      radius: ['50%', '68%'],
      center: ['74%', '55%'],
      data: [
        { name: 'UP', value: 1216 },
        { name: 'DOWN', value: 32 },
      ],
      label: { color: '#a9d3ff', fontSize: 10, formatter: '{b}:{c}' },
      itemStyle: { borderColor: '#0a2b57', borderWidth: 2 },
    },
  ],
  color: ['#3ad0a5', '#f56f72'],
};

const alarmLevelOption = {
  series: [
    {
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['50%', '50%'],
      data: [
        { name: '一级', value: 9 },
        { name: '二级', value: 18 },
        { name: '三级', value: 56 },
        { name: '四级', value: 121 },
      ],
      label: { color: '#a9d3ff', fontSize: 10, formatter: '{b}:{c}' },
      itemStyle: { borderColor: '#0a2b57', borderWidth: 2 },
    },
  ],
  color: ['#f56f72', '#f5b963', '#f1df68', '#84d18d'],
};

const reasonOption = {
  series: [
    {
      type: 'pie',
      radius: ['52%', '72%'],
      center: ['50%', '50%'],
      data: [
        { name: '网络侧', value: 34 },
        { name: '设备侧', value: 23 },
        { name: '量子服务侧', value: 17 },
        { name: '链路侧', value: 14 },
        { name: '客户侧', value: 12 },
      ],
      label: { color: '#a9d3ff', fontSize: 10, formatter: '{b}:{d}%' },
      itemStyle: { borderColor: '#0a2b57', borderWidth: 2 },
    },
  ],
  color: ['#5d92ff', '#31cfb7', '#8f6dff', '#f5b963', '#7e8ba8'],
};

const historyAlarmOption = {
  grid: { top: 24, left: 32, right: 12, bottom: 20 },
  xAxis: { type: 'category', data: ['03-18', '03-20', '03-22', '03-24', '03-26', '03-28', '03-30', '04-01', '04-03', '04-05', '04-07', '04-09', '04-11', '04-13', '04-15'] },
  yAxis: { type: 'value' },
  series: [
    {
      name: '历史告警数',
      type: 'line',
      smooth: true,
      symbol: 'none',
      data: [86, 92, 88, 96, 101, 98, 94, 108, 112, 105, 97, 89, 84, 91, 87],
      lineStyle: { color: '#4ba8ff', width: 2 },
      areaStyle: { color: 'rgba(75,168,255,0.25)' },
    },
  ],
};

const realtimeAlarms = [
  { level: '一级', device: '合肥-HUB-01', reason: '主隧道闪断', time: '19:43:08' },
  { level: '二级', device: '芜湖-CPE-07', reason: '量子密钥更新失败', time: '19:41:55' },
  { level: '三级', device: '滁州-CPE-11', reason: '链路抖动超阈值', time: '19:39:12' },
  { level: '二级', device: '马鞍山-CPE-03', reason: 'QSS连接重连', time: '19:35:46' },
  { level: '四级', device: '安庆-CPE-09', reason: '站点离线恢复', time: '19:31:27' },
  { level: '三级', device: '宿州-CPE-14', reason: '业务时延升高', time: '19:27:15' },
  { level: '二级', device: '铜陵-CPE-05', reason: '备隧道切换', time: '19:23:49' },
  { level: '三级', device: '蚌埠-CPE-06', reason: '密钥剩余低于阈值', time: '19:20:01' },
];

const mapBubbleBase = [
  { name: '合肥', x: 56, y: 52 },
  { name: '芜湖', x: 67, y: 64 },
  { name: '蚌埠', x: 56, y: 33 },
  { name: '马鞍山', x: 78, y: 61 },
  { name: '安庆', x: 36, y: 71 },
  { name: '阜阳', x: 27, y: 43 },
  { name: '淮南', x: 49, y: 58 },
  { name: '滁州', x: 66, y: 45 },
  { name: '黄山', x: 66, y: 88 },
  { name: '铜陵', x: 57, y: 75 },
];

const qssNodes = [
  { id: 'QSS-HEF-01', status: '在线', delay: '8ms', device: 112 },
  { id: 'QSS-WHU-02', status: '在线', delay: '11ms', device: 84 },
  { id: 'QSS-ANQ-03', status: '在线', delay: '15ms', device: 67 },
  { id: 'QSS-BBB-04', status: '波动', delay: '28ms', device: 49 },
];

export const QuantumSDWANOverview: React.FC = () => {
  const [mapSvgMarkup, setMapSvgMarkup] = useState('');
  const mapSvgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let canceled = false;
    fetch('/ah_map.svg')
      .then((res) => res.text())
      .then((text) => {
        if (canceled) return;
        const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
        const svg = doc.querySelector('svg');
        if (svg) {
          svg.setAttribute('width', '100%');
          svg.setAttribute('height', '100%');
          svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          svg.style.overflow = 'hidden';
          const shapes = Array.from(svg.querySelectorAll('path, polygon, polyline')) as SVGElement[];
          shapes.forEach((shape) => {
            shape.style.fill = '#2756B5';
            shape.style.stroke = '#A9D7FF';
            shape.style.strokeWidth = '1.2';
            shape.style.strokeOpacity = '0.9';
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

    shapes.forEach((shape) => {
      shape.style.fill = '#2756B5';
      shape.style.stroke = '#A9D7FF';
      shape.style.strokeWidth = '1.2';
      shape.style.strokeOpacity = '0.9';
      shape.style.transition = 'fill 180ms ease, stroke 180ms ease, filter 180ms ease, stroke-width 180ms ease';
      shape.style.cursor = 'pointer';
    });

    const handlePointerOver = (event: Event) => {
      const target = event.target as SVGElement;
      if (!target || !target.matches('path, polygon, polyline')) return;
      target.style.fill = '#3B6FD3';
      target.style.stroke = '#DDF1FF';
      target.style.strokeWidth = '1.55';
      target.style.filter = 'drop-shadow(0 0 8px rgba(148,208,255,0.7))';
    };

    const handlePointerOut = (event: Event) => {
      const target = event.target as SVGElement;
      if (!target || !target.matches('path, polygon, polyline')) return;
      target.style.fill = '#2756B5';
      target.style.stroke = '#A9D7FF';
      target.style.strokeWidth = '1.2';
      target.style.filter = 'none';
    };

    svgRoot.addEventListener('pointerover', handlePointerOver);
    svgRoot.addEventListener('pointerout', handlePointerOut);
    return () => {
      svgRoot.removeEventListener('pointerover', handlePointerOver);
      svgRoot.removeEventListener('pointerout', handlePointerOut);
    };
  }, [mapSvgMarkup]);

  const mapBubble = useMemo(
    () =>
      mapBubbleBase.map((city) => ({
        ...city,
        n: Math.floor(Math.random() * 12) + 1,
      })),
    []
  );

  return (
    <div className="h-full w-full overflow-auto rounded-lg border border-[#0c3d75] bg-[#031737] p-2">
      <div className="mb-2 rounded border border-[#4f63b8] bg-[linear-gradient(90deg,rgba(91,104,206,0.32),rgba(58,150,255,0.08))] px-2.5 py-1 text-[11px] text-[#d8e9ff]">
        量子加密保护中 | 当前量子隧道 853 条 | 密钥健康度 96.8%
      </div>
      <div className="grid grid-cols-12 gap-2 xl:auto-rows-[minmax(182px,auto)]">
        <div className={`col-span-12 md:col-span-6 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('业务概况')}
          <div className="grid grid-cols-2 gap-1.5">
            {metricRow.map((m, idx) => (
              <div key={m.label} className="rounded bg-[#0e3e7e]/70 p-2">
                <div className="text-[11px] text-[#8bc4ff]">{m.label}</div>
                <div className={`mt-1 font-mono font-black leading-none ${idx === 3 ? 'text-[20px] text-[#bdb0ff]' : 'text-[24px] text-[#d8f1ff]'}`}>{m.value}</div>
              </div>
            ))}
          </div>
          <div className="mt-1.5 rounded bg-[#0a3268] px-2 py-1 text-xs text-[#9bc8ff]">
            <div className="mb-0.5 flex items-center justify-between">
              <span>业务可用率</span>
              <span className="font-bold text-white">99.82%</span>
            </div>
            <div className="h-2 rounded-full bg-[#123d74]">
              <div className="h-2 w-[99.82%] rounded-full bg-gradient-to-r from-[#3d88ff] to-[#8f6dff]" />
            </div>
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('量子密钥健康度')}
          <div className="grid flex-1 grid-cols-2 gap-1.5">
            {keyHealth.map((m) => (
              <div key={m.label} className="rounded bg-[#0e3e7e]/65 p-2">
                <div className="text-[11px] text-[#9fc8f2]">{m.label}</div>
                <div className="mt-1 text-[18px] font-semibold text-[#d8f1ff]">{m.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('网络性能概况')}
          <div className="grid flex-1 grid-cols-2 gap-1.5">
            {netPerf.map((m) => (
              <div key={m.label} className="rounded bg-[#0e3e7e]/65 p-2">
                <div className="text-[11px] text-[#9fc8f2]">{m.label}</div>
                <div className="mt-1 text-[19px] font-semibold text-[#d8f1ff]">{m.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('告警概况')}
          <div className="grid flex-1 grid-cols-2 gap-1.5">
            {alarmOverview.map((m) => (
              <div key={m.label} className="rounded bg-[#0e3e7e]/65 p-2">
                <div className="text-[11px] text-[#9fc8f2]">{m.label}</div>
                <div className="mt-1 text-[20px] font-semibold text-[#d8f1ff]">{m.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 xl:row-span-2 ${panelClass}`}>
          {sectionTitle('站点地理分布')}
          <div className="relative flex-1 min-h-[360px] xl:min-h-0 overflow-hidden rounded border border-[#2a67aa] bg-[radial-gradient(circle_at_50%_50%,#123f7f_0%,#0d3369_46%,#08284f_72%,#061e40_100%)]">
            <div className="absolute inset-0 p-2">
              <div
                ref={mapSvgRef}
                className="h-full w-full overflow-hidden [&>svg]:h-full [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: mapSvgMarkup }}
              />
            </div>
            {mapBubble.map((p) => (
              <div
                key={p.name}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#97cdff] bg-[#2e66ca]/78 font-mono text-xs font-bold text-white shadow-[0_0_10px_rgba(90,168,255,0.46)]">
                  {p.n}
                </div>
                <div className="mt-0.5 text-center text-[10px] text-[#c9e7ff]">{p.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('量子隧道vs普通隧道')}
          <div className="flex-1 min-h-[160px] xl:min-h-0">
            <BaseChart option={quantumTunnelOption} />
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-6 ${panelClass}`}>
          {sectionTitle('量子密钥更新趋势')}
          <div className="flex-1 min-h-[160px] xl:min-h-0">
            <BaseChart option={keyTrendOption} />
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('量子服务器连接状态')}
          <div className="flex-1 min-h-[150px] space-y-1.5 overflow-auto pr-0.5 text-xs">
            {qssNodes.map((s) => (
              <div key={s.id} className="rounded border border-[#2a67aa] bg-[#0c3468]/65 p-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#cfe8ff]">{s.id}</span>
                  <span className={`font-semibold ${s.status === '在线' ? 'text-[#3ad0a5]' : 'text-[#f5b963]'}`}>{s.status}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[#9fc8f2]">
                  <span>keepAlive: {s.delay}</span>
                  <span>deviceID: {s.device}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-6 ${panelClass}`}>
          {sectionTitle('实时告警列表')}
          <div className="flex-1 min-h-[150px] overflow-auto rounded border border-[#2a67aa] bg-[#0c3468]/65">
            <div className="grid grid-cols-[40px_50px_1fr_1fr_72px] border-b border-[#2a67aa] px-2 py-1 text-[11px] text-[#9fc8f2]">
              <span>#</span><span>级别</span><span>网元</span><span>原因</span><span>时间</span>
            </div>
            {realtimeAlarms.map((a, i) => (
              <div key={`${a.device}-${i}`} className="grid grid-cols-[40px_50px_1fr_1fr_72px] px-2 py-1 text-[11px] text-[#d3e9ff] odd:bg-[#0a2f5e]/40">
                <span>{i + 1}</span>
                <span className={a.level === '一级' ? 'text-[#f56f72]' : a.level === '二级' ? 'text-[#f5b963]' : 'text-[#84d18d]'}>{a.level}</span>
                <span className="truncate">{a.device}</span>
                <span className="truncate">{a.reason}</span>
                <span>{a.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('链路质量分布')}
          <div className="flex-1 min-h-[160px] xl:min-h-0">
            <BaseChart option={qualityRadarOption} />
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('站点TOP5带宽利用率')}
          <div className="flex-1 min-h-[160px] xl:min-h-0">
            <BaseChart option={top5BandwidthOption} />
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('隧道状态矩阵')}
          <div className="flex min-h-[150px] flex-1">
            <div className="w-1/2 space-y-1.5 overflow-auto pr-1.5 text-xs">
              {[
                { k: '隧道UP数', v: '1216' },
                { k: '隧道DOWN数', v: '32' },
                { k: '24h闪断次数', v: '74' },
                { k: 'EVPN over IPsec', v: '68%' },
              ].map((item) => (
                <div key={item.k} className="rounded bg-[#0e3e7e]/65 p-2">
                  <div className="text-[#9fc8f2]">{item.k}</div>
                  <div className="mt-1 text-[18px] font-semibold text-[#d8f1ff]">{item.v}</div>
                </div>
              ))}
            </div>
            <div className="w-1/2 min-h-[140px] xl:min-h-0">
              <BaseChart option={tunnelMatrixOption} />
            </div>
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('告警等级分布')}
          <div className="flex-1 min-h-[160px] xl:min-h-0">
            <BaseChart option={alarmLevelOption} />
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('告警原因分析')}
          <div className="flex-1 min-h-[160px] xl:min-h-0">
            <BaseChart option={reasonOption} />
          </div>
        </div>

        <div className={`col-span-12 xl:col-span-12 ${panelClass}`}>
          {sectionTitle('历史告警趋势')}
          <div className="flex-1 min-h-[160px] xl:min-h-0">
            <BaseChart option={historyAlarmOption} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuantumSDWANOverview;
