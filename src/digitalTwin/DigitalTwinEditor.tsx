import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Trash2, RotateCw, FlipHorizontal2, FlipVertical2, Save, RotateCcw, ChevronDown, ChevronUp, Copy, Eye, EyeOff, Lock, Unlock, Undo2, Redo2, MoveUp, MoveDown, ArrowUpToLine, ArrowDownToLine, Link2, Upload, X } from 'lucide-react';
import { AssetKey, getAllAssets, getAsset } from './sceneAssets';
import {
  SceneId, SceneItem, SceneLayout, MotionPoint, normalizeMotionConfig,
  loadLayout, saveLayout, resetLayout, resetToBundledLayout, setLayoutAsDefault,
  getPaletteGroups, SCENE_NAMES, SCENE_DEFAULT_BG, newItemId,
} from './layoutStore';
import { addCustomAsset, customAssetKey, loadCustomAssets, removeCustomAsset } from './customAssets';
import { shouldRenderSceneItem } from './renderGuards';
import { FOLDER_SCENE_ORDER } from './svgSceneRegistry';
import { DEFAULT_ROBOT_MOTION_PATH, ROBOT_MOTION_DURATION, getRobotMotionPoint, getRobotTrackPoints, isMotionRobotItem } from './robotMotion';

const sceneIds: SceneId[] = ['overview', 'line1', 'idc3', 'cmpA', 'agv', 'vision', 'office', ...FOLDER_SCENE_ORDER];
const DEFAULT_MOTION_DURATION = ROBOT_MOTION_DURATION;

const motionPointsToText = (points: MotionPoint[]) => points.map(point => `${point.x},${point.y}`).join('\n');

