import React from 'react';
import { TicketStatus } from '../../types/ticket';

const STEPS: TicketStatus[] = ['accepted', 'dispatching', 'processing', 'restored', 'followup'];
const LABELS: Record<TicketStatus, string> = {
  accepted: '已受理',
  dispatching: '派单中',
  processing: '处理中',
  restored: '已恢复',
  followup: '待回访'
};

export const ProgressStepper: React.FC<{ status: TicketStatus }> = ({ status }) => {
  const idx = STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-2 text-[10px]">
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div
            className={`rounded px-1.5 py-0.5 ${
              i < idx
                ? 'bg-emerald-600 text-white'
                : i === idx
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300'
            }`}
          >
            {LABELS[s]}
          </div>
          {i < STEPS.length - 1 && <div className="h-px w-3 bg-slate-600" />}
        </React.Fragment>
      ))}
    </div>
  );
};
