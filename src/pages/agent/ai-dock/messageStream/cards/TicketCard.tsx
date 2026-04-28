import React from 'react';
import { Ticket } from 'lucide-react';
import { TicketItem } from '../../../../../mock/assistant';
import { CardActionBar } from './CardActionBar';

interface TicketCardProps {
  ticket: TicketItem;
  onOpen: (id: string) => void;
  onCopy?: (text: string) => void;
  onAsk?: (text: string) => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({ ticket, onOpen, onCopy, onAsk }) => {
  const statusTone = ticket.status.includes('待')
    ? {
        badge: 'border-[#cc9d66] bg-[rgba(124,86,42,0.55)] text-[#ffe8cc]',
        stripe: 'bg-[#d0a469]',
      }
    : ticket.status.includes('完成') || ticket.status.includes('已')
      ? {
          badge: 'border-[#5fbf98] bg-[rgba(25,106,84,0.55)] text-[#dcfff3]',
          stripe: 'bg-[#63d3a8]',
        }
      : {
          badge: 'border-[#7aa5f2] bg-[rgba(49,86,154,0.6)] text-[#eaf0ff]',
          stripe: 'bg-[#5f93ee]',
        };

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#3f77ab] bg-[linear-gradient(180deg,#123a66_0%,#11345f_100%)] p-3 shadow-[0_10px_20px_rgba(7,31,67,0.28)]">
      <div className={`absolute left-0 top-0 h-full w-1 ${statusTone.stripe}`} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-[#eef6ff]">
          <Ticket size={14} className="text-[#a8dbff]" />
          {ticket.id}
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] ${statusTone.badge}`}>{ticket.status}</span>
      </div>
      <div className="mt-1 text-sm font-semibold text-[#dff1ff]">{ticket.title}</div>
      <div className="mt-1 text-[11px] text-[#b8daf4]">业务：{ticket.business}</div>
      <div className="mt-0.5 text-[11px] text-[#9ec8ea]">责任人：{ticket.owner}</div>
      <CardActionBar
        actions={[
          {
            key: 'copy',
            label: '复制工单',
            onClick: () => onCopy?.(`${ticket.id}\n${ticket.title}\n业务：${ticket.business}\n状态：${ticket.status}`),
          },
          {
            key: 'ask',
            label: '催办建议',
            onClick: () => onAsk?.(`请给我工单 ${ticket.id} 的催办话术，语气专业简洁`),
          },
          {
            key: 'open',
            label: '查看详情',
            tone: 'primary',
            onClick: () => onOpen(ticket.id),
          },
        ]}
      />
    </div>
  );
};