const parseMotionPointsText = (value: string): MotionPoint[] => value
  .split(/\r?\n/)
  .map(line => line.trim())
  .filter(Boolean)
  .map(line => {
    const parts = line.split(/[,\s]+/).filter(Boolean);
    if (parts.length < 2) return null;
    const x = Number(parts[0]);
    const y = Number(parts[1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return { x, y };
  })
  .filter((point): point is MotionPoint => point != null);

const getMotionPathText = (item: SceneItem) => {
  if (item.motion?.path?.length) return motionPointsToText(item.motion.path);
  if (item.motion?.enabled === false || isMotionRobotItem(item)) return motionPointsToText(DEFAULT_ROBOT_MOTION_PATH);
  return '';
};

const getMotionTrackPoints = (item: SceneItem) => {
  if (item.motion?.path?.length) {
    return item.motion.path.map(point => `${item.cx + point.x},${item.cy + point.y}`).join(' ');
  }
  return getRobotTrackPoints(item);
};

// ── 按钮样式 ──────────────────────────────────────────────────────────
const btn = 'inline-flex h-7 items-center gap-1.5 rounded border border-[#2b6aa8] bg-[#0b2f61] px-2.5 text-[11px] font-semibold text-[#bde3ff] transition hover:border-[#4ea4ff] hover:bg-[#12407e] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed';
const btnPrimary = 'inline-flex h-7 items-center gap-1.5 rounded border border-[#4fc1ff] bg-[linear-gradient(180deg,#114a8a,#0a2f63)] px-2.5 text-[11px] font-semibold text-[#cfe9ff] shadow-[0_0_8px_rgba(79,193,255,0.3)] transition hover:brightness-110';
const btnDanger = 'inline-flex h-7 items-center gap-1.5 rounded border border-[#7a2e2e] bg-[#3a1414] px-2.5 text-[11px] font-semibold text-[#ff8a7a] transition hover:bg-[#4a1818]';
const iconBtn = 'inline-flex h-6 w-6 items-center justify-center rounded border border-[#2b6aa8] bg-[#0d2e5b] text-[#a9c8ee] hover:border-[#4fc1ff] hover:text-[#cfe9ff] disabled:opacity-40 disabled:cursor-not-allowed';

const MAX_HISTORY = 50;
const BASE_ITEM_ID = '__base_map__';
const ITEM_SIZE_MIN = 0.5;
const ITEM_SIZE_MAX = 240;
const BASE_SIZE_MAX = 500;
const AREA_DRILL_KEYS = new Set(['line1', 'idc3', 'cmpA', 'agv', 'vision', 'office']);
const DRILL_TREE = [
  {
    title: '园区区域',
    items: [
      { key: 'line1', label: '生产厂房' },
      { key: 'idc3', label: '3号机房 B区' },
      { key: 'cmpA', label: '能源区' },
      { key: 'agv', label: '物流装卸区' },
      { key: 'vision', label: '视觉检测区' },
      { key: 'office', label: '办公楼' },
    ],
  },
  {
    title: '扩展场景',
    items: [
      { key: 'agvBuilding', label: 'AGV调度车间建筑' },
      { key: 'agvVehicle', label: 'AGV小车展示' },
      { key: 'visualBuilding', label: '视觉检测车间建筑' },
      { key: 'visualWorkshop', label: '视觉检测车间内部' },
      { key: 'rack', label: '机柜' },
    ],
  },
];

const clampSize = (value: number, max = ITEM_SIZE_MAX) => Math.max(ITEM_SIZE_MIN, Math.min(max, +value.toFixed(2)));

// 角度吸附：默认软吸附到最近的 15°（容差 3°），Shift 强制 15° 步进，Alt 完全自由
const snapAngleDeg = (val: number, alt: boolean, shift: boolean) => {
  if (alt) return +val.toFixed(1);
  if (shift) return Math.round(val / 15) * 15;
  const nearest = Math.round(val / 15) * 15;
  return Math.abs(val - nearest) <= 3 ? nearest : +val.toFixed(1);
};

export const DigitalTwinEditor: React.FC = () => {
  const [sceneId, setSceneId] = useState<SceneId>('overview');
  const [layout, setLayoutState] = useState<SceneLayout>(() => loadLayout('overview'));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // 主选中项（最后点选的那个）：驱动右侧单项属性面板与既有单项逻辑
  const selectedId = selectedIds.length ? selectedIds[selectedIds.length - 1] : null;
  const selectOnly = useCallback((id: string | null) => setSelectedIds(id == null ? [] : [id]), []);
  const toggleSelect = useCallback((id: string) => setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])), []);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; startX: number; startY: number; cx: number; cy: number; rect: DOMRect; snapX: number[]; snapY: number[]; items: { id: string; cx: number; cy: number }[] } | null>(null);
  const rotateRef = useRef<{ id: string; centerX: number; centerY: number; startAngle: number; startRotate: number } | null>(null);
  const resizeRef = useRef<{ id: string; startX: number; startY: number; w: number; h?: number; corner: string; rect: DOMRect; itemRect: DOMRect; aspect: boolean; max: number } | null>(null);
  const yawRef = useRef<{ id: string; startX: number; startYaw: number } | null>(null);
  const pitchRef = useRef<{ id: string; startY: number; startPitch: number } | null>(null);
  const pathNodeDragRef = useRef<{ id: string; index: number; cx: number; cy: number; path: MotionPoint[] } | null>(null);
  const [paletteCollapsed, setPaletteCollapsed] = useState(false);
  const [collapsedPaletteGroups, setCollapsedPaletteGroups] = useState<string[]>([]);
  const [assetVersion, setAssetVersion] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [canvasPan, setCanvasPan] = useState({ x: 0, y: 0 });
  const canvasZoomRef = useRef(1);
  const canvasPanRef = useRef({ x: 0, y: 0 });
  const panRef = useRef<{ startX: number; startY: number; ox: number; oy: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);
  const spaceRef = useRef(false);
  const marqueeRef = useRef<{ startX: number; startY: number; rect: DOMRect; additive: boolean; base: string[]; moved: boolean } | null>(null);
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [dragHud, setDragHud] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ common: true, transform: false, interaction: false, motion: false, advanced: false });
  const toggleSection = useCallback((k: string) => setOpenSections(p => ({ ...p, [k]: !p[k] })), []);
  const applyView = useCallback((zoom: number, panX: number, panY: number) => {
    canvasZoomRef.current = zoom;
    canvasPanRef.current = { x: panX, y: panY };
    setCanvasZoom(zoom);
    setCanvasPan({ x: panX, y: panY });
  }, []);
  const [motionTime, setMotionTime] = useState(0);
  const [pathEditId, setPathEditId] = useState<string | null>(null);
  const [snapGuides, setSnapGuides] = useState<{ x?: number; y?: number } | null>(null);
  const [dialog, setDialog] = useState<{
    open: boolean;
    mode: 'alert' | 'confirm';
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
  }>({ open: false, mode: 'alert', title: '', message: '' });
  const dialogResolverRef = useRef<((ok: boolean) => void) | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const moveRafRef = useRef<number | null>(null);
  const pendingPatchRef = useRef<{ id: string; patch: Partial<SceneItem> } | null>(null);
  const isInitialMount = useRef(true);
  const allAssets = useMemo(() => getAllAssets(), [assetVersion]);
  const paletteGroups = useMemo(() => getPaletteGroups(), [assetVersion]);
  const togglePaletteGroup = useCallback((title: string) => {
    setCollapsedPaletteGroups(prev => (
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    ));
  }, []);

  const askConfirm = useCallback((message: string, title = '确认操作', confirmText = '确认', cancelText = '取消') => {
    return new Promise<boolean>((resolve) => {
      dialogResolverRef.current = resolve;
      setDialog({ open: true, mode: 'confirm', title, message, confirmText, cancelText });
    });
  }, []);

  const showAlert = useCallback((message: string, title = '提示', confirmText = '知道了') => {
    return new Promise<void>((resolve) => {
      dialogResolverRef.current = () => resolve();
      setDialog({ open: true, mode: 'alert', title, message, confirmText });
    });
  }, []);

  const closeDialog = useCallback((ok: boolean) => {
    setDialog(prev => ({ ...prev, open: false }));
    const fn = dialogResolverRef.current;
    dialogResolverRef.current = null;
    if (fn) fn(ok);
  }, []);

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
    setSelectedIds([]);
    setPathEditId(null);
    canvasZoomRef.current = 1;
    canvasPanRef.current = { x: 0, y: 0 };
    setCanvasZoom(1);
    setCanvasPan({ x: 0, y: 0 });
    historyRef.current = { stack: [JSON.parse(JSON.stringify(fresh))], idx: 0, bypass: false };
    setHistoryTick(t => t + 1);
  }, [sceneId]);

  // 选中目标变化时退出路径绘制模式，避免误编辑
  useEffect(() => {
    if (pathEditId && pathEditId !== selectedId) setPathEditId(null);
  }, [selectedId, pathEditId]);

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

  const baseSrc = layout.baseMap ?? SCENE_DEFAULT_BG[sceneId];
  const baseEditableItem = useMemo<SceneItem | null>(() => {
    if (!baseSrc) return null;
    const scale = layout.baseMapScale ?? 1;
    return {
      id: BASE_ITEM_ID,
      asset: 'parkBaseMap',
      label: '底图',
      cx: 50 + (layout.baseMapOffsetX ?? 0),
      cy: 50 + (layout.baseMapOffsetY ?? 0),
      w: 100 * scale,
      h: 100 * scale,
      rotate: layout.baseMapRotate ?? 0,
      lockAspect: true,
      anchorBottom: false,
    };
  }, [baseSrc, layout.baseMapScale, layout.baseMapOffsetX, layout.baseMapOffsetY, layout.baseMapRotate]);
  const renderItems = useMemo(() => {
    const raw = baseEditableItem ? [baseEditableItem, ...layout.items] : layout.items;
    return raw.filter(item => {
      if (item.id === BASE_ITEM_ID) return true;
      return shouldRenderSceneItem(item, baseSrc, selectedId); // 完整场景底图下，冲突建筑仅在选中编辑时显示
    });
  }, [baseEditableItem, layout.items, baseSrc, selectedId]);
  const selected = useMemo(() => renderItems.find(i => i.id === selectedId) || null, [renderItems, selectedId]);
  const renderItemsRef = useRef(renderItems);
  renderItemsRef.current = renderItems;
  const pathEditItem = useMemo(() => (pathEditId ? renderItems.find(i => i.id === pathEditId) || null : null), [renderItems, pathEditId]);
  const isBaseSelected = selected?.id === BASE_ITEM_ID;
  const hasRoamingRobot = useMemo(() => renderItems.some(item => item.id !== BASE_ITEM_ID && isMotionRobotItem(item)), [renderItems]);

  useEffect(() => {
    if (!hasRoamingRobot) return;
    let raf = 0;
    let last = 0;
    const loop = (now: number) => {
      if (now - last > 33) {
        last = now;
        setMotionTime(now);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [hasRoamingRobot]);

  // ── 操作 ─────────────────────────────────────────────────────────
  const updateItem = useCallback((id: string, patch: Partial<SceneItem>) => {
    if (id === BASE_ITEM_ID) {
      setLayout(prev => {
        const next = { ...prev };
        if (patch.cx != null) next.baseMapOffsetX = patch.cx - 50;
        if (patch.cy != null) next.baseMapOffsetY = patch.cy - 50;
        if (patch.w != null) next.baseMapScale = Math.max(0.1, patch.w / 100);
        if (patch.rotate != null) next.baseMapRotate = patch.rotate;
        return next;
      });
      return;
    }
    setLayout(prev => ({ ...prev, items: prev.items.map(i => i.id === id ? { ...i, ...patch } : i) }));
  }, [setLayout]);

  const updateSelectedMotion = useCallback((patch: Partial<NonNullable<SceneItem['motion']>>) => {
    if (!selected) return;
    const next = normalizeMotionConfig({ ...(selected.motion ?? {}), ...patch });
    updateItem(selected.id, { motion: next });
  }, [selected, updateItem]);

  // ── 路径绘制（在画布上连线编辑运动轨迹） ─────────────────────────────
  const getEditablePath = useCallback((item: SceneItem): MotionPoint[] => {
    if (item.motion?.path?.length) return item.motion.path;
    return DEFAULT_ROBOT_MOTION_PATH;
  }, []);

  const setMotionPath = useCallback((id: string, path: MotionPoint[]) => {
    setLayout(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === id
        ? { ...i, motion: normalizeMotionConfig({ ...(i.motion ?? {}), enabled: true, path }) }
        : i),
    }));
  }, [setLayout]);

  // 把画布上的鼠标位置换算成相对设备当前位置的百分比偏移点
  const clientToMotionPoint = useCallback((clientX: number, clientY: number, cx: number, cy: number): MotionPoint => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const px = ((clientX - rect.left) / rect.width) * 100;
    const py = ((clientY - rect.top) / rect.height) * 100;
    return { x: +(px - cx).toFixed(1), y: +(py - cy).toFixed(1) };
  }, []);

  const queueItemPatch = useCallback((id: string, patch: Partial<SceneItem>) => {
    const prev = pendingPatchRef.current;
    if (prev && prev.id === id) {
      pendingPatchRef.current = { id, patch: { ...prev.patch, ...patch } };
    } else {
      pendingPatchRef.current = { id, patch };
    }
    if (moveRafRef.current != null) return;
    moveRafRef.current = requestAnimationFrame(() => {
      moveRafRef.current = null;
      const next = pendingPatchRef.current;
      pendingPatchRef.current = null;
      if (next) updateItem(next.id, next.patch);
    });
  }, [updateItem]);

  const removeItem = useCallback((id: string) => {
    if (id === BASE_ITEM_ID) return;
    setLayout(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
    setSelectedIds(prev => prev.filter(x => x !== id));
  }, [setLayout]);

  const removeItems = useCallback((ids: string[]) => {
    const set = new Set(ids.filter(id => id !== BASE_ITEM_ID));
    if (!set.size) return;
    setLayout(prev => ({ ...prev, items: prev.items.filter(i => !set.has(i.id)) }));
    setSelectedIds(prev => prev.filter(x => !set.has(x)));
  }, [setLayout]);

  const addItemAt = useCallback((asset: AssetKey, name: string, cx = 50, cy = 50, w = 14) => {
    const id = newItemId();
    const item: SceneItem = { id, asset, cx, cy, w, sx: 1, label: name, motion: { enabled: false } };
    setLayout(prev => ({ ...prev, items: [...prev.items, item] }));
    selectOnly(id);
    return id;
  }, [setLayout]);

  const addItem = useCallback((asset: AssetKey, name: string) => addItemAt(asset, name, 50, 50, 14), [addItemAt]);

  const duplicateItem = useCallback((id: string) => {
    if (id === BASE_ITEM_ID) return;
    const orig = layout.items.find(i => i.id === id);
    if (!orig) return;
    const newId = newItemId();
    const clone: SceneItem = { ...orig, id: newId, cx: orig.cx + 3, cy: orig.cy + 3, label: orig.label ? `${orig.label} 副本` : undefined };
    setLayout(prev => ({ ...prev, items: [...prev.items, clone] }));
    selectOnly(newId);
  }, [layout, setLayout, selectOnly]);

  // 多选对齐（按中心对齐）
  const alignSelected = useCallback((axis: 'x' | 'y', mode: 'min' | 'center' | 'max') => {
    const items = renderItemsRef.current.filter(i => selectedIds.includes(i.id) && i.id !== BASE_ITEM_ID && !i.locked);
    if (items.length < 2) return;
    const vals = items.map(i => (axis === 'x' ? i.cx : i.cy));
    const target = mode === 'min' ? Math.min(...vals) : mode === 'max' ? Math.max(...vals) : (Math.min(...vals) + Math.max(...vals)) / 2;
    const key = axis === 'x' ? 'cx' : 'cy';
    const set = new Set(items.map(i => i.id));
    setLayout(prev => ({ ...prev, items: prev.items.map(i => (set.has(i.id) ? { ...i, [key]: +target.toFixed(2) } : i)) }));
  }, [selectedIds, setLayout]);

  // 多选等距分布
  const distributeSelected = useCallback((axis: 'x' | 'y') => {
    const items = renderItemsRef.current
      .filter(i => selectedIds.includes(i.id) && i.id !== BASE_ITEM_ID && !i.locked)
      .sort((a, b) => (axis === 'x' ? a.cx - b.cx : a.cy - b.cy));
    if (items.length < 3) return;
    const key = axis === 'x' ? 'cx' : 'cy';
    const first = (items[0] as any)[key];
    const last = (items[items.length - 1] as any)[key];
    const gap = (last - first) / (items.length - 1);
    const updates = new Map(items.map((it, idx) => [it.id, +(first + gap * idx).toFixed(2)]));
    setLayout(prev => ({ ...prev, items: prev.items.map(i => (updates.has(i.id) ? { ...i, [key]: updates.get(i.id)! } : i)) }));
  }, [selectedIds, setLayout]);

  // 批量复制（保留相对位置，整体偏移 +3）
  const duplicateItems = useCallback((ids: string[]) => {
    const set = new Set(ids.filter(id => id !== BASE_ITEM_ID));
    if (!set.size) return;
    const newIds: string[] = [];
    setLayout(prev => {
      const clones = prev.items.filter(i => set.has(i.id)).map(orig => {
        const newId = newItemId();
        newIds.push(newId);
        return { ...orig, id: newId, cx: orig.cx + 3, cy: orig.cy + 3, label: orig.label ? `${orig.label} 副本` : undefined } as SceneItem;
      });
      return { ...prev, items: [...prev.items, ...clones] };
    });
    if (newIds.length) setSelectedIds(newIds);
  }, [setLayout]);

  const resizeItemBy = useCallback((id: string, factor: number) => {
    const item = renderItems.find(i => i.id === id);
    if (!item || item.locked) return;
    const max = id === BASE_ITEM_ID ? BASE_SIZE_MAX : ITEM_SIZE_MAX;
    updateItem(id, {
      w: clampSize(item.w * factor, max),
      h: item.h == null ? undefined : clampSize(item.h * factor, max),
    });
  }, [renderItems, updateItem]);

  const reorderItem = useCallback((id: string, op: 'front' | 'back' | 'forward' | 'backward') => {
    if (id === BASE_ITEM_ID) return;
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

      // 路径绘制模式下：Esc 退出绘制（优先于取消选中）
      if (pathEditId && e.key === 'Escape') { e.preventDefault(); setPathEditId(null); return; }

      // 撤销/重做（全局）
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') || ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'z')) { e.preventDefault(); redo(); return; }
      // 复制（支持多选整组）
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd' && selectedIds.length) { e.preventDefault(); duplicateItems(selectedIds); return; }

      if (!selectedIds.length) return;

      // 删除（整组）
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeItems(selectedIds); return; }
      // Esc 取消选中
      if (e.key === 'Escape') { setSelectedIds([]); return; }

      const movableIds = selectedIds.filter(id => { const it = renderItems.find(i => i.id === id); return it && !it.locked; });
      if (!movableIds.length) return;
      const clamp = (v: number) => Math.max(-20, Math.min(120, v));
      const step = e.shiftKey ? 5 : 0.5;
      const nudge = (dx: number, dy: number) => {
        movableIds.forEach(id => { if (id === BASE_ITEM_ID) { const it = renderItems.find(i => i.id === id); if (it) updateItem(id, { cx: clamp(it.cx + dx), cy: clamp(it.cy + dy) }); } });
        const nonBase = new Set(movableIds.filter(id => id !== BASE_ITEM_ID));
        if (nonBase.size) setLayout(prev => ({ ...prev, items: prev.items.map(i => (nonBase.has(i.id) ? { ...i, cx: clamp(i.cx + dx), cy: clamp(i.cy + dy) } : i)) }));
      };
      if (e.key === 'ArrowUp')    { e.preventDefault(); nudge(0, -step); return; }
      if (e.key === 'ArrowDown')  { e.preventDefault(); nudge(0, step); return; }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); nudge(-step, 0); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); nudge(step, 0); return; }
      if (e.key === '[' || e.key === ']' || e.key === '-' || e.key === '=') {
        e.preventDefault();
        const grow = e.key === ']' || e.key === '=';
        movableIds.forEach(id => resizeItemBy(id, grow ? 1.08 : 0.92));
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedIds, renderItems, updateItem, removeItems, duplicateItems, resizeItemBy, undo, redo, pathEditId, setLayout]);

  // ── 工具栏操作 ───────────────────────────────────────────────────
  const onSave = () => {
    saveLayout(layout);
    const el = document.getElementById('save-indicator');
    if (el) { el.textContent = '已保存'; el.style.opacity = '1'; setTimeout(() => { if (el) el.style.opacity = '0'; }, 1400); }
  };
  const onSetAsDefault = () => {
    setLayoutAsDefault(layout);
    const el = document.getElementById('save-indicator');
    if (el) { el.textContent = '已设为默认'; el.style.opacity = '1'; setTimeout(() => { if (el) el.style.opacity = '0'; }, 1400); }
  };
  const onReset = async () => {
    const ok = await askConfirm(`确定将"${SCENE_NAMES[sceneId]}"恢复为默认布局？所有改动会清除。`, '恢复默认');
    if (!ok) return;
    const def = resetLayout(sceneId);
    setLayoutState(def);
    historyRef.current = { stack: [JSON.parse(JSON.stringify(def))], idx: 0, bypass: false };
    setSelectedIds([]);
    setHistoryTick(t => t + 1);
  };
  const onResetBundled = async () => {
    const ok = await askConfirm(`确定将"${SCENE_NAMES[sceneId]}"同步为代码内最新还原布局？这会清除当前布局和曾经设为默认的版本。`, '同步最新还原');
    if (!ok) return;
    const def = resetToBundledLayout(sceneId);
    setLayoutState(def);
    saveLayout(def);
    historyRef.current = { stack: [JSON.parse(JSON.stringify(def))], idx: 0, bypass: false };
    setSelectedIds([]);
    setHistoryTick(t => t + 1);
    const el = document.getElementById('save-indicator');
    if (el) { el.textContent = '已同步最新还原'; el.style.opacity = '1'; setTimeout(() => { if (el) el.style.opacity = '0'; }, 1400); }
  };
  const onExport = () => {
    const json = JSON.stringify(layout, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `digital-twin-${sceneId}-${stamp}.json`;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    const el = document.getElementById('save-indicator');
    if (el) { el.textContent = '已导出文件'; el.style.opacity = '1'; setTimeout(() => { if (el) el.style.opacity = '0'; }, 1200); }
  };
  const onRepairVisibility = () => {
    setLayout(prev => ({
      ...prev,
      items: prev.items.map(it => ({
        ...it,
        hidden: false,
        opacity: it.opacity == null ? 1 : (it.opacity < 0.15 ? 1 : it.opacity),
      })),
    }));
    const el = document.getElementById('save-indicator');
    if (el) { el.textContent = '已修复可见性'; el.style.opacity = '1'; setTimeout(() => { if (el) el.style.opacity = '0'; }, 1400); }
  };
  const onImportClick = () => importInputRef.current?.click();
  const onImportJsonFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as SceneLayout;
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.items)) {
        await showAlert('JSON 格式无效：缺少 items', '导入失败');
        return;
      }
      const next: SceneLayout = {
        sceneId,
        baseMap: typeof parsed.baseMap === 'string' ? parsed.baseMap : SCENE_DEFAULT_BG[sceneId],
        baseMapRotate: Number.isFinite(parsed.baseMapRotate as number) ? Number(parsed.baseMapRotate) : 0,
        baseMapScale: Number.isFinite(parsed.baseMapScale as number) ? Number(parsed.baseMapScale) : 1,
        baseMapOffsetX: Number.isFinite(parsed.baseMapOffsetX as number) ? Number(parsed.baseMapOffsetX) : 0,
        baseMapOffsetY: Number.isFinite(parsed.baseMapOffsetY as number) ? Number(parsed.baseMapOffsetY) : 0,
        cameraYaw: Number.isFinite(parsed.cameraYaw as number) ? Number(parsed.cameraYaw) : 0,
        cameraPitch: Number.isFinite(parsed.cameraPitch as number) ? Number(parsed.cameraPitch) : 0,
        cameraScale: Number.isFinite(parsed.cameraScale as number) ? Number(parsed.cameraScale) : 1,
        cameraPerspective: Number.isFinite(parsed.cameraPerspective as number) ? Number(parsed.cameraPerspective) : 1200,
        cameraOffsetX: Number.isFinite(parsed.cameraOffsetX as number) ? Number(parsed.cameraOffsetX) : 0,
        cameraOffsetY: Number.isFinite(parsed.cameraOffsetY as number) ? Number(parsed.cameraOffsetY) : 0,
        width: Number(parsed.width) > 0 ? Number(parsed.width) : layout.width,
        height: Number(parsed.height) > 0 ? Number(parsed.height) : layout.height,
        items: parsed.items.map((it, idx) => ({
          id: it.id || `import-${idx}-${Date.now().toString(36)}`,
          asset: it.asset,
          cx: Number(it.cx) || 0,
          cy: Number(it.cy) || 0,
          w: Math.max(2, Number(it.w) || 10),
          h: it.h == null ? undefined : Math.max(2, Number(it.h) || 2),
          lockAspect: it.lockAspect,
          sx: it.sx,
          sy: it.sy,
          rotate: it.rotate,
          yaw: it.yaw,
          pitch: it.pitch,
          opacity: it.opacity,
          hidden: it.hidden,
          locked: it.locked,
          filter: it.filter,
          label: it.label,
          zone: it.zone,
          drillTargets: Array.isArray(it.drillTargets) ? it.drillTargets : (it.zone ? [it.zone] : undefined),
          alarm: it.alarm,
          tone: it.tone,
          anchorBottom: it.anchorBottom,
          motion: normalizeMotionConfig(it.motion),
          zOffset: Number.isFinite(it.zOffset as number) ? Number(it.zOffset) : 0,
        })),
      };
      const ok = await askConfirm(`导入将覆盖当前场景「${SCENE_NAMES[sceneId]}」布局，是否继续？`, '确认导入');
      if (!ok) return;
      setLayoutState(next);
      saveLayout(next);
      historyRef.current = { stack: [JSON.parse(JSON.stringify(next))], idx: 0, bypass: false };
      setSelectedIds([]);
      setHistoryTick(t => t + 1);
      const el = document.getElementById('save-indicator');
      if (el) { el.textContent = '已导入'; el.style.opacity = '1'; setTimeout(() => { if (el) el.style.opacity = '0'; }, 1400); }
    } catch (error) {
      await showAlert(`导入失败：${(error as Error).message}`, '导入失败');
    }
  };

  const deleteCustomAsset = useCallback(async (key: string, filename?: string) => {
    if (!filename) return;
    const ok = await askConfirm('确定删除这个自定义素材？已放入画布的实例会保留配置，但素材文件删除后将无法渲染。', '删除素材');
    if (!ok) return;
    await fetch('/mock-api/delete-svg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename }),
    }).catch(() => {});
    removeCustomAsset(key);
    setAssetVersion(v => v + 1);
  }, []);

  // ── 鼠标变换（拖拽 / 旋转 / 缩放） ───────────────────────────────
  const onItemMouseDown = (e: React.MouseEvent, item: SceneItem) => {
    if (e.button !== 0) return; // 中键放行：交给画布平移
    e.preventDefault(); e.stopPropagation();
    // Shift / Ctrl / Cmd：加选/减选，不进入拖拽
    if (e.shiftKey || e.metaKey || e.ctrlKey) { toggleSelect(item.id); return; }
    // 点中已在多选集合内的项 → 整组拖拽；否则只选它
    const inSelection = selectedIds.includes(item.id);
    const groupIds = inSelection && selectedIds.length > 1 ? selectedIds.slice() : [item.id];
    if (!inSelection) selectOnly(item.id);
    if (item.locked) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    // 参与移动的成员（排除锁定项与底图）
    const moveItems = renderItems.filter(it => groupIds.includes(it.id) && !it.locked && it.id !== BASE_ITEM_ID);
    if (item.id === BASE_ITEM_ID) moveItems.push(item); // 底图单独可拖
    const moveSet = new Set(moveItems.map(it => it.id));
    // 对齐吸附目标：组外可见设备的中心 + 画布中心 50
    const snapX: number[] = [50];
    const snapY: number[] = [50];
    for (const other of renderItems) {
      if (moveSet.has(other.id) || other.id === BASE_ITEM_ID || other.hidden) continue;
      snapX.push(other.cx);
      snapY.push(other.cy);
    }
    dragRef.current = {
      id: item.id, startX: e.clientX, startY: e.clientY, cx: item.cx, cy: item.cy, rect, snapX, snapY,
      items: (moveSet.has(item.id) ? moveItems : [item, ...moveItems]).map(it => ({ id: it.id, cx: it.cx, cy: it.cy })),
    };
  };

  useEffect(() => {
    return () => {
      if (moveRafRef.current != null) cancelAnimationFrame(moveRafRef.current);
    };
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const mq = marqueeRef.current;
      if (mq) {
        if (!mq.moved && Math.hypot(e.clientX - mq.startX, e.clientY - mq.startY) < 3) return;
        mq.moved = true;
        const r = mq.rect;
        const x1 = Math.min(mq.startX, e.clientX), y1 = Math.min(mq.startY, e.clientY);
        const x2 = Math.max(mq.startX, e.clientX), y2 = Math.max(mq.startY, e.clientY);
        setMarquee({
          x: ((x1 - r.left) / r.width) * 100,
          y: ((y1 - r.top) / r.height) * 100,
          w: ((x2 - x1) / r.width) * 100,
          h: ((y2 - y1) / r.height) * 100,
        });
        return;
      }
      const pan = panRef.current;
      if (pan) {
        const dx = e.clientX - pan.startX;
        const dy = e.clientY - pan.startY;
        if (!pan.moved && Math.hypot(dx, dy) < 3) return;
        pan.moved = true;
        applyView(canvasZoomRef.current, pan.ox + dx, pan.oy + dy);
        return;
      }
      const pn = pathNodeDragRef.current;
      if (pn) {
        const np = clientToMotionPoint(e.clientX, e.clientY, pn.cx, pn.cy);
        setMotionPath(pn.id, pn.path.map((point, i) => (i === pn.index ? np : point)));
        return;
      }
      const p = pitchRef.current;
      if (p) {
        const dy = e.clientY - p.startY;
        let next = p.startPitch + dy * 0.6;
        while (next > 180) next -= 360;
        while (next < -180) next += 360;
        next = snapAngleDeg(next, e.altKey, e.shiftKey);
        queueItemPatch(p.id, { pitch: next });
        setDragHud(`X 俯仰  ${Math.round(next)}°`);
        return;
      }
      const y = yawRef.current;
      if (y) {
        const dx = e.clientX - y.startX;
        let next = y.startYaw + dx * 0.6;
        while (next > 180) next -= 360;
        while (next < -180) next += 360;
        next = snapAngleDeg(next, e.altKey, e.shiftKey);
        queueItemPatch(y.id, { yaw: next });
        setDragHud(`Y 水平  ${Math.round(next)}°`);
        return;
      }
      const rs = resizeRef.current;
      if (rs) {
        const dx = ((e.clientX - rs.startX) / rs.rect.width) * 100;
        const dy = ((e.clientY - rs.startY) / rs.rect.height) * 100;
        const signX = rs.corner.includes('e') ? 1 : -1;
        const signY = rs.corner.includes('s') ? 1 : -1;
        const speed = e.altKey ? 0.35 : (e.shiftKey ? 0.7 : 1.4);
        if (rs.aspect) {
          const change = Math.abs(dx) > Math.abs(dy) ? dx * signX : dy * signY;
          const nw = clampSize(rs.w + change * speed, rs.max);
          queueItemPatch(rs.id, { w: nw });
          setDragHud(`宽  ${nw.toFixed(1)}`);
        } else {
          // 角点：自由拉伸（同时改 w/h）
          // 边手柄：只改单维（由 corner 的 'n/s/e/w' 区分）
          if (rs.corner === 'e' || rs.corner === 'w') {
            const nw = clampSize(rs.w + dx * signX * speed, rs.max);
            queueItemPatch(rs.id, { w: nw });
            setDragHud(`宽  ${nw.toFixed(1)}`);
          } else if (rs.corner === 'n' || rs.corner === 's') {
            const baseH = rs.h ?? (rs.itemRect.height / rs.rect.height * 100);
            const nh = clampSize(baseH + dy * signY * speed, rs.max);
            queueItemPatch(rs.id, { h: nh });
            setDragHud(`高  ${nh.toFixed(1)}`);
          } else {
            const baseH = rs.h ?? (rs.itemRect.height / rs.rect.height * 100);
            const nw = clampSize(rs.w + dx * signX * speed, rs.max);
            const nh = clampSize(baseH + dy * signY * speed, rs.max);
            queueItemPatch(rs.id, { w: nw, h: nh });
            setDragHud(`${nw.toFixed(1)} × ${nh.toFixed(1)}`);
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
        next = snapAngleDeg(next, e.altKey, e.shiftKey);
        queueItemPatch(r.id, { rotate: next });
        setDragHud(`Z 旋转  ${Math.round(next)}°`);
        return;
      }
      const d = dragRef.current;
      if (!d) return;
      const dx = ((e.clientX - d.startX) / d.rect.width) * 100;
      const dy = ((e.clientY - d.startY) / d.rect.height) * 100;
      let ncx = Math.max(-20, Math.min(120, d.cx + dx));
      let ncy = Math.max(-20, Math.min(120, d.cy + dy));
      // 对齐吸附（按住 Alt 临时关闭）；按主选中项吸附，整组同步偏移
      if (!e.altKey) {
        const thX = (6 / d.rect.width) * 100;
        const thY = (6 / d.rect.height) * 100;
        let bestX: number | undefined, bestY: number | undefined, dXmin = thX, dYmin = thY;
        for (const tx of d.snapX) { const diff = Math.abs(ncx - tx); if (diff <= dXmin) { dXmin = diff; bestX = tx; } }
        for (const ty of d.snapY) { const diff = Math.abs(ncy - ty); if (diff <= dYmin) { dYmin = diff; bestY = ty; } }
        if (bestX != null) ncx = bestX;
        if (bestY != null) ncy = bestY;
        setSnapGuides(bestX != null || bestY != null ? { x: bestX, y: bestY } : null);
      } else {
        setSnapGuides(null);
      }
      if (d.items.length <= 1) {
        queueItemPatch(d.id, { cx: ncx, cy: ncy });
      } else {
        const adx = ncx - d.cx;
        const ady = ncy - d.cy;
        const updates = new Map<string, { cx: number; cy: number }>(d.items.map(it => [it.id, {
          cx: Math.max(-20, Math.min(120, it.cx + adx)),
          cy: Math.max(-20, Math.min(120, it.cy + ady)),
        }]));
        setLayout(prev => ({ ...prev, items: prev.items.map(i => (updates.has(i.id) ? { ...i, ...updates.get(i.id)! } : i)) }));
      }
    };
    const onUp = (e: MouseEvent) => {
      const mq = marqueeRef.current;
      if (mq) {
        if (mq.moved) {
          const r = mq.rect;
          const bx1 = ((Math.min(mq.startX, e.clientX) - r.left) / r.width) * 100;
          const bx2 = ((Math.max(mq.startX, e.clientX) - r.left) / r.width) * 100;
          const by1 = ((Math.min(mq.startY, e.clientY) - r.top) / r.height) * 100;
          const by2 = ((Math.max(mq.startY, e.clientY) - r.top) / r.height) * 100;
          const hit = renderItemsRef.current
            .filter(it => it.id !== BASE_ITEM_ID && !it.hidden && it.cx >= bx1 && it.cx <= bx2 && it.cy >= by1 && it.cy <= by2)
            .map(it => it.id);
          setSelectedIds(mq.additive ? Array.from(new Set([...mq.base, ...hit])) : hit);
          suppressClickRef.current = true; // 阻止随后的 click 清空选择
        }
        setMarquee(null);
        marqueeRef.current = null;
      }
      if (panRef.current?.moved) suppressClickRef.current = true;
      if (dragRef.current) setSnapGuides(null);
      if (rotateRef.current || yawRef.current || pitchRef.current || resizeRef.current) setDragHud(null);
      dragRef.current = null; rotateRef.current = null; resizeRef.current = null; yawRef.current = null; pitchRef.current = null; pathNodeDragRef.current = null; panRef.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [queueItemPatch, clientToMotionPoint, setMotionPath, applyView, setLayout]);

  // 空格键临时切换为平移模式（按住 + 左键拖拽 = 平移）
  useEffect(() => {
    const isTyping = () => {
      const el = document.activeElement as HTMLElement | null;
      return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
    };
    const kd = (e: KeyboardEvent) => { if (e.code === 'Space' && !isTyping()) spaceRef.current = true; };
    const ku = (e: KeyboardEvent) => { if (e.code === 'Space') spaceRef.current = false; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, []);

  const onItemWheel = (e: React.WheelEvent, item: SceneItem) => {
    if (item.locked || item.id !== selectedId || e.ctrlKey || e.metaKey) return;
    if (!e.altKey && !e.shiftKey) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.shiftKey) {
      const step = e.altKey ? 1 : 5;
      updateItem(item.id, { rotate: (item.rotate ?? 0) + (e.deltaY < 0 ? step : -step) });
      return;
    }
    const delta = e.deltaY < 0 ? 1.5 : -1.5;
    const max = item.id === BASE_ITEM_ID ? BASE_SIZE_MAX : ITEM_SIZE_MAX;
    updateItem(item.id, { w: clampSize(item.w + delta, max) });
  };

  // ── 画布视图（缩放 + 平移，缩放跟随光标） ─────────────────────────────
  const ZOOM_MIN = 0.3;
  const ZOOM_MAX = 4;
  const resetView = useCallback(() => applyView(1, 0, 0), [applyView]);
  // 围绕画布上的某个屏幕点缩放（fx/fy 为该点在画布盒子内的比例 0..1）
  const zoomAtFraction = useCallback((factor: number, fx: number, fy: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const z0 = canvasZoomRef.current;
    const z1 = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, +(z0 * factor).toFixed(3)));
    if (z1 === z0) return;
    const w0 = rect.width / z0;
    const h0 = rect.height / z0;
    const dtx = w0 * (z1 - z0) * (0.5 - fx);
    const dty = h0 * (z1 - z0) * (0.5 - fy);
    const p0 = canvasPanRef.current;
    applyView(z1, p0.x + dtx, p0.y + dty);
  }, [applyView]);
  const zoomAtCenter = useCallback((factor: number) => zoomAtFraction(factor, 0.5, 0.5), [zoomAtFraction]);

  const onCanvasWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    // 触控板 pinch 会带 ctrlKey，按更细的步进缩放；普通滚轮 1.1 倍
    const intensity = (e.ctrlKey || e.metaKey) ? 0.01 : 0.0018;
    const factor = Math.exp(-e.deltaY * intensity);
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    zoomAtFraction(factor, fx, fy);
  };

  // 画布空白处：左键拖拽=框选；中键 / 空格+左键=平移
  const onCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 && e.button !== 1) return;
    suppressClickRef.current = false; // 新一轮交互，清除上次平移遗留的抑制标记
    const isPan = e.button === 1 || (e.button === 0 && spaceRef.current);
    if (isPan) {
      e.preventDefault();
      panRef.current = { startX: e.clientX, startY: e.clientY, ox: canvasPanRef.current.x, oy: canvasPanRef.current.y, moved: false };
      return;
    }
    // 左键框选（Shift/Cmd/Ctrl 为追加框选）
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    marqueeRef.current = {
      startX: e.clientX, startY: e.clientY, rect,
      additive: e.shiftKey || e.metaKey || e.ctrlKey,
      base: e.shiftKey || e.metaKey || e.ctrlKey ? selectedIds.slice() : [],
      moved: false,
    };
  };

  const onResizeHandleDown = (e: React.MouseEvent, item: SceneItem, corner: string) => {
    e.preventDefault(); e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const itemRect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    const aspect = item.lockAspect !== false; // 默认锁比例
    resizeRef.current = { id: item.id, startX: e.clientX, startY: e.clientY, w: item.w, h: item.h, corner, rect, itemRect, aspect, max: item.id === BASE_ITEM_ID ? BASE_SIZE_MAX : ITEM_SIZE_MAX };
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
          {baseEditableItem && (
            <button className={btn + ' !h-6 !px-2 ml-1'} onClick={() => selectOnly(BASE_ITEM_ID)}>选中底图</button>
          )}

          <span className="mx-2 text-[#244871]">|</span>
          <button className={btn} onClick={undo} disabled={!canUndo} title="撤销 (Ctrl+Z)"><Undo2 size={11} /></button>
          <button className={btn} onClick={redo} disabled={!canRedo} title="重做 (Ctrl+Shift+Z / Ctrl+Y)"><Redo2 size={11} /></button>
        </div>
        <div className="flex items-center gap-1.5">
          <span id="save-indicator" className="mr-1 text-[11px] text-[#6ce09a] transition-opacity duration-300 opacity-0">已保存</span>
          <button className={btnPrimary} onClick={() => setUploadOpen(true)}><Upload size={11} />上传素材</button>
          <button className={btn} onClick={onImportClick}><Upload size={11} />导入 JSON</button>
          <button className={btn} onClick={onExport}><Copy size={11} />导出 JSON</button>
          <button className={btn} onClick={onRepairVisibility}>可见性修复</button>
          <button className={btn} onClick={onSetAsDefault}><Save size={11} />设为默认</button>
          <button className={btnDanger} onClick={onReset}><RotateCcw size={11} />恢复默认</button>
          <button className={btnDanger} onClick={onResetBundled}><RotateCcw size={11} />最新还原</button>
          <button className={btnPrimary} onClick={onSave}><Save size={11} />保存</button>
          <div className="ml-2 flex items-center gap-1 rounded border border-[#2b6aa8] bg-[#0d2e5b] px-1.5">
            <button className={iconBtn + ' !h-5 !w-5 !border-0 !bg-transparent'} onClick={() => zoomAtCenter(1 / 1.15)} title="画布缩小">-</button>
            <button className="w-12 text-center text-[10px] text-[#cfe9ff] hover:text-white" onClick={resetView} title="点击复位（100% 居中）">{Math.round(canvasZoom * 100)}%</button>
            <button className={iconBtn + ' !h-5 !w-5 !border-0 !bg-transparent'} onClick={() => zoomAtCenter(1.15)} title="画布放大">+</button>
          </div>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={onImportJsonFile}
          />
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
              {paletteGroups.map(g => {
                const groupCollapsed = collapsedPaletteGroups.includes(g.title);
                const availableItems = g.items.filter(it => allAssets[it.key]);
                return (
                  <div key={g.title} className="rounded border border-[#14365f] bg-[#071c37]/50">
                    <button
                      type="button"
                      onClick={() => togglePaletteGroup(g.title)}
                      className="flex h-7 w-full items-center justify-between px-1.5 text-left text-[10px] font-semibold tracking-wider text-[#79d0ff] hover:bg-[#103968]"
                      title={groupCollapsed ? '展开分组' : '折叠分组'}
                    >
                      <span className="truncate">{g.title}</span>
                      <span className="flex items-center gap-1 text-[#7e9fc8]">
                        <span>{availableItems.length}</span>
                        {groupCollapsed ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
                      </span>
                    </button>
                    {!groupCollapsed && (
                      <div className="grid grid-cols-2 gap-1.5 p-1.5 pt-0">
                        {availableItems.map(it => {
                          const a = allAssets[it.key];
                          return (
                            <div
                              key={it.key}
                              className="group relative"
                            >
                              <button
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
                                className="flex w-full flex-col items-center gap-0.5 rounded border border-[#244871] bg-[#081f3d] p-1 transition hover:border-[#4fc1ff] hover:bg-[#103968] active:cursor-grabbing"
                                title="点击放置中央 · 或拖拽到画布"
                              >
                                <div className="flex h-12 w-full items-center justify-center overflow-hidden">
                                  <img src={a.src} alt={it.name} className="max-h-full max-w-full object-contain" draggable={false} />
                                </div>
                                <span className="truncate text-[10px] text-[#a9c8ee]">{it.name}</span>
                              </button>
                              {it.custom && (
                                <button
                                  type="button"
                                  onClick={() => deleteCustomAsset(it.key, it.filename)}
                                  className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full border border-[#7a2e2e] bg-[#3a1414] text-[#ff8a7a] group-hover:flex"
                                  title="删除自定义素材"
                                >
                                  <X size={9} />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 中间画布 */}
        <div className="relative min-w-0 flex-1 overflow-hidden rounded border border-[#1b4378] bg-[#03132a]">
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              ref={canvasRef}
              className="relative overflow-visible"
              style={{ aspectRatio: `${layout.width} / ${layout.height}`, height: '100%', maxHeight: '100%', maxWidth: '100%', transform: `translate(${canvasPan.x}px, ${canvasPan.y}px) scale(${canvasZoom})`, transformOrigin: '50% 50%', cursor: 'default' }}
              onMouseDown={onCanvasMouseDown}
              onClick={() => { if (suppressClickRef.current) { suppressClickRef.current = false; return; } setSelectedIds([]); }}
              onWheel={onCanvasWheel}
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
                if (!assetKey || !getAsset(assetKey)) return;
                const rect = canvasRef.current!.getBoundingClientRect();
                const cx = ((e.clientX - rect.left) / rect.width) * 100;
                const cy = ((e.clientY - rect.top) / rect.height) * 100;
                addItemAt(assetKey, name, +cx.toFixed(1), +cy.toFixed(1));
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  isolation: 'isolate',
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    transform: `translate(${layout.cameraOffsetX ?? 0}%, ${layout.cameraOffsetY ?? 0}%) scale(${layout.cameraScale ?? 1})`,
                    transformOrigin: '50% 50%',
                    willChange: 'transform',
                  }}
                >
                  {/* 底图层（仅视觉） */}
                  <div className="pointer-events-none absolute inset-0" style={{ zIndex: 1 }}>
                    {!baseSrc && (
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0b2a55_0%,#061a36_60%,#020a18_100%)]" />
                    )}
                    {baseSrc && (
                      <div
                        className="absolute inset-0"
                        style={{
                          transform: `translate(${layout.baseMapOffsetX ?? 0}%, ${layout.baseMapOffsetY ?? 0}%) rotate(${layout.baseMapRotate ?? 0}deg) scale(${layout.baseMapScale ?? 1})`,
                          transformOrigin: '50% 50%',
                          willChange: 'transform',
                        }}
                      >
                        <img src={baseSrc} alt="底图" draggable={false} className="h-full w-full select-none object-contain" />
                      </div>
                    )}
                    <div className="absolute inset-0" style={{
                      backgroundImage: 'linear-gradient(rgba(63,134,200,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(63,134,200,0.07) 1px,transparent 1px)',
                      backgroundSize: '5% 5%',
                      zIndex: 2,
                    }} />
                  </div>

                  {/* 设施层（可交互） */}
                  <div className="absolute inset-0" style={{ zIndex: 10 }}>
                    <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ zIndex: 2 }}>
                      {renderItems.filter(item => item.id !== BASE_ITEM_ID && (isMotionRobotItem(item) || item.motion?.path?.length)).map(item => (
                        getMotionTrackPoints(item) ? (
                          <polyline
                            key={`${item.id}-motion-track`}
                            points={getMotionTrackPoints(item)}
                            fill="none"
                            stroke="rgba(79,193,255,0.72)"
                            strokeWidth="0.24"
                            strokeDasharray="1.2 0.8"
                            vectorEffect="non-scaling-stroke"
                          />
                        ) : null
                      ))}
                    </svg>

                  {renderItems.map((item, idx) => {
                const a = item.id === BASE_ITEM_ID
                  ? (baseSrc ? { src: baseSrc, w: layout.width, h: layout.height } : undefined)
                  : getAsset(item.asset);
                const missingAsset = item.id !== BASE_ITEM_ID && !a;
                const assetSize = a ?? { src: '', w: 512, h: 512 };
                const isSel = selectedIds.includes(item.id);
                const isPrimary = isSel && item.id === selectedId && selectedIds.length === 1;
                if (item.id === BASE_ITEM_ID && !isSel) return null;
                const isHidden = item.hidden;
                const isLocked = item.locked;
                const baseTransform = `translate(-50%, ${item.anchorBottom !== false ? '-100%' : '-50%'}) rotate(${item.rotate ?? 0}deg)`;
                const isRoamingRobot = item.id !== BASE_ITEM_ID && isMotionRobotItem(item);
                const robotPoint = isRoamingRobot ? getRobotMotionPoint(item, motionTime) : { x: item.cx, y: item.cy };
                return (
                  <div
                    key={item.id}
                    onMouseDown={e => onItemMouseDown(e, item)}
                    onWheel={e => onItemWheel(e, item)}
                    onClick={e => e.stopPropagation()}
                    className={`absolute select-none ${isLocked ? 'cursor-not-allowed' : 'cursor-move'} ${item.id === BASE_ITEM_ID ? 'bg-transparent' : ''}`}
                    style={{
                      left: `${robotPoint.x}%`,
                      top: `${robotPoint.y}%`,
                      width: `${item.w}%`,
                      ...(item.h != null ? { height: `${item.h}%` } : { aspectRatio: `${assetSize.w} / ${assetSize.h}` }),
                      transform: baseTransform,
                      transformOrigin: item.anchorBottom !== false ? '50% 100%' : '50% 50%',
                      willChange: 'transform',
                      zIndex: 10 + idx + (isSel ? 1000 : 0),
                      outline: isSel ? '2px solid #ffb672' : (isLocked ? '1px solid rgba(255,180,114,0.5)' : '1px dashed rgba(79,193,255,0.35)'),
                      outlineOffset: 2,
                      opacity: isHidden ? 0.25 : (item.id === BASE_ITEM_ID ? 1 : Math.max(0.12, item.opacity ?? 1)),
                      pointerEvents: item.id === BASE_ITEM_ID && !isSel ? 'none' : 'auto',
                    }}
                    title={item.label || item.asset}
                  >
                    {item.id !== BASE_ITEM_ID && (
                      missingAsset ? (
                        <div
                          className="pointer-events-none flex h-full w-full items-center justify-center rounded border-2 border-dashed border-[#ef5a4a] bg-[#3a1414]/65 text-[10px] font-semibold text-[#ffd8d3]"
                          style={{ transform: `scale(${item.sx ?? 1}, ${item.sy ?? 1})` }}
                        >
                          素材缺失
                        </div>
                      ) : (
                        <img
                          src={assetSize.src} alt="" draggable={false}
                          className="pointer-events-none h-full w-full select-none object-contain"
                          style={{
                            transform: `scale(${item.sx ?? 1}, ${item.sy ?? 1})`,
                            filter: [
                              item.filter,
                              (item.zOffset ?? 0) > 0
                                ? `drop-shadow(0 ${Math.min(20, (item.zOffset ?? 0) * 0.2)}px ${Math.min(30, (item.zOffset ?? 0) * 0.25)}px rgba(0,0,0,0.35))`
                                : undefined,
                            ].filter(Boolean).join(' ') || undefined,
                          }}
                        />
                      )
                    )}

                    {/* 隐藏/锁定角标 */}
                    {(isHidden || isLocked) && (
                      <div className="pointer-events-none absolute top-0 left-0 flex gap-0.5 p-0.5">
                        {isHidden && <EyeOff size={10} className="text-[#7e9fc8]" />}
                        {isLocked && <Lock size={10} className="text-[#ffb672]" />}
                      </div>
                    )}

                    {isPrimary && (
                      <>
                        <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded bg-[#0a2547]/95 px-1.5 py-0.5 text-[10px] font-mono text-[#ffb672] whitespace-nowrap">
                          {item.label || item.asset} · ({item.cx.toFixed(1)},{item.cy.toFixed(1)}) · w{item.w.toFixed(1)}{item.h != null ? `×h${item.h.toFixed(1)}` : ''}
                          <span className="ml-1 text-[#ffb672]">Z{Math.round(((item.rotate ?? 0) + 360) % 360)}°</span>
                          <span className="ml-1 text-[#6ce09a]">Y{Math.round(((item.yaw ?? 0) + 360) % 360)}°</span>
                          <span className="ml-1 text-[#4fc1ff]">X{Math.round(((item.pitch ?? 0) + 360) % 360)}°</span>
                        </div>

                        {dragHud && (
                          <div className="pointer-events-none absolute left-1/2 top-1/2 z-[20] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border border-[#4fc1ff] bg-[#041326]/95 px-2.5 py-1 font-mono text-[13px] font-bold tracking-wide text-[#eaf6ff] shadow-[0_0_16px_rgba(79,193,255,0.65)]">
                            {dragHud}
                          </div>
                        )}

                        {!isLocked && (
                          <>
                            {/* Z 轴旋转手柄（屏幕平面旋转） */}
                            <div className="pointer-events-none absolute left-1/2 -top-5 -translate-x-1/2" style={{ width: 1, height: 20, background: '#ffb672' }} />
                            <div onMouseDown={e => onRotateHandleDown(e, item, (e.currentTarget.parentElement as HTMLElement))} onClick={e => e.stopPropagation()}
                              title="Z 轴旋转（屏幕平面）· 拖拽旋转 · Shift 锁定 15° · Alt 自由"
                              className="absolute left-1/2 -top-10 flex h-7 w-7 -translate-x-1/2 cursor-grab items-center justify-center rounded-full border-2 border-[#ffb672] bg-[#3a2c0d] text-[12px] font-bold text-[#fff0d4] shadow-[0_0_8px_rgba(255,182,114,0.6)] active:cursor-grabbing hover:bg-[#5a4214]">
                              Z
                            </div>

                            {/* Y 轴（水平朝向） */}
                            <div className="pointer-events-none absolute top-1/2 -right-5 -translate-y-1/2" style={{ height: 1, width: 20, background: '#6ce09a' }} />
                            <div onMouseDown={e => onYawHandleDown(e, item)} onClick={e => e.stopPropagation()}
                              title="Y 轴水平朝向 · 左右拖拽 · Shift 锁定 15° · Alt 自由"
                              className="absolute top-1/2 -right-10 flex h-7 w-7 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border-2 border-[#6ce09a] bg-[#0d3a26] text-[12px] font-bold text-[#cfeedf] shadow-[0_0_8px_rgba(108,224,154,0.55)] active:cursor-grabbing hover:bg-[#155538]">
                              Y
                            </div>

                            {/* X 轴（俯仰） */}
                            <div className="pointer-events-none absolute left-1/2 -bottom-5 -translate-x-1/2" style={{ width: 1, height: 20, background: '#4fc1ff' }} />
                            <div onMouseDown={e => onPitchHandleDown(e, item)} onClick={e => e.stopPropagation()}
                              title="X 轴俯仰 · 上下拖拽 · Shift 锁定 15° · Alt 自由"
                              className="absolute left-1/2 -bottom-10 flex h-7 w-7 -translate-x-1/2 cursor-ns-resize items-center justify-center rounded-full border-2 border-[#4fc1ff] bg-[#0a2f63] text-[12px] font-bold text-[#cfe9ff] shadow-[0_0_8px_rgba(79,193,255,0.55)] active:cursor-grabbing hover:bg-[#13427d]">
                              X
                            </div>

                            {/* 4 角缩放手柄（按比例） */}
                            {[
                              { c: 'nw', top: -9, left: -9, cursor: 'nwse-resize' },
                              { c: 'ne', top: -9, right: -9, cursor: 'nesw-resize' },
                              { c: 'sw', bottom: -9, left: -9, cursor: 'nesw-resize' },
                              { c: 'se', bottom: -9, right: -9, cursor: 'nwse-resize' },
                            ].map(h => (
                              <div key={h.c} onMouseDown={e => onResizeHandleDown(e, item, h.c)} onClick={e => e.stopPropagation()}
                                title={item.lockAspect !== false ? '按比例缩放 · Shift/Alt 精细调整' : '自由拉伸 · Shift/Alt 精细调整'}
                                className="absolute h-[18px] w-[18px] rounded-[3px] border-2 border-white bg-[#ffb672] shadow-[0_0_10px_rgba(255,182,114,0.85)] transition-transform hover:scale-125"
                                style={{ top: h.top, bottom: h.bottom, left: h.left, right: h.right, cursor: h.cursor, zIndex: 8 }}
                              />
                            ))}

                            {/* 4 边手柄：仅在解锁宽高比时显示，调单维 */}
                            {item.lockAspect === false && (['n', 's', 'e', 'w'] as const).map(c => {
                              const horiz = c === 'e' || c === 'w';
                              const pos: React.CSSProperties = horiz
                                ? { top: '50%', [c === 'e' ? 'right' : 'left']: -8, transform: 'translateY(-50%)' }
                                : { left: '50%', [c === 's' ? 'bottom' : 'top']: -8, transform: 'translateX(-50%)' };
                              return (
                                <div key={c} onMouseDown={e => onResizeHandleDown(e, item, c)} onClick={e => e.stopPropagation()}
                                  title="单维拉伸 · Shift/Alt 精细调整"
                                  className={`absolute rounded border-2 border-white bg-[#79d0ff] shadow-[0_0_10px_rgba(79,193,255,0.85)] hover:scale-110 ${horiz ? 'h-10 w-4' : 'h-4 w-10'}`}
                                  style={{ ...pos, cursor: horiz ? 'ew-resize' : 'ns-resize', zIndex: 8 }}
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

                  {/* 运动轨迹绘制层：点击空白加点、拖拽圆点移动、双击删除 */}
                  {pathEditItem && (() => {
                    const editPath = getEditablePath(pathEditItem);
                    const ax = pathEditItem.cx;
                    const ay = pathEditItem.cy;
                    return (
                      <svg
                        className="absolute inset-0 h-full w-full overflow-visible"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        style={{ zIndex: 60 }}
                        onClick={e => e.stopPropagation()}
                      >
                        {/* 空白捕获层：点击追加一个新点 */}
                        <rect
                          x={0} y={0} width={100} height={100} fill="transparent"
                          style={{ cursor: 'crosshair' }}
                          onMouseDown={e => {
                            if (e.button !== 0) return; // 中键/右键放行用于平移
                            e.preventDefault(); e.stopPropagation();
                            const np = clientToMotionPoint(e.clientX, e.clientY, ax, ay);
                            setMotionPath(pathEditItem.id, [...editPath, np]);
                          }}
                        />
                        {editPath.length > 1 && (
                          <polyline
                            points={editPath.map(p => `${ax + p.x},${ay + p.y}`).join(' ')}
                            fill="none" stroke="#ffb672" strokeWidth="0.34" strokeDasharray="1.4 0.9"
                            vectorEffect="non-scaling-stroke" pointerEvents="none"
                          />
                        )}
                        {/* 线段命中区：在两点之间点击插入新点 */}
                        {editPath.length > 1 && editPath.map((p, i) => {
                          const loop = pathEditItem.motion?.loop ?? true;
                          if (i === editPath.length - 1 && !loop) return null;
                          const next = editPath[(i + 1) % editPath.length];
                          return (
                            <line
                              key={`seg-${i}`}
                              x1={ax + p.x} y1={ay + p.y} x2={ax + next.x} y2={ay + next.y}
                              stroke="transparent" strokeWidth="2.4" vectorEffect="non-scaling-stroke"
                              style={{ cursor: 'copy' }}
                              onMouseDown={e => {
                                if (e.button !== 0) return;
                                e.preventDefault(); e.stopPropagation();
                                const np = clientToMotionPoint(e.clientX, e.clientY, ax, ay);
                                const nextPath = [...editPath];
                                nextPath.splice(i + 1, 0, np);
                                setMotionPath(pathEditItem.id, nextPath);
                                pathNodeDragRef.current = { id: pathEditItem.id, index: i + 1, cx: ax, cy: ay, path: nextPath };
                              }}
                            />
                          );
                        })}
                        {editPath.map((p, i) => {
                          const x = ax + p.x;
                          const y = ay + p.y;
                          return (
                            <g key={i}>
                              <circle
                                cx={x} cy={y} r={1.5}
                                fill={i === 0 ? '#1c5e3a' : '#0a2f63'}
                                stroke={i === 0 ? '#6ce09a' : '#ffb672'} strokeWidth="0.5"
                                vectorEffect="non-scaling-stroke"
                                style={{ cursor: 'grab' }}
                                onMouseDown={e => {
                                  if (e.button !== 0) return;
                                  e.preventDefault(); e.stopPropagation();
                                  pathNodeDragRef.current = { id: pathEditItem.id, index: i, cx: ax, cy: ay, path: editPath };
                                }}
                                onDoubleClick={e => {
                                  e.preventDefault(); e.stopPropagation();
                                  setMotionPath(pathEditItem.id, editPath.filter((_, idx) => idx !== i));
                                }}
                              >
                                <title>{`第 ${i + 1} 点 · 拖拽移动 · 双击删除`}</title>
                              </circle>
                            </g>
                          );
                        })}
                      </svg>
                    );
                  })()}

                  {/* 框选矩形 */}
                  {marquee && (
                    <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ zIndex: 72 }}>
                      <rect x={marquee.x} y={marquee.y} width={marquee.w} height={marquee.h} fill="rgba(79,193,255,0.12)" stroke="#4fc1ff" strokeWidth="0.16" strokeDasharray="0.8 0.5" vectorEffect="non-scaling-stroke" />
                    </svg>
                  )}

                  {/* 对齐参考线 */}
                  {snapGuides && (snapGuides.x != null || snapGuides.y != null) && (
                    <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ zIndex: 70 }}>
                      {snapGuides.x != null && (
                        <line x1={snapGuides.x} y1={-20} x2={snapGuides.x} y2={120} stroke="#ff5cf0" strokeWidth="0.18" strokeDasharray="0.8 0.6" vectorEffect="non-scaling-stroke" />
                      )}
                      {snapGuides.y != null && (
                        <line x1={-20} y1={snapGuides.y} x2={120} y2={snapGuides.y} stroke="#ff5cf0" strokeWidth="0.18" strokeDasharray="0.8 0.6" vectorEffect="non-scaling-stroke" />
                      )}
                    </svg>
                  )}
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* 画布提示 */}
          <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-[#0a2547]/85 px-2 py-1 text-[10px] leading-relaxed text-[#7e9fc8]">
            素材库拖入 / 点选 · 拖拽移动（<span className="text-[#ff8fe0]">自动对齐吸附</span>，按 Alt 关闭）· <span className="text-[#ffb672]">4 角 ⬚</span>缩放 · <span className="text-[#79d0ff]">4 边 ▭</span>单维拉伸（需关锁定）<br />
            画布：<span className="text-[#9fe0ff]">滚轮缩放（跟随光标）</span> · 空白处拖拽<span className="text-[#9fe0ff]">框选</span> · 中键 / 空格+拖拽<span className="text-[#9fe0ff]">平移</span> · 点缩放比例<span className="text-[#9fe0ff]">复位</span><br />
            多选：框选 / <span className="text-[#9fe0ff]">Shift·⌘ 点击</span>加减选 · 拖任一选中项整组移动 · 右侧面板可对齐/分布<br />
            旋转手柄：<span className="text-[#ffb672]">Z</span> 平面 · <span className="text-[#6ce09a]">Y</span> 水平 · <span className="text-[#4fc1ff]">X</span> 俯仰 · 拖拽时<span className="text-[#9fe0ff]">实时显示角度</span> · Shift 锁 15° · Alt 自由<br />
            快捷键：方向键移动 · Shift+方向 5% · Delete 删除 · Esc 取消 · Ctrl+D 复制 · Ctrl+Z/Y 撤销/重做 · 自动保存
          </div>
        </div>

        {/* 右侧：列表 + 属性 */}
        <div className="flex w-[300px] shrink-0 flex-col gap-1.5 rounded border border-[#1b4378] bg-[#0a2547] p-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#79d0ff]">设施列表 ({renderItems.length})</span>
            {selected && <span className="text-[10px] text-[#7e9fc8]">Ctrl+D 复制 · Del 删除</span>}
          </div>
          <div className="max-h-[28vh] space-y-0.5 overflow-auto custom-scrollbar pr-0.5">
            {renderItems.map((it, idx) => {
              const isSel = selectedIds.includes(it.id);
              return (
                <div key={it.id} onClick={e => { if (e.shiftKey || e.metaKey || e.ctrlKey) toggleSelect(it.id); else selectOnly(it.id); }}
                  className={`flex cursor-pointer items-center gap-1 rounded px-1.5 py-1 text-[11px] ${isSel ? 'border border-[#ffb672] bg-[#3a2c0d]/40 text-[#fff0d4]' : 'border border-[#244871] bg-[#081f3d] text-[#a9c8ee] hover:bg-[#103968]'}`}>
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#0d2e5b] text-[9px]">{idx + 1}</span>
                  <span className="flex-1 truncate" style={it.hidden ? { opacity: 0.5 } : undefined}>{it.label || it.asset}</span>
                  <button title={it.hidden ? '显示' : '隐藏'} onClick={e => { e.stopPropagation(); if (it.id !== BASE_ITEM_ID) updateItem(it.id, { hidden: !it.hidden }); }} className="text-[#7e9fc8] hover:text-[#cfe9ff]">
                    {it.hidden ? <EyeOff size={10} /> : <Eye size={10} />}
                  </button>
                  <button title={it.locked ? '解锁' : '锁定'} onClick={e => { e.stopPropagation(); if (it.id !== BASE_ITEM_ID) updateItem(it.id, { locked: !it.locked }); }} className="text-[#7e9fc8] hover:text-[#cfe9ff]">
                    {it.locked ? <Lock size={10} className="text-[#ffb672]" /> : <Unlock size={10} />}
                  </button>
                </div>
              );
            })}
            {renderItems.length === 0 && (
              <div className="rounded border border-dashed border-[#244871] py-3 text-center text-[10px] text-[#7e9fc8]">从左侧素材库点击或拖入</div>
            )}
          </div>

          {/* 属性 */}
          <div className="mt-1 flex-1 overflow-auto border-t border-[#1b4378] pt-2 text-[11px] custom-scrollbar pr-0.5">
            <div className="mb-2 space-y-1.5 rounded border border-[#244871] bg-[#081f3d] p-2">
              <Row label="相机 Y 偏航">
                <div className="flex items-center gap-1.5">
                  <input type="range" min={-180} max={180} step={1} value={layout.cameraYaw ?? 0}
                    onChange={e => setLayout(prev => ({ ...prev, cameraYaw: +e.target.value }))} className="flex-1 accent-[#6ce09a]" />
                  <NumInput value={layout.cameraYaw ?? 0} onChange={v => setLayout(prev => ({ ...prev, cameraYaw: v }))} step={5} />
                </div>
              </Row>
              <Row label="相机 X 俯仰">
                <div className="flex items-center gap-1.5">
                  <input type="range" min={-80} max={80} step={1} value={layout.cameraPitch ?? 0}
                    onChange={e => setLayout(prev => ({ ...prev, cameraPitch: +e.target.value }))} className="flex-1 accent-[#4fc1ff]" />
                  <NumInput value={layout.cameraPitch ?? 0} onChange={v => setLayout(prev => ({ ...prev, cameraPitch: v }))} step={2} />
                </div>
              </Row>
              <Row label="相机缩放">
                <div className="flex items-center gap-1.5">
                  <input type="range" min={0.4} max={2} step={0.01} value={layout.cameraScale ?? 1}
                    onChange={e => setLayout(prev => ({ ...prev, cameraScale: +e.target.value }))} className="flex-1 accent-[#ffb672]" />
                  <NumInput value={layout.cameraScale ?? 1} onChange={v => setLayout(prev => ({ ...prev, cameraScale: v }))} step={0.05} />
                </div>
              </Row>
              <Row label="透视距离">
                <div className="flex items-center gap-1.5">
                  <input type="range" min={400} max={2400} step={10} value={layout.cameraPerspective ?? 1200}
                    onChange={e => setLayout(prev => ({ ...prev, cameraPerspective: +e.target.value }))} className="flex-1 accent-[#79d0ff]" />
                  <NumInput value={layout.cameraPerspective ?? 1200} onChange={v => setLayout(prev => ({ ...prev, cameraPerspective: v }))} step={50} />
                </div>
              </Row>
            </div>
            {selectedIds.length > 1 ? (
              <div className="space-y-2">
                <div className="rounded border border-[#ffb672]/50 bg-[#3a2c0d]/30 px-2 py-1.5 text-[11px] text-[#fff0d4]">已选中 <b>{selectedIds.length}</b> 项 · 拖动其中任意一个可整组移动</div>
                <div className="text-[10px] text-[#7e9fc8]">水平对齐（按中心）</div>
                <div className="grid grid-cols-3 gap-1">
                  <button className={btn + ' justify-center'} onClick={() => alignSelected('x', 'min')}>左</button>
                  <button className={btn + ' justify-center'} onClick={() => alignSelected('x', 'center')}>水平居中</button>
                  <button className={btn + ' justify-center'} onClick={() => alignSelected('x', 'max')}>右</button>
                </div>
                <div className="text-[10px] text-[#7e9fc8]">垂直对齐（按中心）</div>
                <div className="grid grid-cols-3 gap-1">
                  <button className={btn + ' justify-center'} onClick={() => alignSelected('y', 'min')}>顶</button>
                  <button className={btn + ' justify-center'} onClick={() => alignSelected('y', 'center')}>垂直居中</button>
                  <button className={btn + ' justify-center'} onClick={() => alignSelected('y', 'max')}>底</button>
                </div>
                <div className="text-[10px] text-[#7e9fc8]">等距分布（需 ≥3 项）</div>
                <div className="grid grid-cols-2 gap-1">
                  <button className={btn + ' justify-center'} onClick={() => distributeSelected('x')}>水平等距</button>
                  <button className={btn + ' justify-center'} onClick={() => distributeSelected('y')}>垂直等距</button>
                </div>
                <div className="flex gap-1 pt-1">
                  <button className={btn + ' flex-1 justify-center'} onClick={() => duplicateItems(selectedIds)}><Copy size={11} />复制整组</button>
                  <button className={btnDanger + ' flex-1 justify-center'} onClick={() => removeItems(selectedIds)}><Trash2 size={11} />删除整组</button>
                </div>
                <div className="text-[10px] leading-4 text-[#7e9fc8]">框选：空白处左键拖拽 · Shift/⌘ 点击加/减选 · 方向键整组移动 · Esc 取消选择</div>
              </div>
            ) : selected ? (
              isBaseSelected ? (
                <div className="space-y-1.5">
                  <div className="rounded border border-[#244871] bg-[#081f3d] px-2 py-1 text-[10px] text-[#79d0ff]">底图（复用同一套拖拽/旋转/缩放）</div>
                  <Row label="底图路径">
                    <input type="text" className="input" value={layout.baseMap ?? SCENE_DEFAULT_BG[sceneId] ?? ''} onChange={e => setLayout(prev => ({ ...prev, baseMap: e.target.value || undefined }))} />
                  </Row>
                  <Row label="位置">
                    <div className="flex gap-1.5">
                      <NumInput value={selected.cx} onChange={v => updateItem(BASE_ITEM_ID, { cx: v })} step={0.5} />
                      <NumInput value={selected.cy} onChange={v => updateItem(BASE_ITEM_ID, { cy: v })} step={0.5} />
                    </div>
                  </Row>
                  <Row label="尺寸">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="range"
                          min={10}
                          max={BASE_SIZE_MAX}
                          step={1}
                          value={selected.w}
                          onChange={e => updateItem(BASE_ITEM_ID, { w: +e.target.value })}
                          className="flex-1 accent-[#ffb672]"
                        />
                        <NumInput value={selected.w} onChange={v => updateItem(BASE_ITEM_ID, { w: clampSize(v, BASE_SIZE_MAX) })} step={1} min={5} max={BASE_SIZE_MAX} />
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {[0.9, 0.96, 1.04, 1.1].map(f => (
                          <button key={f} className={btn + ' !h-6 justify-center !px-1'} onClick={() => resizeItemBy(BASE_ITEM_ID, f)}>
                            {f < 1 ? '-' : '+'}{Math.round(Math.abs(1 - f) * 100)}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </Row>
                  <Row label="Z 旋转">
                    <div className="flex items-center gap-1.5">
                      <input type="range" min={-180} max={180} step={1} value={selected.rotate ?? 0}
                        onChange={e => updateItem(BASE_ITEM_ID, { rotate: +e.target.value })} className="flex-1 accent-[#ffb672]" />
                      <NumInput value={selected.rotate ?? 0} onChange={v => updateItem(BASE_ITEM_ID, { rotate: v })} step={5} />
                    </div>
                  </Row>
                </div>
              ) : (
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
                  <button
                    className={iconBtn + ((selected.sx ?? 1) === -1 ? ' !border-[#6ce09a] !text-[#6ce09a]' : '')}
                    onClick={() => updateItem(selected.id, { sx: (selected.sx ?? 1) === -1 ? 1 : -1 })}
                    title="水平翻转"
                  >
                    <FlipHorizontal2 size={11} />
                  </button>
                  <button
                    className={iconBtn + ((selected.sy ?? 1) === -1 ? ' !border-[#4fc1ff] !text-[#4fc1ff]' : '')}
                    onClick={() => updateItem(selected.id, { sy: (selected.sy ?? 1) === -1 ? 1 : -1 })}
                    title="垂直翻转"
                  >
                    <FlipVertical2 size={11} />
                  </button>
                </div>

                <Section title="常用项" open={openSections.common} onToggle={() => toggleSection('common')}>
                <Row label="资源">
                  <select value={selected.asset} onChange={e => updateItem(selected.id, { asset: e.target.value as AssetKey })} className="input">
                    {Object.keys(allAssets).map(k => <option key={k} value={k}>{k}</option>)}
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
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 text-[10px] text-[#7e9fc8]">宽</span>
                      <input
                        type="range"
                        min={ITEM_SIZE_MIN}
                        max={ITEM_SIZE_MAX}
                        step={0.5}
                        value={selected.w}
                        onChange={e => updateItem(selected.id, { w: +e.target.value })}
                        className="flex-1 accent-[#ffb672]"
                      />
                      <NumInput value={selected.w} onChange={v => updateItem(selected.id, { w: clampSize(v) })} step={0.5} min={ITEM_SIZE_MIN} max={ITEM_SIZE_MAX} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 text-[10px] text-[#7e9fc8]">高</span>
                      <input
                        type="range"
                        min={ITEM_SIZE_MIN}
                        max={ITEM_SIZE_MAX}
                        step={0.5}
                        disabled={selected.lockAspect !== false}
                        value={selected.h ?? (() => {
                          const a = getAsset(selected.asset);
                          return a ? +((a.h / a.w) * selected.w).toFixed(1) : selected.w;
                        })()}
                        onChange={e => updateItem(selected.id, { h: +e.target.value })}
                        className="flex-1 accent-[#79d0ff] disabled:opacity-40"
                      />
                      <NumInput
                        value={selected.h ?? (() => {
                          const a = getAsset(selected.asset);
                          return a ? +((a.h / a.w) * selected.w).toFixed(1) : selected.w;
                        })()}
                        onChange={v => updateItem(selected.id, { h: clampSize(v), lockAspect: false })}
                        step={0.5} min={ITEM_SIZE_MIN} max={ITEM_SIZE_MAX}
                      />
                      <button
                        className={iconBtn + (selected.lockAspect !== false ? ' !text-[#ffb672] !border-[#ffb672]' : '')}
                        onClick={() => updateItem(selected.id, { lockAspect: !(selected.lockAspect !== false), h: (selected.lockAspect !== false) ? selected.h : undefined })}
                        title={(selected.lockAspect !== false) ? '已锁定宽高比（点击解锁可独立拉伸）' : '宽高独立（点击锁定回比例）'}
                      >
                        <Link2 size={11} />
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {[0.85, 0.95, 1.05, 1.15].map(f => (
                        <button key={f} className={btn + ' !h-6 justify-center !px-1'} onClick={() => resizeItemBy(selected.id, f)}>
                          {f < 1 ? '-' : '+'}{Math.round(Math.abs(1 - f) * 100)}%
                        </button>
                      ))}
                    </div>
                  </div>
                </Row>
                <Row label="透明度">
                  <div className="flex items-center gap-1.5">
                    <input type="range" min={0.12} max={1} step={0.05} value={Math.max(0.12, selected.opacity ?? 1)}
                      onChange={e => updateItem(selected.id, { opacity: +e.target.value })}
                      className="flex-1 accent-[#79d0ff]" />
                    <span className="w-10 text-right font-mono text-[10px] text-[#cfe9ff]">{Math.round(Math.max(0.12, selected.opacity ?? 1) * 100)}%</span>
                  </div>
                </Row>
                </Section>

                <Section title="旋转 / 深度" open={openSections.transform} onToggle={() => toggleSection('transform')}>
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
                <Row label="深度 Z">
                  <div className="flex items-center gap-1.5">
                    <input type="range" min={-200} max={400} step={1} value={selected.zOffset ?? 0}
                      onChange={e => updateItem(selected.id, { zOffset: +e.target.value })} className="flex-1 accent-[#79d0ff]" />
                    <NumInput value={selected.zOffset ?? 0} onChange={v => updateItem(selected.id, { zOffset: v })} step={5} />
                  </div>
                </Row>
                <Row label="底部锚点">
                  <input type="checkbox" checked={selected.anchorBottom !== false} onChange={e => updateItem(selected.id, { anchorBottom: e.target.checked })} className="h-4 w-4 accent-[#4fc1ff]" />
                </Row>
                </Section>

                <Section title="交互 / 状态" open={openSections.interaction} onToggle={() => toggleSection('interaction')}>
                <Row label="点击下钻">
                  <DrillTargetTree
                    value={selected.drillTargets ?? (selected.zone ? [selected.zone] : [])}
                    onChange={(targets) => {
                      const nextZone = targets.find(t => AREA_DRILL_KEYS.has(t));
                      updateItem(selected.id, {
                        drillTargets: targets.length ? targets : undefined,
                        zone: nextZone,
                      });
                    }}
                  />
                </Row>
                <Row label="状态">
                  <select value={selected.tone || 'normal'} onChange={e => updateItem(selected.id, { tone: e.target.value as any })} className="input">
                    <option value="normal">正常</option>
                    <option value="warn">告警(警告)</option>
                    <option value="alarm">告警(严重)</option>
                  </select>
                </Row>
                </Section>

                <Section title="移动轨迹" open={openSections.motion} onToggle={() => toggleSection('motion')}>
                <Row label="移动">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[11px] text-[#cfe9ff]">
                      <input
                        type="checkbox"
                        checked={selected.motion?.enabled ?? isMotionRobotItem(selected)}
                        onChange={e => updateSelectedMotion({
                          enabled: e.target.checked,
                          path: selected.motion?.path ?? (e.target.checked ? DEFAULT_ROBOT_MOTION_PATH : undefined),
                        })}
                        className="h-4 w-4 accent-[#4fc1ff]"
                      />
                      启用移动
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-8 text-[10px] text-[#7e9fc8]">时长</span>
                        <NumInput
                          value={selected.motion?.duration ?? DEFAULT_MOTION_DURATION}
                          onChange={v => updateSelectedMotion({ duration: Math.max(1000, v) })}
                          step={500}
                          min={1000}
                        />
                      </div>
                      <label className="flex items-center gap-1.5 text-[11px] text-[#cfe9ff]">
                        <input
                          type="checkbox"
                          checked={selected.motion?.loop ?? true}
                          onChange={e => updateSelectedMotion({ loop: e.target.checked })}
                          className="h-4 w-4 accent-[#4fc1ff]"
                        />
                        循环路径
                      </label>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        className={(pathEditId === selected.id ? btnPrimary : btn) + ' h-7 flex-1 justify-center'}
                        onClick={() => {
                          if (pathEditId === selected.id) { setPathEditId(null); return; }
                          if (!selected.motion?.path?.length) {
                            updateSelectedMotion({ enabled: true, path: DEFAULT_ROBOT_MOTION_PATH });
                          } else if (selected.motion?.enabled === false) {
                            updateSelectedMotion({ enabled: true });
                          }
                          setPathEditId(selected.id);
                        }}
                      >
                        {pathEditId === selected.id ? '✓ 绘制中 · 点击结束' : '✎ 在画布上绘制路径'}
                      </button>
                      <button
                        className={btn + ' h-7 justify-center'}
                        title="清空所有路径点"
                        onClick={() => updateSelectedMotion({ path: [] })}
                      >
                        清空
                      </button>
                    </div>
                    {pathEditId === selected.id && (
                      <div className="rounded border border-[#3a5d2c] bg-[#10260a]/70 px-2 py-1 text-[10px] leading-4 text-[#a8e08c]">
                        画布操作：单击空白<b>末尾加点</b> · 点击连线<b>中间插点</b> · 拖拽圆点<b>移动</b> · 双击圆点<b>删除</b> · Esc <b>退出</b>。绿色为起点。
                      </div>
                    )}
                    <textarea
                      value={getMotionPathText(selected)}
                      onChange={e => updateSelectedMotion({ path: parseMotionPointsText(e.target.value) })}
                      className="input h-20 resize-none py-1 font-mono text-[10px] leading-4"
                      placeholder="0,0&#10;8,-4&#10;13,1"
                    />
                    <div className="text-[10px] leading-4 text-[#7e9fc8]">
                      也可直接编辑坐标：每行一个点 `x,y`，相对当前位置的百分比偏移。
                    </div>
                  </div>
                </Row>
                </Section>

                <Section title="高级" open={openSections.advanced} onToggle={() => toggleSection('advanced')}>
                <Row label="CSS Filter">
                  <input type="text" placeholder="如：drop-shadow(0 0 6px #f00)" value={selected.filter || ''} onChange={e => updateItem(selected.id, { filter: e.target.value || undefined })} className="input" />
                </Row>
                </Section>

                <div className="mt-2 flex gap-1.5">
                  <button className={btnDanger + ' flex-1'} onClick={() => removeItem(selected.id)}><Trash2 size={11} />删除 (Del)</button>
                </div>
              </div>
              )
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

      {uploadOpen && (
        <UploadAssetDialog
          onClose={() => setUploadOpen(false)}
          onUploaded={() => setAssetVersion(v => v + 1)}
        />
      )}

      <style>{`
        .input{height:24px;border:1px solid #2b6aa8;background:#0d2e5b;color:#cfe9ff;font:11px monospace;padding:0 6px;border-radius:3px;width:100%;outline:none;}
        .input:focus{border-color:#4fc1ff;}
        .num-wrap{display:flex;align-items:stretch;width:100%;height:24px;border:1px solid #2b6aa8;background:#0d2e5b;border-radius:3px;overflow:hidden;}
        .num-wrap:focus-within{border-color:#4fc1ff;}
        .num-field{flex:1;min-width:0;border:0;background:transparent;color:#cfe9ff;font:11px monospace;padding:0 4px;text-align:center;outline:none;-moz-appearance:textfield;}
        .num-field::-webkit-outer-spin-button,.num-field::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}
        .num-step{width:18px;flex:none;border:0;background:#0b2547;color:#9fc4ee;font-size:13px;line-height:1;cursor:pointer;user-select:none;display:flex;align-items:center;justify-content:center;}
        .num-step:hover{background:#13427d;color:#fff;}
        .num-step:active{background:#1c5aa0;}
      `}</style>

      {dialog.open && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/55 backdrop-blur-[1px]">
          <div className="w-[420px] rounded-lg border border-[#2b6aa8] bg-[#061a36] p-4 shadow-[0_16px_60px_rgba(0,0,0,0.55)]">
            <div className="text-[14px] font-bold text-[#e8f3ff]">{dialog.title}</div>
            <div className="mt-2 whitespace-pre-wrap text-[12px] leading-5 text-[#a9c8ee]">{dialog.message}</div>
            <div className="mt-4 flex justify-end gap-2">
              {dialog.mode === 'confirm' && (
                <button className={btn} onClick={() => closeDialog(false)}>{dialog.cancelText || '取消'}</button>
              )}
              <button className={btnPrimary} onClick={() => closeDialog(true)}>{dialog.confirmText || '确认'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="grid grid-cols-[70px_1fr] items-center gap-1.5">
    <span className="text-[10px] text-[#7e9fc8]">{label}</span>
    <div>{children}</div>
  </div>
);

const Section: React.FC<{ title: string; open: boolean; onToggle: () => void; children: React.ReactNode }> = ({ title, open, onToggle, children }) => (
  <div className="rounded border border-[#1b4378] bg-[#06182f]/50">
    <button type="button" onClick={onToggle} className="flex w-full items-center justify-between px-2 py-1.5 text-[11px] font-semibold text-[#9fd0ff] hover:text-white">
      <span>{title}</span>
      {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
    </button>
    {open && <div className="space-y-1.5 px-2 pb-2 pt-0.5">{children}</div>}
  </div>
);

const DrillTargetTree: React.FC<{ value: string[]; onChange: (targets: string[]) => void }> = ({ value, onChange }) => {
  const selected = new Set(value);
  const toggle = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(Array.from(next));
  };

  return (
    <div className="max-h-36 overflow-auto rounded border border-[#244871] bg-[#081f3d] p-1.5 custom-scrollbar">
      {DRILL_TREE.map(group => (
        <div key={group.title} className="mb-1 last:mb-0">
          <div className="mb-1 text-[10px] font-semibold text-[#79d0ff]">{group.title}</div>
          <div className="space-y-0.5">
            {group.items.map(item => (
              <label key={item.key} className="flex cursor-pointer items-center gap-1.5 rounded px-1.5 py-1 text-[11px] text-[#a9c8ee] hover:bg-[#103968]">
                <input
                  type="checkbox"
                  checked={selected.has(item.key)}
                  onChange={() => toggle(item.key)}
                  className="h-3.5 w-3.5 accent-[#4fc1ff]"
                />
                <span className="truncate">{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
      {value.length === 0 && (
        <div className="mt-1 border-t border-[#1b4378] pt-1 text-[10px] text-[#7e9fc8]">未配置点击下钻</div>
      )}
    </div>
  );
};

const NumInput: React.FC<{ value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number }> = ({ value, onChange, step = 1, min, max }) => {
  const clamp = (v: number) => {
    let n = v;
    if (min != null) n = Math.max(min, n);
    if (max != null) n = Math.min(max, n);
    return +n.toFixed(4);
  };
  const base = Number.isFinite(value) ? value : 0;
  return (
    <div className="num-wrap">
      <button type="button" tabIndex={-1} className="num-step" title={`-${step}`} onClick={() => onChange(clamp(base - step))}>−</button>
      <input type="number" value={base} step={step} min={min} max={max}
        onChange={e => onChange(parseFloat(e.target.value) || 0)} className="num-field" />
      <button type="button" tabIndex={-1} className="num-step" title={`+${step}`} onClick={() => onChange(clamp(base + step))}>+</button>
    </div>
  );
};

const UploadAssetDialog: React.FC<{ onClose: () => void; onUploaded: () => void }> = ({ onClose, onUploaded }) => {
  const existingGroups = useMemo(() => {
    const customGroups = loadCustomAssets().map(item => item.group).filter(Boolean);
    return Array.from(new Set(['自定义素材', '园区建筑', '车间设备', '机房基础设施', '环境/结构', ...customGroups]));
  }, []);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [group, setGroup] = useState('自定义素材');
  const [groupMode, setGroupMode] = useState<'existing' | 'new'>('existing');
  const [newGroup, setNewGroup] = useState('');
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!file) {
      setPreview('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    if (!name) setName(file.name.replace(/\.[^.]+$/, ''));
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const submit = async () => {
    if (!file) {
      setError('请选择 SVG 文件');
      return;
    }
    if (!file.name.toLowerCase().endsWith('.svg')) {
      setError('目前仅支持 SVG 素材');
      return;
    }
    const displayName = name.trim() || file.name.replace(/\.[^.]+$/, '');
    const displayGroup = groupMode === 'new'
      ? (newGroup.trim() || '自定义素材')
      : (group.trim() || '自定义素材');
    setBusy(true);
    setError('');
    try {
      const text = await file.text();
      const { w, h } = parseSvgSize(text);
      const content = await fileToBase64(file);
      const res = await fetch('/mock-api/upload-svg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, content }),
      });
      const payload = await res.json();
      if (!payload.ok) throw new Error(payload.message || '上传失败');
      const custom = {
        key: customAssetKey(payload.filename),
        name: displayName,
        group: displayGroup,
        src: payload.url,
        filename: payload.filename,
        w,
        h,
      } as const;
      addCustomAsset(custom);
      onUploaded();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 backdrop-blur-sm">
      <div className="w-[460px] rounded-lg border border-[#2b6aa8] bg-[#061a36] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.55)]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-[#e8f3ff]">上传本地素材</div>
            <div className="mt-0.5 text-[11px] text-[#7e9fc8]">文件会保存到 <span className="font-mono text-[#a9c8ee]">public/svg/custom</span></div>
          </div>
          <button className={iconBtn} onClick={onClose}><X size={12} /></button>
        </div>

        <div className="space-y-3 text-[12px]">
          <label className="block">
            <span className="mb-1 block text-[#7e9fc8]">SVG 文件</span>
            <input
              type="file"
              accept=".svg,image/svg+xml"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="block w-full text-[11px] text-[#a9c8ee] file:mr-3 file:h-7 file:rounded file:border file:border-[#2b6aa8] file:bg-[#0d2e5b] file:px-2 file:text-[#cfe9ff]"
            />
          </label>

          {preview && (
            <div className="flex h-28 items-center justify-center rounded border border-[#1b4378] bg-[#03132a]">
              <img src={preview} alt="素材预览" className="max-h-full max-w-full object-contain" />
            </div>
          )}

          <label className="block">
            <span className="mb-1 block text-[#7e9fc8]">自定义名称</span>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="例如：冷却塔-新版" />
          </label>

          <div className="block">
            <span className="mb-1 block text-[#7e9fc8]">素材分组</span>
            <div className="mb-1.5 flex gap-1.5">
              <button
                type="button"
                className={`${btn} !h-6 !px-2 ${groupMode === 'existing' ? '!border-[#4fc1ff] !text-[#cfe9ff]' : ''}`}
                onClick={() => setGroupMode('existing')}
              >
                选择已有分组
              </button>
              <button
                type="button"
                className={`${btn} !h-6 !px-2 ${groupMode === 'new' ? '!border-[#4fc1ff] !text-[#cfe9ff]' : ''}`}
                onClick={() => setGroupMode('new')}
              >
                新增分组
              </button>
            </div>
            {groupMode === 'existing' ? (
              <select className="input" value={group} onChange={e => setGroup(e.target.value)}>
                {existingGroups.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            ) : (
              <input
                className="input"
                value={newGroup}
                onChange={e => setNewGroup(e.target.value)}
                placeholder="请输入新分组名称，例如：自定义建筑"
              />
            )}
          </div>

          {error && <div className="rounded border border-[#7a2e2e] bg-[#3a1414] px-2 py-1 text-[11px] text-[#ff8a7a]">{error}</div>}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className={btn} onClick={onClose} disabled={busy}>取消</button>
          <button className={btnPrimary} onClick={submit} disabled={busy}>
            <Upload size={11} />{busy ? '上传中...' : '上传并加入素材库'}
          </button>
        </div>
      </div>
    </div>
  );
};

function parseSvgSize(svg: string): { w: number; h: number } {
  const viewBox = svg.match(/viewBox=["']\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)\s*["']/i);
  if (viewBox) return { w: parseFloat(viewBox[1]) || 512, h: parseFloat(viewBox[2]) || 512 };
  const width = svg.match(/\bwidth=["']([\d.]+)(?:px)?["']/i);
  const height = svg.match(/\bheight=["']([\d.]+)(?:px)?["']/i);
  return {
    w: width ? parseFloat(width[1]) || 512 : 512,
    h: height ? parseFloat(height[1]) || 512 : 512,
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result || '');
      resolve(raw.includes(',') ? raw.split(',')[1] : raw);
    };
    reader.onerror = () => reject(reader.error || new Error('读取文件失败'));
    reader.readAsDataURL(file);
  });
}

export default DigitalTwinEditor;
