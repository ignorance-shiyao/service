import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, BookOpen, ChevronRight, FilePieChart, GripVertical } from 'lucide-react';
import robotEntryIcon from '../assets/robot-entry.svg';
import './FloatingEntries.css';

type FloatingEntriesProps = {
  onOpenKB: () => void;
  onOpenFault: () => void;
  onOpenReport: () => void;
  onOpenAssistant: () => void;
  hideAssistantEntry?: boolean;
};

export const FloatingEntries: React.FC<FloatingEntriesProps> = ({
  onOpenKB,
  onOpenFault,
  onOpenReport,
  onOpenAssistant,
  hideAssistantEntry = false,
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);
  const dragMovedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const clampToViewport = (x: number, y: number) => {
    const el = containerRef.current;
    const width = el?.offsetWidth ?? (collapsed ? 70 : 64);
    const height = el?.offsetHeight ?? (collapsed ? 70 : 360);
    const padding = 8;
    const minX = padding;
    const minY = padding;
    const maxX = Math.max(minX, window.innerWidth - width - padding);
    const maxY = Math.max(minY, window.innerHeight - height - padding);
    return {
      x: Math.min(Math.max(x, minX), maxX),
      y: Math.min(Math.max(y, minY), maxY),
    };
  };

  useEffect(() => {
    const initial = clampToViewport(window.innerWidth - 56, window.innerHeight / 2 - 150);
    setPosition(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fit = () => setPosition((prev) => clampToViewport(prev.x, prev.y));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapsed]);

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragMovedRef.current = false;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) dragMovedRef.current = true;
      const next = clampToViewport(dragRef.current.startPosX + deltaX, dragRef.current.startPosY + deltaY);
      setPosition(next);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, collapsed]);

  if (collapsed) {
    return (
      <div
        ref={containerRef}
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
        className={`fixed z-[100] flex flex-col items-end ${isDragging ? 'cursor-grabbing' : ''}`}
      >
        <button
          type="button"
          onMouseDown={startDrag}
          onClick={() => {
            if (dragMovedRef.current) {
              dragMovedRef.current = false;
              return;
            }
            setCollapsed(false);
          }}
          className="group flex h-[70px] w-[70px] cursor-grab items-center justify-center rounded-full border border-cyan-300/40 bg-[radial-gradient(circle_at_30%_28%,#56e6ff_0%,#1f7dd6_46%,#0e2b67_100%)] text-[#ecfaff] shadow-[0_14px_30px_rgba(8,18,38,0.52),0_0_16px_rgba(34,211,238,0.34)] transition-all duration-250 hover:scale-[1.05] hover:text-white hover:shadow-[0_20px_38px_rgba(14,165,233,0.44)] active:cursor-grabbing"
          title="展开AI助手"
        >
          <span className="ai-entry-halo" />
          <span className="ai-entry-spark ai-entry-spark-a" />
          <span className="ai-entry-spark ai-entry-spark-b" />
          <span className="ai-entry-robot-wrap">
            <img src={robotEntryIcon} alt="AI入口" className="ai-entry-robot" draggable={false} />
          </span>
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className={`fixed z-[100] flex flex-col items-center transition-shadow duration-300 ${isDragging ? 'cursor-grabbing' : ''}`}
    >
      <div
        onMouseDown={startDrag}
        className="flex h-6 w-16 cursor-grab items-center justify-between rounded-t-xl border border-slate-700/50 bg-slate-800/40 px-1.5 active:cursor-grabbing hover:bg-slate-700/60 transition-colors"
        title="拖拽移动位置"
      >
        <GripVertical size={14} className="text-slate-500" />
        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => setCollapsed(true)}
          className="rounded p-0.5 text-slate-400 transition hover:bg-slate-700/60 hover:text-white"
          title="收起AI助手"
        >
          <ChevronRight size={12} />
        </button>
      </div>

      <div className="flex w-16 flex-col gap-1">
        <div className="group cursor-pointer" onClick={onOpenKB}>
          <div className="flex flex-col items-center gap-1.5 border-y border-slate-700/50 border-l-4 border-blue-500/70 bg-slate-900/90 py-3 shadow-xl backdrop-blur-xl transition-all duration-300 group-hover:translate-x-[-4px] group-hover:bg-blue-600">
            <BookOpen size={20} className="text-blue-400 transition-colors group-hover:text-white" />
            <span className="whitespace-nowrap text-[10px] font-bold text-slate-300 group-hover:text-white">知识库</span>
          </div>
        </div>

        <div className="group cursor-pointer" onClick={onOpenFault}>
          <div className="flex flex-col items-center gap-1.5 border-y border-slate-700/50 border-l-4 border-amber-500/70 bg-slate-900/90 py-3 shadow-xl backdrop-blur-xl transition-all duration-300 group-hover:translate-x-[-4px] group-hover:bg-amber-600">
            <AlertTriangle size={20} className="text-amber-400 transition-colors group-hover:text-white" />
            <span className="whitespace-nowrap text-[10px] font-bold text-slate-300 group-hover:text-white">报障</span>
          </div>
        </div>

        <div className="group cursor-pointer" onClick={onOpenReport}>
          <div className="flex flex-col items-center gap-1.5 border-y border-slate-700/50 border-l-4 border-indigo-500/70 bg-slate-900/90 py-3 shadow-xl backdrop-blur-xl transition-all duration-300 group-hover:translate-x-[-4px] group-hover:bg-indigo-600">
            <FilePieChart size={20} className="text-indigo-400 transition-colors group-hover:text-white" />
            <span className="whitespace-nowrap text-[10px] font-bold text-slate-300 group-hover:text-white">简报</span>
          </div>
        </div>

        {!hideAssistantEntry && (
          <div className="group cursor-pointer" onClick={onOpenAssistant}>
            <div className="relative flex flex-col items-center gap-2 overflow-hidden rounded-bl-xl border-y border-slate-700/50 border-l-4 border-indigo-500/70 bg-[var(--sys-bg-header)]/95 py-4 shadow-[0_0_20px_rgba(79,70,229,0.2)] backdrop-blur-xl transition-all duration-300 group-hover:translate-x-[-4px] group-hover:bg-indigo-600">
              <div className="pointer-events-none absolute inset-0 animate-pulse bg-gradient-to-r from-indigo-500/5 to-transparent"></div>
              <img src={robotEntryIcon} alt="AI图标" className="ai-entry-card-robot" draggable={false} />
              <span className="z-10 whitespace-nowrap text-[11px] font-black text-indigo-200 group-hover:text-white">AI管家</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
