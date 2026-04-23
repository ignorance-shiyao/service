import React from 'react';
import { Ticket } from 'lucide-react';
import { TicketItem } from '../../mocks/tickets';

interface TicketCardProps {
  ticket: TicketItem;
  onOpen: (id: string) => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({ ticket, onOpen }) => {
  const statusTone = ticket.status.includes('待')
    ? {
        badge: 'border-[#b0824f] bg-[#8b5c2d] text-[#ffe7c7]',
        card: 'border-[#9b7a4b] bg-[#6f4b2f]',
      }
    : ticket.status.includes('完成') || ticket.status.includes('已')
      ? {
          badge: 'border-[#4f9a82] bg-[#2d7a62] text-[#dffff4]',
          card: 'border-[#4b9a87] bg-[#275f61]',
        }
      : {
          badge: 'border-[#5d7dc8] bg-[#3a5da9] text-[#e8edff]',
          card: 'border-[#5b7ec6] bg-[#2f4e88]',
        };

  return (
    <div className={`rounded-xl border p-3 shadow-[0_10px_20px_rgba(7,31,67,0.28)] ${statusTone.card}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-[#eef6ff]">
          <Ticket size={14} className="text-[#a8dbff]" />
          {ticket.id}
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] ${statusTone.badge}`}>{ticket.status}</span>
      </div>
      <div className="mt-1 text-xs text-[#d6e9f8]">{ticket.title}</div>
      <div className="mt-1 text-[11px] text-[#b8daf4]">业务：{ticket.business} · 责任人：{ticket.owner}</div>
      <button type="button" className="mt-2 rounded border border-[#68bfff] bg-[#2b6fb3] px-2 py-0.5 text-[11px] text-[#eef8ff] shadow-[0_6px_12px_rgba(10,52,102,0.3)] hover:brightness-110" onClick={() => onOpen(ticket.id)}>查看详情</button>
    </div>
  );
};
