import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Maximize2, Minimize2, Paperclip, RotateCcw, Send, X } from 'lucide-react';
import { AiDockStore } from './store/useAiDock';
import { MessageList } from './messageStream/MessageList';
import { QuickChipsBar } from './chips/QuickChipsBar';
import { KnowledgeDrawer } from './messageStream/cards/KnowledgeDrawer';
import { ReportHistoryDrawer } from './messageStream/cards/ReportHistoryDrawer';
import { DiagnosisHistoryDrawer } from './messageStream/cards/DiagnosisHistoryDrawer';
import { TicketDetailDrawer } from './messageStream/cards/TicketDetailDrawer';
import robotEntryIcon from '../../../assets/robot-entry.svg';
import './aiDockTheme.css';

interface AiDockWindowProps {
  store: AiDockStore;
  onClose: () => void;
}

export const AiDockWindow: React.FC<AiDockWindowProps> = ({ store, onClose }) => {
  type SizeMode = 'small' | 'medium' | 'max';
  type ResizeMode = 'left' | 'right' | 'top' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | null;
  const PRESET: Record<'small' | 'medium', { width: number; height: number }> = {
    small: { width: 420, height: 560 },
    medium: { width: 520, height: 760 },
  };

  const [input, setInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeMode, setResizeMode] = useState<ResizeMode>(null);
  const [sizeMode, setSizeMode] = useState<SizeMode>('small');
  const [mediumFromMax, setMediumFromMax] = useState(false);
  const dragRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const resizeRef = useRef<{ x: number; y: number; left: number; top: number; width: number; height: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [store.messages]);

  useEffect(() => {
    if (sizeMode !== 'max') return;
    const syncFull = () => {
      store.setPosition({ x: 8, y: 8 });
      store.setWindowSize({ width: Math.max(360, window.innerWidth - 16), height: Math.max(420, window.innerHeight - 16) });
    };
    syncFull();
    window.addEventListener('resize', syncFull);
    return () => window.removeEventListener('resize', syncFull);
  }, [sizeMode, store]);

  const style = useMemo(() => {
    if (sizeMode === 'max') return { left: 8, top: 8 };
    const x = store.position.x || Math.max(16, window.innerWidth - (store.windowSize.width + 40));
    const y = store.position.y || Math.max(16, window.innerHeight - (store.windowSize.height + 40));
    return { left: x, top: y };
  }, [sizeMode, store.position.x, store.position.y, store.windowSize.height, store.windowSize.width]);

  const clamp = (x: number, y: number, width = store.windowSize.width, height = store.windowSize.height) => {
    return {
      x: Math.min(Math.max(8, x), Math.max(8, window.innerWidth - width - 8)),
      y: Math.min(Math.max(8, y), Math.max(8, window.innerHeight - height - 8)),
    };
  };

  const startDrag = (e: React.MouseEvent) => {
    if (sizeMode === 'max') return;
    e.preventDefault();
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = { x: e.clientX, y: e.clientY, left: rect.left, top: rect.top };
    setIsDragging(true);
  };

  const applySizeMode = (nextMode: SizeMode) => {
    setSizeMode(nextMode);
    if (nextMode === 'max') {
      setMediumFromMax(false);
      store.setPosition({ x: 8, y: 8 });
      store.setWindowSize({ width: Math.max(360, window.innerWidth - 16), height: Math.max(420, window.innerHeight - 16) });
      return;
    }
    const width = Math.min(window.innerWidth - 16, PRESET[nextMode].width);
    const height = Math.min(window.innerHeight - 16, PRESET[nextMode].height);
    store.setWindowSize({ width, height });
    const next = clamp(store.position.x || 8, store.position.y || 8, width, height);
    store.setPosition(next);
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (isDragging && dragRef.current) {
        const next = clamp(
          dragRef.current.left + (e.clientX - dragRef.current.x),
          dragRef.current.top + (e.clientY - dragRef.current.y)
        );
        store.setPosition(next);
      }
      if (isResizing && resizeRef.current && resizeMode) {
        const dx = e.clientX - resizeRef.current.x;
        const dy = e.clientY - resizeRef.current.y;
        const startX = resizeRef.current.left;
        const startY = resizeRef.current.top;
        let left = startX;
        let top = startY;
        let width = resizeRef.current.width;
        let height = resizeRef.current.height;

        const withLeft = resizeMode === 'left' || resizeMode === 'topLeft' || resizeMode === 'bottomLeft';
        const withRight = resizeMode === 'right' || resizeMode === 'topRight' || resizeMode === 'bottomRight';
        const withTop = resizeMode === 'top' || resizeMode === 'topLeft' || resizeMode === 'topRight';
        const withBottom = resizeMode === 'bottom' || resizeMode === 'bottomLeft' || resizeMode === 'bottomRight';

        if (withRight) width = resizeRef.current.width + dx;
        if (withBottom) height = resizeRef.current.height + dy;
        if (withLeft) {
          left = startX + dx;
          width = resizeRef.current.width - dx;
        }
        if (withTop) {
          top = startY + dy;
          height = resizeRef.current.height - dy;
        }

        const minW = 360;
        const minH = 420;
        if (width < minW) {
          if (withLeft) left -= minW - width;
          width = minW;
        }
        if (height < minH) {
          if (withTop) top -= minH - height;
          height = minH;
        }

        left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
        top = Math.max(8, Math.min(top, window.innerHeight - height - 8));
        width = Math.min(width, window.innerWidth - left - 8);
        height = Math.min(height, window.innerHeight - top - 8);

        store.setPosition({ x: left, y: top });
        store.setWindowSize({ width, height });
      }
    };
    const onUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeMode(null);
    };
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, isResizing, resizeMode, store, sizeMode]);

  const startResize = (mode: Exclude<ResizeMode, null>) => (e: React.MouseEvent) => {
    if (sizeMode === 'max') return;
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = {
      x: e.clientX,
      y: e.clientY,
      left: store.position.x || 8,
      top: store.position.y || 8,
      width: store.windowSize.width,
      height: store.windowSize.height,
    };
    setIsResizing(true);
    setResizeMode(mode);
    setSizeMode('medium');
    setMediumFromMax(false);
  };

  const submit = async () => {
    if (!input.trim()) return;
    const value = input;
    setInput('');
    await store.sendUserText(value);
  };
  const hasUserMessage = store.messages.some((m) => m.role === 'user');

  const cycleSizeMode = () => {
    if (sizeMode === 'small') {
      setMediumFromMax(false);
      applySizeMode('medium');
      return;
    }
    if (sizeMode === 'medium' && mediumFromMax) {
      setMediumFromMax(false);
      applySizeMode('small');
      return;
    }
    if (sizeMode === 'medium') {
      applySizeMode('max');
      return;
    }
    setMediumFromMax(true);
    applySizeMode('medium');
  };

  const cycleLabel =
    sizeMode === 'small'
      ? '切换到中等窗口'
      : sizeMode === 'medium'
        ? '切换到最大窗口'
        : '恢复到中等窗口';

  const cycleIcon = sizeMode === 'small' ? <Maximize2 size={13} /> : sizeMode === 'medium' ? <Maximize2 size={13} /> : <Minimize2 size={13} />;

  const onHeaderDoubleClick = () => {
    if (sizeMode === 'max') {
      applySizeMode('medium');
      return;
    }
    applySizeMode('max');
  };

  return (
    <div
      ref={wrapRef}
      style={{ ...style, width: store.windowSize.width, height: store.windowSize.height }}
      className={`ai-dock-surface fixed z-[220] flex flex-col overflow-hidden rounded-[16px] border border-[#2e6aa9] bg-[#0a2a52] shadow-[0_18px_48px_rgba(2,16,38,0.58),0_0_0_1px_rgba(87,172,242,0.2)] ${isDragging ? 'cursor-grabbing' : ''}`}
    >
      <span className="ai-dock-ambient ai-dock-ambient-a" />
      <span className="ai-dock-ambient ai-dock-ambient-b" />
      <span className="ai-dock-ambient ai-dock-ambient-c" />
      <div className="relative flex h-[56px] items-center justify-between border-b border-[#2a639f] bg-[#103d6e] px-3" onMouseDown={startDrag} onDoubleClick={onHeaderDoubleClick}>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#4e95cf] bg-[#1a4f82] shadow-[0_8px_18px_rgba(6,33,70,0.3)]">
            <img src={robotEntryIcon} alt="AI管家" className="h-7 w-7" draggable={false} />
          </div>
          <div>
            <div className="text-sm font-semibold text-[#deefff]">运维管家智能体</div>
            <div className="flex items-center gap-1 text-[10px] text-[#8fcbff]">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#2be38f] shadow-[0_0_8px_rgba(43,227,143,0.8)]" />
              在线
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" className="rounded-full border border-[#3f82c0] bg-[#1a548f] p-1.5 text-[#c8e7ff] transition hover:border-[#68bdff] hover:bg-[#2369ad]" onClick={store.clearConversation} title="清空会话"><RotateCcw size={13} /></button>
          <button type="button" className="rounded-full border border-[#3f82c0] bg-[#1a548f] p-1.5 text-[#c8e7ff] transition hover:border-[#68bdff] hover:bg-[#2369ad]" onClick={cycleSizeMode} title={cycleLabel}>
            {cycleIcon}
          </button>
          <button type="button" className="rounded-full border border-[#3f82c0] bg-[#1a548f] p-1.5 text-[#c8e7ff] transition hover:border-[#68bdff] hover:bg-[#2369ad]" onClick={onClose} title="关闭"><X size={13} /></button>
        </div>
      </div>

      <div
        ref={listRef}
        className="relative min-h-0 flex-1 overflow-y-auto custom-scrollbar"
      >
        {!hasUserMessage && (
          <div className="px-4 pt-4">
            <div className="rounded-2xl border border-[#2f6fad] bg-[#143d6b] p-4 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-[#6fc2ff] bg-[#2f77c9] text-[#e9f6ff] shadow-[0_0_20px_rgba(83,174,248,0.35)]">
                <img src={robotEntryIcon} alt="智能体图标" className="ai-dock-hero-robot h-7 w-7" draggable={false} />
              </div>
              <div className="ai-dock-hero-title text-xl font-semibold text-[#ebf7ff]">您好，我是智慧运维管家智能体</div>
              <div className="ai-dock-hero-line mt-1 text-xs leading-5 text-[#b7daf6]">我可以为您提供：知识检索、智能问答、业务运行报告、自助诊断和自助报障。</div>
              <div className="ai-dock-hero-line ai-dock-hero-line-delay mt-1 text-xs leading-5 text-[#9bc9ec]">建议先试试“业务体检”，看看今天您名下业务是否都正常。</div>
            </div>
          </div>
        )}
        <MessageList messages={store.messages} store={store} />
        {store.drawer?.type === 'knowledge' && (
          <KnowledgeDrawer item={store.drawer.item} onClose={() => store.setDrawer(null)} />
        )}
        {store.drawer?.type === 'reportHistory' && (
          <ReportHistoryDrawer
            list={store.drawer.list}
            onSelect={(id) => {
              store.setActiveReportId(id);
              store.sendUserText('查看该期报告', 'report');
              store.setDrawer(null);
            }}
            onClose={() => store.setDrawer(null)}
          />
        )}
        {store.drawer?.type === 'diagnosisHistory' && (
          <DiagnosisHistoryDrawer list={store.drawer.list} onClose={() => store.setDrawer(null)} />
        )}
        {store.drawer?.type === 'ticket' && (
          <TicketDetailDrawer item={store.drawer.item} onClose={() => store.setDrawer(null)} />
        )}
      </div>

      <div className="border-t border-[#2a639f] bg-[#0f3560] px-3 py-2">
        <div className="rounded-2xl border border-[#3575b3] bg-[#123d6f] px-2 py-2 shadow-[inset_0_1px_0_rgba(125,195,255,0.22)]">
          <QuickChipsBar chips={store.quickChips} onClick={store.handleQuickChip} className="mb-2" />
          <div className="flex h-[44px] items-center gap-2">
          <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#3f82c0] bg-[#1a548f] text-[#bfe1ff] transition hover:border-[#68bdff] hover:bg-[#2369ad]" title="上传附件">
            <Paperclip size={13} />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="请输入问题，回车发送，换行请按 Shift+回车"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            className="custom-scrollbar max-h-[74px] min-h-[34px] flex-1 resize-none overflow-y-auto bg-transparent px-2 py-1.5 text-xs text-[#e1f2ff] placeholder:text-[#84b4e0] outline-none"
          />
          <button type="button" onClick={submit} className="inline-flex h-9 items-center gap-1 rounded-full border border-[#57adff] bg-[#2b71c4] px-3 text-xs font-semibold text-[#eff8ff] shadow-[0_8px_18px_rgba(10,54,108,0.36)]">
            <Send size={13} />
            发送
          </button>
          </div>
        </div>
      </div>
      {sizeMode !== 'max' && (
        <>
          <div className="absolute left-0 top-[56px] bottom-0 w-2 cursor-ew-resize opacity-0" onMouseDown={startResize('left')} />
          <div className="absolute right-0 top-[56px] bottom-0 w-2 cursor-ew-resize opacity-0" onMouseDown={startResize('right')} />
          <div className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0" onMouseDown={startResize('top')} />
          <div className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0" onMouseDown={startResize('bottom')} />
          <div className="absolute left-0 top-0 h-3 w-3 cursor-nwse-resize opacity-0" onMouseDown={startResize('topLeft')} />
          <div className="absolute right-0 top-0 h-3 w-3 cursor-nesw-resize opacity-0" onMouseDown={startResize('topRight')} />
          <div className="absolute left-0 bottom-0 h-3 w-3 cursor-nesw-resize opacity-0" onMouseDown={startResize('bottomLeft')} />
          <div className="absolute right-0 bottom-0 h-3 w-3 cursor-nwse-resize opacity-0" onMouseDown={startResize('bottomRight')} />
        </>
      )}
    </div>
  );
};
