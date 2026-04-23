import React from 'react';
import { DiagnosisTemplate } from '../../mocks/diagnosis';

interface DiagnosisReportCardProps {
  data: DiagnosisTemplate;
  onHistory: () => void;
  onFault: (data: DiagnosisTemplate) => void;
}

export const DiagnosisReportCard: React.FC<DiagnosisReportCardProps> = ({ data, onHistory, onFault }) => {
  return (
    <div className="rounded-xl border border-[var(--sys-border-primary)] bg-[var(--sys-bg-header)] p-3">
      <div className="text-sm font-semibold text-[#e2f2ff]">{data.title}</div>
      <div className="mt-1 text-xs text-[var(--sys-text-secondary)]">结论：{data.conclusion}</div>
      <div className="mt-2 inline-flex rounded-full border border-[#2f73b2] bg-[#104175] px-2 py-0.5 text-[11px] text-[#bfe3ff]">健康评分 {data.score}</div>
      <div className="mt-2 text-[11px] text-[#9ecfff]">关键发现</div>
      <div className="mt-1 space-y-1 text-xs text-[var(--sys-text-secondary)]">
        {data.findings.map((i) => <div key={i}>• {i}</div>)}
      </div>
      <div className="mt-2 text-[11px] text-[#9ecfff]">建议</div>
      <div className="mt-1 space-y-1 text-xs text-[var(--sys-text-secondary)]">
        {data.suggestions.map((i) => <div key={i}>• {i}</div>)}
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => onFault(data)} className="rounded border border-[#3f85c4] bg-[#184f8c] px-2 py-1 text-[11px] text-[#e0f2ff]">发起报障</button>
        <button type="button" onClick={onHistory} className="rounded border border-[#3f85c4] bg-[#184f8c] px-2 py-1 text-[11px] text-[#e0f2ff]">诊断历史</button>
      </div>
    </div>
  );
};
