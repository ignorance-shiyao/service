import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingMessage: React.FC<{ payload?: Record<string, unknown> }> = ({ payload }) => (
  <div className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-300">
    <Loader2 size={14} className="animate-spin" />
    {String(payload?.text || '处理中...')}
  </div>
);
