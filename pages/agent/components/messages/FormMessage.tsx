import React, { useState } from 'react';
import { Button, Input } from '../../../../components/UI';

export const FormMessage: React.FC<{ payload?: Record<string, unknown>; onSubmit?: (note: string) => void }> = ({ payload, onSubmit }) => {
  const [note, setNote] = useState('');
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3 text-sm">
      <div className="mb-2 font-bold text-slate-100">报障表单（已预填）</div>
      <div className="mb-2 text-xs text-slate-300">业务：{String(payload?.bizName || '专线')}，故障：{String(payload?.title || '链路中断')}</div>
      <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="补充说明（可选）" />
      <div className="mt-2 flex justify-end">
        <Button size="sm" onClick={() => onSubmit?.(note)}>确认提交</Button>
      </div>
    </div>
  );
};
