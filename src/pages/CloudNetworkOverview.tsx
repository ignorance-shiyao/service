import React from 'react';
import { BaseChart } from '../components/BaseChart';
import { AlertTriangle, Camera, Database, Power, Server } from 'lucide-react';

const panelClass =
  'bg-[#072654]/96 border border-[#16508f] rounded-md p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] h-full flex flex-col';

const sectionTitle = (title: string) => (
  <div className="mb-1 flex items-center border-b border-[#1f5b9b] pb-0.5 text-slate-200 shrink-0">
    <span className="mr-2 text-[#4fb6ff]">|</span>
    <span className="text-xs font-semibold tracking-wide">{title}</span>
  </div>
);

const customerRows = [
  { name: '安徽省一体化数据基础平台', count: 56 },
  { name: '网上政务服务平台-2', count: 34 },
  { name: '三端协同调度中枢', count: 34 },
  { name: '政务协同交换中心', count: 28 },
];

const cpuOption = {
  grid: { top: 24, left: 32, right: 10, bottom: 22 },
  legend: { top: 0, textStyle: { color: '#9fc8f2', fontSize: 10 } },
  xAxis: { type: 'category', data: ['06-19', '06-20', '06-21', '06-22', '06-23', '06-24', '06-25', '06-26', '06-27', '06-28', '06-29', '06-30', '07-01', '07-02', '07-03', '07-04', '07-05', '07-06', '07-07', '07-08', '07-09', '07-10', '07-11', '07-12', '07-13', '07-14', '07-15', '07-16', '07-17', '07-18'] },
  yAxis: { type: 'value', min: 20, max: 50 },
  series: [
    {
      name: '滁州OA--0002',
      type: 'line',
      smooth: true,
      symbol: 'none',
      areaStyle: { color: 'rgba(42, 196, 162, 0.2)' },
      lineStyle: { color: '#31cfb7', width: 2 },
      data: [37, 36, 34, 35, 37, 38, 36, 37, 39, 38, 37, 36, 35, 37, 36, 35, 34, 37, 36, 38, 37, 36, 35, 34, 33, 36, 35, 37, 36, 38],
    },
    {
      name: '皖企通h5-0002',
      type: 'line',
      smooth: true,
      symbol: 'none',
      areaStyle: { color: 'rgba(93, 143, 255, 0.35)' },
      lineStyle: { color: '#6b93ff', width: 2 },
      data: [35, 34, 36, 37, 37, 36, 35, 36, 37, 38, 37, 36, 37, 38, 37, 39, 36, 37, 38, 37, 36, 38, 39, 37, 36, 34, 35, 37, 38, 46],
    },
    {
      name: '统一认证后台_1',
      type: 'line',
      smooth: true,
      symbol: 'none',
      lineStyle: { color: '#7ea2d7', width: 2 },
      data: [34, 35, 36, 35, 34, 35, 36, 34, 35, 36, 35, 34, 36, 35, 34, 35, 36, 35, 34, 35, 36, 34, 35, 36, 35, 34, 35, 34, 35, 36],
    },
  ],
};

