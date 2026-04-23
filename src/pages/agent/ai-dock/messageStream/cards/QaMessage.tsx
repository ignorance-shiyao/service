import React from 'react';
import { QaPayload } from '../../store/useAiDock';

interface QaMessageProps {
  data: QaPayload;
  onSendFollowup: (text: string) => void;
  onOpenKnowledge: (id: string) => void;
}

export const QaMessage: React.FC<QaMessageProps> = ({ data, onSendFollowup, onOpenKnowledge }) => {
  return (
    <div className="rounded-xl border border-[var(--sys-border-primary)] bg-[var(--sys-bg-header)] p-3">
      <div className="text-sm font-semibold text-[#e7f4ff]">💡 结论：{data.conclusion}</div>
      <p className="mt-1 text-xs leading-5 text-[var(--sys-text-secondary)]">📖 解释：{data.explanation}</p>
      {data.suggestions && data.suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {data.suggestions.map((s) => (
            <button key={s} type="button" onClick={() => onSendFollowup(s)} className="rounded border border-[#3f85c4] bg-[#174f8d] px-2 py-1 text-[11px] text-[#dff1ff]">
              {s}
            </button>
          ))}
        </div>
      )}
      {data.sourceId && (
        <button
          type="button"
          className="mt-2 text-[11px] text-[#7dc2ff] underline"
          onClick={() => onOpenKnowledge(data.sourceId as string)}
        >
          参考自：知识库条目，点击查看
        </button>
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
      <div className="mt-2 text-[10px] text-[var(--sys-text-disabled)]">运维管家智能体返回内容由大模型生成，请注意辨别真实性。</div>
    </div>
  );
};
