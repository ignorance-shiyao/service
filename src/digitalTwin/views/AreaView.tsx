import React from 'react';
import { BaseChart } from '../../components/BaseChart';
import { dtPanel, DtSectionTitle, DtStatusBadge, DtAlarmTag, DtProgress, DtAlarm24hPanel } from '../shared';
import { B_AREA_CATEGORIES, B_AREA_KPIS, B_AREA_ENV, CURRENT_ALARMS } from '../data';
import { Gauge, Activity, Thermometer, Zap, Wifi, Network, Server, Camera, HardDrive, Wind, Cpu, Square, Database } from 'lucide-react';
import { useDtNav, DtSceneHeader } from '../DigitalTwinDashboard';
import { SceneStage, SceneSprite, SceneLabel, SceneAlarmPulse } from '../sceneAssets';
import { loadLayout, SceneId } from '../layoutStore';

const categoryIcons = [Network, Server, Cpu, Camera, HardDrive, Wind];
const kpiIcons = [Gauge, Activity, Wifi, Thermometer, Zap];

const sparkline = (data: number[], color: string) => ({
  grid: { top: 4, left: 0, right: 0, bottom: 4 },
  xAxis: { type: 'category', show: false, data: data.map((_, i) => i) },
  yAxis: { type: 'value', show: false },
  series: [{
    type: 'line', data, smooth: true, symbol: 'none',
    lineStyle: { width: 1.5, color },
    areaStyle: { color: `${color}33` },
  }],
});

