import React, { useEffect, useRef, useState } from 'react';
import { Bot, Sparkles } from 'lucide-react';

interface Props {
  unread: number;
  healthText: string;
  onClick: () => void;
}

export const FloatingBall: React.FC<Props> = ({ unread, healthText, onClick }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragMovedRef = useRef(false);
  const dragRef = useRef<{ startX: number; startY: number; x: number; y: number } | null>(null);

  const clamp = (x: number, y: number) => {
    const maxX = Math.max(8, window.innerWidth - 56 - 8);
    const maxY = Math.max(8, window.innerHeight - 56 - 8);
    return { x: Math.min(Math.max(8, x), maxX), y: Math.min(Math.max(8, y), maxY) };
  };

  useEffect(() => {
    setPosition(clamp(window.innerWidth - 76, window.innerHeight - 76));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging || !dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragMovedRef.current = true;
      setPosition(clamp(dragRef.current.x + dx, dragRef.current.y + dy));
    };
    const onUp = () => setDragging(false);
    if (dragging) {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging]);

  return (
    <div
      className={`fixed z-[190] ${dragging ? 'cursor-grabbing' : ''}`}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      <div className="pointer-events-none absolute -inset-1 rounded-full bg-blue-500/20 blur-md" />
      <button
        type="button"
        onMouseDown={(e) => {
          setDragging(true);
          dragMovedRef.current = false;
          dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            x: position.x,
            y: position.y
          };
        }}
        onClick={() => {
          if (dragMovedRef.current) {
            dragMovedRef.current = false;
            return;
          }
          onClick();
        }}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full border border-[#3d8ce6] bg-[linear-gradient(180deg,#15509a_0%,#103b72_100%)] text-[#d7ecff] shadow-[0_0_26px_rgba(34,126,255,0.35)] transition-all hover:scale-105 hover:border-[#64b0ff]"
      >
        <Bot size={24} />
        <Sparkles size={11} className="absolute -bottom-0.5 -right-0.5 text-cyan-200" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>
      <div className="pointer-events-none absolute bottom-16 right-0 hidden w-60 rounded-xl border border-[#2d5f94] bg-[linear-gradient(180deg,#102b4b_0%,#0b1d36_100%)] p-2.5 text-xs text-slate-200 shadow-xl group-hover:block">
        <div className="font-bold text-[#8fd2ff]">AI 管家预览</div>
        <div className="mt-1 leading-relaxed text-[#c1dbf3]">{healthText}</div>
      </div>
    </div>
  );
};
