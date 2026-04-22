import React from 'react';
import { StatusLight } from '../common/StatusLight';

export const BusinessCardMessage: React.FC<{ payload?: Record<string, unknown>; onOpen?: (id: string) => void }> = ({ payload, onOpen }) => {
  const cards = (payload?.cards as any[]) || [];
  return (
    <div className="grid gap-2">
      {cards.map((card) => (
        <button
          key={card.id}
          type="button"
          className="rounded-xl border border-slate-700 bg-slate-900/70 p-3 text-left hover:border-blue-500"
          onClick={() => onOpen?.(card.id)}
        >
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <StatusLight status={card.status} />
              {card.name}
            </div>
            <span className="text-xs text-slate-400">{card.countLabel}</span>
          </div>
          <div className="text-xs text-slate-300">{card.summary}</div>
          <div className="mt-1 text-[11px] text-blue-300">{card.metricLabel}：{card.metricValue}</div>
        </button>
      ))}
    </div>
  );
};