// ── B 区机房内部（按真实平面图：墙体 / 机柜行 / 末端配电 / 入口走廊） ────
const IdcInteriorScene: React.FC = () => {
  const { setView } = useDtNav();
  const drill = () => setView('rack');
  return (
    <SceneStage width={1200} height={720} className="bg-[radial-gradient(ellipse_at_center,#0e2f5a_0%,#061a36_60%,#020a18_100%)]">
      {/* === 房间外框（实际机房四面墙体）=== */}
      {/* 整间机房地板 */}
      <div
        className="pointer-events-none absolute"
        style={{ left: '6%', right: '6%', top: '8%', bottom: '6%', background: '#04162e',
                 border: '2px solid #2b6aa8', borderRadius: 6, zIndex: 1 }}
      />
      {/* 地板瓷砖纹理 */}
      <SceneSprite asset="floorRaisedTile" x={50} y={66} width={84} z={2} anchorBottom={false} opacity={0.85} />
      {/* 后墙带（顶端的墙体厚度示意） */}
      <div
        className="pointer-events-none absolute"
        style={{ left: '6%', right: '6%', top: '8%', height: '4%',
                 background: 'linear-gradient(180deg,#163b6d,#0e2a52)',
                 borderBottom: '1px solid #2b6aa8', borderTopLeftRadius: 6, borderTopRightRadius: 6,
                 zIndex: 3 }}
      />
      {/* 顶部桥架（沿后墙内侧） */}
      <SceneSprite asset="cableTray" x={50} y={20} width={66} z={5} anchorBottom={false} opacity={0.8} />

      {/* === 后墙：左右监控摄像头（贴在墙上） === */}
      <SceneSprite asset="deviceCamera" x={12} y={15} width={3.6} z={20} title="监控摄像头 北-1" />
      <SceneSprite asset="deviceCamera" x={88} y={15} width={3.6} z={20} title="监控摄像头 北-2" />

      {/* === 主操作区：上下两排机柜，中间冷通道 === */}
      {/* 行尾两台行内空调（在 B01/B02 行之间的两端） */}
      <SceneSprite asset="acInrow" x={14} y={50} width={3.2} z={28} title="行内空调-A" />
      <SceneSprite asset="acInrow" x={86} y={50} width={3.2} z={28} title="行内空调-B" />

      {/* B01 后排机柜 */}
      <SceneSprite asset="rackRow" x={50} y={42} width={50} z={20} onClick={drill} title="B01 机柜行（8 台）" />
      <SceneLabel  x={50} y={30} z={61}>B01 机柜行 · 8 台</SceneLabel>

      {/* 冷通道指示 */}
      <div
        className="pointer-events-none absolute"
        style={{ left: '25%', right: '25%', top: '46%', height: '5%',
                 background: 'linear-gradient(180deg,rgba(79,193,255,0.16),rgba(79,193,255,0.04))',
                 border: '1px dashed rgba(79,193,255,0.55)', borderRadius: 3, zIndex: 6 }}
      >
        <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-1/2 text-[10px] font-semibold text-[#79d0ff] tracking-[0.2em]">冷 通 道</span>
      </div>

      {/* B02 前排机柜 */}
      <SceneSprite asset="rackRow" x={50} y={60} width={50} z={22} onClick={drill} title="B02 机柜行（8 台）" />
      <SceneLabel  x={50} y={48} z={61}>B02 机柜行 · 8 台</SceneLabel>

      {/* 故障指示：定位到 B01 第 3 台机柜（SW-A-01 在该机柜中） */}
      <SceneAlarmPulse x={38} y={36} size={7} z={50} />
      <SceneLabel x={38} y={26} z={70} tone="alarm">⚠ SW-A-01 离线 · B01 / 3 号机柜</SceneLabel>

      {/* === 末端配电与制冷（沿房间下边墙整齐排列） === */}
      {/* 左段：制冷 */}
      <SceneSprite asset="acRoomPrecision"    x={14} y={82} width={6.5} z={42} title="精密空调-A" />
      <SceneLabel  x={14} y={89} z={61}>精密空调 A</SceneLabel>
      {/* 中段：UPS 与配电 */}
      <SceneSprite asset="upsMain"            x={26} y={82} width={5}   z={42} title="UPS 主机" />
      <SceneLabel  x={26} y={89} z={61}>UPS 主机</SceneLabel>
      <SceneSprite asset="upsBattery"         x={35} y={82} width={4.5} z={42} title="电池柜" />
      <SceneLabel  x={35} y={89} z={61}>电池柜</SceneLabel>
      <SceneSprite asset="atsCabinet"         x={44} y={82} width={4.5} z={42} title="ATS 切换柜" />
      <SceneLabel  x={44} y={89} z={61}>ATS</SceneLabel>
      <SceneSprite asset="powerDistribution"  x={55} y={82} width={6}   z={42} title="低压配电柜" />
      <SceneLabel  x={55} y={89} z={61}>配电柜</SceneLabel>
      <SceneSprite asset="fireCylinders"      x={64} y={82} width={4}   z={42} title="气体灭火" />
      <SceneLabel  x={64} y={89} z={61}>灭火</SceneLabel>
      {/* 右段：制冷 + 动环主机 */}
      <SceneSprite asset="devicePrecisionAcW" x={75} y={82} width={5}   z={42} title="精密空调-B（告警）" />
      <SceneLabel  x={75} y={89} z={61} tone="alarm">精密空调 B</SceneLabel>
      <SceneSprite asset="workshopCtrlCab"    x={84} y={82} width={3.6} z={42} title="动环主机" />
      <SceneLabel  x={84} y={89} z={61}>动环主机</SceneLabel>

      {/* === 入口：双开门在右下角的"前墙"上（不与机柜垂直对齐） === */}
      <div
        className="pointer-events-none absolute"
        style={{ left: '88%', right: '6%', top: '8%', bottom: '6%',
                 background: 'linear-gradient(180deg,#0e2a52,#0a1f3d)',
                 borderLeft: '1px solid #2b6aa8', borderRadius: '0 6px 6px 0', zIndex: 3 }}
      />
      <SceneSprite asset="doorDouble" x={91.5} y={68} width={4} z={44} title="机房入口" />
      <SceneLabel x={91.5} y={74} z={61}>入口</SceneLabel>
    </SceneStage>
  );
};

// ── 1号产线 内部（厂房：物料门在左墙 / 工艺自西向东 / 包装在前） ─────────
const ProductionLineScene: React.FC = () => (
  <SceneStage width={1200} height={720} className="bg-[radial-gradient(ellipse_at_center,#0b2a55_0%,#061a36_60%,#020a18_100%)]">
    {/* 厂房外框 + 地坪 */}
    <div
      className="pointer-events-none absolute"
      style={{ left: '6%', right: '6%', top: '8%', bottom: '6%', background: '#082040',
               border: '2px solid #2b6aa8', borderRadius: 6, zIndex: 1 }}
    />
    <SceneSprite asset="floorRoomSlab" x={50} y={66} width={84} z={2} anchorBottom={false} opacity={0.9} />
    {/* 后墙带 */}
    <div
      className="pointer-events-none absolute"
      style={{ left: '6%', right: '6%', top: '8%', height: '4%',
               background: 'linear-gradient(180deg,#143560,#0a1f3d)',
               borderBottom: '1px solid #2b6aa8', borderTopLeftRadius: 6, borderTopRightRadius: 6, zIndex: 3 }}
    />
    {/* 后墙：监控（仅 2 台贴墙摄像头，避免与设备争位） */}
    <SceneSprite asset="deviceCamera" x={12} y={15} width={3.6} z={20} title="摄像头" />
    <SceneSprite asset="deviceCamera" x={88} y={15} width={3.6} z={20} title="摄像头" />

    {/* === 入口（卷帘门）在左侧墙体上 === */}
    <div
      className="pointer-events-none absolute"
      style={{ left: '6%', right: '92%', top: '8%', bottom: '6%',
               background: 'linear-gradient(180deg,#0e2a52,#0a1f3d)',
               borderRight: '1px solid #2b6aa8', borderRadius: '6px 0 0 6px', zIndex: 3 }}
    />
    <SceneSprite asset="doorDouble" x={8.5} y={84} width={4} z={44} title="物料入口（卷帘门）" />
    <SceneLabel x={8.5} y={90} z={61}>物料入口</SceneLabel>

    {/* === 工艺流水线：上料 → CNC → 装配 → 下料（横贯东西，避开门）=== */}
    {/* 主传送带 */}
    <SceneSprite asset="workshopConveyor" x={55} y={48} width={68} z={20} title="主装配线传送带" />

    {/* ① 上料机械臂（紧挨入口） */}
    <SceneSprite asset="workshopRobotArm" x={22} y={52} width={9}  z={32} title="上料机械臂" />
    <SceneLabel  x={22} y={60} z={61}>① 上料</SceneLabel>

    {/* ② CNC 加工区 */}
    <SceneSprite asset="workshopCNC" x={40} y={54} width={11} z={31} title="CNC 数控机床 A" />
    <SceneLabel  x={40} y={64} z={61}>② CNC-A</SceneLabel>
    <SceneSprite asset="workshopCNC" x={56} y={54} width={11} z={31} title="CNC 数控机床 B" />
    <SceneLabel  x={56} y={64} z={61}>② CNC-B</SceneLabel>

    {/* ③ 装配 */}
    <SceneSprite asset="workshopAssembly" x={72} y={54} width={10} z={32} title="装配工位" />
    <SceneLabel  x={72} y={64} z={61}>③ 装配</SceneLabel>

    {/* ④ 下料 */}
    <SceneSprite asset="workshopRobotArm" x={86} y={52} width={9}  z={32} title="下料机械臂" />
    <SceneLabel  x={86} y={60} z={61}>④ 下料</SceneLabel>

    {/* === 前排：包装区 + 控制柜 + 出货 AGV === */}
    <SceneSprite asset="workshopCtrlCab"  x={20} y={82} width={4}  z={42} title="车间主控柜" />
    <SceneLabel  x={20} y={89} z={61}>主控柜</SceneLabel>
    <SceneSprite asset="workshopAssembly" x={32} y={82} width={8}  z={40} title="包装工位 1" />
    <SceneLabel  x={32} y={89} z={61}>包装工位 1</SceneLabel>
    <SceneSprite asset="workshopAssembly" x={46} y={82} width={8}  z={40} title="包装工位 2" />
    <SceneLabel  x={46} y={89} z={61}>包装工位 2</SceneLabel>
    <SceneSprite asset="workshopAssembly" x={60} y={82} width={8}  z={40} title="包装工位 3" />
    <SceneLabel  x={60} y={89} z={61}>包装工位 3</SceneLabel>
    <SceneSprite asset="workshopCtrlCab"  x={72} y={82} width={4}  z={42} title="PLC 柜" />
    <SceneLabel  x={72} y={89} z={61}>PLC 柜</SceneLabel>
    <SceneSprite asset="deviceAgv"        x={84} y={82} width={9}  z={40} title="出货 AGV" />
    <SceneLabel  x={84} y={89} z={61}>出货 AGV</SceneLabel>

    {/* 安全栏沿主流水线前缘 */}
    <SceneSprite asset="workshopFence" x={55} y={72} width={66} z={15} anchorBottom={false} opacity={0.5} />
  </SceneStage>
);

// ── 算力模块A 内部（三排机柜 + 冷热通道 + 配电墙） ──────────────────────
const ComputeModuleScene: React.FC = () => {
  const { setView } = useDtNav();
  const drill = () => setView('rack');
  // 冷通道指示带组件
  const Aisle = ({ y }: { y: number }) => (
    <div
      className="pointer-events-none absolute"
      style={{ left: '20%', right: '20%', top: `${y}%`, height: '4.5%', background: 'linear-gradient(180deg,rgba(79,193,255,0.18),rgba(79,193,255,0.05))', border: '1px dashed rgba(79,193,255,0.4)', borderRadius: 3, zIndex: 6 }}
    >
      <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-1/2 text-[9.5px] font-semibold text-[#79d0ff] tracking-wider">冷 通 道</span>
    </div>
  );
  return (
    <SceneStage width={1200} height={720} className="bg-[radial-gradient(ellipse_at_center,#0e2f5a_0%,#061a36_60%,#020a18_100%)]">
      {/* 房间外框 + 地坪 */}
      <div className="pointer-events-none absolute" style={{ left: '6%', right: '6%', top: '8%', bottom: '6%', background: '#04162e', border: '2px solid #2b6aa8', borderRadius: 6, zIndex: 1 }} />
      <SceneSprite asset="floorRaisedTile" x={50} y={66} width={84} z={2} anchorBottom={false} opacity={0.85} />
      {/* 后墙带 */}
      <div className="pointer-events-none absolute" style={{ left: '6%', right: '6%', top: '8%', height: '4%', background: 'linear-gradient(180deg,#163b6d,#0e2a52)', borderBottom: '1px solid #2b6aa8', borderTopLeftRadius: 6, borderTopRightRadius: 6, zIndex: 3 }} />
      {/* 顶部桥架 */}
      <SceneSprite asset="cableTray" x={50} y={20} width={62} z={5} anchorBottom={false} opacity={0.8} />

      {/* 后墙：仅摄像头 */}
      <SceneSprite asset="deviceCamera" x={12} y={15} width={3.6} z={20} />
      <SceneSprite asset="deviceCamera" x={88} y={15} width={3.6} z={20} />

      {/* 行尾行内空调 */}
      <SceneSprite asset="acInrow" x={14} y={56} width={3.2} z={28} title="行内空调-A" />
      <SceneSprite asset="acInrow" x={86} y={56} width={3.2} z={28} title="行内空调-B" />

      {/* 三排机柜 + 两条冷通道 */}
      <SceneSprite asset="rackRow" x={50} y={34} width={50} z={20} onClick={drill} title="A01 机柜行" />
      <SceneLabel  x={50} y={24} z={61}>A01 机柜行 · 8 台</SceneLabel>
      <Aisle y={38} />
      <SceneSprite asset="rackRow" x={50} y={50} width={50} z={22} onClick={drill} title="A02 机柜行" />
      <SceneLabel  x={50} y={40} z={61}>A02 机柜行 · 8 台</SceneLabel>
      <Aisle y={54} />
      <SceneSprite asset="rackRow" x={50} y={66} width={50} z={24} onClick={drill} title="A03 机柜行" />
      <SceneLabel  x={50} y={56} z={61}>A03 机柜行 · 8 台</SceneLabel>

      {/* 末端配电与制冷（下边墙整齐排列，不与门冲突） */}
      <SceneSprite asset="acRoomPrecision"   x={14} y={82} width={6.5} z={42} title="精密空调 A" />
      <SceneLabel  x={14} y={89} z={61}>精密空调 A</SceneLabel>
      <SceneSprite asset="upsMain"           x={26} y={82} width={5}   z={42} title="UPS" />
      <SceneLabel  x={26} y={89} z={61}>UPS</SceneLabel>
      <SceneSprite asset="upsBattery"        x={34} y={82} width={4.5} z={42} title="电池柜" />
      <SceneLabel  x={34} y={89} z={61}>电池柜</SceneLabel>
      <SceneSprite asset="atsCabinet"        x={43} y={82} width={4.5} z={42} title="ATS" />
      <SceneLabel  x={43} y={89} z={61}>ATS</SceneLabel>
      <SceneSprite asset="powerDistribution" x={53} y={82} width={6}   z={42} title="配电柜" />
      <SceneLabel  x={53} y={89} z={61}>配电柜</SceneLabel>
      <SceneSprite asset="fireCylinders"     x={62} y={82} width={4}   z={42} title="气体灭火" />
      <SceneLabel  x={62} y={89} z={61}>灭火</SceneLabel>
      <SceneSprite asset="acRoomPrecision"   x={73} y={82} width={6}   z={42} title="精密空调 B" />
      <SceneLabel  x={73} y={89} z={61}>精密空调 B</SceneLabel>
      <SceneSprite asset="workshopCtrlCab"   x={82} y={82} width={3.6} z={42} title="动环主机" />
      <SceneLabel  x={82} y={89} z={61}>动环</SceneLabel>

      {/* 入口在右墙（不在机柜正上方） */}
      <div className="pointer-events-none absolute" style={{ left: '88%', right: '6%', top: '8%', bottom: '6%', background: 'linear-gradient(180deg,#0e2a52,#0a1f3d)', borderLeft: '1px solid #2b6aa8', borderRadius: '0 6px 6px 0', zIndex: 3 }} />
      <SceneSprite asset="doorDouble" x={91.5} y={68} width={4} z={44} title="机房入口" />
      <SceneLabel x={91.5} y={74} z={61}>入口</SceneLabel>
    </SceneStage>
  );
};

// ── AGV 调度区 内部 ─────────────────────────────────────────────────────
const AgvDispatchScene: React.FC = () => (
  <SceneStage width={1200} height={700} className="bg-[radial-gradient(ellipse_at_center,#0b2a55_0%,#061a36_60%,#020a18_100%)]">
    <SceneSprite asset="floorRoomSlab" x={50} y={62} width={92} z={1} anchorBottom={false} />
    {/* 充电区（后排） */}
    <SceneSprite asset="parkEvCharger" x={30} y={38} width={22} z={20} title="充电桩 A" />
    <SceneSprite asset="parkEvCharger" x={70} y={38} width={22} z={20} title="充电桩 B" />
    <SceneLabel  x={50} y={20} z={61}>AGV 充电区（双侧）</SceneLabel>
    {/* AGV 阵列（前排） */}
    <SceneSprite asset="deviceAgv" x={15} y={78} width={8} z={40} title="AGV-01" />
    <SceneSprite asset="deviceAgv" x={30} y={82} width={8} z={41} title="AGV-02" />
    <SceneSprite asset="deviceAgv" x={45} y={78} width={8} z={40} title="AGV-03" />
    <SceneSprite asset="deviceAgv" x={60} y={82} width={8} z={41} title="AGV-04（告警）"
      filter="drop-shadow(0 0 6px rgba(255,180,114,0.55))" />
    <SceneSprite asset="deviceAgv" x={75} y={78} width={8} z={40} title="AGV-05" />
    <SceneSprite asset="deviceAgv" x={88} y={82} width={8} z={41} title="AGV-06" />
    <SceneLabel  x={60} y={90} z={61} tone="warn">AGV-04 电量低</SceneLabel>
    {/* 控制柜 + 摄像头 */}
    <SceneSprite asset="workshopCtrlCab" x={6}  y={58} width={5}   z={42} title="调度控制柜" />
    <SceneSprite asset="deviceCamera"    x={94} y={20} width={4.5} z={45} title="监控摄像头" />
  </SceneStage>
);

// ── 视觉检测区 内部 ─────────────────────────────────────────────────────
const VisionLineScene: React.FC = () => (
  <SceneStage width={1200} height={700} className="bg-[radial-gradient(ellipse_at_center,#3a1a2c_0%,#1a0a18_60%,#020a18_100%)]">
    <SceneSprite asset="floorRoomSlab" x={50} y={62} width={92} z={1} anchorBottom={false} />
    {/* 来料传送带 */}
    <SceneSprite asset="workshopConveyor" x={50} y={42} width={72} z={20} title="检测传送带" />
    <SceneLabel  x={50} y={26} z={61}>检测传送带</SceneLabel>
    {/* 5 台视觉工位均匀排列 */}
    {[18, 33, 50, 67, 82].map((x, i) => (
      <React.Fragment key={i}>
        <SceneSprite asset="workstationVision" x={x} y={82} width={7} z={40} title={`视觉工位-0${i + 1}`}
          filter={i === 1 || i === 3 ? 'drop-shadow(0 0 6px rgba(239,90,74,0.65))' : undefined} />
        <SceneLabel x={x} y={88} z={61} tone={i === 1 || i === 3 ? 'alarm' : 'normal'}>
          视觉-0{i + 1}
        </SceneLabel>
      </React.Fragment>
    ))}
    <SceneSprite asset="workshopCtrlCab" x={6}  y={58} width={5}   z={42} title="视觉控制柜" />
    <SceneSprite asset="workshopCtrlCab" x={94} y={58} width={5}   z={42} title="视觉控制柜" />
    <SceneLabel x={50} y={95} z={61} tone="alarm">视觉-02 / 04 告警 · 整体健康度 78.6</SceneLabel>
  </SceneStage>
);

// ── 办公网区 内部 ───────────────────────────────────────────────────────
const OfficeNetScene: React.FC = () => (
  <SceneStage width={1200} height={700} className="bg-[radial-gradient(ellipse_at_center,#0b2a55_0%,#061a36_60%,#020a18_100%)]">
    <SceneSprite asset="floorRoomSlab" x={50} y={62} width={92} z={1} anchorBottom={false} />
    {/* 玻璃隔断 + 双开门 */}
    <SceneSprite asset="glassPartition" x={50} y={42} width={64} z={15} title="玻璃隔断" opacity={0.85} />
    <SceneSprite asset="doorDouble"     x={50} y={62} width={8}  z={20} title="双开门" />
    <SceneLabel  x={50} y={22} z={61}>办公区主入口</SceneLabel>
    {/* 网络/配电柜 */}
    <SceneSprite asset="deviceServer2u"     x={15} y={88} width={9}  z={42} title="办公网汇聚交换机" />
    <SceneLabel  x={15} y={94} z={61}>办公网交换机</SceneLabel>
    <SceneSprite asset="powerDistribution"  x={32} y={92} width={6}  z={42} title="弱电柜" />
    <SceneLabel  x={32} y={96} z={61}>弱电柜</SceneLabel>
    <SceneSprite asset="atsCabinet"         x={50} y={92} width={6}  z={42} title="ATS" />
    <SceneLabel  x={50} y={96} z={61}>ATS</SceneLabel>
    <SceneSprite asset="upsMain"            x={68} y={92} width={5.5} z={42} title="办公网 UPS" />
    <SceneLabel  x={68} y={96} z={61}>UPS</SceneLabel>
    <SceneSprite asset="deviceCamera"       x={86} y={20} width={4.5} z={45} title="办公区监控" />
  </SceneStage>
);

// 分发：根据 zone 选择内部场景
const LayoutDrivenAreaScene: React.FC<{ sceneId: SceneId }> = ({ sceneId }) => {
  const { setView } = useDtNav();
  const layout = loadLayout(sceneId);
  const enterRack = () => setView('rack');
  const baseSrc = layout.baseMap || undefined;

  return (
    <SceneStage width={layout.width} height={layout.height} className="bg-[#020a18]">
      {baseSrc ? (
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
      ) : null}
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
          onClick={/rack|机柜/i.test(item.id + item.label) ? enterRack : undefined}
        />
      ))}
    </SceneStage>
  );
};

