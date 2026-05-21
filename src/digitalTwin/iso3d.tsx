import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { RotateCcw, Move3D } from 'lucide-react';

// ╭─────────────────────────────────────────────────────────────────────╮
// │ 真·伪3D：基于 yaw/pitch 的顶点重投影                                  │
// │ 每个 Box3D / Plane3D 都在每次渲染时根据相机角度重新计算多边形顶点   │
// │ 用 painter's algorithm 进行深度排序，背面剔除                         │
// ╰─────────────────────────────────────────────────────────────────────╯

export type Vec3 = { x: number; y: number; z: number };

// 相机状态
type CameraState = {
  yaw: number;    // 绕 Y 轴
  pitch: number;  // 绕 X 轴
  scale: number;
  cx: number;     // 屏幕中心
  cy: number;
};

const CameraCtx = createContext<CameraState>({ yaw: 30, pitch: 45, scale: 1, cx: 480, cy: 300 });
export const useCamera = () => useContext(CameraCtx);

// 投影：3D 世界坐标 → 2D 屏幕
export const project = (p: Vec3, cam: CameraState) => {
  // 先 pitch (X 轴) —— 让相机俯视
  const px = Math.PI / 180 * cam.pitch;
  const cp = Math.cos(px), sp = Math.sin(px);
  const x1 = p.x;
  const y1 = p.y * cp - p.z * sp;
  const z1 = p.y * sp + p.z * cp;
  // 再 yaw (Y 轴) —— 让相机水平旋转
  const py = Math.PI / 180 * cam.yaw;
  const cy = Math.cos(py), sy = Math.sin(py);
  const x2 = x1 * cy + z1 * sy;
  const y2 = y1;
  const z2 = -x1 * sy + z1 * cy;
  return { x: cam.cx + x2 * cam.scale, y: cam.cy - y2 * cam.scale, z: z2 };
};

// 面顶点（按外法向量右手定则的顺序）
type Face = {
  verts: Vec3[];
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  /** 法向量（用于背面剔除 & 简单光照） */
  normal: Vec3;
  /** 重写绘制逻辑（如窗户、屏幕等额外内容） */
  decorate?: (pts: { x: number; y: number }[]) => React.ReactNode;
};

const computeFaceCenter = (verts: Vec3[]): Vec3 => {
  const n = verts.length;
  return {
    x: verts.reduce((s, v) => s + v.x, 0) / n,
    y: verts.reduce((s, v) => s + v.y, 0) / n,
    z: verts.reduce((s, v) => s + v.z, 0) / n,
  };
};

// 旋转后法向量
const rotateNormal = (n: Vec3, cam: CameraState): Vec3 => {
  const px = Math.PI / 180 * cam.pitch;
  const cp = Math.cos(px), sp = Math.sin(px);
  const x1 = n.x;
  const y1 = n.y * cp - n.z * sp;
  const z1 = n.y * sp + n.z * cp;
  const py = Math.PI / 180 * cam.yaw;
  const cy = Math.cos(py), sy = Math.sin(py);
  return {
    x: x1 * cy + z1 * sy,
    y: y1,
    z: -x1 * sy + z1 * cy,
  };
};

// 根据法向量与相机方向计算光照系数（0~1）
const lighting = (normalRot: Vec3, baseFactor: number) => {
  // 假设光源方向为 (-0.4, -0.8, -0.5) (从左上前方向)
  const lx = -0.4, ly = -0.8, lz = -0.5;
  const dot = normalRot.x * lx + normalRot.y * ly + normalRot.z * lz;
  return baseFactor * (0.6 + 0.4 * Math.max(0, dot));
};

// ── Faces 渲染器：背面剔除 + Z 排序 + 绘制 ─────────────────────────────
const RenderFaces: React.FC<{ faces: Face[]; onClick?: () => void }> = ({ faces, onClick }) => {
  const cam = useCamera();
  const items = faces.map(f => {
    const projected = f.verts.map(v => project(v, cam));
    const center = computeFaceCenter(f.verts);
    const projCenter = project(center, cam);
    const nRot = rotateNormal(f.normal, cam);
    const visible = nRot.z > 0.01;
    return { f, projected, zAvg: projCenter.z, visible, nRot };
  }).filter(i => i.visible).sort((a, b) => a.zAvg - b.zAvg);

  return (
    <g onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      {items.map((it, i) => {
        const ptsStr = it.projected.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
        return (
          <g key={i}>
            <polygon
              points={ptsStr}
              fill={it.f.fill}
              stroke={it.f.stroke}
              strokeWidth={it.f.strokeWidth ?? 0.6}
              strokeLinejoin="round"
            />
            {it.f.decorate?.(it.projected)}
          </g>
        );
      })}
    </g>
  );
};

