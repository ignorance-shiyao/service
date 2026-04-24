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
  return (
    <div className="rounded-xl border border-[var(--sys-border-primary)] bg-[var(--sys-bg-header)] p-3 shadow-[0_10px_20px_rgba(7,31,67,0.24)]">
      <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#e7f4ff]">
        <Lightbulb size={14} className="text-[#9dd9ff]" />
        结论：{data.conclusion}
      </div>
      <p className="mt-1 flex items-start gap-1.5 text-xs leading-5 text-[var(--sys-text-secondary)]">
        <BookText size={13} className="mt-1 shrink-0 text-[#8fc3ef]" />
        <span>解释：{data.explanation}</span>
      </p>
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
        <div className="mt-2 flex flex-wrap gap-2">
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
      )}
      <CardActionBar
        actions={[
          {
            key: 'copy',
            label: '复制回答',
            onClick: () => onCopy?.(`结论：${data.conclusion}\n解释：${data.explanation}`),
          },
          ...(data.sourceId
            ? [{
                key: 'open',
                label: '查看知识来源',
                onClick: () => onOpenKnowledge(data.sourceId as string),
              }]
            : []),
          {
            key: 'ask',
            label: '继续追问',
            tone: 'primary' as const,
            onClick: () => onSendFollowup('请再给我一个更具体的落地建议'),
          },
        ]}
      />
      <div className="mt-2 text-[10px] text-[var(--sys-text-disabled)]">运维管家智能体返回内容由大模型生成，请注意辨别真实性。</div>
    </div>
  );
};
