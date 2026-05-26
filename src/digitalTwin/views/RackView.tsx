import React, { useState } from 'react';
import { BaseChart } from '../../components/BaseChart';
import { dtPanel, DtSectionTitle, DtStatusBadge, DtAlarmTag, DtProgress, DtAlarm24hPanel } from '../shared';
import { RACK_DETAIL } from '../data';
import { Zap, Thermometer, Database, Camera, Car, X } from 'lucide-react';
import { SceneStage, SceneSprite, SceneLabel } from '../sceneAssets';
import { DtSceneHeader } from '../DigitalTwinDashboard';
import { loadLayout } from '../layoutStore';

// ── 容量环 ─────────────────────────────────────────────────────────────
const capacityOption = {
  series: [{
    type: 'pie',
    radius: ['68%', '85%'],
    label: { show: false },
    silent: true,
    data: [
      { value: 75, name: '已用', itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: '#4fc1ff' }, { offset: 1, color: '#79d0ff' }] } } },
      { value: 25, name: '剩余', itemStyle: { color: '#102a52' } },
    ],
  }],
};

const sparkArea = (data: number[], color: string, min?: number, max?: number) => ({
  grid: { top: 4, left: 18, right: 4, bottom: 12 },
  xAxis: { type: 'category', data: data.map((_, i) => i), show: false },
  yAxis: { type: 'value', min, max, axisLabel: { color: '#7e9fc8', fontSize: 9 }, splitLine: { show: false } },
  series: [{
    type: 'line', data, smooth: true, symbol: 'none',
    lineStyle: { color, width: 1.5 },
    areaStyle: { color: `${color}22` },
  }],
});

const alarmCountOption = {
  grid: { top: 18, left: 28, right: 6, bottom: 22 },
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: ['14:30','18:30','22:30','02:30','06:30','10:30','14:30'], axisLabel: { color: '#7e9fc8', fontSize: 9 }, axisLine: { lineStyle: { color: '#234c7c' } } },
  yAxis: { type: 'value', max: 40, axisLabel: { color: '#7e9fc8', fontSize: 9 }, splitLine: { lineStyle: { color: 'rgba(35,76,124,0.4)' } } },
  series: [{
    name: '告警数', type: 'line', smooth: true,
    data: [4, 8, 14, 12, 22, 26, 30],
    lineStyle: { color: '#f5b963', width: 2 },
    itemStyle: { color: '#f5b963' },
    symbol: 'circle',
    symbolSize: 5,
    areaStyle: { color: 'rgba(245,185,99,0.15)' },
  }],
};

// ── 单 U 颜色 ─────────────────────────────────────────────────────────
const statusStyle = (s: string) => {
  switch (s) {
    case 'critical': return { bg: 'linear-gradient(180deg,#5a1414 0%,#3a0d0d 100%)', border: '#ef5a4a', text: '#ffe4df', dot: '#ef5350' };
    case 'warning':  return { bg: 'linear-gradient(180deg,#5a3a14 0%,#3a2509 100%)', border: '#f5b963', text: '#fff0d4', dot: '#f5b963' };
    case 'idle':     return { bg: '#0a1f3d', border: '#244871', text: '#5d7a9c', dot: '#3a557a' };
    default:         return { bg: 'linear-gradient(180deg,#114a8a 0%,#0a2f63 100%)', border: '#5fb4ff', text: '#cfe5ff', dot: '#6ce09a' };
  }
};

const Tile: React.FC<{ icon: React.ReactNode; label: string; value?: string; alarm?: boolean }> = ({ icon, label, value, alarm }) => (
  <div
    className="flex flex-col items-center justify-center gap-1 rounded border px-2 py-2 text-[11.5px]"
    style={{
      borderColor: alarm ? '#ef5a4a' : '#2b6aa8',
      background: alarm ? 'linear-gradient(180deg,#3a1310 0%,#220a08 100%)' : 'linear-gradient(180deg,#0e3a72 0%,#0a2c5e 100%)',
      color: alarm ? '#ff8a7a' : '#cfe5ff',
    }}
  >
    {icon}
    {value && <div className="font-mono text-[16px] font-black">{value}</div>}
    <div className="leading-tight">{label}</div>
  </div>
);