const BAreaScene: React.FC = () => {
  const { zone } = useDtNav();
  return <LayoutDrivenAreaScene sceneId={zone as SceneId} />;
};

const alarmTrendOption = {
  grid: { top: 20, left: 28, right: 6, bottom: 22 },
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    data: ['14:30','16:30','18:30','20:30','22:30','00:30','02:30','04:30','06:30','08:30','10:30','12:30','14:30'],
    axisLine: { lineStyle: { color: '#234c7c' } },
    axisLabel: { color: '#7e9fc8', fontSize: 9 },
  },
  yAxis: { type: 'value', max: 30, splitLine: { lineStyle: { color: 'rgba(35,76,124,0.4)' } }, axisLabel: { color: '#7e9fc8', fontSize: 9 } },
  series: [
    { name: '严重', type: 'line', data: [2,4,6,8,10,6,4,5,3,4,5,7,3], lineStyle: { color: '#ef5350', width: 1.5 }, smooth: true, symbol: 'none', areaStyle: { color: 'rgba(239,83,80,0.15)' } },
    { name: '一般', type: 'line', data: [5,8,12,18,22,14,10,12,9,13,14,16,8], lineStyle: { color: '#f5b963', width: 1.5 }, smooth: true, symbol: 'none' },
    { name: '提示', type: 'line', data: [3,6,11,17,25,18,12,14,15,17,13,15,15], lineStyle: { color: '#3b8de1', width: 1.5 }, smooth: true, symbol: 'none' },
  ],
};

