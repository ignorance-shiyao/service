import React from 'react';
import { BaseChart } from '../components/BaseChart';
import { Box, Camera, Database, Power } from 'lucide-react';

const panelClass =
  'bg-[#072654]/96 border border-[#16508f] rounded-md p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] h-full flex flex-col';

const sectionTitle = (title: string) => (
  <div className="mb-1 flex items-center border-b border-[#1f5b9b] pb-0.5 text-slate-200 shrink-0">
    <span className="mr-2 text-[#4fb6ff]">|</span>
    <span className="text-xs font-semibold tracking-wide">{title}</span>
  </div>
);

const deviceTableRows = [
  { name: '中央空调末端', online: 137, offline: 0 },
  { name: '机房环境', online: 802, offline: 0 },
  { name: '动环监控', online: 30, offline: 0 },
  { name: '交流电线配电', online: 44, offline: 0 },
];

const alarmPieOption = {
  legend: { show: false },
  series: [
    {
      type: 'pie',
      radius: ['36%', '72%'],
      center: ['52%', '53%'],
      startAngle: 180,
      label: { color: '#9fc8f2', fontSize: 10, formatter: '{b}:{c}' },
      data: [
        { name: '一级告警', value: 0 },
        { name: '二级告警', value: 5 },
        { name: '三级告警', value: 0 },
        { name: '四级告警', value: 9 },
      ],
    },
  ],
  color: ['#f56f72', '#f5b963', '#f1df68', '#84d18d'],
};

const historyOption = {
  grid: { top: 26, left: 30, right: 10, bottom: 20 },
  legend: { top: 0, textStyle: { color: '#9fc8f2', fontSize: 10 } },
  xAxis: { type: 'category', data: ['2024-06-19', '2024-06-22', '2024-06-26', '2024-06-30', '2024-07-04', '2024-07-07', '2024-07-11', '2024-07-14'] },
  yAxis: { type: 'value' },
  series: [
    { name: '一级告警', type: 'line', smooth: true, symbol: 'none', data: [2, 3, 2, 1, 4, 2, 3, 2], lineStyle: { color: '#f56f72', width: 2 } },
    { name: '二级告警', type: 'line', smooth: true, symbol: 'none', data: [12, 18, 22, 14, 380, 24, 84, 58], lineStyle: { color: '#f5b963', width: 2 } },
    { name: '三级告警', type: 'line', smooth: true, symbol: 'none', data: [1, 1, 0, 1, 0, 1, 1, 0], lineStyle: { color: '#f1df68', width: 2 } },
    { name: '四级告警', type: 'line', smooth: true, symbol: 'none', data: [8, 12, 20, 16, 18, 12, 22, 16], lineStyle: { color: '#84d18d', width: 2 } },
  ],
};

const tempOption = {
  grid: { top: 26, left: 30, right: 26, bottom: 20 },
  legend: { top: 0, textStyle: { color: '#9fc8f2', fontSize: 10 } },
  xAxis: { type: 'category', data: ['2024-06-18', '06-21', '06-25', '06-29', '07-02', '07-05', '07-09', '07-12', '2024-07-15'] },
  yAxis: [{ type: 'value', name: '单位(°C)', min: 15, max: 32 }, { type: 'value', name: '单位(%RH)', min: 20, max: 80 }],
  series: [
    { name: '温度(°C)', type: 'line', smooth: true, symbol: 'circle', symbolSize: 5, data: [24.1, 24.5, 24.3, 24.6, 24.4, 24.5, 24.6, 24.2, 24.3], lineStyle: { color: '#dcb6ff', width: 2 }, areaStyle: { color: 'rgba(136, 151, 255, 0.22)' } },
    { name: '湿度(%RH)', type: 'line', yAxisIndex: 1, smooth: true, symbol: 'circle', symbolSize: 5, data: [54, 56, 55, 54, 55, 56, 55, 54, 54], lineStyle: { color: '#c9f1ff', width: 2 } },
  ],
};

const idcAlarmCountOption = {
  grid: { top: 26, left: 30, right: 12, bottom: 20 },
  legend: { top: 0, textStyle: { color: '#9fc8f2', fontSize: 10 } },
  xAxis: { type: 'category', data: ['2024-06-19', '2024-06-22', '2024-06-25', '2024-06-28', '2024-07-01', '2024-07-05', '2024-07-08', '2024-07-11', '2024-07-15'] },
  yAxis: { type: 'value', name: '单位(条)' },
  series: [{ name: '告警数', type: 'bar', data: [8, 16, 22, 25, 12, 380, 86, 62, 4], itemStyle: { color: '#3b8de1' }, barWidth: 20 }],
};

const monitorDeviceOption = {
  grid: { top: 24, left: 30, right: 12, bottom: 20 },
  legend: { top: 0, textStyle: { color: '#9fc8f2', fontSize: 10 } },
  xAxis: { type: 'category', data: Array.from({ length: 24 }, (_, i) => `${(i + 1).toString().padStart(2, '0')}`), axisLabel: { show: false } },
  yAxis: { type: 'value', max: 190 },
  series: [
    { name: '在线数', type: 'bar', data: Array.from({ length: 24 }, () => 157), itemStyle: { color: '#7dc483' }, barWidth: 6 },
    { name: '离线数', type: 'bar', data: Array.from({ length: 24 }, () => 7), itemStyle: { color: '#98a2b6' }, barWidth: 6 },
  ],
};

