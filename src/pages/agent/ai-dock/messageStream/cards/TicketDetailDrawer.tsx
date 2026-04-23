import React from 'react';
import { TicketItem } from '../../mocks/tickets';

interface TicketDetailDrawerProps {
  item: TicketItem;
  onClose: () => void;
}

export const TicketDetailDrawer: React.FC<TicketDetailDrawerProps> = ({ item, onClose }) => {
  return (
    <div className="absolute inset-y-0 right-0 z-[40] w-[360px] border-l border-[var(--sys-border-primary)] bg-[var(--sys-bg-header)] shadow-2xl">
      <div className="flex h-full flex-col">
        <div className="border-b border-[var(--sys-border-primary)] px-4 py-3 text-sm font-semibold text-[#dff0ff]">工单详情</div>
        <div className="flex-1 overflow-auto p-3 space-y-3 text-xs custom-scrollbar">
          <div className="rounded border border-[var(--sys-border-primary)] bg-[#103f74] p-2 text-[#d7ecff]">
            <div className="font-semibold">{item.id}</div>
            <div className="mt-1">{item.title}</div>
            <div className="mt-1 text-[var(--sys-text-secondary)]">{item.detail}</div>
          </div>
          <div>
            <div className="mb-1 text-[11px] text-[#9fccff]">处理时间线</div>
            <div className="space-y-2">
              {item.timeline.map((t) => (
                <div key={`${t.time}_${t.text}`} className="rounded border border-[var(--sys-border-primary)] bg-[#0f3a6d] p-2 text-[var(--sys-text-secondary)]">
                  <div className="text-[#8fc7ff]">{t.time}</div>
                  <div className="mt-0.5">{t.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-[var(--sys-border-primary)] p-3">
          <button type="button" onClick={onClose} className="w-full rounded border border-[var(--sys-border-secondary)] bg-[#113f72] py-1.5 text-xs text-[#d7ecff]">关闭</button>
        </div>
      </div>
    </div>
  );
};
