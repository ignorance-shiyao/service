import React, { useState } from 'react';
import { BaseChart } from '../../components/BaseChart';
import { dtPanel, DtSectionTitle, DtStatusBadge, DtAlarmTag } from '../shared';
import { RACK_LAYOUT, RACK_DETAIL } from '../data';
import { Zap, Thermometer, Database, Camera, Car, AlertTriangle, X } from 'lucide-react';

const capacityOption = {
  series: [{
    type: 'pie',
    radius: ['62%', '82%'],
    avoidLabelOverlap: false,
    label: { show: false },
    data: [
      { value: 75, name: '已用', itemStyle: { color: '#3fa5ff' } },
      { value: 25, name: '剩余', itemStyle: { color: '#0e3e7e' } },
    ],
  }],
};

const powerOption = {
  grid: { top: 8, left: 24, right: 6, bottom: 16 },
  xAxis: { type: 'category', show: false, data: Array.from({ length: 24 }).map((_, i) => i) },
  yAxis: { type: 'value', max: 12, axisLabel: { color: '#9fc8f2', fontSize: 9 } },
  series: [{
    type: 'line', smooth: true, symbol: 'none',
    data: [4, 4.5, 5, 5.2, 5.4, 6, 7, 6.4, 7.2, 8, 7.8, 8.4, 8.8, 8.2, 7.8, 8.6, 9, 8.4, 7.8, 8.2, 8.6, 8.4, 8, 6.8],
    lineStyle: { color: '#4fc1ff', width: 1.5 },
    areaStyle: { color: 'rgba(79,193,255,0.18)' },
  }],
};

const tempOption = {
  grid: { top: 8, left: 24, right: 6, bottom: 16 },
  xAxis: { type: 'category', show: false, data: Array.from({ length: 24 }).map((_, i) => i) },
  yAxis: { type: 'value', min: 15, max: 45, axisLabel: { color: '#9fc8f2', fontSize: 9 } },
  series: [{
    type: 'line', smooth: true, symbol: 'none',
    data: [28, 28.4, 29, 29.4, 30.2, 30.6, 31, 31.2, 30.8, 30.4, 30.2, 30.6, 31, 31.4, 31.2, 30.8, 31.2, 31.6, 31.4, 31, 30.8, 31, 31.2, 31.2],
    lineStyle: { color: '#ff8a7a' },
    areaStyle: { color: 'rgba(255,138,122,0.18)' },
  }],
};

const alarmCountOption = {
  grid: { top: 18, left: 30, right: 6, bottom: 22 },
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: ['14:30', '18:30', '22:30', '02:30', '06:30', '10:30', '14:30'], axisLabel: { color: '#9fc8f2', fontSize: 9 } },
  yAxis: { type: 'value', max: 40, axisLabel: { color: '#9fc8f2', fontSize: 9 } },
  series: [{
    name: '告警数', type: 'line', smooth: true,
    data: [4, 8, 14, 12, 22, 26, 30],
    lineStyle: { color: '#f5b963' }, itemStyle: { color: '#f5b963' },
  }],
};

const statusColor = (s: string) => {
  switch (s) {
    case 'critical': return { bg: '#5a1414', border: '#ff5a4a', text: '#ffe4df', dot: '#ef5350' };
    case 'warning': return { bg: '#5a3a14', border: '#f5b963', text: '#fff0d4', dot: '#f5b963' };
    case 'idle': return { bg: '#0a1f3d', border: '#2a4566', text: '#7a96b6', dot: '#3a557a' };
    default: return { bg: '#0d3567', border: '#5ea6e5', text: '#cfe5ff', dot: '#7dd6a4' };
  }
};

