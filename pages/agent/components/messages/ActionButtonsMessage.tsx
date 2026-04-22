import React from 'react';
import { MessageAction } from '../../types/message';

export const ActionButtonsMessage: React.FC<{ payload?: Record<string, unknown>; actions?: MessageAction[]; onAction?: (id: string) => void }> = ({ payload, actions = [], onAction }) => (
  <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3 text-sm">
    {payload?.text && <div className="mb-2 text-slate-200">{String(payload.text)}</div>}
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={() => onAction?.(action.id)}
          className={`rounded px-2 py-1 text-xs ${action.kind === 'primary' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-100'}`}
        >
          {action.label}
        </button>
      ))}
    </div>
  </div>
);