// ╭─────────────────────────────────────────────────────────────────────╮
// │ Box3D —— 中心 (cx,cy,cz)、半宽 hw/hh/hd 的轴对齐盒子                  │
// │ colors: { top, front, back, left, right, bottom }                     │
// ╰─────────────────────────────────────────────────────────────────────╯
export const Box3D: React.FC<{
  cx: number; cy: number; cz: number;
  hw: number; hh: number; hd: number;
  colors: { top: string; front: string; back: string; left: string; right: string; bottom?: string };
  stroke?: string;
  strokeWidth?: number;
  onClick?: () => void;
  decorate?: {
    top?: (pts: { x: number; y: number }[]) => React.ReactNode;
    front?: (pts: { x: number; y: number }[]) => React.ReactNode;
    left?: (pts: { x: number; y: number }[]) => React.ReactNode;
    right?: (pts: { x: number; y: number }[]) => React.ReactNode;
  };
}> = ({ cx, cy, cz, hw, hh, hd, colors, stroke = '#3f86c8', strokeWidth = 0.6, decorate, onClick }) => {
  // 8 个顶点
  const v = {
    TLF: { x: cx - hw, y: cy + hh, z: cz + hd },
    TRF: { x: cx + hw, y: cy + hh, z: cz + hd },
    TLB: { x: cx - hw, y: cy + hh, z: cz - hd },
    TRB: { x: cx + hw, y: cy + hh, z: cz - hd },
    BLF: { x: cx - hw, y: cy - hh, z: cz + hd },
    BRF: { x: cx + hw, y: cy - hh, z: cz + hd },
    BLB: { x: cx - hw, y: cy - hh, z: cz - hd },
    BRB: { x: cx + hw, y: cy - hh, z: cz - hd },
  };

  const faces: Face[] = [
    { // 顶面
      verts: [v.TLB, v.TRB, v.TRF, v.TLF],
      normal: { x: 0, y: 1, z: 0 },
      fill: colors.top, stroke, strokeWidth,
      decorate: decorate?.top,
    },
    { // 前面
      verts: [v.TLF, v.TRF, v.BRF, v.BLF],
      normal: { x: 0, y: 0, z: 1 },
      fill: colors.front, stroke, strokeWidth,
      decorate: decorate?.front,
    },
    { // 后面
      verts: [v.TRB, v.TLB, v.BLB, v.BRB],
      normal: { x: 0, y: 0, z: -1 },
      fill: colors.back, stroke, strokeWidth,
    },
    { // 左面
      verts: [v.TLB, v.TLF, v.BLF, v.BLB],
      normal: { x: -1, y: 0, z: 0 },
      fill: colors.left, stroke, strokeWidth,
      decorate: decorate?.left,
    },
    { // 右面
      verts: [v.TRF, v.TRB, v.BRB, v.BRF],
      normal: { x: 1, y: 0, z: 0 },
      fill: colors.right, stroke, strokeWidth,
      decorate: decorate?.right,
    },
    { // 底面
      verts: [v.BLF, v.BRF, v.BRB, v.BLB],
      normal: { x: 0, y: -1, z: 0 },
      fill: colors.bottom ?? colors.front, stroke, strokeWidth: 0,
    },
  ];

  return <RenderFaces faces={faces} onClick={onClick} />;
};

// 阴影椭圆（地面）
export const GroundShadow: React.FC<{ cx: number; cz: number; rx: number; rz: number }> = ({ cx, cz, rx, rz }) => {
  const cam = useCamera();
  // 投影 4 个边界点
  const pts = [
    project({ x: cx - rx, y: 0, z: cz }, cam),
    project({ x: cx, y: 0, z: cz - rz }, cam),
    project({ x: cx + rx, y: 0, z: cz }, cam),
    project({ x: cx, y: 0, z: cz + rz }, cam),
  ];
  const minX = Math.min(...pts.map(p => p.x));
  const maxX = Math.max(...pts.map(p => p.x));
  const minY = Math.min(...pts.map(p => p.y));
  const maxY = Math.max(...pts.map(p => p.y));
  return (
    <ellipse
      cx={(minX + maxX) / 2}
      cy={(minY + maxY) / 2}
      rx={(maxX - minX) / 2}
      ry={(maxY - minY) / 2}
      fill="rgba(0,0,0,0.45)"
    />
  );
};