const diskOption = {
  grid: { top: 24, left: 32, right: 10, bottom: 20 },
  legend: { top: 0, textStyle: { color: '#9fc8f2', fontSize: 10 } },
  xAxis: { type: 'category', data: ['06-20', '06-21', '06-22', '06-23', '06-24', '06-25', '06-26', '06-27', '06-28', '06-29', '06-30', '07-01', '07-02', '07-03', '07-04', '07-05', '07-06', '07-07', '07-08', '07-09', '07-10', '07-11', '07-12', '07-13', '07-14', '07-15', '07-16', '07-17'] },
  yAxis: { type: 'value', min: 39, max: 54 },
  series: [
    { name: 'WZT-KRS-NODE-0005', type: 'line', smooth: true, symbol: 'none', data: [49, 49, 50, 50, 49, 48, 50, 50, 49, 50, 49, 49, 50, 50, 49, 50, 49, 50, 49, 49, 50, 49, 50, 49, 49, 50, 49, 50], lineStyle: { color: '#31cfb7', width: 2 } },
    { name: '应用服务器-0009', type: 'line', smooth: true, symbol: 'none', data: [48, 49, 48, 50, 49, 50, 49, 48, 49, 50, 49, 48, 49, 50, 49, 48, 49, 50, 49, 48, 49, 50, 49, 48, 49, 50, 49, 48], lineStyle: { color: '#f5b963', width: 2 } },
    { name: '区块链-MyChain软件--0010', type: 'line', smooth: true, symbol: 'none', data: [50, 51, 52, 49, 50, 51, 52, 50, 49, 50, 51, 49, 50, 51, 50, 49, 50, 51, 49, 50, 52, 50, 49, 50, 51, 49, 50, 51], lineStyle: { color: '#7ea2d7', width: 2 } },
  ],
};

const memOption = {
  grid: { top: 24, left: 32, right: 10, bottom: 22 },
  legend: { top: 0, textStyle: { color: '#9fc8f2', fontSize: 10 } },
  xAxis: { type: 'category', data: ['06-19', '06-20', '06-21', '06-22', '06-23', '06-24', '06-25', '06-26', '06-27', '06-28', '06-29', '06-30', '07-01', '07-02', '07-03', '07-04', '07-05', '07-06', '07-07', '07-08', '07-09', '07-10', '07-11', '07-12', '07-13', '07-14', '07-15', '07-16', '07-17', '07-18'] },
  yAxis: { type: 'value', min: 33, max: 48 },
  series: [
    { name: '应用服务器--0009', type: 'line', smooth: true, symbol: 'none', data: [40, 41, 40, 41, 40, 40, 41, 40, 41, 40, 40, 41, 40, 41, 40, 40, 41, 40, 41, 40, 41, 40, 41, 40, 41, 40, 41, 40, 41, 42], lineStyle: { color: '#31cfb7', width: 2 } },
    { name: 'WZT-PJ-PASS-0002', type: 'line', smooth: true, symbol: 'none', data: [39, 40, 39, 40, 39, 40, 39, 41, 39, 40, 39, 40, 39, 40, 39, 41, 39, 40, 39, 40, 39, 40, 39, 41, 39, 40, 39, 40, 39, 47], lineStyle: { color: '#f5b963', width: 2 } },
    { name: 'WPS-中台灾备--0004', type: 'line', smooth: true, symbol: 'none', data: [40, 39, 40, 39, 40, 39, 40, 39, 40, 39, 40, 39, 40, 39, 40, 39, 40, 39, 40, 39, 40, 39, 40, 39, 40, 39, 40, 39, 40, 39], lineStyle: { color: '#9ca6c8', width: 2 } },
    { name: '72小时不打烊--0003', type: 'line', smooth: true, symbol: 'none', data: [41, 40, 41, 40, 41, 40, 41, 40, 41, 40, 41, 40, 41, 40, 41, 40, 41, 40, 41, 40, 41, 40, 41, 40, 41, 40, 41, 40, 41, 40], lineStyle: { color: '#4ea8ff', width: 2 } },
    { name: '业务支撑_4--0013', type: 'line', smooth: true, symbol: 'none', data: [39, 39, 40, 39, 40, 39, 40, 39, 40, 39, 40, 39, 40, 39, 40, 39, 40, 39, 40, 39, 40, 39, 40, 39, 40, 39, 40, 39, 40, 41], lineStyle: { color: '#5d79f2', width: 2 } },
  ],
};

const alarmLevelOption = {
  series: [
    {
      type: 'pie',
      radius: ['35%', '63%'],
      center: ['50%', '60%'],
      data: [
        { value: 28, name: '一级告警' },
        { value: 97, name: '二级告警' },
        { value: 197, name: '三级告警' },
        { value: 236, name: '四级告警' },
      ],
      label: { color: '#a9d3ff', fontSize: 10, formatter: '{b}:{c}({d}%)' },
      itemStyle: { borderColor: '#0a2b57', borderWidth: 2 },
    },
  ],
  color: ['#f56f72', '#f5b963', '#f1df68', '#84d18d'],
};

