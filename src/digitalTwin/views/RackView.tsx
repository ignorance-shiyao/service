import React, { useState } from 'react';
import { dtPanel, DtSectionTitle, DtStatusBadge, DtAlarmTag, DtAlarm24hPanel } from '../shared';
import { Database, Camera, Car, X } from 'lucide-react';
import { SceneStage, SceneSprite, SceneLabel } from '../sceneAssets';
import { DtSceneHeader } from '../DigitalTwinDashboard';
import { loadLayout, SceneItem } from '../layoutStore';

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

type RackDeviceDetail = {
  name: string;
  type: string;
  ip: string;
  status: '正常' | '告警' | '离线';
  rack: string;
  attached: number;
  bizScope: string;
  children: string[];
  alarmText?: string;
};

const isRackClickableDevice = (item: SceneItem) => (
  /Switch|Server|Ups/i.test(item.asset)
);

const getRackDeviceDetail = (item: SceneItem): RackDeviceDetail => {
  if (item.asset === 'rackInternalAccessSwitchAlarm') {
    return {
      name: 'SW-B03-01',
      type: '接入交换机',
      ip: '192.168.10.21',
      status: '离线',
      rack: 'B03',
      attached: 8,
      bizScope: '视觉检测、AGV调度',
      children: ['CAM-VIS-01', 'CAM-VIS-02', 'AGV-CTRL-01', 'AGV-CTRL-02', 'PLC-LINE-01', 'PLC-LINE-02', 'HMI-03', 'EDGE-I/O-01'],
      alarmText: 'SW-B03-01 接入交换机离线，影响 8 台下挂终端。',
    };
  }
  if (/Switch/i.test(item.asset)) {
    return {
      name: item.label || '接入交换机',
      type: '接入交换机',
      ip: '192.168.10.22',
      status: '正常',
      rack: 'B03',
      attached: 6,
      bizScope: '生产专网',
      children: ['PLC-01', 'PLC-02', 'IPC-01', 'IPC-02', 'CAM-01', 'CAM-02'],
    };
  }
  if (/Server/i.test(item.asset)) {
    const storage = /Storage/i.test(item.asset);
    return {
      name: item.label || (storage ? '存储服务器' : '业务服务器'),
      type: storage ? '存储服务器' : '应用服务器',
      ip: storage ? '192.168.20.41' : '192.168.20.31',
      status: item.tone === 'warn' ? '告警' : '正常',
      rack: 'B03',
      attached: storage ? 4 : 3,
      bizScope: storage ? '视频存储、检测样本库' : '视觉算法、AGV调度服务',
      children: storage ? ['VOL-VIDEO-01', 'VOL-VIDEO-02', 'VOL-SAMPLE-01', 'VOL-BACKUP-01'] : ['APP-VISION', 'APP-AGV', 'APP-MQ'],
    };
  }
  if (/Ups/i.test(item.asset)) {
    return {
      name: item.label || 'UPS 模块',
      type: '供电模块',
      ip: '192.168.30.11',
      status: item.tone === 'alarm' ? '告警' : '正常',
      rack: 'B03',
      attached: 5,
      bizScope: '机柜供电',
      children: ['PDU-A', 'PDU-B', 'SW-B03-01', 'SRV-APP-01', 'SRV-STO-01'],
    };
  }
  return { name: item.label || item.asset, type: '机柜组件', ip: '-', status: item.tone === 'alarm' ? '告警' : '正常', rack: 'B03', attached: 0, bizScope: '机柜内部', children: [] };
};