// ── 地面平面（plane on Y=0） ───────────────────────────────────────────
export const GroundPlane: React.FC<{
  x: number; z: number; w: number; d: number; fill: string; stroke?: string;
}> = ({ x, z, w, d, fill, stroke }) => {
  const cam = useCamera();
  const corners = [
    project({ x, y: 0, z: z - d / 2 }, cam),
    project({ x: x + w, y: 0, z: z - d / 2 }, cam),
    project({ x: x + w, y: 0, z: z + d / 2 }, cam),
    project({ x, y: 0, z: z + d / 2 }, cam),
  ];
  const pts = corners.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  return <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={0.5} />;
};

// ── 在 3D 平面（Y=y）上画线 ───────────────────────────────────────────
export const Line3D: React.FC<{ a: Vec3; b: Vec3; stroke: string; dash?: string; width?: number }> = ({ a, b, stroke, dash, width = 1 }) => {
  const cam = useCamera();
  const pa = project(a, cam), pb = project(b, cam);
  return <line x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke={stroke} strokeDasharray={dash} strokeWidth={width} />;
};

// ── 在 3D 空间一个点投影出去的 2D 子节点（用于摆放文字标签等） ────────
export const Anchor3D: React.FC<{ p: Vec3; children: (p2: { x: number; y: number }) => React.ReactNode }> = ({ p, children }) => {
  const cam = useCamera();
  const p2 = project(p, cam);
  return <>{children(p2)}</>;
};

// ╭─────────────────────────────────────────────────────────────────────╮
// │ Scene3DCanvas —— 提供 yaw/pitch 状态、拖拽更新、容器视口             │
// │ 子节点直接使用 useCamera 获取相机参数计算自身投影                   │
// ╰─────────────────────────────────────────────────────────────────────╯
export const Scene3DCanvas: React.FC<{
  width?: number; height?: number;
  defaultYaw?: number; defaultPitch?: number; defaultScale?: number;
  cx?: number; cy?: number;
  background?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({
  width = 960, height = 560,
  defaultYaw = 30, defaultPitch = 45, defaultScale = 1,
  cx = 480, cy = 300,
  background, children, className = '',
}) => {
  const [yaw, setYaw] = useState(defaultYaw);
  const [pitch, setPitch] = useState(defaultPitch);
  const [scale, setScale] = useState(defaultScale);
  const dragRef = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragRef.current = { x: e.clientX, y: e.clientY, yaw, pitch };
  }, [yaw, pitch]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.x;
      const dy = e.clientY - dragRef.current.y;
      setYaw(dragRef.current.yaw + dx * 0.5);
      setPitch(Math.max(10, Math.min(85, dragRef.current.pitch + dy * 0.4)));
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
    setScale(s => Math.max(0.6, Math.min(2.2, s + (e.deltaY > 0 ? -0.08 : 0.08))));
  }, []);

  const reset = () => { setYaw(defaultYaw); setPitch(defaultPitch); setScale(defaultScale); };

  const cam: CameraState = { yaw, pitch, scale, cx, cy };

  return (
    <div ref={wrapperRef} className={`relative h-full w-full overflow-hidden ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full cursor-grab active:cursor-grabbing select-none"
        onMouseDown={onMouseDown}
        onWheel={onWheel}
      >
        {background}
        <CameraCtx.Provider value={cam}>
          {children}
        </CameraCtx.Provider>
      </svg>

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
      <div className="pointer-events-none absolute bottom-2 right-2 rounded border border-[#1b4378] bg-[#0a2547]/75 px-1.5 py-0.5 font-mono text-[10px] text-[#7e9fc8]">
        Yaw {Math.round(yaw)}° · Pitch {Math.round(pitch)}° · {scale.toFixed(2)}×
      </div>
    </div>
  );
};