const pingOption = {
  grid: { top: 24, left: 34, right: 34, bottom: 22 },
  legend: { top: 0, textStyle: { color: '#9fc8f2', fontSize: 10 } },
  xAxis: { type: 'category', data: ['2024-07-08', '07-09', '07-10', '07-11', '07-12', '07-13', '07-14', '07-15', '07-16', '2024-07-17'] },
  yAxis: [{ type: 'value', name: '单位(ms)' }, { type: 'value', name: '单位(%)' }],
  series: [
    { name: '时延(ms)', type: 'bar', data: [18, 23, 23, 22, 20, 18, 24, 21, 20, 21], itemStyle: { color: '#4ba8ff' }, barWidth: 10 },
    { name: '抖动(ms)', type: 'bar', data: [20, 14, 22, 21, 16, 17, 19, 20, 17, 18], itemStyle: { color: '#4ecf58' }, barWidth: 10 },
    { name: '丢包率(%)', type: 'line', yAxisIndex: 1, smooth: true, data: [0.04, 0.02, 0.04, 0.02, 0.04, 0.05, 0.03, 0.04, 0.04, 0.03], lineStyle: { color: '#f3a54f', width: 2 }, symbolSize: 5 },
  ],
};

const historyStatOption = {
  grid: { top: 24, left: 32, right: 12, bottom: 20 },
  legend: { top: 0, textStyle: { color: '#9fc8f2', fontSize: 10 } },
  xAxis: { type: 'category', data: ['2024-06-19', '06-20', '06-21', '06-22', '06-23', '06-24', '06-25', '06-26', '06-27', '06-28', '06-29', '06-30', '07-01', '07-02', '07-03', '07-04', '07-05', '07-06', '07-07', '07-08', '07-09', '07-10', '07-11', '07-12', '07-13', '07-14', '07-15', '07-16', '2024-07-17'] },
  yAxis: { type: 'value', name: '单位(条)' },
  series: [
    { name: '告警数', type: 'bar', data: [340, 440, 380, 390, 420, 510, 335, 487, 476, 210, 82, 56, 205, 168, 181, 450, 221, 244, 248, 201, 200, 198, 241, 205, 167, 182, 178, 180, 72], itemStyle: { color: '#4aa0ef' }, barWidth: 12 },
  ],
};

const objectStoreOption = {
  grid: { top: 24, left: 32, right: 12, bottom: 20 },
  legend: { top: 0, textStyle: { color: '#9fc8f2', fontSize: 10 } },
  xAxis: { type: 'category', data: ['2024-07-17', '07-14', '07-10', '07-07', '07-03', '06-30', '06-26', '06-23', '2024-06-19'] },
  yAxis: { type: 'value', name: '单位(%)', min: 0, max: 100 },
  series: [
    {
      name: '存储利用率',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      data: [47, 48, 47, 48, 47, 48, 47, 48, 47],
      lineStyle: { color: '#dcb6ff', width: 2 },
      areaStyle: { color: 'rgba(136, 151, 255, 0.22)' },
    },
  ],
};

