import React, { useState } from 'react';
import { ChevronDown, ClipboardCheck } from 'lucide-react';
import { BusinessDiagnosisReportPayload, FaultContext } from '../../store/useAiDock';
import { CardActionBar } from './CardActionBar';

interface BusinessDiagnosisReportCardProps {
  data: BusinessDiagnosisReportPayload;
  onCopy?: (text: string) => void;
  onAsk?: (text: string) => void;
  onFault?: (context: FaultContext) => void;
}

const levelClass = {
  健康: 'border-[#54b98f] bg-[#1f604c] text-[#ddfff2]',
  关注: 'border-[#c49a58] bg-[#6d4d2d] text-[#fff1d8]',
  异常: 'border-[#c76f7b] bg-[#65303d] text-[#ffdce1]',
};

const metricClass = {
  normal: 'border-[#3f9378] bg-[#174f43] text-[#dffcf3]',
  warning: 'border-[#9d7b45] bg-[#584128] text-[#ffedd5]',
  danger: 'border-[#a65b69] bg-[#542b36] text-[#ffd8de]',
};

export const BusinessDiagnosisReportCard: React.FC<BusinessDiagnosisReportCardProps> = ({ data, onCopy, onAsk, onFault }) => {
  const [expandedId, setExpandedId] = useState(data.results[0]?.id || '');
  const selectedFaultTarget =
    data.results.find((item) => item.level === '异常') ||
    data.results.find((item) => item.id === expandedId) ||
    data.results[0];

  const copyText = [
    data.title,
    data.summary,
    ...data.results.map((item) => `${item.type} ${item.name}：${item.level}，${item.score}分，${item.summary}`),
    ...data.nextActions.map((item) => `建议：${item}`),
  ].join('\n');

  return (
    <div className="rounded-xl border border-[var(--sys-border-primary)] bg-[var(--sys-bg-header)] p-3 shadow-[0_10px_20px_rgba(7,31,67,0.24)]">
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#e6f5ff]">
          <ClipboardCheck size={14} className="text-[#9bd4ff]" />
          {data.title}
        </div>
        <span className="rounded-full border border-[#3972a8] bg-[#133e6a] px-2 py-0.5 text-[10px] text-[#bfe1ff]">
          平均 {data.averageScore} 分
        </span>
      </div>

      <div className="mt-2 rounded-lg border border-[#2f679d] bg-[#0f3358] p-2">
        <div className="text-[11px] leading-5 text-[#d5ebff]">{data.summary}</div>
        <div className="mt-1 text-[10px] text-[#8fbde0]">生成时间：{data.generatedAt}</div>
      </div>

      <div className="mt-2 space-y-1.5">
        {data.results.map((item) => {
          const expanded = expandedId === item.id;
          return (
            <article key={item.id} className="overflow-hidden rounded-lg border border-[#315f89] bg-[rgba(17,61,101,0.62)]">
              <button type="button" onClick={() => setExpandedId(expanded ? '' : item.id)} className="w-full px-2.5 py-2 text-left">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-[#eaf6ff]">{item.name}</div>
                    <div className="mt-0.5 truncate text-[10px] text-[#9fc5e5]">{item.type} · {item.region} · {item.site}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className={`rounded-full border px-1.5 py-0.5 text-[10px] ${levelClass[item.level]}`}>{item.level}</span>
                    <span className="rounded-full border border-[#4b87ba] bg-[#164a78] px-1.5 py-0.5 text-[10px] text-[#d8efff]">{item.score}</span>
                    <ChevronDown size={13} className={`text-[#9fc8ea] transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </button>
              {expanded && (
                <div className="border-t border-white/10 px-2.5 pb-2 pt-1.5">
                  <div className="text-[11px] leading-5 text-[#d6ebff]">{item.summary}</div>
                  <div className="mt-2 grid grid-cols-2 gap-1">
                    {item.metrics.map((metric) => (
                      <div key={metric.label} className={`rounded border px-2 py-1 text-[10px] ${metricClass[metric.status]}`}>
                        <span className="opacity-75">{metric.label}</span>
                        <div className="mt-0.5 font-semibold">{metric.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-[10px] text-[#9ecfff]">诊断详情</div>
                  <div className="mt-1 space-y-1 text-[11px] text-[#cfe2f5]">
                    {item.findings.map((finding) => <div key={finding}>• {finding}</div>)}
                  </div>
                  <div className="mt-2 text-[10px] text-[#9ecfff]">后续建议</div>
                  <div className="mt-1 space-y-1 text-[11px] text-[#cfe2f5]">
                    {item.suggestions.map((suggestion) => <div key={suggestion}>• {suggestion}</div>)}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className="mt-2 rounded-lg border border-[#2f679d] bg-[#0f3358] p-2">
        <div className="text-[11px] text-[#9ecfff]">整体后续操作建议</div>
        <div className="mt-1 space-y-1 text-[11px] text-[#d1e7fb]">
          {data.nextActions.map((item) => <div key={item}>• {item}</div>)}
        </div>
      </div>

      <CardActionBar
        actions={[
          { key: 'copy', label: '复制报告', onClick: () => onCopy?.(copyText) },
          { key: 'ask', label: '生成汇报说明', onClick: () => onAsk?.('基于本次业务体检结果，生成一份客户汇报说明') },
          {
            key: 'fault',
            label: '发起报障',
            tone: 'primary',
            onClick: () => selectedFaultTarget && onFault?.({
              source: 'businessDiagnosis',
              title: `${selectedFaultTarget.type}${selectedFaultTarget.region}业务异常报障`,
              business: selectedFaultTarget.name,
              businessId: selectedFaultTarget.id,
              businessType: selectedFaultTarget.type,
              region: selectedFaultTarget.region,
              site: selectedFaultTarget.site,
              severity: selectedFaultTarget.level === '异常' ? '高' : '中',
              desc: `故障业务：${selectedFaultTarget.name}\n业务类型：${selectedFaultTarget.type}\n故障位置：${selectedFaultTarget.region} / ${selectedFaultTarget.site}\n体检结论：${selectedFaultTarget.summary}\n建议：${selectedFaultTarget.suggestions.join('；')}`,
            }),
          },
        ]}
      />
    </div>
  );
};
