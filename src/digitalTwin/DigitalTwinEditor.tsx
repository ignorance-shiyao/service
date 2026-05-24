import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Trash2, RotateCw, FlipHorizontal2, FlipVertical2, Save, RotateCcw, ChevronDown, ChevronUp, Copy, Eye, EyeOff, Lock, Unlock, Layers, Undo2, Redo2, MoveUp, MoveDown, ArrowUpToLine, ArrowDownToLine, Link2 } from 'lucide-react';
import { ASSETS, AssetKey } from './sceneAssets';
import {
  SceneId, SceneItem, SceneLayout,
  loadLayout, saveLayout, resetLayout,
  PALETTE_GROUPS, SCENE_NAMES, SCENE_DEFAULT_BG, newItemId,
} from './layoutStore';

const sceneIds: SceneId[] = ['overview', 'line1', 'idc3', 'cmpA', 'agv', 'vision', 'office'];

// ── 按钮样式 ──────────────────────────────────────────────────────────
const btn = 'inline-flex h-7 items-center gap-1.5 rounded border border-[#2b6aa8] bg-[#0b2f61] px-2.5 text-[11px] font-semibold text-[#bde3ff] transition hover:border-[#4ea4ff] hover:bg-[#12407e] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed';
const btnPrimary = 'inline-flex h-7 items-center gap-1.5 rounded border border-[#4fc1ff] bg-[linear-gradient(180deg,#114a8a,#0a2f63)] px-2.5 text-[11px] font-semibold text-[#cfe9ff] shadow-[0_0_8px_rgba(79,193,255,0.3)] transition hover:brightness-110';
const btnDanger = 'inline-flex h-7 items-center gap-1.5 rounded border border-[#7a2e2e] bg-[#3a1414] px-2.5 text-[11px] font-semibold text-[#ff8a7a] transition hover:bg-[#4a1818]';
const iconBtn = 'inline-flex h-6 w-6 items-center justify-center rounded border border-[#2b6aa8] bg-[#0d2e5b] text-[#a9c8ee] hover:border-[#4fc1ff] hover:text-[#cfe9ff] disabled:opacity-40 disabled:cursor-not-allowed';

const MAX_HISTORY = 50;

