import React from 'react';
import { BookText, Lightbulb } from 'lucide-react';
import { QaPayload } from '../../store/useAiDock';
import { CardActionBar } from './CardActionBar';

interface QaMessageProps {
  data: QaPayload;
  onSendFollowup: (text: string) => void;
  onOpenKnowledge: (id: string) => void;
  onCopy?: (text: string) => void;
}

export const QaMessage: React.FC<QaMessageProps> = ({ data, onSendFollowup, onOpenKnowledge, onCopy }) => {
  const getStaleDays = (dateText?: string) => {
    if (!dateText) return null;
    const parsed = new Date(dateText);
    if (Number.isNaN(parsed.getTime())) return null;
    const diff = Date.now() - parsed.getTime();
    return Math.floor(diff / (24 * 60 * 60 * 1000));
  };
  const staleDays = getStaleDays(data.sourceUpdatedAt);
  const isStale = typeof staleDays === 'number' && staleDays > 90;
  const sourceIds = (data.sourceIds && data.sourceIds.length > 0 ? data.sourceIds : data.sourceId ? [data.sourceId] : []).slice(0, 3);

  return (
    <div className="rounded-xl border border-[#3f77ab] bg-[linear-gradient(180deg,#0f3562_0%,#10315a_100%)] p-3 shadow-[0_10px_20px_rgba(7,31,67,0.24)]">
      <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#e7f4ff]">
        <Lightbulb size={14} className="text-[#9dd9ff]" />
        结论：{data.conclusion}
      </div>
      <p className="mt-1 flex items-start gap-1.5 text-xs leading-5 text-[#c9e2f8]">
        <BookText size={13} className="mt-1 shrink-0 text-[#8fc3ef]" />
        <span>解释：{data.explanation}</span>
      </p>
      {sourceIds.length > 0 && (
        <div className="mt-2 rounded-md border border-[#3f77ab] bg-[#133f6c] p-2">
          <div className="mb-1 text-[11px] text-[#9fd0f5]">引用来源</div>
          <div className="flex flex-wrap gap-1.5">
            {sourceIds.map((id, idx) => (
              <button
                key={id}
                type="button"
                onClick={() => onOpenKnowledge(id)}
                className="rounded-md border border-[#4f8bbd] bg-[#1a5286] px-2 py-1 text-[11px] text-[#e4f2ff] hover:bg-[#23639e]"
              >
                [{idx + 1}] 查看来源
              </button>
            ))}
          </div>
          {isStale && (
            <div className="mt-1.5 rounded border border-[#a67d3a] bg-[rgba(130,91,33,0.35)] px-1.5 py-1 text-[11px] text-[#ffe4b1]">
              来源知识距今已 {staleDays} 天，建议复核最新规范后执行。
            </div>
          )}
        </div>
      )}
      {data.suggestions && data.suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {data.suggestions.map((s) => (
            <button key={s} type="button" onClick={() => onSendFollowup(s)} className="rounded border border-[#3f85c4] bg-[#174f8d] px-2 py-1 text-[11px] text-[#dff1ff]">
              {s}
            </button>
          ))}
        </div>
      )}
      {data.followups && data.followups.length > 0 && (
        <div className="mt-2">
          <div className="mb-1 text-[11px] text-[#9fd0f5]">相关问答</div>
          <div className="flex flex-wrap gap-2">
          {data.followups.slice(0, 3).map((f) => (
            <button
              type="button"
              key={f}
              onClick={() => onSendFollowup(f)}
              className="rounded-full border border-[var(--sys-border-secondary)] bg-[#123f74] px-2 py-1 text-[10px] text-[#bfe0ff]"
            >
              {f}
            </button>
          ))}
          </div>
        </div>
      )}
      <CardActionBar
        actions={[
          {
            key: 'copy',
            label: '复制回答',
            onClick: () => onCopy?.(`结论：${data.conclusion}\n解释：${data.explanation}`),
          },
          {
            key: 'ask',
            label: '深入了解',
            tone: 'primary' as const,
            onClick: () => onSendFollowup('请再给我一个更具体的落地建议'),
          },
        ]}
      />
      <div className="mt-2 text-[10px] text-[#84afd2]">
        本回答基于当前业务数据与知识库生成；如需人工确认，可点击“转人工客户经理”。
      </div>
    </div>
  );
};