const KvRow: React.FC<{ k: string; v: React.ReactNode }> = ({ k, v }) => (
  <div className="grid grid-cols-[80px_1fr] items-center gap-2 text-[12px]">
    <span className="text-[#7e9fc8]">{k}：</span>
    <span className="text-[#e8f3ff]">{v}</span>
  </div>
);

const EditableRackScene: React.FC = () => {
  const layout = loadLayout('rack');
  const baseSrc = layout.baseMap;

  return (
    <SceneStage width={layout.width} height={layout.height} className="bg-[#020a18]">
      {baseSrc && (
        <img
          src={baseSrc}
          alt=""
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
          style={{
            zIndex: 1,
            transform: `translate(${layout.baseMapOffsetX ?? 0}%, ${layout.baseMapOffsetY ?? 0}%) rotate(${layout.baseMapRotate ?? 0}deg) scale(${layout.baseMapScale ?? 1})`,
            transformOrigin: '50% 50%',
          }}
        />
      )}
      {layout.items.filter(item => !item.hidden).map((item, idx) => (
        <SceneSprite
          key={item.id}
          asset={item.asset}
          x={item.cx}
          y={item.cy}
          width={item.w}
          height={item.h}
          rotate={item.rotate}
          yaw={item.yaw}
          pitch={item.pitch}
          sx={item.sx}
          sy={item.sy}
          opacity={item.opacity ?? 1}
          filter={item.filter}
          anchorBottom={item.anchorBottom !== false}
          title={item.label ?? item.asset}
          z={20 + idx}
        />
      ))}
      <SceneLabel x={20} y={8} z={80} tone="alarm">SW-B03-01 接入交换机离线</SceneLabel>
    </SceneStage>
  );
};