export const DigitalTwinEditor: React.FC = () => {
  const [sceneId, setSceneId] = useState<SceneId>('overview');
  const [layout, setLayoutState] = useState<SceneLayout>(() => loadLayout('overview'));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; startX: number; startY: number; cx: number; cy: number; rect: DOMRect } | null>(null);
  const rotateRef = useRef<{ id: string; centerX: number; centerY: number; startAngle: number; startRotate: number } | null>(null);
  const resizeRef = useRef<{ id: string; startX: number; startY: number; w: number; h?: number; corner: string; rect: DOMRect; itemRect: DOMRect; aspect: boolean } | null>(null);
  const yawRef = useRef<{ id: string; startX: number; startYaw: number } | null>(null);
  const pitchRef = useRef<{ id: string; startY: number; startPitch: number } | null>(null);
  const [paletteCollapsed, setPaletteCollapsed] = useState(false);
  const isInitialMount = useRef(true);

  // ── 历史栈：撤销/重做 ────────────────────────────────────────────
  const historyRef = useRef<{ stack: SceneLayout[]; idx: number; bypass: boolean }>({ stack: [], idx: -1, bypass: false });
  const [historyTick, setHistoryTick] = useState(0); // 触发 UI 刷新

  // 包装 setLayout 以记录历史
  const pushHistory = useCallback((next: SceneLayout) => {
    const h = historyRef.current;
    const stack = h.stack.slice(0, h.idx + 1);
    stack.push(JSON.parse(JSON.stringify(next)));
    if (stack.length > MAX_HISTORY) stack.shift();
    h.stack = stack;
    h.idx = stack.length - 1;
    setHistoryTick(t => t + 1);
  }, []);

  const setLayout = useCallback<React.Dispatch<React.SetStateAction<SceneLayout>>>((updater) => {
    setLayoutState(prev => {
      const next = typeof updater === 'function' ? (updater as any)(prev) : updater;
      if (!historyRef.current.bypass) pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  // 切换场景：重新加载 + 清空历史
  useEffect(() => {
    isInitialMount.current = true;
    const fresh = loadLayout(sceneId);
    setLayoutState(fresh);
    setSelectedId(null);
    historyRef.current = { stack: [JSON.parse(JSON.stringify(fresh))], idx: 0, bypass: false };
    setHistoryTick(t => t + 1);
  }, [sceneId]);

  // 自动保存（debounce 400ms）
  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    const t = setTimeout(() => {
      saveLayout(layout);
      const el = document.getElementById('save-indicator');
      if (el) { el.textContent = '自动已保存'; el.style.opacity = '0.85'; setTimeout(() => { if (el) el.style.opacity = '0'; }, 800); }
    }, 400);
    return () => clearTimeout(t);
  }, [layout]);

  useEffect(() => {
    const onUnload = () => saveLayout(layout);
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [layout]);

  const selected = useMemo(() => layout.items.find(i => i.id === selectedId) || null, [layout, selectedId]);

  // ── 操作 ─────────────────────────────────────────────────────────
  const updateItem = useCallback((id: string, patch: Partial<SceneItem>) => {
    setLayout(prev => ({ ...prev, items: prev.items.map(i => i.id === id ? { ...i, ...patch } : i) }));
  }, [setLayout]);

  const removeItem = useCallback((id: string) => {
    setLayout(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
    setSelectedId(s => (s === id ? null : s));
  }, [setLayout]);

  const addItemAt = useCallback((asset: AssetKey, name: string, cx = 50, cy = 50, w = 14) => {
    const id = newItemId();
    const item: SceneItem = { id, asset, cx, cy, w, sx: 1, label: name };
    setLayout(prev => ({ ...prev, items: [...prev.items, item] }));
    setSelectedId(id);
    return id;
  }, [setLayout]);

  const addItem = useCallback((asset: AssetKey, name: string) => addItemAt(asset, name, 50, 50, 14), [addItemAt]);

  const duplicateItem = useCallback((id: string) => {
    const orig = layout.items.find(i => i.id === id);
    if (!orig) return;
    const newId = newItemId();
    const clone: SceneItem = { ...orig, id: newId, cx: orig.cx + 3, cy: orig.cy + 3, label: orig.label ? `${orig.label} 副本` : undefined };
    setLayout(prev => ({ ...prev, items: [...prev.items, clone] }));
    setSelectedId(newId);
  }, [layout, setLayout]);

  const reorderItem = useCallback((id: string, op: 'front' | 'back' | 'forward' | 'backward') => {
    setLayout(prev => {
      const arr = prev.items.slice();
      const idx = arr.findIndex(i => i.id === id);
      if (idx < 0) return prev;
      const [it] = arr.splice(idx, 1);
      let next = idx;
      if (op === 'front') next = arr.length;
      else if (op === 'back') next = 0;
      else if (op === 'forward') next = Math.min(arr.length, idx + 1);
      else if (op === 'backward') next = Math.max(0, idx - 1);
      arr.splice(next, 0, it);
      return { ...prev, items: arr };
    });
  }, [setLayout]);

  // 撤销/重做
  const canUndo = historyRef.current.idx > 0;
  const canRedo = historyRef.current.idx < historyRef.current.stack.length - 1;

  const undo = useCallback(() => {
    const h = historyRef.current;
    if (h.idx <= 0) return;
    h.idx -= 1;
    h.bypass = true;
    setLayoutState(JSON.parse(JSON.stringify(h.stack[h.idx])));
    setTimeout(() => { h.bypass = false; }, 0);
    setHistoryTick(t => t + 1);
  }, []);

  const redo = useCallback(() => {
    const h = historyRef.current;
    if (h.idx >= h.stack.length - 1) return;
    h.idx += 1;
    h.bypass = true;
    setLayoutState(JSON.parse(JSON.stringify(h.stack[h.idx])));
    setTimeout(() => { h.bypass = false; }, 0);
    setHistoryTick(t => t + 1);
  }, []);

  // ── 键盘快捷键 ───────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // 输入框内不触发
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // 撤销/重做（全局）
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') || ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'z')) { e.preventDefault(); redo(); return; }
      // 复制
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd' && selectedId) { e.preventDefault(); duplicateItem(selectedId); return; }

      if (!selectedId) return;
      const sel = layout.items.find(i => i.id === selectedId);
      if (!sel || sel.locked) return;

      // 删除
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeItem(selectedId); return; }
      // Esc 取消选中
      if (e.key === 'Escape') { setSelectedId(null); return; }
      // 方向键移动
      const step = e.shiftKey ? 5 : 0.5;
      if (e.key === 'ArrowUp')    { e.preventDefault(); updateItem(selectedId, { cy: sel.cy - step }); return; }
      if (e.key === 'ArrowDown')  { e.preventDefault(); updateItem(selectedId, { cy: sel.cy + step }); return; }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); updateItem(selectedId, { cx: sel.cx - step }); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); updateItem(selectedId, { cx: sel.cx + step }); return; }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, layout, updateItem, removeItem, duplicateItem, undo, redo]);

  // ── 工具栏操作 ───────────────────────────────────────────────────
  const onSave = () => {
    saveLayout(layout);
    const el = document.getElementById('save-indicator');
    if (el) { el.textContent = '已保存'; el.style.opacity = '1'; setTimeout(() => { if (el) el.style.opacity = '0'; }, 1400); }
  };
  const onReset = () => {
    if (!confirm(`确定将"${SCENE_NAMES[sceneId]}"恢复为默认布局？所有改动会清除。`)) return;
    const def = resetLayout(sceneId);
    setLayoutState(def);
    historyRef.current = { stack: [JSON.parse(JSON.stringify(def))], idx: 0, bypass: false };
    setSelectedId(null);
    setHistoryTick(t => t + 1);
  };
  const onExport = () => {
    const json = JSON.stringify(layout, null, 2);
    navigator.clipboard?.writeText(json).then(() => alert('当前场景 JSON 已复制到剪贴板'), () => prompt('复制下面的 JSON：', json));
  };

  // ── 鼠标变换（拖拽 / 旋转 / 缩放） ───────────────────────────────
  const onItemMouseDown = (e: React.MouseEvent, item: SceneItem) => {
    e.preventDefault(); e.stopPropagation();
    setSelectedId(item.id);
    if (item.locked) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = { id: item.id, startX: e.clientX, startY: e.clientY, cx: item.cx, cy: item.cy, rect };
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const p = pitchRef.current;
      if (p) {
        const dy = e.clientY - p.startY;
        let next = p.startPitch + dy * 0.6;
        while (next > 180) next -= 360;
        while (next < -180) next += 360;
        if (e.shiftKey) next = Math.round(next / 15) * 15;
        updateItem(p.id, { pitch: next });
        return;
      }
      const y = yawRef.current;
      if (y) {
        const dx = e.clientX - y.startX;
        let next = y.startYaw + dx * 0.6;
        while (next > 180) next -= 360;
        while (next < -180) next += 360;
        if (e.shiftKey) next = Math.round(next / 15) * 15;
        updateItem(y.id, { yaw: next });
        return;
      }
      const rs = resizeRef.current;
      if (rs) {
        const dx = ((e.clientX - rs.startX) / rs.rect.width) * 100;
        const dy = ((e.clientY - rs.startY) / rs.rect.height) * 100;
        const signX = rs.corner.includes('e') ? 1 : -1;
        const signY = rs.corner.includes('s') ? 1 : -1;
        if (rs.aspect) {
          const change = Math.abs(dx) > Math.abs(dy) ? dx * signX : dy * signY;
          updateItem(rs.id, { w: Math.max(2, Math.min(100, rs.w + change * 2)) });
        } else {
          // 角点：自由拉伸（同时改 w/h）
          // 边手柄：只改单维（由 corner 的 'n/s/e/w' 区分）
          if (rs.corner === 'e' || rs.corner === 'w') {
            updateItem(rs.id, { w: Math.max(2, Math.min(100, rs.w + dx * signX * 2)) });
          } else if (rs.corner === 'n' || rs.corner === 's') {
            const baseH = rs.h ?? (rs.itemRect.height / rs.rect.height * 100);
            updateItem(rs.id, { h: Math.max(2, Math.min(100, baseH + dy * signY * 2)) });
          } else {
            const baseH = rs.h ?? (rs.itemRect.height / rs.rect.height * 100);
            updateItem(rs.id, {
              w: Math.max(2, Math.min(100, rs.w + dx * signX * 2)),
              h: Math.max(2, Math.min(100, baseH + dy * signY * 2)),
            });
          }
        }
        return;
      }
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
      const d = dragRef.current;
      if (!d) return;
      const dx = ((e.clientX - d.startX) / d.rect.width) * 100;
      const dy = ((e.clientY - d.startY) / d.rect.height) * 100;
      updateItem(d.id, {
        cx: Math.max(-20, Math.min(120, d.cx + dx)),
        cy: Math.max(-20, Math.min(120, d.cy + dy)),
      });
    };
    const onUp = () => { dragRef.current = null; rotateRef.current = null; resizeRef.current = null; yawRef.current = null; pitchRef.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [updateItem]);

  const onItemWheel = (e: React.WheelEvent, item: SceneItem) => {
    if (item.locked) return;
    e.preventDefault(); e.stopPropagation();
    if (e.shiftKey) {
      const step = e.altKey ? 1 : 5;
      updateItem(item.id, { rotate: (item.rotate ?? 0) + (e.deltaY < 0 ? step : -step) });
      return;
    }
    const delta = e.deltaY < 0 ? 0.5 : -0.5;
    updateItem(item.id, { w: Math.max(2, Math.min(100, item.w + delta)) });
  };

  const onResizeHandleDown = (e: React.MouseEvent, item: SceneItem, corner: string) => {
    e.preventDefault(); e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const itemRect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    const aspect = item.lockAspect !== false; // 默认锁比例
    resizeRef.current = { id: item.id, startX: e.clientX, startY: e.clientY, w: item.w, h: item.h, corner, rect, itemRect, aspect };
  };
  const onRotateHandleDown = (e: React.MouseEvent, item: SceneItem, itemEl: HTMLElement) => {
    e.preventDefault(); e.stopPropagation();
    const rect = itemEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = item.anchorBottom !== false ? rect.bottom : (rect.top + rect.height / 2);
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    rotateRef.current = { id: item.id, centerX, centerY, startAngle: Math.atan2(dy, dx) * 180 / Math.PI + 90, startRotate: item.rotate ?? 0 };
  };
  const onYawHandleDown = (e: React.MouseEvent, item: SceneItem) => {
    e.preventDefault(); e.stopPropagation();
    yawRef.current = { id: item.id, startX: e.clientX, startYaw: item.yaw ?? 0 };
  };
  const onPitchHandleDown = (e: React.MouseEvent, item: SceneItem) => {
    e.preventDefault(); e.stopPropagation();
    pitchRef.current = { id: item.id, startY: e.clientY, startPitch: item.pitch ?? 0 };
  };

  const baseSrc = layout.baseMap ?? SCENE_DEFAULT_BG[sceneId];

  return (
    <div className="flex h-full w-full flex-col gap-2 overflow-hidden rounded-lg border border-[#0c3d75] bg-[#021026] p-2">
      {/* 顶部工具栏 */}
      <div className="flex h-9 shrink-0 items-center justify-between gap-2 rounded border border-[#1b4378] bg-[linear-gradient(180deg,#0a2547,#082040)] px-3">
        <div className="flex items-center gap-2 text-[12px]">
          <span className="text-[#a9c8ee]">数字孪生编辑器</span>
          <span className="mx-1 text-[#244871]">|</span>
          <span className="text-[#7e9fc8]">场景:</span>
          <select value={sceneId} onChange={e => setSceneId(e.target.value as SceneId)} className="h-6 rounded border border-[#2b6aa8] bg-[#0d2e5b] px-1.5 text-[11px] text-[#cfe9ff] outline-none">
            {sceneIds.map(s => <option key={s} value={s}>{SCENE_NAMES[s]}</option>)}
          </select>
          <span className="text-[#7e9fc8] ml-2">{layout.items.length} 项设施</span>

          <span className="mx-2 text-[#244871]">|</span>
          <button className={btn} onClick={undo} disabled={!canUndo} title="撤销 (Ctrl+Z)"><Undo2 size={11} /></button>
          <button className={btn} onClick={redo} disabled={!canRedo} title="重做 (Ctrl+Shift+Z / Ctrl+Y)"><Redo2 size={11} /></button>
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
          <button type="button" onClick={() => setPaletteCollapsed(v => !v)} className="flex h-6 shrink-0 items-center justify-between rounded bg-[#0d2e5b] px-1.5 text-[11px] font-semibold text-[#a9c8ee] hover:text-[#cfe9ff]">
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
                            const img = new Image();
                            img.src = a.src;
                            try { e.dataTransfer.setDragImage(img, 30, 30); } catch {}
                          }}
                          onClick={() => addItem(it.key, it.name)}
                          className="group flex flex-col items-center gap-0.5 rounded border border-[#244871] bg-[#081f3d] p-1 transition hover:border-[#4fc1ff] hover:bg-[#103968] active:cursor-grabbing"
                          title="点击放置中央 · 或拖拽到画布"
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
                }
              }}
              onDrop={e => {
                e.preventDefault();
                const assetKey = e.dataTransfer.getData('text/dt-asset') as AssetKey;
                const name = e.dataTransfer.getData('text/dt-name') || assetKey;
                if (!assetKey || !ASSETS[assetKey]) return;
                const rect = canvasRef.current!.getBoundingClientRect();
                const cx = ((e.clientX - rect.left) / rect.width) * 100;
                const cy = ((e.clientY - rect.top) / rect.height) * 100;
                addItemAt(assetKey, name, +cx.toFixed(1), +cy.toFixed(1));
              }}
            >
              {baseSrc ? (
                <img src={baseSrc} alt="底图" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain" style={{ zIndex: 1 }} />
              ) : (
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0b2a55_0%,#061a36_60%,#020a18_100%)]" />
              )}
              <div className="pointer-events-none absolute inset-0" style={{
                backgroundImage: 'linear-gradient(rgba(63,134,200,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(63,134,200,0.07) 1px,transparent 1px)',
                backgroundSize: '5% 5%', zIndex: 2,
              }} />

              {layout.items.map((item, idx) => {
                const a = ASSETS[item.asset];
                if (!a) return null;
                const isSel = item.id === selectedId;
                const isHidden = item.hidden;
                const isLocked = item.locked;
                return (
                  <div
                    key={item.id}
                    onMouseDown={e => onItemMouseDown(e, item)}
                    onWheel={e => onItemWheel(e, item)}
                    onClick={e => { e.stopPropagation(); setSelectedId(item.id); }}
                    className={`absolute select-none ${isLocked ? 'cursor-not-allowed' : 'cursor-move'}`}
                    style={{
                      left: `${item.cx}%`,
                      top: `${item.cy}%`,
                      width: `${item.w}%`,
                      ...(item.h != null ? { height: `${item.h}%` } : { aspectRatio: `${a.w} / ${a.h}` }),
                      transform: `translate(-50%, ${item.anchorBottom !== false ? '-100%' : '-50%'}) rotate(${item.rotate ?? 0}deg) rotateY(${item.yaw ?? 0}deg) rotateX(${item.pitch ?? 0}deg)`,
                      transformOrigin: item.anchorBottom !== false ? '50% 100%' : '50% 50%',
                      transformStyle: 'preserve-3d',
                      zIndex: 10 + idx + (isSel ? 1000 : 0),
                      outline: isSel ? '2px solid #ffb672' : (isLocked ? '1px solid rgba(255,180,114,0.5)' : '1px dashed rgba(79,193,255,0.35)'),
                      outlineOffset: 2,
                      opacity: isHidden ? 0.25 : (item.opacity ?? 1),
                    }}
                    title={item.label || item.asset}
                  >
                    <img
                      src={a.src} alt="" draggable={false}
                      className="pointer-events-none h-full w-full select-none object-contain"
                      style={{ filter: item.filter }}
                    />

                    {/* 隐藏/锁定角标 */}
                    {(isHidden || isLocked) && (
                      <div className="pointer-events-none absolute top-0 left-0 flex gap-0.5 p-0.5">
                        {isHidden && <EyeOff size={10} className="text-[#7e9fc8]" />}
                        {isLocked && <Lock size={10} className="text-[#ffb672]" />}
                      </div>
                    )}

                    {isSel && (
                      <>
                        <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded bg-[#0a2547]/95 px-1.5 py-0.5 text-[10px] font-mono text-[#ffb672] whitespace-nowrap">
                          {item.label || item.asset} · ({item.cx.toFixed(1)},{item.cy.toFixed(1)}) · w{item.w.toFixed(1)}{item.h != null ? `×h${item.h.toFixed(1)}` : ''}
                          <span className="ml-1 text-[#ffb672]">Z{Math.round(((item.rotate ?? 0) + 360) % 360)}°</span>
                          <span className="ml-1 text-[#6ce09a]">Y{Math.round(((item.yaw ?? 0) + 360) % 360)}°</span>
                          <span className="ml-1 text-[#4fc1ff]">X{Math.round(((item.pitch ?? 0) + 360) % 360)}°</span>
                        </div>

                        {!isLocked && (
                          <>
                            {/* Z 轴旋转手柄 */}
                            <div className="pointer-events-none absolute left-1/2 -top-5 -translate-x-1/2" style={{ width: 1, height: 20, background: '#ffb672' }} />
                            <div onMouseDown={e => onRotateHandleDown(e, item, (e.currentTarget.parentElement as HTMLElement))} onClick={e => e.stopPropagation()}
                              title="Z 轴旋转 · Shift 吸附 15°"
                              className="absolute left-1/2 -top-9 flex h-6 w-6 -translate-x-1/2 cursor-grab items-center justify-center rounded-full border-2 border-[#ffb672] bg-[#3a2c0d] text-[#fff0d4] shadow-[0_0_8px_rgba(255,182,114,0.55)] active:cursor-grabbing hover:bg-[#5a4214]">
                              <RotateCw size={11} />
                            </div>

                            {/* Y 轴 */}
                            <div className="pointer-events-none absolute top-1/2 -right-5 -translate-y-1/2" style={{ height: 1, width: 20, background: '#6ce09a' }} />
                            <div onMouseDown={e => onYawHandleDown(e, item)} onClick={e => e.stopPropagation()}
                              title="Y 轴水平旋转 · 左右拖拽"
                              className="absolute top-1/2 -right-9 flex h-6 w-6 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border-2 border-[#6ce09a] bg-[#0d3a26] text-[#cfeedf] shadow-[0_0_8px_rgba(108,224,154,0.5)] active:cursor-grabbing hover:bg-[#155538]">
                              <FlipHorizontal2 size={11} />
                            </div>

                            {/* X 轴 */}
                            <div className="pointer-events-none absolute left-1/2 -bottom-5 -translate-x-1/2" style={{ width: 1, height: 20, background: '#4fc1ff' }} />
                            <div onMouseDown={e => onPitchHandleDown(e, item)} onClick={e => e.stopPropagation()}
                              title="X 轴俯仰旋转 · 上下拖拽"
                              className="absolute left-1/2 -bottom-9 flex h-6 w-6 -translate-x-1/2 cursor-ns-resize items-center justify-center rounded-full border-2 border-[#4fc1ff] bg-[#0a2f63] text-[#cfe9ff] shadow-[0_0_8px_rgba(79,193,255,0.5)] active:cursor-grabbing hover:bg-[#13427d]">
                              <FlipVertical2 size={11} />
                            </div>

                            {/* 4 角缩放手柄（按比例） */}
                            {[
                              { c: 'nw', top: -4, left: -4, cursor: 'nwse-resize' },
                              { c: 'ne', top: -4, right: -4, cursor: 'nesw-resize' },
                              { c: 'sw', bottom: -4, left: -4, cursor: 'nesw-resize' },
                              { c: 'se', bottom: -4, right: -4, cursor: 'nwse-resize' },
                            ].map(h => (
                              <div key={h.c} onMouseDown={e => onResizeHandleDown(e, item, h.c)} onClick={e => e.stopPropagation()}
                                title={item.lockAspect !== false ? '按比例缩放' : '自由拉伸（宽高独立）'}
                                className="absolute h-2.5 w-2.5 rounded-sm border-2 border-white bg-[#ffb672] shadow-[0_0_6px_rgba(255,182,114,0.7)]"
                                style={{ top: h.top, bottom: h.bottom, left: h.left, right: h.right, cursor: h.cursor, zIndex: 5 }}
                              />
                            ))}

                            {/* 4 边手柄：仅在解锁宽高比时显示，调单维 */}
                            {item.lockAspect === false && (['n', 's', 'e', 'w'] as const).map(c => {
                              const horiz = c === 'e' || c === 'w';
                              const pos: React.CSSProperties = horiz
                                ? { top: '50%', [c === 'e' ? 'right' : 'left']: -4, transform: 'translateY(-50%)' }
                                : { left: '50%', [c === 's' ? 'bottom' : 'top']: -4, transform: 'translateX(-50%)' };
                              return (
                                <div key={c} onMouseDown={e => onResizeHandleDown(e, item, c)} onClick={e => e.stopPropagation()}
                                  title="单维拉伸"
                                  className="absolute h-2.5 w-2.5 rounded-sm border-2 border-white bg-[#79d0ff] shadow-[0_0_6px_rgba(79,193,255,0.7)]"
                                  style={{ ...pos, cursor: horiz ? 'ew-resize' : 'ns-resize', zIndex: 5 }}
                                />
                              );
                            })}
                          </>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 画布提示 */}
          <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-[#0a2547]/85 px-2 py-1 text-[10px] leading-relaxed text-[#7e9fc8]">
            素材库拖入 / 点选 · 拖拽建筑移动 · <span className="text-[#ffb672]">4 角 ⬚</span>缩放 · <span className="text-[#79d0ff]">4 边 ▭</span>单维拉伸（需关锁定）<br />
            旋转：<span className="text-[#ffb672]">⟳ Z</span> · <span className="text-[#6ce09a]">⇆ Y</span>（左右） · <span className="text-[#4fc1ff]">⇅ X</span>（上下）· Shift 吸附 15°<br />
            快捷键：方向键移动 · Shift+方向 5% · Delete 删除 · Esc 取消 · Ctrl+D 复制 · Ctrl+Z/Y 撤销/重做 · 自动保存
          </div>
        </div>

        {/* 右侧：列表 + 属性 */}
        <div className="flex w-[300px] shrink-0 flex-col gap-1.5 rounded border border-[#1b4378] bg-[#0a2547] p-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#79d0ff]">设施列表 ({layout.items.length})</span>
            {selected && <span className="text-[10px] text-[#7e9fc8]">Ctrl+D 复制 · Del 删除</span>}
          </div>
          <div className="max-h-[28vh] space-y-0.5 overflow-auto custom-scrollbar pr-0.5">
            {layout.items.map((it, idx) => {
              const isSel = it.id === selectedId;
              return (
                <div key={it.id} onClick={() => setSelectedId(it.id)}
                  className={`flex cursor-pointer items-center gap-1 rounded px-1.5 py-1 text-[11px] ${isSel ? 'border border-[#ffb672] bg-[#3a2c0d]/40 text-[#fff0d4]' : 'border border-[#244871] bg-[#081f3d] text-[#a9c8ee] hover:bg-[#103968]'}`}>
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#0d2e5b] text-[9px]">{idx + 1}</span>
                  <span className="flex-1 truncate" style={it.hidden ? { opacity: 0.5 } : undefined}>{it.label || it.asset}</span>
                  <button title={it.hidden ? '显示' : '隐藏'} onClick={e => { e.stopPropagation(); updateItem(it.id, { hidden: !it.hidden }); }} className="text-[#7e9fc8] hover:text-[#cfe9ff]">
                    {it.hidden ? <EyeOff size={10} /> : <Eye size={10} />}
                  </button>
                  <button title={it.locked ? '解锁' : '锁定'} onClick={e => { e.stopPropagation(); updateItem(it.id, { locked: !it.locked }); }} className="text-[#7e9fc8] hover:text-[#cfe9ff]">
                    {it.locked ? <Lock size={10} className="text-[#ffb672]" /> : <Unlock size={10} />}
                  </button>
                </div>
              );
            })}
            {layout.items.length === 0 && (
              <div className="rounded border border-dashed border-[#244871] py-3 text-center text-[10px] text-[#7e9fc8]">从左侧素材库点击或拖入</div>
            )}
          </div>

          {/* 属性 */}
          <div className="mt-1 flex-1 overflow-auto border-t border-[#1b4378] pt-2 text-[11px] custom-scrollbar pr-0.5">
            {selected ? (
              <div className="space-y-1.5">
                {/* 层级 + 复制 + 锁定 + 隐藏 行 */}
                <div className="flex flex-wrap items-center gap-1">
                  <button className={iconBtn} onClick={() => reorderItem(selected.id, 'front')} title="置顶 (Front)"><ArrowUpToLine size={11} /></button>
                  <button className={iconBtn} onClick={() => reorderItem(selected.id, 'forward')} title="上移"><MoveUp size={11} /></button>
                  <button className={iconBtn} onClick={() => reorderItem(selected.id, 'backward')} title="下移"><MoveDown size={11} /></button>
                  <button className={iconBtn} onClick={() => reorderItem(selected.id, 'back')} title="置底 (Back)"><ArrowDownToLine size={11} /></button>
                  <div className="mx-1 h-4 w-px bg-[#1b4378]" />
                  <button className={iconBtn} onClick={() => duplicateItem(selected.id)} title="复制 (Ctrl+D)"><Copy size={11} /></button>
                  <button className={iconBtn} onClick={() => updateItem(selected.id, { hidden: !selected.hidden })} title={selected.hidden ? '显示' : '隐藏'}>
                    {selected.hidden ? <EyeOff size={11} /> : <Eye size={11} />}
                  </button>
                  <button className={iconBtn} onClick={() => updateItem(selected.id, { locked: !selected.locked })} title={selected.locked ? '解锁' : '锁定'}>
                    {selected.locked ? <Lock size={11} /> : <Unlock size={11} />}
                  </button>
                </div>

                <Row label="资源">
                  <select value={selected.asset} onChange={e => updateItem(selected.id, { asset: e.target.value as AssetKey })} className="input">
                    {Object.keys(ASSETS).map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </Row>
                <Row label="标签">
                  <input type="text" value={selected.label || ''} onChange={e => updateItem(selected.id, { label: e.target.value })} className="input" />
                </Row>
                <Row label="位置">
                  <div className="flex gap-1.5">
                    <NumInput value={selected.cx} onChange={v => updateItem(selected.id, { cx: v })} step={0.5} />
                    <NumInput value={selected.cy} onChange={v => updateItem(selected.id, { cy: v })} step={0.5} />
                  </div>
                </Row>
                <Row label="尺寸">
                  <div className="flex items-center gap-1.5">
                    <NumInput value={selected.w} onChange={v => updateItem(selected.id, { w: v })} step={0.5} min={2} max={100} />
                    <span className="text-[10px] text-[#7e9fc8]">×</span>
                    <NumInput
                      value={selected.h ?? +((ASSETS[selected.asset].h / ASSETS[selected.asset].w) * selected.w).toFixed(1)}
                      onChange={v => updateItem(selected.id, { h: v })}
                      step={0.5} min={2} max={100}
                    />
                    <button
                      className={iconBtn + (selected.lockAspect !== false ? ' !text-[#ffb672] !border-[#ffb672]' : '')}
                      onClick={() => updateItem(selected.id, { lockAspect: !(selected.lockAspect !== false), h: (selected.lockAspect !== false) ? selected.h : undefined })}
                      title={(selected.lockAspect !== false) ? '已锁定宽高比（点击解锁可独立拉伸）' : '宽高独立（点击锁定回比例）'}
                    >
                      <Link2 size={11} />
                    </button>
                  </div>
                </Row>
                <Row label="透明度">
                  <div className="flex items-center gap-1.5">
                    <input type="range" min={0} max={1} step={0.05} value={selected.opacity ?? 1}
                      onChange={e => updateItem(selected.id, { opacity: +e.target.value })}
                      className="flex-1 accent-[#79d0ff]" />
                    <span className="w-10 text-right font-mono text-[10px] text-[#cfe9ff]">{Math.round((selected.opacity ?? 1) * 100)}%</span>
                  </div>
                </Row>
                <Row label="Z 旋转">
                  <div className="flex items-center gap-1.5">
                    <input type="range" min={-180} max={180} step={1} value={selected.rotate ?? 0}
                      onChange={e => updateItem(selected.id, { rotate: +e.target.value })} className="flex-1 accent-[#ffb672]" />
                    <NumInput value={selected.rotate ?? 0} onChange={v => updateItem(selected.id, { rotate: v })} step={5} />
                  </div>
                </Row>
                <Row label="Y 旋转">
                  <div className="flex items-center gap-1.5">
                    <input type="range" min={-180} max={180} step={1} value={selected.yaw ?? 0}
                      onChange={e => updateItem(selected.id, { yaw: +e.target.value })} className="flex-1 accent-[#6ce09a]" />
                    <NumInput value={selected.yaw ?? 0} onChange={v => updateItem(selected.id, { yaw: v })} step={5} />
                  </div>
                </Row>
                <Row label="X 旋转">
                  <div className="flex items-center gap-1.5">
                    <input type="range" min={-180} max={180} step={1} value={selected.pitch ?? 0}
                      onChange={e => updateItem(selected.id, { pitch: +e.target.value })} className="flex-1 accent-[#4fc1ff]" />
                    <NumInput value={selected.pitch ?? 0} onChange={v => updateItem(selected.id, { pitch: v })} step={5} />
                  </div>
                </Row>
                <Row label="底部锚点">
                  <input type="checkbox" checked={selected.anchorBottom !== false} onChange={e => updateItem(selected.id, { anchorBottom: e.target.checked })} className="h-4 w-4 accent-[#4fc1ff]" />
                </Row>
                <Row label="点击下钻">
                  <input type="text" placeholder="line1 / idc3 / cmpA …" value={selected.zone || ''} onChange={e => updateItem(selected.id, { zone: e.target.value || undefined })} className="input" />
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
                  <button className={btnDanger + ' flex-1'} onClick={() => removeItem(selected.id)}><Trash2 size={11} />删除 (Del)</button>
                </div>
              </div>
            ) : (
              <div className="rounded border border-dashed border-[#244871] py-4 text-center text-[10px] text-[#7e9fc8]">
                选中设施后在此编辑
                <br /><br />
                <span className="opacity-70">提示：素材库点击或拖入加入设施</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .input{height:24px;border:1px solid #2b6aa8;background:#0d2e5b;color:#cfe9ff;font:11px monospace;padding:0 6px;border-radius:3px;width:100%;outline:none;}
        .input:focus{border-color:#4fc1ff;}
      `}</style>
    </div>
  );
};

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="grid grid-cols-[70px_1fr] items-center gap-1.5">
    <span className="text-[10px] text-[#7e9fc8]">{label}</span>
    <div>{children}</div>
  </div>
);

const NumInput: React.FC<{ value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number }> = ({ value, onChange, step = 1, min, max }) => (
  <input type="number" value={Number.isFinite(value) ? value : 0} step={step} min={min} max={max}
    onChange={e => onChange(parseFloat(e.target.value) || 0)} className="input" />
);

export default DigitalTwinEditor;
