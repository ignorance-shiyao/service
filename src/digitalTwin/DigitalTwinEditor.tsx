import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Trash2, RotateCw, FlipHorizontal2, Save, RotateCcw, Plus, ChevronDown, ChevronUp, Eye, Copy, Image as ImageIcon } from 'lucide-react';
import { ASSETS, AssetKey } from './sceneAssets';
import {
  SceneId, SceneItem, SceneLayout,
  DEFAULT_LAYOUTS, loadLayout, saveLayout, resetLayout,
  PALETTE_GROUPS, SCENE_NAMES, SCENE_DEFAULT_BG, newItemId,
} from './layoutStore';

const sceneIds: SceneId[] = ['overview', 'line1', 'idc3', 'cmpA', 'agv', 'vision', 'office'];

// ── 顶部工具按钮基础样式 ──────────────────────────────────────────────
const btn = 'inline-flex h-7 items-center gap-1.5 rounded border border-[#2b6aa8] bg-[#0b2f61] px-2.5 text-[11px] font-semibold text-[#bde3ff] transition hover:border-[#4ea4ff] hover:bg-[#12407e] hover:text-white';
const btnPrimary = 'inline-flex h-7 items-center gap-1.5 rounded border border-[#4fc1ff] bg-[linear-gradient(180deg,#114a8a,#0a2f63)] px-2.5 text-[11px] font-semibold text-[#cfe9ff] shadow-[0_0_8px_rgba(79,193,255,0.3)] transition hover:brightness-110';
const btnDanger = 'inline-flex h-7 items-center gap-1.5 rounded border border-[#7a2e2e] bg-[#3a1414] px-2.5 text-[11px] font-semibold text-[#ff8a7a] transition hover:bg-[#4a1818]';

