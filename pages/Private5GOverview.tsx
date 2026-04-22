import React from 'react';
import { AlertTriangle, Database, Network, Radar, Server, ShieldCheck, Signal, Smartphone, UploadCloud, UserRound, Wifi } from 'lucide-react';
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
  <div className="flex min-h-[64px] items-center justify-between rounded bg-[#0e3e7e]/70 p-2.5">
    <div>
      <div className="mb-0.5 text-[11px] text-[#8bc4ff]">{label}</div>
      <div className="font-mono text-[28px] font-black leading-none tracking-wider text-[#d8f1ff]">{value}</div>
    </div>
    <div className="rounded-full bg-[#2f78d4]/40 p-1.5 text-[#8fd3ff]">{icon}</div>
  </div>
);

const netManageOption = {
  grid: { top: 24, left: 30, right: 10, bottom: 22 },
  legend: {
    top: 0,
    textStyle: { color: '#9fc8f2', fontSize: 10 },
  },
  xAxis: {
    type: 'category',
    data: ['2026-04-06', '2026-04-09', '2026-04-12', '2026-04-15'],
    axisLabel: { color: '#88b5e4', fontSize: 10 },
  },
  yAxis: { type: 'value', min: 99, max: 100 },
  series: [
    {
      name: '初始注册成功率(%)',
      type: 'line',
      smooth: true,
      symbol: 'none',
      lineStyle: { color: '#31d1c6', width: 2 },
      areaStyle: { color: 'rgba(49, 209, 198, 0.18)' },
      data: [99.4, 99.9, 99.3, 99.7],
    },
    {
      name: '鉴权成功率(%)',
      type: 'line',
      smooth: true,
      symbol: 'none',
      lineStyle: { color: '#5e92ff', width: 2 },
      areaStyle: { color: 'rgba(94, 146, 255, 0.2)' },
      data: [99.5, 99.7, 99.8, 99.4],
    },
    {
      name: '分DNN的PDU会话建立成功率(%)',
      type: 'line',
      smooth: true,
      symbol: 'none',
      lineStyle: { color: '#377ff6', width: 2 },
      areaStyle: { color: 'rgba(55, 127, 246, 0.16)' },
      data: [99.3, 99.6, 99.5, 99.9],
    },
  ],
};

const dpiRadarOption = {
  radar: {
    center: ['50%', '57%'],
    radius: '62%',
    splitNumber: 4,
    axisName: { color: '#9fc8f2', fontSize: 10 },
    splitLine: { lineStyle: { color: 'rgba(98, 164, 233, 0.45)' } },
    splitArea: { areaStyle: { color: ['rgba(17,55,105,0.25)', 'rgba(17,55,105,0.08)'] } },
    axisLine: { lineStyle: { color: 'rgba(98, 164, 233, 0.35)' } },
    indicator: [
      { name: 'HTTP请求成功率', max: 100 },
      { name: '切换成功率', max: 100 },
      { name: '寻呼成功率', max: 100 },
      { name: '鉴权成功率', max: 100 },
      { name: 'PDU会话建立成功率', max: 100 },
      { name: 'TCP请求成功率', max: 100 },
    ],
  },
  series: [
    {
      type: 'radar',
      data: [
        {
          value: [97.8, 96.3, 97.1, 96.8, 98.1, 97.2],
          areaStyle: { color: 'rgba(239, 196, 68, 0.34)' },
          lineStyle: { color: '#f3ca4a', width: 2 },
          symbol: 'none',
        },
      ],
    },
  ],
};

const pingOption = {
  grid: { top: 24, left: 34, right: 34, bottom: 22 },
  legend: { top: 0, textStyle: { color: '#9fc8f2', fontSize: 10 } },
  xAxis: { type: 'category', data: ['2026-04-06', '04-07', '04-08', '04-09', '04-10', '04-11', '04-12', '04-13', '04-14', '2026-04-15'] },
  yAxis: [{ type: 'value', name: '单位(ms)' }, { type: 'value', name: '单位(%)' }],
  series: [
    { name: '时延(ms)', type: 'bar', data: [19, 21, 20, 23, 20, 20, 19, 22, 20, 19], itemStyle: { color: '#4ba8ff' }, barWidth: 10 },
    { name: '抖动(ms)', type: 'bar', data: [16, 14, 18, 17, 19, 21, 20, 15, 19, 17], itemStyle: { color: '#4ecf58' }, barWidth: 10 },
    { name: '丢包率(%)', type: 'line', yAxisIndex: 1, smooth: true, data: [0.03, 0.03, 0.04, 0.03, 0.04, 0.04, 0.02, 0.03, 0.04, 0.05], lineStyle: { color: '#f3a54f', width: 2 }, symbolSize: 5 },
  ],
};

