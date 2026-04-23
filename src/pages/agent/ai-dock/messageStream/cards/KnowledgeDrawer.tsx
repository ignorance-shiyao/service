import React, { useMemo, useState } from 'react';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { KnowledgeItem, KNOWLEDGE_ITEMS } from '../../mocks/knowledge';

interface KnowledgeDrawerProps {
  item: KnowledgeItem;
  onClose: () => void;
}

export const KnowledgeDrawer: React.FC<KnowledgeDrawerProps> = ({ item, onClose }) => {
  const [feedback, setFeedback] = useState<string | null>(null);

  const related = useMemo(
    () => KNOWLEDGE_ITEMS.filter((k) => k.business === item.business && k.id !== item.id).slice(0, 3),
    [item]
  );

  return (
    <div className="absolute inset-y-0 right-0 z-[40] w-[360px] border-l border-[var(--sys-border-primary)] bg-[var(--sys-bg-header)] shadow-2xl">
      <div className="flex h-full flex-col">
        <div className="border-b border-[var(--sys-border-primary)] px-4 py-3">
          <h3 className="text-sm font-semibold text-[#d7ecff]">{item.title}</h3>
          <div className="mt-1 text-[11px] text-[var(--sys-text-secondary)]">{item.business} · 最后更新 {item.updatedAt} · {item.owner}</div>
        </div>
        <div className="flex-1 overflow-auto px-4 py-3 text-xs leading-6 text-[var(--sys-text-secondary)] whitespace-pre-wrap custom-scrollbar">
          {item.content}
          <div className="mt-4 border-t border-[var(--sys-border-primary)] pt-3">
            <div className="mb-2 text-[11px] text-[#afd7ff]">相关知识</div>
            <div className="space-y-2">
              {related.map((r) => (
                <div key={r.id} className="rounded border border-[var(--sys-border-primary)] bg-[#0f3c74] px-2 py-1.5 text-[11px] text-[#cbe6ff]">
                  {r.title}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-[var(--sys-border-primary)] px-4 py-3">
          <div className="mb-2 text-[11px] text-[var(--sys-text-secondary)]">内容反馈</div>
          <div className="mb-3 flex gap-2">
            {[
              { key: 'useful', label: '有用', icon: <ThumbsUp size={12} /> },
              { key: 'useless', label: '没用', icon: <ThumbsDown size={12} /> },
              { key: 'old', label: '内容过时', icon: <ThumbsDown size={12} /> },
            ].map((b) => (
              <button
                key={b.key}
                type="button"
                disabled={!!feedback}
                onClick={() => setFeedback(b.key)}
                className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] ${
                  feedback === b.key
                    ? 'border-[#35a7ff] bg-[#165699] text-[#e6f4ff]'
                    : 'border-[var(--sys-border-secondary)] bg-[#123d71] text-[#bcdfff]'
                }`}
              >
                {b.icon}
                {b.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={onClose} className="w-full rounded-md border border-[var(--sys-border-secondary)] bg-[#0f3b70] py-1.5 text-xs text-[#d7ecff] hover:bg-[#155293]">
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
