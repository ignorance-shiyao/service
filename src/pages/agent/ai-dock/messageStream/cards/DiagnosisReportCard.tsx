import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { DiagnosisTemplate } from '../../../../../mock/assistant';
import { CardActionBar } from './CardActionBar';

interface DiagnosisReportCardProps {
  data: DiagnosisTemplate;
  onHistory: () => void;
  onFault: (data: DiagnosisTemplate) => void;
  onCopy?: (text: string) => void;
  onAsk?: (text: string) => void;
}

export const DiagnosisReportCard: React.FC<DiagnosisReportCardProps> = ({ data, onHistory, onFault, onCopy, onAsk }) => {
  const issueKeywords = ['异常', '风险', '超阈', '告警', '抖动', '丢包', '失败', '拥塞', '中断', '超时'];
  const issueFindings = data.findings.filter((item) => issueKeywords.some((keyword) => item.includes(keyword)));
  const normalFindings = data.findings.filter((item) => !issueFindings.includes(item));
  const hasIssue = issueFindings.length > 0;

  const scoreTone =
    data.score < 80
      ? 'border-[#c97171] bg-[rgba(120,40,50,0.38)] text-[#ffd6d6]'
      : data.score < 90
        ? 'border-[#c98563] bg-[rgba(128,66,28,0.35)] text-[#ffe2cc]'
        : data.score < 98
          ? 'border-[#c29a5f] bg-[rgba(115,80,30,0.34)] text-[#ffe7c2]'
          : 'border-[#46a67d] bg-[rgba(32,111,78,0.36)] text-[#d9ffef]';

  return (
    <div className="rounded-xl border border-[var(--sys-border-primary)] bg-[var(--sys-bg-header)] p-3 shadow-[0_10px_20px_rgba(7,31,67,0.24)]">
      <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#e2f2ff]">
        <ShieldCheck size={14} className="text-[#9bd4ff]" />
        {data.title}
      </div>
      <div className="mt-1 text-xs text-[var(--sys-text-secondary)]">结论：{data.conclusion}</div>
      {hasIssue && (
        <>
          <div className="mt-2 text-[11px] text-[#9ecfff]">问题明细</div>
          <div className="mt-1 space-y-1 text-xs text-[var(--sys-text-secondary)]">
            {issueFindings.map((i, index) => <div key={i}>{index + 1}. {i}</div>)}
          </div>
        </>
      )}
      <div className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] ${scoreTone}`}>健康评分 {data.score}</div>
      {hasIssue ? (
        <>
          {normalFindings.length > 0 && (
            <>
              <div className="mt-2 text-[11px] text-[#9ecfff]">关键发现（其余）</div>
              <div className="mt-1 space-y-1 text-xs text-[var(--sys-text-secondary)]">
                {normalFindings.map((i) => <div key={i}>• {i}</div>)}
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <div className="mt-2 text-[11px] text-[#9ecfff]">关键发现</div>
          <div className="mt-1 space-y-1 text-xs text-[var(--sys-text-secondary)]">
            {data.findings.map((i) => <div key={i}>• {i}</div>)}
          </div>
        </>
      )}
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