const InlineDeviceDetail: React.FC<{
  detail: RackDeviceDetail | null;
  onClose: () => void;
}> = ({ detail, onClose }) => (
  <div
    className="absolute rounded-md border bg-[#0a2547]/92 p-3 shadow-[0_0_22px_rgba(79,193,255,0.2)] backdrop-blur-[1px]"
    style={{
      left: '43%',
      right: '4%',
      top: '11%',
      minHeight: '36%',
      zIndex: 120,
      borderColor: detail?.status === '离线' ? '#ef5a4a' : '#2b6aa8',
    }}
    onClick={e => e.stopPropagation()}
  >
    <div className="mb-2 flex items-center justify-between">
      <span className="text-[13px] font-bold text-[#e8f3ff]">设备详情</span>
      {detail && (
        <button onClick={onClose} className="text-[#7e9fc8] hover:text-white">
          <X size={14} />
        </button>
      )}
    </div>
    {detail ? (
      <>
        <div className="space-y-1.5">
          <KvRow k="设备名称" v={<span className={detail.status === '正常' ? 'font-bold text-[#cfe9ff]' : 'font-bold text-[#ff8a7a]'}>{detail.name}</span>} />
          <KvRow k="类型" v={detail.type} />
          <KvRow k="IP" v={<span className="font-mono">{detail.ip}</span>} />
          <KvRow k="状态" v={<DtStatusBadge status={detail.status} />} />
          <KvRow k="所属机柜" v={detail.rack} />
          <KvRow k="下挂设备" v={`${detail.attached} 台`} />
          <KvRow k="关联业务" v={detail.bizScope} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Tile icon={<Database size={18} />} label="下挂设备" value={`${detail.attached}台`} alarm={detail.status !== '正常'} />
          <Tile icon={<Camera size={18} />} label="视觉检测" alarm={detail.bizScope.includes('视觉')} />
          <Tile icon={<Car size={18} />} label="AGV调度" alarm={detail.bizScope.includes('AGV')} />
        </div>
        {detail.children.length > 0 && (
          <div className="mt-3 rounded border border-[#244871] bg-[#081f3d]/65 p-2">
            <div className="mb-1 text-[11px] font-semibold text-[#79d0ff]">模拟下挂对象</div>
            <div className="grid grid-cols-2 gap-1">
              {detail.children.map(child => (
                <div key={child} className="truncate rounded border border-[#143258] bg-[#061a36] px-2 py-1 font-mono text-[10.5px] text-[#cfe9ff]">
                  {child}
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    ) : (
      <div className="flex min-h-[150px] items-center justify-center rounded border border-dashed border-[#244871] bg-[#081f3d]/45 px-4 text-center text-[12px] leading-5 text-[#7e9fc8]">
        点击机柜内部交换机、服务器、UPS 等设备后展示详情和告警影响。
      </div>
    )}
  </div>
);

const EditableRackScene: React.FC<{
  selectedId?: string | null;
  selectedDetail: RackDeviceDetail | null;
  onSelectDevice: (item: SceneItem) => void;
  onClearDevice: () => void;
}> = ({ selectedId, selectedDetail, onSelectDevice, onClearDevice }) => {
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
      {layout.items.filter(item => !item.hidden).map((item, idx) => {
        const clickable = isRackClickableDevice(item);
        const isSelected = clickable && item.id === selectedId;
        const isAlarm = item.asset === 'rackInternalAccessSwitchAlarm' || item.tone === 'alarm';
        return (
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
            filter={[
              item.filter,
              isSelected ? 'drop-shadow(0 0 12px rgba(79,193,255,0.85))' : undefined,
              isAlarm ? 'drop-shadow(0 0 10px rgba(239,90,74,0.65))' : undefined,
            ].filter(Boolean).join(' ') || undefined}
            anchorBottom={item.anchorBottom !== false}
            title={item.label ?? item.asset}
            z={20 + idx + (isSelected ? 100 : 0)}
            onClick={clickable ? () => onSelectDevice(item) : undefined}
          />
        );
      })}
      <SceneLabel x={20} y={8} z={80} tone="alarm">点击机柜内部设备查看详情</SceneLabel>
      <InlineDeviceDetail detail={selectedDetail} onClose={onClearDevice} />
    </SceneStage>
  );
};

export const RackView: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState<SceneItem | null>(null);
  const selectedDetail = selectedDevice ? getRackDeviceDetail(selectedDevice) : null;
  return (
    <div className={dtPanel + ' h-full min-h-0 overflow-hidden'}>
        <DtSceneHeader />
      <div
        className="grid min-h-0 flex-1 gap-2"
        style={{ gridTemplateColumns: 'minmax(0, 1.35fr) minmax(320px, 0.65fr)' }}
      >
        <div className="relative min-h-0 overflow-hidden rounded border border-[#1b4378] bg-[#03132a] p-2">
          <div className="relative h-full w-full">
            <EditableRackScene
              selectedId={selectedDevice?.id}
              selectedDetail={selectedDetail}
              onSelectDevice={setSelectedDevice}
              onClearDevice={() => setSelectedDevice(null)}
            />
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-2">
        <div className={dtPanel + ' flex-[3] min-h-0 overflow-hidden'}>
          <DtSectionTitle title="设备告警" />
          {selectedDetail?.alarmText ? (
            <div className="flex-1 space-y-1.5 overflow-auto custom-scrollbar pr-0.5">
              <div className="rounded border bg-[#0a1f3d]/85 p-2" style={{ borderColor: 'rgba(239,83,80,0.35)', borderLeftWidth: 4, borderLeftColor: '#ef5350' }}>
                <div className="mb-0.5 flex items-center justify-between">
                  <DtAlarmTag level="critical" />
                  <span className="font-mono text-[11px] text-[#7e9fc8]">14:28:19</span>
                </div>
                <div className="text-[12.5px] font-semibold text-[#e8f3ff]">{selectedDetail.alarmText}</div>
              </div>
              <div className="rounded border bg-[#0a1f3d]/85 p-2" style={{ borderColor: 'rgba(245,185,99,0.35)', borderLeftWidth: 4, borderLeftColor: '#f5b963' }}>
                <div className="mb-0.5 flex items-center justify-between">
                  <DtAlarmTag level="warning" />
                  <span className="font-mono text-[11px] text-[#7e9fc8]">14:25:07</span>
                </div>
                <div className="text-[12.5px] font-semibold text-[#e8f3ff]">B03 机柜温度偏高。</div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded border border-dashed border-[#244871] bg-[#081f3d]/55 px-4 text-center text-[12px] text-[#7e9fc8]">
              当前未选中告警设备
            </div>
          )}
        </div>

        <div className={dtPanel + ' flex-[3] min-h-0 overflow-hidden'}>
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

        <div className={dtPanel + ' flex-[2] min-h-0 overflow-hidden'}>
          <DtAlarm24hPanel />
        </div>
        </div>
      </div>
    </div>
  );
};
