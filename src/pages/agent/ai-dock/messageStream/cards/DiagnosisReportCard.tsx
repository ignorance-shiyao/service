import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { DiagnosisTemplate } from '../../mocks/diagnosis';
import { CardActionBar } from './CardActionBar';

interface DiagnosisReportCardProps {
  data: DiagnosisTemplate;
  onHistory: () => void;
  onFault: (data: DiagnosisTemplate) => void;
  onCopy?: (text: string) => void;
  onAsk?: (text: string) => void;
}

export const DiagnosisReportCard: React.FC<DiagnosisReportCardProps> = ({ data, onHistory, onFault, onCopy, onAsk }) => {
  return (
    <div className="rounded-xl border border-[var(--sys-border-primary)] bg-[var(--sys-bg-header)] p-3 shadow-[0_10px_20px_rgba(7,31,67,0.24)]">
      <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#e2f2ff]">
        <ShieldCheck size={14} className="text-[#9bd4ff]" />
        {data.title}
      </div>
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
      <CardActionBar
        actions={[
          {
            key: 'copy',
            label: '复制结论',
            onClick: () => onCopy?.(`诊断：${data.title}\n结论：${data.conclusion}\n健康评分：${data.score}`),
          },
          {
            key: 'ask',
            label: '生成处置建议',
            onClick: () => onAsk?.(`请基于诊断结果《${data.title}》生成详细处置建议`),
          },
          {
            key: 'fault',
            label: '发起报障',
            tone: 'primary',
            onClick: () => onFault(data),
          },
          {
            key: 'history',
            label: '诊断历史',
            onClick: onHistory,
          },
        ]}
      />
    </div>
  );
};
