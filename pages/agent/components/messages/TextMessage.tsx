import React from 'react';

export const TextMessage: React.FC<{ payload?: Record<string, unknown> }> = ({ payload }) => {
  const title = String(payload?.title || '管家回复');
  const text = String(payload?.text || '已收到。');
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-3 text-sm text-slate-100">
      <div className="mb-1 text-xs font-bold text-blue-300">{title}</div>
      <div className="text-slate-200">{text}</div>
    </div>
  );
};
