import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RotateCcw, Move3D } from 'lucide-react';

// ╭─────────────────────────────────────────────────────────────────────╮
// │ Scene3DContainer —— 透视容器，支持鼠标拖拽旋转 / 滚轮缩放 / 重置      │
// │ 通过 CSS perspective + transform: rotateX/Y/scale 模拟 3D 旋转       │
// ╰─────────────────────────────────────────────────────────────────────╯
export const Scene3DContainer: React.FC<{
  children: React.ReactNode;
  defaultRotX?: number;
  defaultRotY?: number;
  className?: string;
}> = ({ children, defaultRotX = 0, defaultRotY = 0, className = '' }) => {
  const [rotX, setRotX] = useState(defaultRotX);
  const [rotY, setRotY] = useState(defaultRotY);
  const [scale, setScale] = useState(1);
  const dragRef = useRef<{ x: number; y: number; rx: number; ry: number } | null>(null);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragRef.current = { x: e.clientX, y: e.clientY, rx: rotX, ry: rotY };
  }, [rotX, rotY]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.x;
      const dy = e.clientY - dragRef.current.y;
      const nextRy = dragRef.current.ry + dx * 0.4;
      const nextRx = Math.max(-60, Math.min(60, dragRef.current.rx - dy * 0.3));
      setRotY(nextRy);
      setRotX(nextRx);
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale(s => Math.max(0.7, Math.min(2, s + (e.deltaY > 0 ? -0.08 : 0.08))));
  }, []);

  const reset = () => { setRotX(defaultRotX); setRotY(defaultRotY); setScale(1); };

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}
         style={{ perspective: '1600px', perspectiveOrigin: '50% 50%' }}>
      <div
        onMouseDown={onMouseDown}
        onWheel={onWheel}
        className="h-full w-full cursor-grab active:cursor-grabbing select-none"
        style={{
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scale})`,
          transformStyle: 'preserve-3d',
          transformOrigin: '50% 50%',
          transition: dragRef.current ? 'none' : 'transform 0.18s ease-out',
        }}
      >
        {children}
      </div>

      {/* 控制条 */}
      <div className="pointer-events-none absolute right-2 top-2 flex items-center gap-1.5">
        <div className="pointer-events-auto flex items-center gap-1 rounded border border-[#1b4378] bg-[#0a2547]/85 px-2 py-1 text-[10px] text-[#a9c8ee] backdrop-blur">
          <Move3D size={12} className="text-[#79d0ff]" />
          <span>拖拽旋转 · 滚轮缩放</span>
          <button
            onClick={reset}
            className="ml-1.5 inline-flex h-[18px] items-center gap-0.5 rounded border border-[#2b6aa8] bg-[#0d2e5b] px-1.5 text-[10px] text-[#cfe5ff] hover:border-[#4fc1ff]"
          >
            <RotateCcw size={10} />重置
          </button>
        </div>
      </div>

      {/* 角度提示 */}
      <div className="pointer-events-none absolute bottom-2 right-2 rounded border border-[#1b4378] bg-[#0a2547]/75 px-1.5 py-0.5 font-mono text-[10px] text-[#7e9fc8]">
        X {Math.round(rotX)}° · Y {Math.round(rotY)}°
      </div>
    </div>
  );
};


// 数字孪生大屏 - 写实风格的 SVG 场景组件（园区 / 机房 / 机柜）
// 采用 cabinet 投影：正面 1:1，纵深 50% × 45° 偏移，营造伪 3D 立体感

// ╭─────────────────────────────────────────────────────────────────────╮
// │ 公共渐变 / 滤镜定义（在最外层 <svg> 内可直接引用）                  │
// ╰─────────────────────────────────────────────────────────────────────╯
export const DtSceneDefs: React.FC = () => (
  <defs>
    {/* 地面：深空蓝径向渐变 */}
    <radialGradient id="scGround" cx="50%" cy="55%" r="70%">
      <stop offset="0%" stopColor="#0b2a55" />
      <stop offset="60%" stopColor="#061a36" />
      <stop offset="100%" stopColor="#02101f" />
    </radialGradient>

    {/* 网格 */}
    <pattern id="scGrid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0 L0 0 0 48" fill="none" stroke="rgba(35,76,124,0.35)" strokeWidth="0.6" />
    </pattern>
    <pattern id="scGridFine" width="16" height="16" patternUnits="userSpaceOnUse">
      <path d="M16 0 L0 0 0 16" fill="none" stroke="rgba(35,76,124,0.18)" strokeWidth="0.4" />
    </pattern>

    {/* 路面（深灰沥青） */}
    <linearGradient id="scRoad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#15233e" />
      <stop offset="100%" stopColor="#0b1830" />
    </linearGradient>

    {/* 建筑：屋顶 / 正面 / 侧面（正常） */}
    <linearGradient id="bRoof" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#3a8ad6" />
      <stop offset="100%" stopColor="#1c4f88" />
    </linearGradient>
    <linearGradient id="bFront" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#1f5a9b" />
      <stop offset="100%" stopColor="#0c2c5c" />
    </linearGradient>
    <linearGradient id="bSide" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#163f70" />
      <stop offset="100%" stopColor="#081f3d" />
    </linearGradient>

    {/* 建筑：告警高亮 */}
    <linearGradient id="bRoofAlarm" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#ef5a4a" />
      <stop offset="100%" stopColor="#8b201a" />
    </linearGradient>
    <linearGradient id="bFrontAlarm" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#a82d22" />
      <stop offset="100%" stopColor="#3f0e0a" />
    </linearGradient>
    <linearGradient id="bSideAlarm" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#7a1f18" />
      <stop offset="100%" stopColor="#2a0907" />
    </linearGradient>

    {/* 窗户图案：发光小方格 */}
    <pattern id="winNormal" width="14" height="11" patternUnits="userSpaceOnUse">
      <rect x="0" y="0" width="14" height="11" fill="transparent" />
      <rect x="2" y="2" width="9" height="6" fill="#9bd1ff" opacity="0.55" />
      <rect x="2" y="2" width="9" height="3" fill="#cfe9ff" opacity="0.35" />
    </pattern>
    <pattern id="winAlarm" width="14" height="11" patternUnits="userSpaceOnUse">
      <rect x="0" y="0" width="14" height="11" fill="transparent" />
      <rect x="2" y="2" width="9" height="6" fill="#ffd0c0" opacity="0.55" />
      <rect x="2" y="2" width="9" height="3" fill="#ffe4d8" opacity="0.4" />
    </pattern>

    {/* 屋顶设备纹理 */}
    <pattern id="roofVents" width="10" height="10" patternUnits="userSpaceOnUse">
      <rect width="10" height="10" fill="transparent" />
      <circle cx="5" cy="5" r="1.6" fill="rgba(0,0,0,0.35)" />
    </pattern>

    {/* 机柜面板 */}
    <linearGradient id="rackBezel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#2a3344" />
      <stop offset="100%" stopColor="#0e131c" />
    </linearGradient>
    <linearGradient id="rackInner" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#0c1726" />
      <stop offset="100%" stopColor="#050a13" />
    </linearGradient>

    {/* 发光滤镜 */}
    <filter id="scGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.5" />
      <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
  </defs>
);

// ╭─────────────────────────────────────────────────────────────────────╮
// │ IsoBuilding —— 立体建筑（cabinet 投影）                              │
// │ 参数：左上前角 (x,y)，宽 w、高 h、深 d；roofH 屋顶高；alarm 是否告警 │
// ╰─────────────────────────────────────────────────────────────────────╯
export const IsoBuilding: React.FC<{
  x: number;            // 正面左下角 x
  y: number;            // 正面左下角 y
  w: number;            // 建筑宽（正面）
  h: number;            // 建筑高
  d: number;            // 纵深
  roofH?: number;       // 屋顶高度（额外凸起，0 = 平顶）
  alarm?: boolean;
  withWindows?: boolean;
  withRoofGear?: boolean;
  children?: React.ReactNode;
}> = ({ x, y, w, h, d, roofH = 12, alarm, withWindows = true, withRoofGear = true, children }) => {
  // cabinet 投影：纵深向右上偏移 d*cos45 ≈ d*0.7 / d*0.5
  const dx = d * 0.55;
  const dy = -d * 0.45;

  // 关键顶点
  const FBL = [x, y];                                    // 正面左下
  const FBR = [x + w, y];                                // 正面右下
  const FTR = [x + w, y - h];                            // 正面右上（=屋顶前右）
  const FTL = [x, y - h];                                // 正面左上（=屋顶前左）
  const BTR = [x + w + dx, y - h + dy];                  // 屋顶后右
  const BTL = [x + dx, y - h + dy];                      // 屋顶后左
  const BBR = [x + w + dx, y + dy];                      // 背面右下

  const roofFront = `${FTL[0]},${FTL[1]} ${FTR[0]},${FTR[1]} ${BTR[0]},${BTR[1]} ${BTL[0]},${BTL[1]}`;
  const front     = `${FBL[0]},${FBL[1]} ${FBR[0]},${FBR[1]} ${FTR[0]},${FTR[1]} ${FTL[0]},${FTL[1]}`;
  const side      = `${FBR[0]},${FBR[1]} ${BBR[0]},${BBR[1]} ${BTR[0]},${BTR[1]} ${FTR[0]},${FTR[1]}`;

  // 屋顶女儿墙（小高度）
  const parapetH = 4;
  const paraTL = [BTL[0], BTL[1] - parapetH];
  const paraTR = [BTR[0], BTR[1] - parapetH];
  const paraFR = [FTR[0], FTR[1] - parapetH];
  const paraFL = [FTL[0], FTL[1] - parapetH];

  const roofGrad   = alarm ? 'url(#bRoofAlarm)'  : 'url(#bRoof)';
  const frontGrad  = alarm ? 'url(#bFrontAlarm)' : 'url(#bFront)';
  const sideGrad   = alarm ? 'url(#bSideAlarm)'  : 'url(#bSide)';
  const stroke     = alarm ? '#ef5a4a' : '#3f86c8';
  const winFill    = alarm ? 'url(#winAlarm)' : 'url(#winNormal)';

  return (
    <g>
      {/* 阴影投影 */}
      <ellipse cx={x + w / 2 + 6} cy={y + 4} rx={w * 0.6} ry={6} fill="rgba(0,0,0,0.45)" />

      {/* 侧面 */}
      <polygon points={side} fill={sideGrad} stroke={stroke} strokeWidth={0.6} />
      {/* 正面 */}
      <polygon points={front} fill={frontGrad} stroke={stroke} strokeWidth={0.8} />
      {/* 窗户层（嵌正面） */}
      {withWindows && (
        <>
          {/* 顶部细线带 */}
          <rect x={x + 4} y={y - h + 6} width={w - 8} height={2} fill={alarm ? '#ffd0c0' : '#79d0ff'} opacity="0.55" />
          {/* 窗格矩阵 */}
          <rect x={x + 6} y={y - h + 12} width={w - 12} height={h - 22} fill={winFill} />
        </>
      )}
      {/* 底部细线（地脚） */}
      <line x1={x} y1={y} x2={x + w} y2={y} stroke={alarm ? '#ef5a4a' : '#5a8fc9'} strokeWidth={1} />

      {/* 屋顶（平顶 + 女儿墙） */}
      <polygon points={roofFront} fill={roofGrad} stroke={stroke} strokeWidth={0.6} />
      {/* 屋顶纹理（小孔） */}
      <polygon points={roofFront} fill="url(#roofVents)" opacity="0.5" />
      {/* 女儿墙顶面 */}
      <polygon
        points={`${paraTL[0]},${paraTL[1]} ${paraTR[0]},${paraTR[1]} ${FTR[0]},${FTR[1] - parapetH} ${FTL[0]},${FTL[1] - parapetH}`}
        fill={alarm ? '#c14238' : '#2f74ba'} stroke={stroke} strokeWidth={0.4}
      />

      {/* 屋顶设备：HVAC 单元 + 天线 */}
      {withRoofGear && (
        <g>
          {/* HVAC 机组 */}
          <rect
            x={x + w * 0.18} y={y - h - 4 + dy * 0.45} width={w * 0.18} height={6}
            fill="#243a55" stroke="#5a8fc9" strokeWidth={0.5}
          />
          <rect
            x={x + w * 0.56} y={y - h - 6 + dy * 0.55} width={w * 0.22} height={8}
            fill="#243a55" stroke="#5a8fc9" strokeWidth={0.5}
          />
          {/* 天线 */}
          <line
            x1={x + w * 0.42} y1={y - h - 2 + dy * 0.5}
            x2={x + w * 0.42} y2={y - h - 14 + dy * 0.5}
            stroke="#79d0ff" strokeWidth={0.8}
          />
          <circle cx={x + w * 0.42} cy={y - h - 14 + dy * 0.5} r={1.5} fill="#79d0ff" />
        </g>
      )}

      {children}
    </g>
  );
};

// ╭─────────────────────────────────────────────────────────────────────╮
// │ IsoSlab —— 平台/操作区（仅地面厚板，无屋顶）                          │
// ╰─────────────────────────────────────────────────────────────────────╯
export const IsoSlab: React.FC<{
  x: number; y: number; w: number; h: number; d: number;
  fill?: string; stroke?: string;
  children?: React.ReactNode;
}> = ({ x, y, w, h, d, fill = '#0a2c5e', stroke = '#3f86c8', children }) => {
  const dx = d * 0.55, dy = -d * 0.45;
  const front = `${x},${y} ${x + w},${y} ${x + w},${y - h} ${x},${y - h}`;
  const side  = `${x + w},${y} ${x + w + dx},${y + dy} ${x + w + dx},${y - h + dy} ${x + w},${y - h}`;
  const top   = `${x},${y - h} ${x + w},${y - h} ${x + w + dx},${y - h + dy} ${x + dx},${y - h + dy}`;
  return (
    <g>
      <ellipse cx={x + w / 2 + 4} cy={y + 4} rx={w * 0.55} ry={5} fill="rgba(0,0,0,0.35)" />
      <polygon points={side}  fill={fill} opacity={0.85} stroke={stroke} strokeWidth={0.6} />
      <polygon points={front} fill={fill} stroke={stroke} strokeWidth={0.8} />
      <polygon points={top}   fill={fill} opacity={0.95} stroke={stroke} strokeWidth={0.6} />
      {children}
    </g>
  );
};

// ╭─────────────────────────────────────────────────────────────────────╮
// │ Road —— 带白色虚线的路面                                              │
// ╰─────────────────────────────────────────────────────────────────────╯
export const Road: React.FC<{
  x: number; y: number; w: number; h: number;
  dir?: 'h' | 'v';
}> = ({ x, y, w, h, dir = 'h' }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} fill="url(#scRoad)" stroke="rgba(255,255,255,0.05)" strokeWidth={0.5} />
    {dir === 'h' ? (
      <line
        x1={x + 6} y1={y + h / 2} x2={x + w - 6} y2={y + h / 2}
        stroke="#cfe9ff" strokeOpacity={0.4} strokeWidth={1.2} strokeDasharray="10 8"
      />
    ) : (
      <line
        x1={x + w / 2} y1={y + 6} x2={x + w / 2} y2={y + h - 6}
        stroke="#cfe9ff" strokeOpacity={0.4} strokeWidth={1.2} strokeDasharray="10 8"
      />
    )}
  </g>
);

// ╭─────────────────────────────────────────────────────────────────────╮
// │ Tree —— 小树（俯视 + 阴影）                                            │
// ╰─────────────────────────────────────────────────────────────────────╯
export const Tree: React.FC<{ x: number; y: number; r?: number }> = ({ x, y, r = 4 }) => (
  <g>
    <ellipse cx={x + 1.5} cy={y + 1} rx={r * 0.9} ry={r * 0.45} fill="rgba(0,0,0,0.45)" />
    <circle cx={x} cy={y} r={r} fill="#1e6647" stroke="#3a8e6a" strokeWidth={0.5} />
    <circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.5} fill="#2a8a5e" opacity={0.7} />
  </g>
);

// ╭─────────────────────────────────────────────────────────────────────╮
// │ Parking —— 简化的停车位（多个白色平行线）                              │
// ╰─────────────────────────────────────────────────────────────────────╯
export const Parking: React.FC<{ x: number; y: number; cols: number; rows?: number }> = ({ x, y, cols, rows = 1 }) => (
  <g>
    {Array.from({ length: rows }).map((_, r) => (
      Array.from({ length: cols + 1 }).map((__, i) => (
        <line
          key={`${r}-${i}`}
          x1={x + i * 10} y1={y + r * 16}
          x2={x + i * 10} y2={y + r * 16 + 14}
          stroke="#9fbedb" strokeOpacity={0.4} strokeWidth={0.8}
        />
      ))
    ))}
  </g>
);

// ╭─────────────────────────────────────────────────────────────────────╮
// │ ServerRack3D —— 写实风格的机柜（前 3/4 视角）                         │
// │   units: 自顶向下的 U 配置                                            │
// ╰─────────────────────────────────────────────────────────────────────╯
export type RackUnit = {
  height: number;                                  // 占用 U 数
  kind: 'patch' | 'switch' | 'server' | 'storage' | 'ups' | 'idle';
  label?: string;
  status?: 'normal' | 'critical' | 'warning' | 'idle';
  selected?: boolean;
  onClick?: () => void;
};

const U_PX = 15;     // 每 U 高度（适配主舞台容器）
const RACK_W = 200;  // 机柜面板宽

const statusToColor = (s?: string) => {
  switch (s) {
    case 'critical': return { led: '#ef5350', glow: 'rgba(239,83,80,0.7)', accent: '#5a1414', border: '#ef5a4a', text: '#ffd6d0' };
    case 'warning':  return { led: '#f5b963', glow: 'rgba(245,185,99,0.65)', accent: '#5a3a14', border: '#f5b963', text: '#fff0d4' };
    case 'idle':     return { led: '#3a557a', glow: 'transparent', accent: '#0a1f3d', border: '#244871', text: '#5d7a9c' };
    default:         return { led: '#6ce09a', glow: 'rgba(108,224,154,0.6)', accent: '#0d2e5b', border: '#3f86c8', text: '#cfe5ff' };
  }
};

// 单台 1U/2U/4U 设备前面板的写实绘制
const UnitFace: React.FC<{ x: number; y: number; w: number; h: number; u: RackUnit }> = ({ x, y, w, h, u }) => {
  const c = statusToColor(u.status);

  // 通用：金属面板背板
  const baseBg = (
    <>
      <rect x={x} y={y} width={w} height={h} fill="url(#rackBezel)" />
      {/* 高光顶 */}
      <rect x={x} y={y} width={w} height={1.5} fill="rgba(255,255,255,0.15)" />
      {/* 阴影底 */}
      <rect x={x} y={y + h - 1.5} width={w} height={1.5} fill="rgba(0,0,0,0.55)" />
      {/* 状态条（左侧细带） */}
      <rect x={x} y={y} width={3} height={h} fill={c.led} opacity={u.status === 'idle' ? 0.3 : 0.9}>
        {u.status !== 'idle' && (
          <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
        )}
      </rect>
    </>
  );

  if (u.kind === 'idle') {
    return (
      <g onClick={u.onClick} style={{ cursor: 'default' }}>
        {baseBg}
        <rect x={x + 4} y={y + 2} width={w - 8} height={h - 4} fill="#06101e" stroke="#1a2538" strokeWidth={0.5} strokeDasharray="2 2" />
        <text x={x + w / 2} y={y + h / 2 + 3} textAnchor="middle" fontSize="9" fill="#3a557a">空闲位</text>
      </g>
    );
  }

  if (u.kind === 'patch') {
    return (
      <g onClick={u.onClick} style={{ cursor: 'pointer' }}>
        {baseBg}
        {/* 配线架插孔行 */}
        {Array.from({ length: 24 }).map((_, i) => (
          <rect key={i} x={x + 8 + i * ((w - 18) / 24)} y={y + h / 2 - 3} width={4} height={6} fill="#10202f" stroke="#2a3a52" strokeWidth={0.4} />
        ))}
        <text x={x + w - 6} y={y + h - 5} textAnchor="end" fontSize="8" fill={c.text} opacity={0.8}>{u.label}</text>
      </g>
    );
  }

  if (u.kind === 'switch') {
    return (
      <g onClick={u.onClick} style={{ cursor: 'pointer' }}>
        {baseBg}
        {/* LCD 显示 */}
        <rect x={x + 6} y={y + h / 2 - 4} width={26} height={8} fill="#031022" stroke="#2a3a52" strokeWidth={0.5} />
        <text x={x + 19} y={y + h / 2 + 2} textAnchor="middle" fontSize="6" fill={c.led} fontFamily="monospace">{u.status === 'critical' ? 'ERR' : 'OK'}</text>
        {/* 网络端口 2 行 */}
        {Array.from({ length: 24 }).map((_, i) => {
          const col = i % 12;
          const row = Math.floor(i / 12);
          const px = x + 38 + col * 12;
          const py = y + 3 + row * (h / 2 - 3);
          const portColor = u.status === 'critical'
            ? (i % 3 === 0 ? '#ef5350' : '#3a1414')
            : (i % 2 === 0 ? '#6ce09a' : '#1e5b3b');
          return (
            <g key={i}>
              <rect x={px} y={py} width={10} height={h / 2 - 5} fill="#0a1726" stroke="#1a2538" strokeWidth={0.4} />
              {/* 端口 LED */}
              <circle cx={px + 5} cy={py + 2} r={1.1} fill={portColor} />
            </g>
          );
        })}
        {/* 右侧机器型号标签 */}
        <text x={x + w - 6} y={y + h - 5} textAnchor="end" fontSize="8" fill={c.text}>{u.label}</text>
      </g>
    );
  }

  if (u.kind === 'server' || u.kind === 'storage') {
    return (
      <g onClick={u.onClick} style={{ cursor: 'pointer' }}>
        {baseBg}
        {/* 左侧 LED 簇 */}
        <g>
          <circle cx={x + 10} cy={y + 5} r={1.2} fill={c.led}>
            <animate attributeName="opacity" values="0.4;1;0.4" dur="1.6s" repeatCount="indefinite" />
          </circle>
          <circle cx={x + 14} cy={y + 5} r={1.2} fill="#79d0ff" opacity={0.7} />
          <circle cx={x + 10} cy={y + h - 5} r={1.2} fill="#6ce09a" opacity={0.7} />
          <circle cx={x + 14} cy={y + h - 5} r={1.2} fill="#f5d263" opacity={0.6} />
        </g>
        {/* 中部硬盘托架 / 散热孔 */}
        {u.kind === 'storage' ? (
          Array.from({ length: 8 }).map((_, i) => (
            <rect key={i} x={x + 22 + i * 14} y={y + 3} width={11} height={h - 6} fill="#0a1726" stroke="#3a557a" strokeWidth={0.5} />
          ))
        ) : (
          <>
            {/* 散热网纹 */}
            <rect x={x + 22} y={y + 3} width={w - 60} height={h - 6} fill="url(#rackInner)" stroke="#1a2538" strokeWidth={0.5} />
            {Array.from({ length: 20 }).map((_, i) => (
              <line key={i} x1={x + 26 + i * ((w - 70) / 20)} y1={y + 5} x2={x + 26 + i * ((w - 70) / 20)} y2={y + h - 5} stroke="#1a2538" strokeWidth={0.3} />
            ))}
            {/* USB / 电源按钮 */}
            <circle cx={x + w - 28} cy={y + h / 2} r={2} fill="#10202f" stroke="#2a3a52" strokeWidth={0.5} />
            <circle cx={x + w - 28} cy={y + h / 2} r={1} fill={c.led} />
          </>
        )}
        {/* 右侧型号 */}
        <text x={x + w - 6} y={y + h - 5} textAnchor="end" fontSize="8" fill={c.text}>{u.label}</text>
      </g>
    );
  }

  if (u.kind === 'ups') {
    return (
      <g onClick={u.onClick} style={{ cursor: 'pointer' }}>
        {baseBg}
        {/* LCD */}
        <rect x={x + 8} y={y + 3} width={36} height={h - 6} fill="#031022" stroke="#2a3a52" strokeWidth={0.5} />
        <text x={x + 26} y={y + h / 2 + 2} textAnchor="middle" fontSize="7" fill="#79d0ff" fontFamily="monospace">{u.status === 'warning' ? '!CHK' : 'ON'}</text>
        {/* 电池电量条 */}
        <rect x={x + 50} y={y + h / 2 - 3} width={60} height={6} fill="#0a1726" stroke="#3a557a" strokeWidth={0.5} />
        <rect x={x + 51} y={y + h / 2 - 2} width={48} height={4} fill={u.status === 'warning' ? '#f5b963' : '#6ce09a'} />
        <text x={x + w - 6} y={y + h - 5} textAnchor="end" fontSize="8" fill={c.text}>{u.label}</text>
      </g>
    );
  }

  return null;
};

export const ServerRack3D: React.FC<{
  x: number;          // 机柜底部左前角
  y: number;
  units: RackUnit[];  // 自顶向下
  height: number;     // 机柜总 U 数（用于刻度）
  className?: string;
  totalUHeight?: number;
}> = ({ x, y, units, height }) => {
  const innerH = height * U_PX;
  const frameW = RACK_W;
  const frameH = innerH + 60;             // 上下含装饰

  // 计算每个 unit 的 y 起点（自顶向下）
  let cursorU = 0;
  const blocks = units.map((u, i) => {
    const unitY = y - frameH + 30 + cursorU * U_PX;   // 顶部留 30
    const unitH = u.height * U_PX - 2;                // 留 2px 间隙
    cursorU += u.height;
    return { ...u, unitY, unitH };
  });

  return (
    <g>
      {/* 阴影 */}
      <ellipse cx={x + frameW / 2 + 8} cy={y + 6} rx={frameW * 0.55} ry={7} fill="rgba(0,0,0,0.55)" />

      {/* 侧面纵深（cabinet 投影） */}
      <polygon
        points={`${x + frameW},${y} ${x + frameW + 18},${y - 12} ${x + frameW + 18},${y - frameH - 12} ${x + frameW},${y - frameH}`}
        fill="#0a1322" stroke="#1a2538" strokeWidth={0.6}
      />
      <polygon
        points={`${x},${y - frameH} ${x + frameW},${y - frameH} ${x + frameW + 18},${y - frameH - 12} ${x + 18},${y - frameH - 12}`}
        fill="#1a2538" stroke="#3a557a" strokeWidth={0.6}
      />

      {/* 机柜框（金属边框） */}
      <rect x={x} y={y - frameH} width={frameW} height={frameH} fill="#1a2538" stroke="#3a557a" strokeWidth={1.2} />
      {/* 顶部凸出装饰 */}
      <rect x={x + frameW / 2 - 24} y={y - frameH - 6} width={48} height={6} fill="#243a55" stroke="#3a557a" strokeWidth={0.6} />
      {/* 底部底座 */}
      <rect x={x - 4} y={y - 4} width={frameW + 8} height={6} fill="#10182a" stroke="#3a557a" strokeWidth={0.5} />
      {/* 顶部品牌灯 */}
      <rect x={x + 12} y={y - frameH + 6} width={frameW - 24} height={3} fill="#0a1726" />
      <rect x={x + 14} y={y - frameH + 7} width={(frameW - 28) * 0.6} height={1} fill="#79d0ff" opacity={0.9}>
        <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite" />
      </rect>

      {/* 内部黑色凹槽 */}
      <rect x={x + 4} y={y - frameH + 16} width={frameW - 8} height={frameH - 30} fill="url(#rackInner)" stroke="#0a1322" strokeWidth={0.6} />

      {/* U 刻度（左侧） */}
      {Array.from({ length: height + 1 }).map((_, i) => (
        <g key={i}>
          <line
            x1={x + 4} y1={y - frameH + 30 + i * U_PX}
            x2={x + 8} y2={y - frameH + 30 + i * U_PX}
            stroke="#3a557a" strokeWidth={0.5}
          />
        </g>
      ))}

      {/* 每个 U 单元 */}
      {blocks.map((b, i) => (
        <g key={i}>
          <UnitFace x={x + 10} y={b.unitY} w={frameW - 20} h={b.unitH} u={b} />
          {/* 选中环 */}
          {b.selected && (
            <rect
              x={x + 8} y={b.unitY - 2} width={frameW - 16} height={b.unitH + 4}
              fill="none" stroke="#ef5a4a" strokeWidth={1.5} rx={2}
            >
              <animate attributeName="stroke-opacity" values="1;0.4;1" dur="1.6s" repeatCount="indefinite" />
            </rect>
          )}
        </g>
      ))}
    </g>
  );
};

// ╭─────────────────────────────────────────────────────────────────────╮
// │ DataRack3DSmall —— 机房俯视用的小型 3D 机柜组（一排）                  │
// ╰─────────────────────────────────────────────────────────────────────╯
export const DataRackRow: React.FC<{
  x: number; y: number; count?: number; alarm?: boolean;
}> = ({ x, y, count = 8, alarm }) => {
  const w = 32, h = 56, gap = 4, d = 26;
  return (
    <g>
      {/* 底座阴影 */}
      <ellipse cx={x + (count * (w + gap)) / 2} cy={y + h + 6} rx={count * (w + gap) / 2 + 4} ry={6} fill="rgba(0,0,0,0.45)" />
      {Array.from({ length: count }).map((_, i) => {
        const rx = x + i * (w + gap);
        const isAlarm = alarm && i === Math.floor(count / 2);
        const stroke = isAlarm ? '#ef5a4a' : '#5fb4ff';
        const front  = isAlarm ? 'url(#bFrontAlarm)' : 'linear-gradient(...)';
        return (
          <g key={i}>
            {/* 侧面 */}
            <polygon
              points={`${rx + w},${y} ${rx + w + d * 0.55},${y - d * 0.45} ${rx + w + d * 0.55},${y - d * 0.45 + h} ${rx + w},${y + h}`}
              fill="#0a1f3d" stroke="#1f4d7e" strokeWidth={0.5}
            />
            {/* 顶面 */}
            <polygon
              points={`${rx},${y} ${rx + w},${y} ${rx + w + d * 0.55},${y - d * 0.45} ${rx + d * 0.55},${y - d * 0.45}`}
              fill="#1a3a64" stroke="#2f74ba" strokeWidth={0.5}
            />
            {/* 正面 */}
            <rect x={rx} y={y} width={w} height={h} fill={isAlarm ? '#3a0d0d' : '#0d2e5b'} stroke={stroke} strokeWidth={0.7} />
            {/* 散热孔 */}
            {Array.from({ length: 6 }).map((_, j) => (
              <rect key={j} x={rx + 4} y={y + 4 + j * 8} width={w - 8} height={4} fill="#03101e" stroke="rgba(255,255,255,0.05)" strokeWidth={0.3} />
            ))}
            {/* LED */}
            <circle cx={rx + w - 5} cy={y + 4} r={1.5} fill={isAlarm ? '#ef5350' : '#6ce09a'}>
              {isAlarm && <animate attributeName="opacity" values="0.4;1;0.4" dur="1s" repeatCount="indefinite" />}
            </circle>
          </g>
        );
      })}
    </g>
  );
};