const n6Option = {
  grid: { top: 24, left: 32, right: 12, bottom: 22 },
  legend: { top: 0, textStyle: { color: '#9fc8f2', fontSize: 10 } },
  xAxis: { type: 'category', data: ['2026-04-06', '04-07', '04-08', '04-09', '04-10', '04-11', '04-12', '04-13', '04-14', '2026-04-15'] },
  yAxis: { type: 'value', name: '单位(GB)' },
  series: [
    { name: '分DNN的N6上行流量(GB)', type: 'bar', data: [0.28, 0.25, 0.52, 0.14, 0.42, 0.51, 0.26, 0.43, 0.16, 0.62], itemStyle: { color: '#5c8aff' }, barWidth: 16 },
    { name: '分DNN的N6下行流量(GB)', type: 'bar', data: [0.52, 0.39, 0.78, 0.41, 0.52, 0.64, 0.51, 0.54, 0.28, 0.92], itemStyle: { color: '#2fb8e9' }, barWidth: 16 },
  ],
};

const warnReasonOption = {
  series: [
    {
      type: 'pie',
      radius: ['62%', '80%'],
      data: [
        { value: 72.46, name: '终端平台侧原因' },
        { value: 21.36, name: '无线网' },
        { value: 1.73, name: '内容平台' },
        { value: 3.54, name: '传输网' },
      ],
      label: { color: '#a9d3ff', fontSize: 11, formatter: '{b}:{d}%' },
      itemStyle: { borderColor: '#0a2b57', borderWidth: 2 },
    },
  ],
  color: ['#f56f72', '#f2cc5a', '#5ed3f8', '#51b4ff'],
};

const alarmClassOption = {
  grid: { top: 24, left: 30, right: 10, bottom: 20 },
  legend: { top: 0, textStyle: { color: '#9fc8f2', fontSize: 10 } },
  xAxis: { type: 'category', data: ['2026-04-06', '04-07', '04-08', '04-09', '04-10', '04-11', '04-12', '04-13', '04-14', '2026-04-15'] },
  yAxis: { type: 'value', name: '单位(条)' },
  series: [
    { name: '网络告警(条)', type: 'line', smooth: true, data: [6, 2, 10, 5, 6, 5, 9, 2, 6, 8], lineStyle: { color: '#38d0be', width: 2 }, symbolSize: 5 },
    { name: '业务告警(条)', type: 'line', smooth: true, data: [20, 12, 14, 16, 9, 8, 16, 19, 14, 19], lineStyle: { color: '#a8b2c8', width: 2 }, symbolSize: 5 },
    { name: '拨测告警(条)', type: 'line', smooth: true, data: [27, 10, 17, 28, 23, 29, 26, 11, 24, 13], lineStyle: { color: '#5f92ff', width: 2 }, symbolSize: 5 },
  ],
};

const workOrderOption = {
  grid: { top: 26, left: 30, right: 32, bottom: 20 },
  legend: { top: 0, textStyle: { color: '#9fc8f2', fontSize: 10 } },
  xAxis: { type: 'category', data: ['2024-06', '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12', '2025-01', '2025-02'] },
  yAxis: [{ type: 'value', name: '单位(条)' }, { type: 'value', name: '单位(%)' }],
  series: [
    { name: '预警工单数量(条)', type: 'bar', data: [8, 4, 7, 8, 7, 8, 7, 6, 6], itemStyle: { color: '#2fc0e8' }, barWidth: 18 },
    { name: '预警工单处理及时率(%)', type: 'line', yAxisIndex: 1, smooth: true, data: [86, 87, 88, 89, 89, 87, 89, 88, 88], lineStyle: { color: '#f4b061', width: 2 }, symbolSize: 5 },
  ],
};

