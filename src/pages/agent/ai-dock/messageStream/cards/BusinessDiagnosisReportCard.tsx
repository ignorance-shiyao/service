import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown, ClipboardCheck } from 'lucide-react';
import { BusinessDiagnosisReportPayload, FaultContext } from '../../store/useAiDock';
import { CardActionBar } from './CardActionBar';

interface BusinessDiagnosisReportCardProps {
  data: BusinessDiagnosisReportPayload;
  onCopy?: (text: string) => void;
  onGenerateBrief?: (report: BusinessDiagnosisReportPayload) => void;
  onFaultMany?: (contexts: FaultContext[]) => void;
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

export const BusinessDiagnosisReportCard: React.FC<BusinessDiagnosisReportCardProps> = ({ data, onCopy, onGenerateBrief, onFaultMany }) => {
  const [expandedId, setExpandedId] = useState(data.results[0]?.id || '');
  const defaultSelectedIds = useMemo(() => {
    const abnormal = data.results.filter((item) => item.level === '异常').map((item) => item.id);
    if (abnormal.length > 0) return abnormal;
    return data.results[0] ? [data.results[0].id] : [];
  }, [data.results]);
  const [selectedIds, setSelectedIds] = useState<string[]>(defaultSelectedIds);
  const selectedTargets = useMemo(
    () => data.results.filter((item) => selectedIds.includes(item.id)),
    [data.results, selectedIds]
  );
  const abnormalCount = data.results.filter((item) => item.level === '异常').length;
  const warningCount = data.results.filter((item) => item.level === '关注').length;
  const healthyCount = data.results.filter((item) => item.level === '健康').length;
  const maxRiskTarget = data.results
    .slice()
    .sort((a, b) => a.score - b.score)[0];

  const copyText = [
    data.title,
    data.summary,
    ...data.results.map((item) => `${item.type} ${item.name}：${item.level}，${item.score}分，${item.summary}`),
    ...data.nextActions.map((item) => `建议：${item}`),
  ].join('\n');

  const toggleFaultTarget = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      return [...prev, id];
    });
  };

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
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full border border-[#2f8a6f] bg-[#155041] px-1.5 py-0.5 text-[10px] text-[#ddfff2]">健康 {healthyCount}</span>
          <span className="rounded-full border border-[#8e743f] bg-[#503b21] px-1.5 py-0.5 text-[10px] text-[#fff1d8]">关注 {warningCount}</span>
          <span className="rounded-full border border-[#9e4c5b] bg-[#572937] px-1.5 py-0.5 text-[10px] text-[#ffdce1]">异常 {abnormalCount}</span>
          {maxRiskTarget && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#8f4f5a] bg-[#4d2731] px-1.5 py-0.5 text-[10px] text-[#ffd8de]">
              <AlertTriangle size={11} />
              重点：{maxRiskTarget.name}
            </span>
          )}
        </div>
        <div className="mt-1.5 text-[11px] leading-5 text-[#d5ebff]">{data.summary}</div>
        <div className="mt-1 text-[10px] text-[#8fbde0]">生成时间：{data.generatedAt}</div>
      </div>

      <div className="mt-2 rounded-lg border border-[#2f679d] bg-[#0f3358] p-2">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[11px] font-semibold text-[#d7ecff]">报障业务选择</div>
          <div className="text-[10px] text-[#9ecfff]">已选 {selectedTargets.length} 条</div>
        </div>
        <div className="mt-1 text-[10px] text-[#8ebcde]">
          先勾选需要发起报障的业务，再点击“发起报障”
        </div>
      </div>

      <div className="mt-2 space-y-1.5">
        {data.results.map((item) => {
          const expanded = expandedId === item.id;
          const selected = selectedIds.includes(item.id);
          return (
            <article key={item.id} className="overflow-hidden rounded-lg border border-[#315f89] bg-[rgba(17,61,101,0.62)]">
              <button type="button" onClick={() => setExpandedId(expanded ? '' : item.id)} className="w-full px-2.5 py-2 text-left">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <label className="inline-flex items-center gap-1.5 text-[10px] text-[#90c4eb]">
                      <input
                        type="checkbox"
                        className="h-3 w-3 rounded border border-[#5f97c8] bg-[#123f6e]"
                        checked={selected}
                        onChange={() => toggleFaultTarget(item.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      纳入报障
                    </label>
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
                  <div className="rounded-md border border-[#2f679d] bg-[#0f3358] px-2 py-1.5 text-[11px] leading-5 text-[#d6ebff]">{item.summary}</div>
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
        <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#bde4ff]">
          <CheckCircle2 size={12} className="text-[#7ad2ff]" />
          后续操作建议（重点）
        </div>
        <div className="mt-1 space-y-1">
          {data.nextActions.map((item, idx) => (
            <div key={item} className="rounded border border-[#2f679d] bg-[#143f69] px-2 py-1.5 text-[11px] text-[#d1e7fb]">
              <span className="mr-1 text-[#8fd4ff]">[{idx + 1}]</span>{item}
            </div>
          ))}
        </div>
      </div>

      <CardActionBar
        actions={[
          { key: 'copy', label: '复制报告', onClick: () => onCopy?.(copyText) },
          {
            key: 'ask',
            label: '生成汇报说明',
            onClick: () => {
              onGenerateBrief?.(data);
            },
          },
          {
            key: 'fault',
            label: '发起报障',
            tone: 'primary',
            onClick: () => onFaultMany?.(
              selectedTargets.map((target) => ({
                source: 'businessDiagnosis',
                title: `${target.type}${target.region}业务异常报障`,
                business: target.name,
                businessId: target.id,
                businessType: target.type,
                region: target.region,
                site: target.site,
                severity: target.level === '异常' ? '高' : '中',
                desc: `故障业务：${target.name}\n业务类型：${target.type}\n故障位置：${target.region} / ${target.site}\n诊断结论：${target.summary}\n建议：${target.suggestions.join('；')}`,
              }))
            ),
          },
        ]}
      />
    </div>
  );
};