export const RackView: React.FC = () => {
  const [showDetail, setShowDetail] = useState(true);
  return (
    <div
      className="grid h-full min-h-0 gap-1.5"
      style={{ gridTemplateColumns: 'minmax(200px, clamp(200px, 16vw, 280px)) minmax(0, 1fr) minmax(240px, clamp(260px, 20vw, 340px))' }}
    >
      {/* ===== 左列 ===== */}
      <div className="flex min-h-0 flex-col gap-1.5">
        {/* 机柜容量 */}
        <div className={dtPanel + ' flex-[3] min-h-0 overflow-hidden'}>
          <DtSectionTitle title="机柜容量" />
          <div className="flex items-center gap-3">
            <div className="relative h-[110px] w-[110px] shrink-0">
              <BaseChart option={capacityOption} />
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <div className="font-mono text-[22px] font-black text-[#e8f3ff]">75%</div>
                <div className="text-[10px] text-[#7e9fc8]">容量利用率</div>
              </div>
            </div>
            <div className="space-y-3">
              <div><div className="font-mono text-[22px] font-black text-[#e8f3ff]">32U</div><div className="text-[11px] text-[#7e9fc8]">总容量</div></div>
              <div><div className="font-mono text-[22px] font-black text-[#e8f3ff]">24U</div><div className="text-[11px] text-[#7e9fc8]">已用容量</div></div>
            </div>
          </div>
        </div>

        {/* 当前功耗 */}
        <div className={dtPanel + ' flex-[3] min-h-0 overflow-hidden'}>
          <DtSectionTitle title="当前功耗" right={<span className="text-[10px] text-[#7e9fc8]">kW</span>} />
          <div className="mb-1 flex items-center gap-2">
            <Zap size={18} className="text-[#79d0ff] drop-shadow-[0_0_4px_rgba(79,193,255,0.6)]" />
            <div className="font-mono text-[26px] font-black text-[#e8f3ff]">6.8 <span className="text-[11px] font-normal text-[#7e9fc8]">kW</span></div>
          </div>
          <div className="min-h-0 flex-1"><BaseChart option={sparkArea([4,4.5,5,5.2,5.4,6,7,6.4,7.2,8,7.8,8.4,8.8,8.2,7.8,8.6,9,8.4,7.8,8.2,8.6,8.4,8,6.8], '#4fc1ff', 0, 12)} /></div>
        </div>

        {/* 机柜温度 */}
        <div className={dtPanel + ' flex-[3] min-h-0 overflow-hidden'}>
          <DtSectionTitle title="机柜温度" right={<span className="text-[10px] font-bold text-[#ff9a5a]">偏高</span>} />
          <div className="mb-1 flex items-center gap-2">
            <Thermometer size={18} className="text-[#ff9a5a] drop-shadow-[0_0_4px_rgba(255,154,90,0.6)]" />
            <div className="font-mono text-[26px] font-black text-[#ffd0c0]">31.2 <span className="text-[11px] font-normal text-[#ff9a5a]">°C</span></div>
          </div>
          <div className="min-h-0 flex-1"><BaseChart option={sparkArea([28,28.4,29,29.4,30.2,30.6,31,31.2,30.8,30.4,30.2,30.6,31,31.4,31.2,30.8,31.2,31.6,31.4,31,30.8,31,31.2,31.2], '#ff8a7a', 15, 45)} /></div>
        </div>

        {/* PDU 负载 */}
        <div className={dtPanel + ' flex-[1] min-h-0 overflow-hidden'}>
          <DtSectionTitle title="PDU负载" />
          <div className="flex items-center gap-2.5">
            <div className="font-mono text-[20px] font-black text-[#e8f3ff]">68<span className="text-[10px] font-normal text-[#7e9fc8]">%</span></div>
            <div className="flex-1"><DtProgress value={68} color="#6ce09a" height={8} /></div>
          </div>
          <div className="mt-1 flex justify-between text-[9px] text-[#7e9fc8]"><span>0%</span><span>50%</span><span>100%</span></div>
        </div>

        {/* 上联链路状态 */}
        <div className={dtPanel + ' flex-[2] min-h-0 overflow-hidden'}>
          <DtSectionTitle title="上联链路状态" />
          <div className="space-y-1.5 overflow-auto text-[12px] custom-scrollbar pr-0.5">
            <div className="flex items-center justify-between rounded border border-[#143258] bg-[#081f3d]/65 px-2.5 py-1.5 text-[#e8f3ff]">
              <span>主链路</span><DtStatusBadge status="中断" />
            </div>
            <div className="flex items-center justify-between rounded border border-[#143258] bg-[#081f3d]/65 px-2.5 py-1.5 text-[#e8f3ff]">
              <span>备用链路</span><DtStatusBadge status="待切换" />
            </div>
          </div>
        </div>
      </div>

      {/* ===== 中间机柜 ===== */}
      <div className={dtPanel + ' min-h-0 overflow-hidden'}>
        <DtSceneHeader />
        <div className="relative mb-1.5 flex min-h-0 flex-[4] gap-4 overflow-hidden rounded border border-[#1b4378] bg-[#03132a] p-4">
          <div className="relative flex-1 max-w-[520px]">
            <EditableRackScene />
          </div>

          {/* 设备详情卡 */}
          {showDetail && (
            <div className="relative flex-1 min-w-[280px]">
              {/* 连接线 */}
              <svg className="pointer-events-none absolute -left-4 top-[88px] h-[2px] w-4" viewBox="0 0 16 2">
                <line x1="0" y1="1" x2="16" y2="1" stroke="#ef5a4a" strokeWidth="2" />
              </svg>

              <div
                className="rounded-md border bg-[#0a1f3d]/95 p-3 shadow-[0_0_18px_rgba(255,90,74,0.25)]"
                style={{ borderColor: '#ef5a4a' }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[#e8f3ff]">设备详情</span>
                  <button onClick={() => setShowDetail(false)} className="text-[#7e9fc8] hover:text-white">
                    <X size={14} />
                  </button>
                </div>
                <div className="space-y-1.5">
                  <KvRow k="设备名称" v={<span className="font-bold text-[#ff8a7a]">{RACK_DETAIL.name}</span>} />
                  <KvRow k="类型" v={RACK_DETAIL.type} />
                  <KvRow k="IP" v={<span className="font-mono">{RACK_DETAIL.ip}</span>} />
                  <KvRow k="状态" v={<DtStatusBadge status="离线" />} />
                  <KvRow k="所属机柜" v={RACK_DETAIL.rack} />
                  <KvRow k="下挂设备" v={`${RACK_DETAIL.attached} 台`} />
                  <KvRow k="关联业务" v={RACK_DETAIL.bizScope} />
                </div>
              </div>

              {/* 关联业务/下挂设备 */}
              <div className="mt-3 grid grid-cols-3 gap-2">
                <Tile icon={<Database size={18} />} label="下挂设备" value="8台" alarm />
                <Tile icon={<Camera size={18} />} label="视觉检测" alarm />
                <Tile icon={<Car size={18} />} label="AGV调度" alarm />
              </div>
            </div>
          )}
        </div>

        <DtAlarm24hPanel />
      </div>

      {/* ===== 右列 ===== */}
      <div className="flex min-h-0 flex-col gap-1.5">
        <div className={dtPanel + ' flex-[3] min-h-0 overflow-hidden'}>
          <DtSectionTitle title="设备告警" />
          <div className="flex-1 space-y-1.5 overflow-auto custom-scrollbar pr-0.5">
            <div className="rounded border bg-[#0a1f3d]/85 p-2" style={{ borderColor: 'rgba(239,83,80,0.35)', borderLeftWidth: 4, borderLeftColor: '#ef5350' }}>
              <div className="mb-0.5 flex items-center justify-between">
                <DtAlarmTag level="critical" />
                <span className="font-mono text-[11px] text-[#7e9fc8]">14:28:19</span>
              </div>
              <div className="text-[12.5px] font-semibold text-[#e8f3ff]">SW-B03-01 接入交换机离线，影响 8台下挂终端。</div>
            </div>
            <div className="rounded border bg-[#0a1f3d]/85 p-2" style={{ borderColor: 'rgba(245,185,99,0.35)', borderLeftWidth: 4, borderLeftColor: '#f5b963' }}>
              <div className="mb-0.5 flex items-center justify-between">
                <DtAlarmTag level="warning" />
                <span className="font-mono text-[11px] text-[#7e9fc8]">14:25:07</span>
              </div>
              <div className="text-[12.5px] font-semibold text-[#e8f3ff]">B03机柜温度偏高。</div>
            </div>
          </div>
        </div>

        <div className={dtPanel + ' flex-[5] min-h-0 overflow-hidden'}>
          <DtSectionTitle title="处理建议" />
          <ol className="flex-1 space-y-1.5 overflow-auto text-[12px] text-[#e8f3ff] custom-scrollbar pr-0.5">
            {['检查上联光模块', '确认PDU供电', '切换备用链路', '派发网络运维工单', '通知一号产线负责人'].map((t, i) => (
              <li key={i} className="flex items-center gap-2 rounded border border-[#143258] bg-[#081f3d]/65 px-2.5 py-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1f5f9c] text-[10px] font-bold text-white">{i + 1}</span>
                {t}
              </li>
            ))}
          </ol>
        </div>

        <div className={dtPanel + ' flex-[3] min-h-0 overflow-hidden'}>
          <DtSectionTitle title="环境状态" />
          <div className="flex-1 grid grid-cols-2 gap-1.5 content-start overflow-auto custom-scrollbar pr-0.5">
            {[
              { name: '温度', s: '偏高' as const }, { name: '湿度', s: '正常' as const },
              { name: '烟感', s: '正常' as const }, { name: '水浸', s: '正常' as const },
              { name: 'UPS', s: '正常' as const }, { name: '空调', s: '告警' as const },
            ].map(x => (
              <div key={x.name} className="flex items-center justify-between rounded border border-[#143258] bg-[#081f3d]/65 px-2.5 py-1.5 text-[12px] text-[#e8f3ff]">
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
