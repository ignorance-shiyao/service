import React, { useEffect, useRef, useState } from 'react';
import { useAiDock } from './store/useAiDock';
import { AiDockWindow } from './AiDockWindow';
import robotEntryIcon from '../../../assets/robot-entry.svg';
import './aiDockEntry.css';

interface AiDockProps {
  onOpenStateChange?: (opened: boolean) => void;
}

export const AiDock: React.FC<AiDockProps> = ({ onOpenStateChange }) => {
  const store = useAiDock();
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  useEffect(() => {
    onOpenStateChange?.(store.open);
  }, [onOpenStateChange, store.open]);

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      px: store.position.x || window.innerWidth - 80,
      py: store.position.y || window.innerHeight - 80,
    };
    setDragging(true);
  };

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!dragging || !dragRef.current) return;
      const x = dragRef.current.px + (e.clientX - dragRef.current.x);
      const y = dragRef.current.py + (e.clientY - dragRef.current.y);
      store.setPosition({ x, y });
    };
    const up = () => setDragging(false);
    if (dragging) {
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
    }
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [dragging, store]);

  const collapsed = !store.open || store.minimized;

  return (
    <>
      {collapsed && (
        <div
          style={{
            left: `${store.position.x || window.innerWidth - 84}px`,
            top: `${store.position.y || window.innerHeight - 94}px`,
          }}
          className={`fixed z-[230] ${dragging ? 'cursor-grabbing' : ''}`}
        >
          <button
            type="button"
            onMouseDown={startDrag}
            onClick={store.restoreWindow}
            className="group relative flex h-[66px] w-[66px] items-center justify-center rounded-full border border-cyan-300/40 bg-[radial-gradient(circle_at_30%_28%,#56e6ff_0%,#1f7dd6_46%,#0e2b67_100%)] text-white shadow-[0_14px_30px_rgba(8,18,38,0.52),0_0_16px_rgba(34,211,238,0.34)] transition-all duration-250 hover:scale-[1.05] hover:shadow-[0_20px_38px_rgba(14,165,233,0.44)]"
          >
            <span className="ai-dock-entry-halo" />
            <span className="ai-dock-entry-spark ai-dock-entry-spark-a" />
            <span className="ai-dock-entry-spark ai-dock-entry-spark-b" />
            <span className="ai-dock-entry-robot-wrap">
              <img src={robotEntryIcon} alt="AI入口" className="ai-dock-entry-robot" draggable={false} />
            </span>
            {store.unread > 0 && (
              <span className="absolute -right-1 -top-1 z-20 rounded-full bg-[#f43f5e] px-1.5 py-[1px] text-[10px] font-semibold text-white">
                {store.unread > 99 ? '99+' : store.unread}
              </span>
            )}
          </button>
        </div>
      )}

      {store.open && !store.minimized && (
        <AiDockWindow store={store} onClose={store.closeWindow} />
      )}
    </>
  );
};