export const RackView: React.FC = () => {
  const [showDetail, setShowDetail] = useState(true);
  return (
    <div className="grid h-full grid-cols-12 gap-1.5">
      {/* 左列 */}
      <div className="col-span-3 flex flex-col gap-1.5">
        <div className={dtPanel}>
          <DtSectionTitle title="机柜容量" />
          <div className="flex flex-1 items-center gap-2">
            <div className="relative h-[110px] w-[110px]">
              <BaseChart option={capacityOption} />
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <div className="font-mono text-[22px] font-black text-[#d8f1ff]">75%</div>
                <div className="text-[10px] text-[#8bc4ff]">容量利用率</div>
              </div>
            </div>
            <div className="space-y-2 text-[12px]">
              <div><div className="font-mono text-[20px] font-bold text-[#cfe9ff]">32U</div><div className="text-[10px] text-[#8bc4ff]">总容量</div></div>
              <div><div className="font-mono text-[20px] font-bold text-[#cfe9ff]">24U</div><div className="text-[10px] text-[#8bc4ff]">已用容量</div></div>
            </div>
          </div>
        </div>
        <div className={dtPanel}>
          <DtSectionTitle title="当前功耗" right={<span className="text-[10px] text-[#8bc4ff]">kW</span>} />
          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} className="text-[#79d0ff]" />
            <div className="font-mono text-[26px] font-black text-[#d8f1ff]">6.8 <span className="text-[10px] text-[#8bc4ff] font-normal">kW</span></div>
          </div>
          <div className="flex-1"><BaseChart option={powerOption} /></div>
        </div>
        <div className={dtPanel}>
          <DtSectionTitle title="机柜温度" right={<span className="text-[10px] text-[#ff9a5a]">偏高</span>} />
          <div className="flex items-center gap-2 mb-1">
            <Thermometer size={16} className="text-[#ff9a5a]" />
            <div className="font-mono text-[26px] font-black text-[#ffd0c0]">31.2 <span className="text-[10px] text-[#ff9a5a] font-normal">°C</span></div>
          </div>
          <div className="flex-1"><BaseChart option={tempOption} /></div>
        </div>
        <div className={dtPanel}>
          <DtSectionTitle title="PDU负载" />
          <div className="flex items-center gap-2.5">
            <div className="font-mono text-[22px] font-black text-[#d8f1ff]">68<span className="text-[10px] text-[#8bc4ff] font-normal">%</span></div>
            <div className="h-2.5 flex-1 overflow-hidden rounded bg-[#0c2f5e]">
              <div className="h-full rounded bg-gradient-to-r from-[#3fa5ff] to-[#7dd6a4]" style={{ width: '68%' }} />
            </div>
          </div>
        </div>
        <div className={dtPanel}>
          <DtSectionTitle title="上联链路状态" />
          <div className="space-y-1.5 text-[12px]">
            <div className="flex items-center justify-between rounded bg-[#0e3e7e]/55 px-2 py-1 text-[#d8eaff]"><span>主链路</span><DtStatusBadge status="中断" /></div>
            <div className="flex items-center justify-between rounded bg-[#0e3e7e]/55 px-2 py-1 text-[#d8eaff]"><span>备用链路</span><DtStatusBadge status="待切换" /></div>
          </div>
        </div>
      </div>

      {/* 中间机柜可视化 + 设备详情 */}
      <div className="col-span-6 flex flex-col gap-1.5">
        <div className={`${dtPanel} flex-1`}>
          <DtSectionTitle title="B03 机柜" />
          <div className="relative flex flex-1 gap-3 overflow-hidden rounded border border-[#16508f] bg-[#03132a] p-3">
            {/* U 位刻度 */}
            <div className="flex flex-col-reverse justify-between text-[9px] text-[#8bc4ff] py-1">
              {[1, 4, 8, 12, 16, 20, 24, 28, 32].map(u => <div key={u}>{u}U</div>)}
            </div>
            {/* 机柜本体 */}
            <div className="relative flex flex-1 max-w-[300px] flex-col justify-between rounded border-2 border-[#3a82c8] bg-[#0a1f3d] p-1.5">
              {RACK_LAYOUT.map((slot, i) => {
                const c = statusColor(slot.status);
                return (
                  <div
                    key={i}
                    onClick={() => slot.status !== 'idle' && setShowDetail(true)}
                    className={`rounded flex items-center justify-center text-[11px] font-semibold border ${slot.selected ? 'animate-pulse' : ''}`}
                    style={{ background: c.bg, borderColor: c.border, color: c.text, cursor: slot.status !== 'idle' ? 'pointer' : 'default', height: 24 }}
                  >
                    <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full" style={{ background: c.dot }} />
                    {slot.name}
                  </div>
                );
              })}
            </div>
            {/* 设备详情卡 */}
            {showDetail && (
              <div className="relative flex-1 min-w-[280px]">
                <div className="absolute left-[-26px] top-[148px] h-[2px] w-[26px] bg-[#ff5a4a]" />
                <div className="rounded-lg border border-[#ff5a4a] bg-[#0a1f3d]/95 p-3 shadow-[0_0_18px_rgba(255,90,74,0.25)]">
                  <div className="mb-2 flex items-center justify-between text-[#eaf6ff]">
                    <span className="text-[13px] font-bold">设备详情</span>
                    <button onClick={() => setShowDetail(false)} className="text-[#9bc4eb] hover:text-white"><X size={14} /></button>
                  </div>
                  <div className="space-y-1.5 text-[12px]">
                    <Row k="设备名称" v={<span className="text-[#ff8a7a] font-bold">{RACK_DETAIL.name}</span>} />
                    <Row k="类型" v={RACK_DETAIL.type} />
                    <Row k="IP" v={RACK_DETAIL.ip} />
                    <Row k="状态" v={<DtStatusBadge status="离线" />} />
                    <Row k="所属机柜" v={RACK_DETAIL.rack} />
                    <Row k="下挂设备" v={`${RACK_DETAIL.attached} 台`} />
                    <Row k="关联业务" v={RACK_DETAIL.bizScope} />
                  </div>
                </div>
                {/* 下挂设备 / 业务关联 */}
                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  <Tile icon={<Database size={16} />} label="下挂设备" value="8台" alarm />
                  <Tile icon={<Camera size={16} />} label="视觉检测" alarm />
                  <Tile icon={<Car size={16} />} label="AGV调度" alarm />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={dtPanel} style={{ height: 144 }}>
          <DtSectionTitle title="最近24小时告警数量变化" right={<div className="flex items-center gap-2 text-[10px] text-[#9fc8f2]"><span>严重告警 <span className="text-[#ff8a7a]">12</span></span><span>一般告警 <span className="text-[#f5b963]">21</span></span></div>} />
          <div className="flex-1 min-h-0"><BaseChart option={alarmCountOption} /></div>
        </div>
      </div>

      {/* 右列 */}
      <div className="col-span-3 flex flex-col gap-1.5">
        <div className={dtPanel}>
          <DtSectionTitle title="设备告警" />
          <div className="space-y-1.5">
            <div className="rounded border-l-4 border-[#ef5350] bg-[#0c2f5e]/85 px-2 py-1.5 text-[11px]">
              <div className="mb-0.5 flex items-center justify-between"><DtAlarmTag level="critical" /><span className="text-[10px] text-[#9bc4eb]">14:28:19</span></div>
              <div className="text-[12px] font-semibold text-[#eaf6ff]">SW-B03-01 接入交换机离线，影响 8台下挂终端。</div>
            </div>
            <div className="rounded border-l-4 border-[#f5b963] bg-[#0c2f5e]/85 px-2 py-1.5 text-[11px]">
              <div className="mb-0.5 flex items-center justify-between"><DtAlarmTag level="warning" /><span className="text-[10px] text-[#9bc4eb]">14:25:07</span></div>
              <div className="text-[12px] font-semibold text-[#eaf6ff]">B03机柜温度偏高。</div>
            </div>
          </div>
        </div>
        <div className={dtPanel}>
          <DtSectionTitle title="处理建议" />
          <ol className="space-y-1.5 text-[12px] text-[#d8eaff]">
            {['检查上联光模块', '确认PDU供电', '切换备用链路', '派发网络运维工单', '通知一号产线负责人'].map((t, i) => (
              <li key={i} className="flex items-center gap-2 rounded bg-[#0e3e7e]/55 px-2 py-1.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#1f5f9c] text-[10px] font-bold text-white">{i + 1}</span>
                {t}
              </li>
            ))}
          </ol>
        </div>
        <div className={dtPanel}>
          <DtSectionTitle title="环境状态" />
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { name: '温度', s: '偏高' as const },
              { name: '湿度', s: '正常' as const },
              { name: '烟感', s: '正常' as const },
              { name: '水浸', s: '正常' as const },
              { name: 'UPS', s: '正常' as const },
              { name: '空调', s: '告警' as const },
            ].map(x => (
              <div key={x.name} className="flex items-center justify-between rounded bg-[#0e3e7e]/55 px-2 py-1 text-[11px] text-[#d8eaff]">
                <span>{x.name}</span>
                <DtStatusBadge status={x.s} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Row: React.FC<{ k: string; v: React.ReactNode }> = ({ k, v }) => (
  <div className="grid grid-cols-[80px_1fr] gap-2 text-[#cfe5ff]">
    <span className="text-[#8bc4ff]">{k}:</span>
    <span>{v}</span>
  </div>
);

const Tile: React.FC<{ icon: React.ReactNode; label: string; value?: string; alarm?: boolean }> = ({ icon, label, value, alarm }) => (
  <div className={`flex flex-col items-center justify-center gap-1 rounded border px-2 py-2 text-[11px] ${alarm ? 'border-[#ff5a4a] bg-[#3a1414] text-[#ff8a7a]' : 'border-[#3a82c8] bg-[#0d3567] text-[#cfe5ff]'}`}>
    {icon}
    {value && <div className="font-mono text-[15px] font-bold">{value}</div>}
    <div>{label}</div>
  </div>
);
