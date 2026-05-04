import React, { useMemo, useState } from 'react';
import { TicketItem } from '../../../../../mock/assistant';
import { TICKET_TEXT, TICKET_URGE_LIMIT_MINUTES } from '../../store/ticketText';

interface TicketDetailDrawerProps {
  item: TicketItem;
  onAction: (payload: { ticketId: string; action: 'supplement' | 'urge' | 'confirm' | 'reopen'; note?: string }) => void;
  onClose: () => void;
}

export const TicketDetailDrawer: React.FC<TicketDetailDrawerProps> = ({ item, onAction, onClose }) => {
  const [note, setNote] = useState('');
  const isPendingCustomerConfirm = item.status === TICKET_TEXT.pendingConfirmStatus;
  const urgeRemainMin = useMemo(() => {
    if (!item.lastUrgedAt) return 0;
    const remain = item.lastUrgedAt + TICKET_URGE_LIMIT_MINUTES * 60 * 1000 - Date.now();
    return remain > 0 ? Math.ceil(remain / 60000) : 0;
  }, [item.lastUrgedAt]);

  return (
    <div className="absolute inset-y-0 right-0 z-[260] w-[min(420px,calc(100%-24px))] border-l border-[var(--sys-border-primary)] bg-[var(--sys-bg-header)] shadow-2xl">
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
          <div>
            <div className="mb-1 text-[11px] text-[#9fccff]">下一步处理</div>
            <div className="space-y-2 rounded border border-[var(--sys-border-primary)] bg-[#0f3a6d] p-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="补充现场现象/影响范围（可选）"
                className="custom-scrollbar h-20 w-full resize-none rounded border border-[var(--sys-border-secondary)] bg-[#103f74] px-2 py-1.5 text-xs text-[#d7ecff] placeholder:text-[#8ebbe2] outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                {!isPendingCustomerConfirm && (
                  <>
                    <button
                      type="button"
                      onClick={() => onAction({ ticketId: item.id, action: 'supplement', note: note.trim() || undefined })}
                      className="rounded border border-[#4f8bbd] bg-[#15518c] px-2 py-1.5 text-xs text-[#def2ff]"
                    >
                      补充信息
                    </button>
                    <button
                      type="button"
                      disabled={urgeRemainMin > 0}
                      onClick={() => onAction({ ticketId: item.id, action: 'urge', note: note.trim() || undefined })}
                      className={`rounded border px-2 py-1.5 text-xs ${
                        urgeRemainMin > 0
                          ? 'cursor-not-allowed border-[#496f93] bg-[#284662] text-[#8fb1cf]'
                          : 'border-[#4f8bbd] bg-[#15518c] text-[#def2ff]'
                      }`}
                    >
                      {urgeRemainMin > 0 ? `催办中(${urgeRemainMin}m)` : '催办处理'}
                    </button>
                  </>
                )}
                {isPendingCustomerConfirm && (
                  <>
                    <button
                      type="button"
                      onClick={() => onAction({ ticketId: item.id, action: 'confirm', note: note.trim() || undefined })}
                      className="rounded border border-[#4ea57f] bg-[#1c6a54] px-2 py-1.5 text-xs text-[#e1fff4]"
                    >
                      确认完成
                    </button>
                    <button
                      type="button"
                      onClick={() => onAction({ ticketId: item.id, action: 'reopen', note: note.trim() || undefined })}
                      className="rounded border border-[#c28b58] bg-[#7c4f26] px-2 py-1.5 text-xs text-[#fff0dd]"
                    >
                      二次受理
                    </button>
                  </>
                )}
              </div>
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
