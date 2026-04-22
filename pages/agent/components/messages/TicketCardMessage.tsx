import React from 'react';
import { ProgressStepper } from '../common/ProgressStepper';
import { TicketStatus } from '../../types/ticket';

export const TicketCardMessage: React.FC<{ payload?: Record<string, unknown> }> = ({ payload }) => {
  const status = (payload?.status as TicketStatus) || 'accepted';
  return (
    <div className="rounded-xl border border-blue-600/40 bg-blue-950/20 p-3 text-sm">
      <div className="font-bold text-blue-300">{String(payload?.title || '工单状态')}</div>
      <div className="mt-1 text-xs text-slate-300">工单号：{String(payload?.ticketId || '--')}</div>
      <div className="mt-2"><ProgressStepper status={status} /></div>
      <div className="mt-2 text-xs text-slate-300">处理人：{String(payload?.owner || '--')}，{String(payload?.eta || '')}</div>
    </div>
  );
};
