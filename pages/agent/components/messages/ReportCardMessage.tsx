import React from 'react';

export const ReportCardMessage: React.FC<{ payload?: Record<string, unknown> }> = ({ payload }) => (
  <div className="rounded-xl border border-indigo-600/40 bg-indigo-950/20 p-3 text-sm">
    <div className="font-bold text-indigo-300">{String(payload?.title || '服务报告')}</div>
    <div className="mt-1 text-slate-200">{String(payload?.summary || '')}</div>
  </div>
);