export const CloudNetworkOverview: React.FC = () => {
  return (
    <div className="h-full w-full overflow-auto rounded-lg border border-[#0c3d75] bg-[var(--sys-bg-page)] p-1.5">
      <div className="grid grid-cols-12 gap-1.5 xl:h-full xl:auto-rows-fr xl:grid-rows-[0.95fr_1.12fr_1fr]">
        <div className={`col-span-12 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('客户业务概况')}
          <div className="grid grid-cols-2 gap-1.5">
            <div className="flex min-h-[62px] items-center justify-between rounded bg-[#0e3e7e]/70 p-2.5">
              <div>
                <div className="mb-0.5 text-[11px] text-[#8bc4ff]">云主机实例数</div>
                <div className="font-mono text-[28px] font-black leading-none text-[#d8f1ff]">1999</div>
              </div>
              <Server size={20} className="text-[#9cd3ff]" />
            </div>
            <div className="flex min-h-[62px] items-center justify-between rounded bg-[#0e3e7e]/70 p-2.5">
              <div>
                <div className="mb-0.5 text-[11px] text-[#8bc4ff]">业务数</div>
                <div className="font-mono text-[28px] font-black leading-none text-[#d8f1ff]">29</div>
              </div>
              <Database size={20} className="text-[#9cd3ff]" />
            </div>
          </div>
          <div className="mt-1.5 rounded border border-[var(--comp-panel-border)] bg-[#0c3468]/65 p-2">
            <div className="grid grid-cols-2 text-[11px] text-[#bedaf8]">
              <div>业务名称</div>
              <div className="text-right">云主机实例数</div>
            </div>
            <div className="mt-1.5 space-y-1 text-xs text-[#e3f0ff]">
              {customerRows.map((row) => (
                <div key={row.name} className="grid grid-cols-2">
                  <div className="truncate">{row.name}</div>
                  <div className="text-right text-[#8fd3ff]">{row.count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={`col-span-12 xl:col-span-6 ${panelClass}`}>
          {sectionTitle('云主机CPU利用率')}
          <div className="flex-1 min-h-[160px] xl:min-h-0">
            <BaseChart option={cpuOption} />
          </div>
        </div>

        <div className={`col-span-12 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('云主机磁盘利用率')}
          <div className="flex-1 min-h-[160px] xl:min-h-0">
            <BaseChart option={diskOption} />
          </div>
        </div>

        <div className={`col-span-12 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('告警等级')}
          <div className="flex-1 min-h-[170px] xl:min-h-0">
            <BaseChart option={alarmLevelOption} />
          </div>
        </div>

        <div className={`col-span-12 xl:col-span-6 ${panelClass}`}>
          {sectionTitle('云主机内存利用率')}
          <div className="flex-1 min-h-[170px] xl:min-h-0">
            <BaseChart option={memOption} />
          </div>
        </div>

        <div className={`col-span-12 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('实时视频')}
          <div className="relative flex-1 min-h-[170px] overflow-hidden rounded border border-[#2f78d4] bg-[#0a2f5e]">
            <div className="flex items-center justify-between border-b border-[var(--comp-panel-border)] bg-[#0d3f79]/60 px-2 py-1 text-[11px] text-[#c8e6ff]">
              <span>纬4楼201机房D-E列冷通道南</span>
              <div className="flex items-center gap-1.5 text-[#7dc5ff]">
                <Camera size={11} />
                <Power size={11} className="text-[#ff9a5a]" />
              </div>
            </div>
            <div className="relative h-[calc(100%-28px)]">
              <img src="/screens/cloud-gov.png" alt="实时视频" className="h-full w-full object-cover object-center" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-end bg-gradient-to-t from-[#071c39] to-transparent px-2 py-1 text-[11px] text-[#d0e9ff]">
                163 kb/s
              </div>
            </div>
          </div>
        </div>

        <div className={`col-span-12 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('PING测试统计')}
          <div className="flex-1 min-h-[166px] xl:min-h-0">
            <BaseChart option={pingOption} />
          </div>
        </div>

        <div className={`col-span-12 xl:col-span-6 ${panelClass}`}>
          {sectionTitle('历史告警统计')}
          <div className="flex-1 min-h-[166px] xl:min-h-0">
            <BaseChart option={historyStatOption} />
          </div>
        </div>

        <div className={`col-span-12 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('对象存储磁盘利用率')}
          <div className="flex-1 min-h-[166px] xl:min-h-0">
            <BaseChart option={objectStoreOption} />
          </div>
        </div>
      </div>

    </div>
  );
};

export default CloudNetworkOverview;