const terminalGaugeOption = {
  series: [
    {
      type: 'gauge',
      center: ['25%', '32%'],
      radius: '22%',
      min: 0,
      max: 100,
      progress: { show: true, width: 7, itemStyle: { color: '#3ce5d1' } },
      pointer: { width: 2, length: '60%' },
      axisLine: { lineStyle: { width: 7, color: [[1, 'rgba(53, 106, 168, 0.35)']] } },
      splitLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      detail: { valueAnimation: false, offsetCenter: [0, '95%'], color: '#35f0df', fontSize: 13, formatter: '{value} %' },
      data: [{ value: 25.71, name: '内存平均利用率' }],
      title: { offsetCenter: [0, '130%'], color: '#9fc8f2', fontSize: 10 },
    },
    {
      type: 'gauge',
      center: ['75%', '32%'],
      radius: '22%',
      min: 0,
      max: 100,
      progress: { show: true, width: 7, itemStyle: { color: '#28d7ff' } },
      pointer: { width: 2, length: '60%' },
      axisLine: { lineStyle: { width: 7, color: [[1, 'rgba(53, 106, 168, 0.35)']] } },
      splitLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      detail: { offsetCenter: [0, '95%'], color: '#33dbff', fontSize: 13, formatter: '{value} %' },
      data: [{ value: 53.39, name: 'CPU平均利用率' }],
      title: { offsetCenter: [0, '130%'], color: '#9fc8f2', fontSize: 10 },
    },
    {
      type: 'gauge',
      center: ['25%', '76%'],
      radius: '22%',
      min: 0,
      max: 100,
      progress: { show: true, width: 7, itemStyle: { color: '#2de3ff' } },
      pointer: { width: 2, length: '60%' },
      axisLine: { lineStyle: { width: 7, color: [[1, 'rgba(53, 106, 168, 0.35)']] } },
      splitLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      detail: { offsetCenter: [0, '95%'], color: '#32e2ff', fontSize: 13, formatter: '{value} %' },
      data: [{ value: 30.5, name: 'Flash平均利用率' }],
      title: { offsetCenter: [0, '130%'], color: '#9fc8f2', fontSize: 10 },
    },
    {
      type: 'gauge',
      center: ['75%', '76%'],
      radius: '22%',
      min: 0,
      max: 100,
      progress: { show: true, width: 7, itemStyle: { color: '#53e6c8' } },
      pointer: { width: 2, length: '60%' },
      axisLine: { lineStyle: { width: 7, color: [[1, 'rgba(53, 106, 168, 0.35)']] } },
      splitLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      detail: { offsetCenter: [0, '95%'], color: '#53e6c8', fontSize: 13, formatter: '{value} ℃' },
      data: [{ value: 40.6, name: '设备平均温度' }],
      title: { offsetCenter: [0, '130%'], color: '#9fc8f2', fontSize: 10 },
    },
  ],
};

const qualityRows = [
  { name: '内存平均利用率', count: 26, score: 92 },
  { name: 'PING测成功率', count: 19, score: 86 },
  { name: '设备平均温度', count: 11, score: 74 },
  { name: '平均信干噪比', count: 9, score: 63 },
  { name: 'HTTP请求成功率', count: 4, score: 58 },
];

const bizMetricRows = [
  ['上行瞬时速率(KBps)', '2.63', <UploadCloud size={14} />],
  ['下行瞬时速率(KBps)', '2.58', <UploadCloud size={14} />],
  ['上行峰值速率(KBps)', '692.92', <Signal size={14} />],
  ['下行峰值速率(KBps)', '961.87', <Signal size={14} />],
  ['Ping测试成功率(%)', '89.03', <Wifi size={14} />],
  ['Ping测试次数(次)', '14061', <Radar size={14} />],
  ['时延(ms)', '21.1', <Network size={14} />],
  ['丢包(%)', '0.04', <AlertTriangle size={14} />],
  ['抖动(ms)', '18.8', <Database size={14} />],
];