export const DigitalTwinEditor: React.FC = () => {
  const [sceneId, setSceneId] = useState<SceneId>('overview');
  const [layout, setLayout] = useState<SceneLayout>(() => loadLayout('overview'));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; startX: number; startY: number; cx: number; cy: number; rect: DOMRect } | null>(null);
  const rotateRef = useRef<{ id: string; centerX: number; centerY: number; startAngle: number; startRotate: number } | null>(null);
  const resizeRef = useRef<{ id: string; startX: number; startY: number; w: number; corner: string; rect: DOMRect; itemRect: DOMRect } | null>(null);
  const yawRef = useRef<{ id: string; startX: number; startYaw: number } | null>(null);
  const [paletteCollapsed, setPaletteCollapsed] = useState(false);
  const [dropPreview, setDropPreview] = useState<{ x: number; y: number } | null>(null);

  // 切换场景 → 重新加载
  useEffect(() => {
    setLayout(loadLayout(sceneId));
    setSelectedId(null);
  }, [sceneId]);

  const selected = useMemo(() => layout.items.find(i => i.id === selectedId) || null, [layout, selectedId]);

  // ── 操作 ─────────────────────────────────────────────────────────
  const updateItem = useCallback((id: string, patch: Partial<SceneItem>) => {
    setLayout(prev => ({ ...prev, items: prev.items.map(i => i.id === id ? { ...i, ...patch } : i) }));
  }, []);

  const removeItem = useCallback((id: string) => {
    setLayout(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
    setSelectedId(s => (s === id ? null : s));
  }, []);

  const addItemAt = useCallback((asset: AssetKey, name: string, cx = 50, cy = 50, w = 14) => {
    const id = newItemId();
    const item: SceneItem = { id, asset, cx, cy, w, sx: 1, label: name };
    setLayout(prev => ({ ...prev, items: [...prev.items, item] }));
    setSelectedId(id);
    return id;
  }, []);

  const addItem = useCallback((asset: AssetKey, name: string) => addItemAt(asset, name, 50, 50, 14), [addItemAt]);

  const onSave = () => {
    saveLayout(layout);
    // 闪烁提示
    const el = document.getElementById('save-indicator');
    if (el) {
      el.style.opacity = '1';
      setTimeout(() => { if (el) el.style.opacity = '0'; }, 1400);
    }
  };

  const onReset = () => {
    if (!confirm(`确定将"${SCENE_NAMES[sceneId]}"恢复为默认布局？所有改动会清除。`)) return;
    const def = resetLayout(sceneId);
    setLayout(def);
    setSelectedId(null);
  };

  const onExport = () => {
    const json = JSON.stringify(layout, null, 2);
    navigator.clipboard?.writeText(json).then(
      () => alert('当前场景 JSON 已复制到剪贴板'),
      () => prompt('复制下面的 JSON：', json),
    );
  };

  // 层级调整
  const bringTo = (id: string, dir: 'up' | 'down') => {
    setLayout(prev => {
      const idx = prev.items.findIndex(i => i.id === id);
      if (idx < 0) return prev;
      const next = idx + (dir === 'down' ? 1 : -1);
      if (next < 0 || next >= prev.items.length) return prev;
      const arr = prev.items.slice();
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return { ...prev, items: arr };
    });
  };

  // ── 拖拽 ─────────────────────────────────────────────────────────
  const onItemMouseDown = (e: React.MouseEvent, item: SceneItem) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(item.id);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = { id: item.id, startX: e.clientX, startY: e.clientY, cx: item.cx, cy: item.cy, rect };
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      // 优先处理 yaw（水平 Y 轴旋转）
      const y = yawRef.current;
      if (y) {
        const dx = e.clientX - y.startX;
        let next = y.startYaw + dx * 0.6; // 1 像素 ≈ 0.6°
        while (next > 180) next -= 360;
        while (next < -180) next += 360;
        if (e.shiftKey) next = Math.round(next / 15) * 15;
        updateItem(y.id, { yaw: next });
        return;
      }
      // 调整大小
      const rs = resizeRef.current;
      if (rs) {
        const dx = ((e.clientX - rs.startX) / rs.rect.width) * 100;
        const dy = ((e.clientY - rs.startY) / rs.rect.height) * 100;
        // 以远离/靠近建筑中心的方向决定增减
        const signX = rs.corner.includes('e') ? 1 : -1;
        const signY = rs.corner.includes('s') ? 1 : -1;
        // 取 x/y 中较大变化量作为缩放依据
        const change = Math.abs(dx) > Math.abs(dy) ? dx * signX : dy * signY;
        const next = Math.max(2, Math.min(80, rs.w + change * 2));
        updateItem(rs.id, { w: next });
        return;
      }
      // 旋转
      const r = rotateRef.current;
      if (r) {
        const dx = e.clientX - r.centerX;
        const dy = e.clientY - r.centerY;
        const currentAngle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
        let next = r.startRotate + (currentAngle - r.startAngle);
        while (next > 180) next -= 360;
        while (next < -180) next += 360;
        if (e.shiftKey) next = Math.round(next / 15) * 15;
        updateItem(r.id, { rotate: next });
        return;
      }
      // 移动
      const d = dragRef.current;
      if (!d) return;
      const dx = ((e.clientX - d.startX) / d.rect.width) * 100;
      const dy = ((e.clientY - d.startY) / d.rect.height) * 100;
      updateItem(d.id, {
        cx: Math.max(-20, Math.min(120, d.cx + dx)),
        cy: Math.max(-20, Math.min(120, d.cy + dy)),
      });
    };
    const onUp = () => { dragRef.current = null; rotateRef.current = null; resizeRef.current = null; yawRef.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [updateItem]);

  // 角点缩放手柄拖拽
  const onResizeHandleDown = (e: React.MouseEvent, item: SceneItem, corner: string) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const itemRect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    resizeRef.current = { id: item.id, startX: e.clientX, startY: e.clientY, w: item.w, corner, rect, itemRect };
  };

  // 水平 Y 轴旋转手柄拖拽（左右移动 = yaw）
  const onYawHandleDown = (e: React.MouseEvent, item: SceneItem) => {
    e.preventDefault();
    e.stopPropagation();
    yawRef.current = { id: item.id, startX: e.clientX, startYaw: item.yaw ?? 0 };
  };

  const onItemWheel = (e: React.WheelEvent, item: SceneItem) => {
    e.preventDefault();
    e.stopPropagation();
    // Shift + 滚轮 → 旋转（5°/格，按住 Shift 时 1°）
    if (e.shiftKey) {
      const step = e.altKey ? 1 : 5;
      const delta = e.deltaY < 0 ? step : -step;
      updateItem(item.id, { rotate: ((item.rotate ?? 0) + delta) });
      return;
    }
    // 默认：滚轮调大小
    const delta = e.deltaY < 0 ? 0.5 : -0.5;
    updateItem(item.id, { w: Math.max(2, Math.min(80, item.w + delta)) });
  };

  // 旋转手柄拖拽开始
  const onRotateHandleDown = (e: React.MouseEvent, item: SceneItem, itemEl: HTMLElement) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = itemEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    // 旋转中心：item 的底部中心（因为 SceneSprite 默认底部为锚点）
    const centerY = item.anchorBottom !== false ? rect.bottom : (rect.top + rect.height / 2);
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const startAngle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
    rotateRef.current = { id: item.id, centerX, centerY, startAngle, startRotate: item.rotate ?? 0 };
  };

  // ── 画布渲染 ─────────────────────────────────────────────────────
  const baseSrc = layout.baseMap ?? SCENE_DEFAULT_BG[sceneId];

  return (
    <div className="flex h-full w-full flex-col gap-2 overflow-hidden rounded-lg border border-[#0c3d75] bg-[#021026] p-2">
      {/* 顶部工具栏 */}
      <div className="flex h-9 shrink-0 items-center justify-between gap-2 rounded border border-[#1b4378] bg-[linear-gradient(180deg,#0a2547,#082040)] px-3">
        <div className="flex items-center gap-2 text-[12px]">
          <span className="text-[#a9c8ee]">数字孪生编辑器</span>
          <span className="mx-1 text-[#244871]">|</span>
          <span className="text-[#7e9fc8]">场景:</span>
          <select
            value={sceneId}
            onChange={e => setSceneId(e.target.value as SceneId)}
            className="h-6 rounded border border-[#2b6aa8] bg-[#0d2e5b] px-1.5 text-[11px] text-[#cfe9ff] outline-none"
          >
            {sceneIds.map(s => <option key={s} value={s}>{SCENE_NAMES[s]}</option>)}
          </select>
          <span className="text-[#7e9fc8] ml-2">{layout.items.length} 项设施</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span id="save-indicator" className="mr-1 text-[11px] text-[#6ce09a] transition-opacity duration-300 opacity-0">已保存</span>
          <button className={btn} onClick={onExport}><Copy size={11} />导出 JSON</button>
          <button className={btnDanger} onClick={onReset}><RotateCcw size={11} />恢复默认</button>
          <button className={btnPrimary} onClick={onSave}><Save size={11} />保存</button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-2">
        {/* 左侧素材库 */}
        <div className={`flex shrink-0 flex-col gap-1.5 rounded border border-[#1b4378] bg-[#0a2547] p-2 ${paletteCollapsed ? 'w-9' : 'w-[210px]'}`}>
          <button
            type="button"
            onClick={() => setPaletteCollapsed(v => !v)}
            className="flex h-6 shrink-0 items-center justify-between rounded bg-[#0d2e5b] px-1.5 text-[11px] font-semibold text-[#a9c8ee] hover:text-[#cfe9ff]"
          >
            {!paletteCollapsed && <span>素材库</span>}
            {paletteCollapsed ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
          </button>
          {!paletteCollapsed && (
            <div className="flex-1 space-y-2 overflow-auto custom-scrollbar pr-0.5">
              {PALETTE_GROUPS.map(g => (
                <div key={g.title}>
                  <div className="mb-1 text-[10px] font-semibold tracking-wider text-[#79d0ff]">{g.title}</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {g.items.map(it => {
                      const a = ASSETS[it.key];
                      if (!a) return null;
                      return (
                        <button
                          key={it.key}
                          type="button"
                          draggable
                          onDragStart={e => {
                            e.dataTransfer.setData('text/dt-asset', it.key);
                            e.dataTransfer.setData('text/dt-name', it.name);
                            e.dataTransfer.effectAllowed = 'copy';
                            // 可选：使用素材本身作为拖拽缩略图
                            const img = new Image();
                            img.src = a.src;
                            try { e.dataTransfer.setDragImage(img, 30, 30); } catch {}
                          }}
                          onClick={() => addItem(it.key, it.name)}
                          className="group flex flex-col items-center gap-0.5 rounded border border-[#244871] bg-[#081f3d] p-1 transition hover:border-[#4fc1ff] hover:bg-[#103968] active:cursor-grabbing"
                          title={`点击放置在画布中央，或拖拽到画布任意位置`}
                        >
                          <div className="flex h-12 w-full items-center justify-center overflow-hidden">
                            <img src={a.src} alt={it.name} className="max-h-full max-w-full object-contain" draggable={false} />
                          </div>
                          <span className="truncate text-[10px] text-[#a9c8ee]">{it.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 中间画布 */}
        <div className="relative min-w-0 flex-1 overflow-hidden rounded border border-[#1b4378] bg-[#03132a]">
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              ref={canvasRef}
              className="relative"
              style={{ aspectRatio: `${layout.width} / ${layout.height}`, height: '100%', maxHeight: '100%', maxWidth: '100%' }}
              onClick={() => setSelectedId(null)}
              onDragOver={e => {
                if (e.dataTransfer.types.includes('text/dt-asset')) {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'copy';
                  const rect = canvasRef.current!.getBoundingClientRect();
                  setDropPreview({
                    x: ((e.clientX - rect.left) / rect.width) * 100,
                    y: ((e.clientY - rect.top) / rect.height) * 100,
                  });
                }
              }}
              onDragLeave={() => setDropPreview(null)}
              onDrop={e => {
                e.preventDefault();
                setDropPreview(null);
                const assetKey = e.dataTransfer.getData('text/dt-asset') as AssetKey;
                const name = e.dataTransfer.getData('text/dt-name') || assetKey;
                if (!assetKey || !ASSETS[assetKey]) return;
                const rect = canvasRef.current!.getBoundingClientRect();
                const cx = ((e.clientX - rect.left) / rect.width) * 100;
                const cy = ((e.clientY - rect.top) / rect.height) * 100;
                addItemAt(assetKey, name, +cx.toFixed(1), +cy.toFixed(1));
              }}
            >
              {/* 底图 */}
              {baseSrc ? (
                <img src={baseSrc} alt="底图" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain" style={{ zIndex: 1 }} />
              ) : (
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0b2a55_0%,#061a36_60%,#020a18_100%)]" />
              )}
              {/* 网格 */}
              <div className="pointer-events-none absolute inset-0" style={{
                backgroundImage: 'linear-gradient(rgba(63,134,200,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(63,134,200,0.07) 1px,transparent 1px)',
                backgroundSize: '5% 5%',
                zIndex: 2,
              }} />

              {/* 拖入预览（虚线圆点指示放置位置） */}
              {dropPreview && (
                <div
                  className="pointer-events-none absolute"
                  style={{
                    left: `${dropPreview.x}%`,
                    top: `${dropPreview.y}%`,
                    width: 30, height: 30,
                    transform: 'translate(-50%,-50%)',
                    border: '2px dashed #4fc1ff',
                    borderRadius: '50%',
                    background: 'rgba(79,193,255,0.15)',
                    zIndex: 5000,
                    boxShadow: '0 0 12px rgba(79,193,255,0.5)',
                  }}
                >
                  <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4fc1ff]" />
                </div>
              )}

              {/* 项目 */}
              {layout.items.map((item, idx) => {
                const a = ASSETS[item.asset];
                if (!a) return null;
                const isSel = item.id === selectedId;
                return (
                  <div
                    key={item.id}
                    ref={el => { if (el) (el as any).__rotateAnchor = el; }}
                    onMouseDown={e => onItemMouseDown(e, item)}
                    onWheel={e => onItemWheel(e, item)}
                    onClick={e => { e.stopPropagation(); setSelectedId(item.id); }}
                    className="absolute cursor-move select-none"
                    style={{
                      left: `${item.cx}%`,
                      top: `${item.cy}%`,
                      width: `${item.w}%`,
                      aspectRatio: `${a.w} / ${a.h}`,
                      transform: `translate(-50%, ${item.anchorBottom !== false ? '-100%' : '-50%'}) rotate(${item.rotate ?? 0}deg) rotateY(${item.yaw ?? 0}deg)`,
                      transformOrigin: item.anchorBottom !== false ? '50% 100%' : '50% 50%',
                      transformStyle: 'preserve-3d',
                      zIndex: 10 + idx + (isSel ? 1000 : 0),
                      outline: isSel ? '2px solid #ffb672' : '1px dashed rgba(79,193,255,0.35)',
                      outlineOffset: 2,
                    }}
                    title={`${item.label || item.asset}`}
                  >
                    <img
                      src={a.src}
                      alt={item.label || item.asset}
                      draggable={false}
                      className="pointer-events-none h-full w-full select-none object-contain"
                      style={{ transform: `scaleX(${item.sx ?? 1})`, filter: item.filter }}
                    />

                    {/* 选中：信息标签 */}
                    {isSel && (
                      <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded bg-[#0a2547]/95 px-1.5 py-0.5 text-[10px] font-mono text-[#ffb672] whitespace-nowrap">
                        {item.label || item.asset} · ({item.cx.toFixed(1)},{item.cy.toFixed(1)}) · w{item.w.toFixed(1)}
                        <span className="ml-1 text-[#79d0ff]">Z{Math.round(((item.rotate ?? 0) + 360) % 360)}°</span>
                        <span className="ml-1 text-[#6ce09a]">Y{Math.round(((item.yaw ?? 0) + 360) % 360)}°</span>
                      </div>
                    )}

                    {/* 选中：旋转手柄（Z 轴，建筑上方） */}
                    {isSel && (
                      <>
                        {/* Z 轴旋转手柄：橙色，建筑上方 */}
                        <div className="pointer-events-none absolute left-1/2 -top-5 -translate-x-1/2" style={{ width: 1, height: 20, background: '#ffb672' }} />
                        <div
                          onMouseDown={e => onRotateHandleDown(e, item, (e.currentTarget.parentElement as HTMLElement))}
                          title="Z 轴旋转 · 拖拽角度 · Shift 吸附 15°"
                          className="absolute left-1/2 -top-9 flex h-6 w-6 -translate-x-1/2 cursor-grab items-center justify-center rounded-full border-2 border-[#ffb672] bg-[#3a2c0d] text-[#fff0d4] shadow-[0_0_8px_rgba(255,182,114,0.55)] active:cursor-grabbing hover:bg-[#5a4214]"
                          onClick={e => e.stopPropagation()}
                        >
                          <RotateCw size={11} />
                        </div>

                        {/* Y 轴水平旋转手柄：绿色，建筑右侧中部，左右拖拽 */}
                        <div className="pointer-events-none absolute top-1/2 -right-5 -translate-y-1/2" style={{ height: 1, width: 20, background: '#6ce09a' }} />
                        <div
                          onMouseDown={e => onYawHandleDown(e, item)}
                          title="水平 360° 旋转（Y 轴）· 左右拖拽 · Shift 吸附 15°"
                          className="absolute top-1/2 -right-9 flex h-6 w-6 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border-2 border-[#6ce09a] bg-[#0d3a26] text-[#cfeedf] shadow-[0_0_8px_rgba(108,224,154,0.5)] active:cursor-grabbing hover:bg-[#155538]"
                          onClick={e => e.stopPropagation()}
                          style={{ userSelect: 'none' }}
                        >
                          <FlipHorizontal2 size={11} />
                        </div>
                      </>
                    )}

                    {/* 选中：4 个角点缩放手柄（按比例缩放） */}
                    {isSel && (
                      <>
                        {[
                          { c: 'nw', top: -4, left: -4, cursor: 'nwse-resize' },
                          { c: 'ne', top: -4, right: -4, cursor: 'nesw-resize' },
                          { c: 'sw', bottom: -4, left: -4, cursor: 'nesw-resize' },
                          { c: 'se', bottom: -4, right: -4, cursor: 'nwse-resize' },
                        ].map(h => (
                          <div
                            key={h.c}
                            onMouseDown={e => onResizeHandleDown(e, item, h.c)}
                            onClick={e => e.stopPropagation()}
                            title="拖拽角点调整大小"
                            className="absolute h-2.5 w-2.5 rounded-sm border-2 border-white bg-[#ffb672] shadow-[0_0_6px_rgba(255,182,114,0.7)]"
                            style={{
                              top: h.top, bottom: h.bottom, left: h.left, right: h.right,
                              cursor: h.cursor,
                              zIndex: 5,
                            }}
                          />
                        ))}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 画布提示 */}
          <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-[#0a2547]/85 px-2 py-1 text-[10px] leading-relaxed text-[#7e9fc8]">
            <span className="text-[#79d0ff]">素材库拖拽</span>到画布添加 · 拖拽建筑移动 · 滚轮调宽<br />
            <span className="text-[#ffb672]">4 角手柄</span>调大小 · <span className="text-[#ffb672]">顶部 ⟳</span>Z 轴旋转 · <span className="text-[#6ce09a]">右侧 ⇆</span>Y 轴水平旋转 (左右拖拽)<br />
            Shift+滚轮 Z 旋转 5° · Shift+Alt+滚轮 1° · 任意旋转按 Shift 吸附 15°
          </div>
        </div>

        {/* 右侧属性面板 */}
        <div className="flex w-[280px] shrink-0 flex-col gap-1.5 rounded border border-[#1b4378] bg-[#0a2547] p-2">
          {/* 项目列表 */}
          <div className="text-[11px] font-semibold text-[#79d0ff]">设施列表 ({layout.items.length})</div>
          <div className="max-h-[35vh] space-y-0.5 overflow-auto custom-scrollbar pr-0.5">
            {layout.items.map((it, idx) => {
              const isSel = it.id === selectedId;
              return (
                <div
                  key={it.id}
                  onClick={() => setSelectedId(it.id)}
                  className={`flex cursor-pointer items-center gap-1 rounded px-1.5 py-1 text-[11px] ${isSel ? 'border border-[#ffb672] bg-[#3a2c0d]/40 text-[#fff0d4]' : 'border border-[#244871] bg-[#081f3d] text-[#a9c8ee] hover:bg-[#103968]'}`}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#0d2e5b] text-[9px]">{idx + 1}</span>
                  <span className="flex-1 truncate">{it.label || it.asset}</span>
                  <button type="button" onClick={e => { e.stopPropagation(); bringTo(it.id, 'up'); }} className="opacity-70 hover:opacity-100"><ChevronUp size={10} /></button>
                  <button type="button" onClick={e => { e.stopPropagation(); bringTo(it.id, 'down'); }} className="opacity-70 hover:opacity-100"><ChevronDown size={10} /></button>
                </div>
              );
            })}
            {layout.items.length === 0 && (
              <div className="rounded border border-dashed border-[#244871] py-3 text-center text-[10px] text-[#7e9fc8]">从左侧素材库点击添加设施</div>
            )}
          </div>

          {/* 属性 */}
          <div className="mt-1 border-t border-[#1b4378] pt-2 text-[11px]">
            {selected ? (
              <div className="space-y-1.5">
                <Row label="资源">
                  <select
                    value={selected.asset}
                    onChange={e => updateItem(selected.id, { asset: e.target.value as AssetKey })}
                    className="input"
                  >
                    {Object.keys(ASSETS).map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </Row>
                <Row label="标签">
                  <input type="text" value={selected.label || ''} onChange={e => updateItem(selected.id, { label: e.target.value })} className="input" />
                </Row>
                <Row label="cx (%)"><NumInput value={selected.cx} onChange={v => updateItem(selected.id, { cx: v })} step={0.5} /></Row>
                <Row label="cy (%)"><NumInput value={selected.cy} onChange={v => updateItem(selected.id, { cy: v })} step={0.5} /></Row>
                <Row label="宽度 (%)"><NumInput value={selected.w} onChange={v => updateItem(selected.id, { w: v })} step={0.5} min={2} max={80} /></Row>
                <Row label="Z 旋转 (°)">
                  <div className="flex items-center gap-1.5">
                    <input type="range" min={-180} max={180} step={1} value={selected.rotate ?? 0}
                      onChange={e => updateItem(selected.id, { rotate: +e.target.value })}
                      className="flex-1 accent-[#ffb672]" />
                    <NumInput value={selected.rotate ?? 0} onChange={v => updateItem(selected.id, { rotate: v })} step={5} />
                  </div>
                </Row>
                <Row label="Y 旋转 (°)">
                  <div className="flex items-center gap-1.5">
                    <input type="range" min={-180} max={180} step={1} value={selected.yaw ?? 0}
                      onChange={e => updateItem(selected.id, { yaw: +e.target.value })}
                      className="flex-1 accent-[#6ce09a]" />
                    <NumInput value={selected.yaw ?? 0} onChange={v => updateItem(selected.id, { yaw: v })} step={5} />
                  </div>
                </Row>
                <Row label="水平翻转">
                  <div className="flex gap-1">
                    <button className={btn + ' flex-1'} onClick={() => updateItem(selected.id, { yaw: ((selected.yaw ?? 0) === 180 ? 0 : 180) })}>
                      <FlipHorizontal2 size={11} />翻转 180° (当前 Y {Math.round(((selected.yaw ?? 0) + 360) % 360)}°)
                    </button>
                  </div>
                </Row>
                <Row label="底部对齐">
                  <input type="checkbox" checked={selected.anchorBottom !== false} onChange={e => updateItem(selected.id, { anchorBottom: e.target.checked })} className="h-4 w-4 accent-[#4fc1ff]" />
                </Row>
                <Row label="点击下钻">
                  <input type="text" placeholder="line1 / idc3 / cmpA ..." value={selected.zone || ''} onChange={e => updateItem(selected.id, { zone: e.target.value || undefined })} className="input" />
                </Row>
                <Row label="状态">
                  <select value={selected.tone || 'normal'} onChange={e => updateItem(selected.id, { tone: e.target.value as any })} className="input">
                    <option value="normal">正常</option>
                    <option value="warn">告警(警告)</option>
                    <option value="alarm">告警(严重)</option>
                  </select>
                </Row>
                <Row label="CSS Filter">
                  <input type="text" placeholder="如：drop-shadow(0 0 6px #f00)" value={selected.filter || ''} onChange={e => updateItem(selected.id, { filter: e.target.value || undefined })} className="input" />
                </Row>
                <div className="mt-2 flex gap-1.5">
                  <button className={btnDanger + ' flex-1'} onClick={() => removeItem(selected.id)}><Trash2 size={11} />删除</button>
                </div>
              </div>
            ) : (
              <div className="rounded border border-dashed border-[#244871] py-4 text-center text-[10px] text-[#7e9fc8]">
                选中设施后在此编辑属性
                <br /><br />
                <span className="opacity-70">提示：从左侧素材库点击图标即可加入新设施</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 行内样式（input/select 复用） */}
      <style>{`
        .input{height:24px;border:1px solid #2b6aa8;background:#0d2e5b;color:#cfe9ff;font:11px monospace;padding:0 6px;border-radius:3px;width:100%;outline:none;}
        .input:focus{border-color:#4fc1ff;}
      `}</style>
    </div>
  );
};

// ── 小组件 ─────────────────────────────────────────────────────────
const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="grid grid-cols-[80px_1fr] items-center gap-1.5">
    <span className="text-[10px] text-[#7e9fc8]">{label}</span>
    <div>{children}</div>
  </div>
);

const NumInput: React.FC<{ value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number }> = ({ value, onChange, step = 1, min, max }) => (
  <input
    type="number"
    value={Number.isFinite(value) ? value : 0}
    step={step}
    min={min}
    max={max}
    onChange={e => onChange(parseFloat(e.target.value) || 0)}
    className="input"
  />
);

export default DigitalTwinEditor;
