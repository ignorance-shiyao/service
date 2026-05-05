import React, { useEffect, useRef, useState } from 'react';
import { AI_DOCK_SESSION_STORAGE_KEY, useAiDock } from './store/useAiDock';
import { AiDockWindow } from './AiDockWindow';
import robotEntryIcon from '../../../assets/robot-entry.svg';
import './aiDockEntry.css';

interface AiDockProps {
  onOpenStateChange?: (opened: boolean) => void;
}

type AiDockBoundaryState = {
  hasError: boolean;
};

class AiDockErrorBoundary extends React.Component<React.PropsWithChildren, AiDockBoundaryState> {
  state: AiDockBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AiDockBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[AiDock] 智能体渲染失败，已启用兜底入口。', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed bottom-5 right-5 z-[230] rounded-2xl border border-cyan-300/35 bg-[#0d3764] px-3 py-2 text-xs text-[#d8efff] shadow-[0_12px_30px_rgba(8,18,38,0.38)]">
          <div className="font-semibold text-white">智能体暂不可用</div>
          <div className="mt-0.5 text-[#9fc9e9]">大屏已保护，可刷新后重试。</div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className="rounded-md border border-[#4f8bbd] bg-[#1a5286] px-2 py-1 text-[11px] text-[#e4f2ff] hover:bg-[#23639e]"
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
            >
              刷新
            </button>
            <button
              type="button"
              className="rounded-md border border-[#8aa1bd] bg-[#17314f] px-2 py-1 text-[11px] text-[#d7e8f7] hover:bg-[#21466d]"
              onClick={() => {
                window.localStorage.removeItem(AI_DOCK_SESSION_STORAGE_KEY);
                this.setState({ hasError: false });
                window.location.reload();
              }}
            >
              重置会话
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const AiDockInner: React.FC<AiDockProps> = ({ onOpenStateChange }) => {
  const store = useAiDock();
  const [dragging, setDragging] = useState(false);
  const [bubblePosition, setBubblePosition] = useState(() => {
    if (typeof window === 'undefined') return { x: 0, y: 0 };
    return { x: window.innerWidth - 84, y: window.innerHeight - 94 };
  });
  const dragRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const justDraggedRef = useRef(false);

  useEffect(() => {
    onOpenStateChange?.(store.open);
  }, [onOpenStateChange, store.open]);

  const clampToViewport = (x: number, y: number) => {
    if (typeof window === 'undefined') return { x, y };
    const size = 66;
    const padding = 8;
    const maxX = Math.max(padding, window.innerWidth - size - padding);
    const maxY = Math.max(padding, window.innerHeight - size - padding);
    return {
      x: Math.min(Math.max(x, padding), maxX),
      y: Math.min(Math.max(y, padding), maxY),
    };
  };

  useEffect(() => {
    const onResize = () => {
      setBubblePosition((prev) => clampToViewport(prev.x, prev.y));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      px: bubblePosition.x,
      py: bubblePosition.y,
    };
    justDraggedRef.current = false;
    setDragging(true);
  };

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!dragging || !dragRef.current) return;
      const dx = e.clientX - dragRef.current.x;
      const dy = e.clientY - dragRef.current.y;
      const moved = Math.abs(dx) > 3 || Math.abs(dy) > 3;
      if (moved) {
        justDraggedRef.current = true;
      }
      const next = clampToViewport(dragRef.current.px + dx, dragRef.current.py + dy);
      setBubblePosition(next);
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
  }, [bubblePosition.x, bubblePosition.y, dragging]);

  const collapsed = !store.open || store.minimized;

  return (
    <>
      {collapsed && (
        <div
          style={{
            left: `${bubblePosition.x}px`,
            top: `${bubblePosition.y}px`,
          }}
          className={`fixed z-[230] ${dragging ? 'cursor-grabbing' : ''}`}
        >
          <button
            type="button"
            onMouseDown={startDrag}
            onClick={() => {
              if (justDraggedRef.current) {
                justDraggedRef.current = false;
                return;
              }
              store.restoreWindow();
            }}
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

export const AiDock: React.FC<AiDockProps> = (props) => (
  <AiDockErrorBoundary>
    <AiDockInner {...props} />
  </AiDockErrorBoundary>
);