export const Private5GOverview: React.FC = () => {
  return (
    <div className="h-full w-full overflow-auto rounded-lg border border-[#0c3d75] bg-[#031737] p-1.5">
      <div className="grid grid-cols-12 gap-1.5 xl:h-full xl:auto-rows-fr xl:grid-rows-[0.95fr_1fr_1.12fr]">
        <div className={`col-span-12 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('业务概况')}
          <div className="grid grid-cols-2 gap-1.5">
            {metricCard('开卡数(个)', '100', <UserRound size={16} />)}
            {metricCard('活跃用户数(个)', '46', <Smartphone size={16} />)}
            {metricCard('上下行总流量(GB)', '0.91', <UploadCloud size={16} />)}
            {metricCard('终端平均在线时长(H)', '18.93', <ShieldCheck size={16} />)}
          </div>
          <div className="mt-1.5 rounded bg-[#0a3268] px-2 py-1 text-xs text-[#9bc8ff]">
            <div className="mb-0.5 flex items-center justify-between">
              <span>终端活跃率</span>
              <span className="font-bold text-white">100%</span>
            </div>
            <div className="h-2 rounded-full bg-[#123d74]">
              <div className="h-2 w-full rounded-full bg-gradient-to-r from-[#3d88ff] to-[#7ac7ff]" />
            </div>
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('网管性能分析')}
          <div className="flex-1 min-h-[170px] xl:min-h-0">
            <BaseChart option={netManageOption} />
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('DPI性能分析')}
          <div className="flex-1 min-h-[170px] xl:min-h-0">
            <BaseChart option={dpiRadarOption} />
          </div>
        </div>

        <div className={`col-span-12 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('网络性能分析')}
          <div className="flex flex-1 items-center justify-between gap-2 rounded border border-[#2a67aa] bg-[radial-gradient(circle_at_50%_40%,#13417f_0%,#0b2f63_64%,#08254b_100%)] px-3">
            <div className="space-y-2 text-right text-[#9fd0ff] text-xs">
              <div><div>信号接收平均质量</div><div className="text-[22px] font-bold text-[#39b1ff]">-9.56dB</div></div>
              <div><div>接收信号平均强度</div><div className="text-[22px] font-bold text-[#35a7ff]">-98.89dBm</div></div>
            </div>
            <div className="flex h-36 w-36 items-center justify-center rounded-full border border-[#2f78d4] bg-[#0f3a73] shadow-[0_0_24px_rgba(49,148,255,0.45)]">
              <Server size={50} className="text-[#58c4ff]" />
            </div>
            <div className="space-y-2 text-left text-[#9fd0ff] text-xs">
              <div><div>参考信号接收平均功率</div><div className="text-[22px] font-bold text-[#39b1ff]">-91.3dBm</div></div>
              <div><div>平均信干噪比</div><div className="text-[22px] font-bold text-[#35a7ff]">10.78dB</div></div>
            </div>
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('PING测试统计')}
          <div className="flex-1 min-h-[168px] xl:min-h-0">
            <BaseChart option={pingOption} />
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('N6流量分析')}
          <div className="flex-1 min-h-[168px] xl:min-h-0">
            <BaseChart option={n6Option} />
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('预警原因分析')}
          <div className="flex-1 min-h-[168px] xl:min-h-0">
            <BaseChart option={warnReasonOption} />
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('终端性能分析')}
          <div className="flex-1 min-h-[168px] xl:min-h-0">
            <BaseChart option={terminalGaugeOption} />
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('告警分类统计')}
          <div className="flex-1 min-h-[174px] xl:min-h-0">
            <BaseChart option={alarmClassOption} />
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('质差分析')}
          <div className="flex-1 space-y-2 overflow-auto pr-1 text-xs">
            {qualityRows.map((item, index) => (
              <div key={item.name} className="rounded bg-[#0d3a73]/55 px-2 py-1.5">
                <div className="mb-1 flex items-center justify-between text-[#bfe0ff]">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-[4px] border border-[#6bb9ff] bg-[#1f69b8] text-[11px] font-bold text-white">{index + 1}</span>
                    <span>{item.name}</span>
                  </div>
                  <span className="font-bold text-[#d7efff]">{item.count} 次</span>
                </div>
                <div className="h-2 rounded-full bg-[#123d74]">
                  <div className="h-2 rounded-full bg-gradient-to-r from-[#2c87ff] to-[#7fd2ff]" style={{ width: `${item.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('预警工单统计')}
          <div className="flex-1 min-h-[174px] xl:min-h-0">
            <BaseChart option={workOrderOption} />
          </div>
        </div>

        <div className={`col-span-12 md:col-span-6 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('业务性能分析')}
          <div className="grid flex-1 grid-cols-3 gap-1.5 text-xs">
            {bizMetricRows.map(([label, value, icon]) => (
              <div key={label as string} className="rounded bg-[#0d3a73]/60 p-2">
                <div className="mb-1 text-[10px] text-[#9fc8f2]">{label}</div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[19px] font-black leading-none text-[#dcf2ff]">{value}</span>
                  <span className="rounded-full bg-[#2f78d4]/40 p-1 text-[#8fd3ff]">{icon as React.ReactNode}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Private5GOverview;
