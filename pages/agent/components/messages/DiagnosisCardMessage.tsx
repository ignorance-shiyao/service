import React, { useState } from 'react';

export const DiagnosisCardMessage: React.FC<{ payload?: Record<string, unknown> }> = ({ payload }) => {
  const [open, setOpen] = useState(false);
  const summary = String(payload?.summary || '暂无诊断内容');
  const impact = (payload?.impact as string[]) || [];
  const reasons = (payload?.reasons as string[]) || [];

  return (
    <div className="rounded-xl border border-amber-600/40 bg-amber-950/20 p-3 text-sm">
      <div className="flex items-center justify-between">
        <div className="font-bold text-amber-300">诊断报告</div>
        <button type="button" className="text-xs text-amber-200" onClick={() => setOpen((v) => !v)}>{open ? '收起' : '展开'}</button>
      </div>
      <div className="mt-1 text-slate-100">{summary}</div>
      {open && (
        <div className="mt-2 space-y-2 text-xs text-slate-200">
          <div>
            <div className="mb-1 font-bold">影响范围</div>
            {impact.map((x) => <div key={x}>· {x}</div>)}
          </div>
          <div>
            <div className="mb-1 font-bold">可能原因</div>
            {reasons.map((x, i) => <div key={x}>{i + 1}. {x}</div>)}
          </div>
        </div>
      )}
    </div>
  );
};
