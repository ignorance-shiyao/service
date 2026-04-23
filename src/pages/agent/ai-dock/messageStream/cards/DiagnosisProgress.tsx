import React from 'react';

interface DiagnosisProgressProps {
  title: string;
  progress: number;
  step: string;
  running: boolean;
}

export const DiagnosisProgress: React.FC<DiagnosisProgressProps> = ({ title, progress, step, running }) => {
  return (
    <div className="rounded-xl border border-[var(--sys-border-primary)] bg-[var(--sys-bg-header)] p-3">
      <div className="text-sm font-semibold text-[#ddf1ff]">{title}</div>
      <div className="mt-1 text-xs text-[var(--sys-text-secondary)]">{step}</div>
      <div className="mt-2 h-2 rounded-full bg-[#0d315f]">
        <div className="h-2 rounded-full bg-gradient-to-r from-[#2f81d9] to-[#68beff] transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-1 text-[11px] text-[#9fcfff]">{running ? `分析中 ${progress}%` : '分析完成'}</div>
    </div>
  );
};