const cameraCards = [
  { id: 'cam-1', title: '纬4楼201机房西南角', rate: '96 kb/s' },
  { id: 'cam-2', title: '纬4楼201机房L列冷通道北', rate: '188 kb/s' },
  { id: 'cam-3', title: '纬4楼201机房D-E列冷通道北', rate: '53 kb/s' },
  { id: 'cam-4', title: '纬4楼202机房东南角', rate: '86 kb/s' },
];

export const IDCOverview: React.FC = () => {
  return (
    <div className="h-full w-full overflow-auto rounded-lg border border-[#0c3d75] bg-[#031737] p-1.5">
      <div className="grid grid-cols-12 gap-1.5 xl:h-full xl:auto-rows-fr xl:grid-rows-[1.06fr_1fr_1fr]">
        <div className={`col-span-12 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('IDC设备在线情况')}
          <div className="grid grid-cols-2 gap-1.5">
            <div className="flex min-h-[62px] items-center justify-between rounded bg-[#0e3e7e]/70 p-2.5">
              <div>
                <div className="mb-0.5 text-[11px] text-[#8bc4ff]">机房数</div>
                <div className="font-mono text-[28px] font-black leading-none text-[#d8f1ff]">5</div>
              </div>
              <Box size={20} className="text-[#9cd3ff]" />
            </div>
            <div className="flex min-h-[62px] items-center justify-between rounded bg-[#0e3e7e]/70 p-2.5">
              <div>
                <div className="mb-0.5 text-[11px] text-[#8bc4ff]">设备数</div>
                <div className="font-mono text-[28px] font-black leading-none text-[#d8f1ff]">1046</div>
              </div>
              <Database size={20} className="text-[#9cd3ff]" />
            </div>
          </div>
          <div className="mt-1.5 rounded border border-[#2a67aa] bg-[#0c3468]/65 p-2">
            <div className="grid grid-cols-3 text-[11px] text-[#a6cefa]">
              <div>设备类型</div>
              <div className="text-center">在线数</div>
              <div className="text-right">离线数</div>
            </div>
            <div className="mt-1.5 space-y-1 text-xs">
              {deviceTableRows.map((row) => (
                <div key={row.name} className="grid grid-cols-3 text-[#d3e9ff]">
                  <div>{row.name}</div>
                  <div className="text-center text-[#6ce09a]">{row.online}</div>
                  <div className="text-right text-[#ff8a7a]">{row.offline}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={`col-span-12 xl:col-span-5 xl:row-span-2 ${panelClass}`}>
          {sectionTitle('实时视频')}
          <div className="grid flex-1 grid-cols-1 gap-1.5 md:grid-cols-2">
            {cameraCards.map((cam) => (
              <div key={cam.id} className="relative overflow-hidden rounded border border-[#2f78d4] bg-[#0a2f5e]">
                <div className="flex items-center justify-between border-b border-[#2a67aa] bg-[#0d3f79]/60 px-2 py-1 text-[11px] text-[#c8e6ff]">
                  <span>{cam.title}</span>
                  <div className="flex items-center gap-1.5 text-[#7dc5ff]">
                    <Camera size={11} />
                    <Power size={11} className="text-[#ff9a5a]" />
                  </div>
                </div>
                <div className="relative h-[calc(100%-28px)] min-h-[120px]">
                  <img src="/screens/idc-citic.png" alt={cam.title} className="h-full w-full object-cover object-center" />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-end bg-gradient-to-t from-[#071c39] to-transparent px-2 py-1 text-[11px] text-[#d0e9ff]">
                    {cam.rate}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`col-span-12 xl:col-span-4 ${panelClass}`}>
          {sectionTitle('IDC实时告警')}
          <div className="flex-1 min-h-[170px] xl:min-h-0">
            <BaseChart option={alarmPieOption} />
          </div>
        </div>

        <div className={`col-span-12 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('IDC设备统计')}
          <div className="flex flex-1 items-center justify-center rounded border border-[#2a67aa] bg-[#0a2f5e]">
            <div className="relative flex h-40 w-40 items-center justify-center rounded-full border border-[#619dff] bg-[#0d356e]">
              <div className="absolute inset-2 rounded-full border border-[#3f8ef7]" />
              <Box size={42} className="text-[#2d95ff]" />
            </div>
          </div>
          <div className="mt-1 text-center text-xs text-[#aed8ff]">正常运行数:1046</div>
        </div>

        <div className={`col-span-12 xl:col-span-4 ${panelClass}`}>
          {sectionTitle('IDC历史告警')}
          <div className="flex-1 min-h-[166px] xl:min-h-0">
            <BaseChart option={historyOption} />
          </div>
        </div>

        <div className={`col-span-12 xl:col-span-3 ${panelClass}`}>
          {sectionTitle('IDC设备性能')}
          <div className="flex-1 min-h-[166px] xl:min-h-0">
            <BaseChart option={tempOption} />
          </div>
        </div>

        <div className={`col-span-12 xl:col-span-5 ${panelClass}`}>
          {sectionTitle('IDC告警统计')}
          <div className="flex-1 min-h-[166px] xl:min-h-0">
            <BaseChart option={idcAlarmCountOption} />
          </div>
        </div>

        <div className={`col-span-12 xl:col-span-4 ${panelClass}`}>
          {sectionTitle('IDC监控设备')}
          <div className="flex-1 min-h-[166px] xl:min-h-0">
            <BaseChart option={monitorDeviceOption} />
          </div>
        </div>
      </div>

    </div>
  );
};

export default IDCOverview;