export const AreaView: React.FC = () => {
  return (
    <div
      className="grid h-full min-h-0 gap-1.5"
      style={{ gridTemplateColumns: 'minmax(220px, clamp(220px, 18vw, 320px)) minmax(0, 1fr) minmax(240px, clamp(260px, 20vw, 340px))' }}
    >
      {/* ===== 左列 ===== */}
      <div className="flex min-h-0 flex-col gap-1.5">
        <div className={dtPanel + ' flex-[6] min-h-0 overflow-hidden'}>
          <DtSectionTitle title="设备分类" />
          <div className="flex-1 space-y-1.5 overflow-auto custom-scrollbar pr-0.5">
            {B_AREA_CATEGORIES.map((c, i) => {
              const Ic = categoryIcons[i] || Server;
              const hasAlarm = c.alarm > 0;
              return (
                <div key={c.name} className="grid grid-cols-[24px_1fr_auto_auto] items-center gap-2 rounded border border-[#143258] bg-[#081f3d]/65 px-2.5 py-1.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded border border-[#244871] bg-[#0d2a52] text-[#79d0ff]">
                    <Ic size={12} />
                  </span>
                  <span className="text-[12.5px] text-[#e8f3ff]">{c.name}</span>
                  <span className="font-mono text-[16px] font-black text-[#cfe9ff]">{c.count}</span>
                  <span
                    className="rounded-[3px] border px-2 py-[1px] text-[10.5px] font-bold leading-none"
                    style={{
                      color: hasAlarm ? '#ff7d7d' : '#6ce09a',
                      borderColor: hasAlarm ? '#7a2e2e' : '#1d6a45',
                      background: hasAlarm ? 'rgba(82,28,28,0.6)' : 'rgba(15,68,42,0.55)',
                    }}
                  >
                    告警 {c.alarm}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className={dtPanel + ' flex-[5] min-h-0 overflow-hidden'}>
          <DtSectionTitle title="关键指标" />
          <div className="flex-1 space-y-1.5 overflow-auto custom-scrollbar pr-0.5">
            {B_AREA_KPIS.map((k, i) => {
              const Ic = kpiIcons[i] || Gauge;
              const colors = ['#5b8def', '#9c6dff', '#ffb672', '#ff7d7d', '#6ce09a'];
              return (
                <div key={k.label} className="rounded border border-[#143258] bg-[#081f3d]/65 px-2.5 py-2">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[11.5px] text-[#a9c8ee]">
                      <Ic size={12} className="text-[#79d0ff]" />
                      {k.label}
                    </span>
                    <span className="font-mono text-[15px] font-black text-[#e8f3ff]">
                      {k.value}<span className="ml-0.5 text-[10px] font-normal text-[#7e9fc8]">{k.unit}</span>
                    </span>
                  </div>
                  <div className="h-5"><BaseChart option={sparkline([10,12,9,14,16,13,18,15,17,18], colors[i % colors.length])} /></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== 中间主舞台 ===== */}
      <div className={dtPanel + ' min-h-0 overflow-hidden'}>
        <DtSceneHeader
          right={
            <div className="ml-2 flex items-center gap-2 text-[11px] text-[#7e9fc8]">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#6ce09a]" />正常</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#ef5350]" />严重</span>
            </div>
          }
        />
        <div className="relative mb-1.5 min-h-0 flex-[4] overflow-hidden rounded border border-[#1b4378] bg-[#03132a]">
          <BAreaScene />
        </div>
        <DtAlarm24hPanel />
      </div>

      {/* ===== 右列 ===== */}
      <div className="flex min-h-0 flex-col gap-1.5">
        <div className={dtPanel + ' flex-[4] min-h-0 overflow-hidden'}>
          <DtSectionTitle title="当前告警" />
          <div className="flex-1 space-y-1.5 overflow-auto custom-scrollbar pr-0.5">
            {CURRENT_ALARMS.map(al => {
              const c = al.level === 'critical' ? '#ef5350' : al.level === 'warning' ? '#f5b963' : '#3b8de1';
              return (
                <div key={al.id} className="rounded border bg-[#0a1f3d]/85 p-2" style={{ borderColor: `${c}55`, borderLeftWidth: 4, borderLeftColor: c }}>
                  <div className="mb-0.5 flex items-center justify-between">
                    <DtAlarmTag level={al.level} />
                    <span className="font-mono text-[11px] text-[#7e9fc8]">{al.time}</span>
                  </div>
                  <div className="text-[12.5px] font-semibold text-[#e8f3ff]">{al.title}</div>
                  <div className="text-[10.5px] text-[#7e9fc8]">影响范围：{al.scope}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={dtPanel + ' flex-[3] min-h-0 overflow-hidden'}>
          <DtSectionTitle title="处理建议" />
          <ul className="flex-1 space-y-1.5 overflow-auto text-[12px] text-[#e8f3ff] custom-scrollbar pr-0.5">
            {[
              '检查上联光模块',
              '切换备用链路',
              '通知一号产线负责人',
              '派发网络运维工单',
            ].map((t, i) => (
              <li key={i} className="flex items-center gap-2 rounded border border-[#143258] bg-[#081f3d]/65 px-2.5 py-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1f5f9c] text-[10px] font-bold text-white">{i + 1}</span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className={dtPanel + ' flex-[2] min-h-0 overflow-hidden'}>
          <DtSectionTitle title="环境状态" />
          <div className="flex-1 grid grid-cols-2 gap-1.5 content-start overflow-auto custom-scrollbar pr-0.5">
            {B_AREA_ENV.map(e => (
              <div key={e.name} className="flex items-center justify-between rounded border border-[#143258] bg-[#081f3d]/65 px-2.5 py-1.5 text-[12px] text-[#e8f3ff]">
                <span>{e.name}</span>
                <DtStatusBadge status={e.status as any} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
