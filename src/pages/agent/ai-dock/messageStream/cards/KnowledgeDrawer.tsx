import React, { useMemo, useState } from 'react';
import { BookOpen, FileText, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { FAQ_ITEMS, KnowledgeItem, KNOWLEDGE_ITEMS } from '../../../../../mock/assistant';

interface KnowledgeDrawerProps {
  item: KnowledgeItem;
  onOpenKnowledge: (id: string) => void;
  onAsk: (text: string) => void;
  onFeedback: (payload: { id: string; feedback: 'useful' | 'useless' | 'old' }) => void;
  onClose: () => void;
}

export const KnowledgeDrawer: React.FC<KnowledgeDrawerProps> = ({ item, onOpenKnowledge, onAsk, onFeedback, onClose }) => {
  const [feedback, setFeedback] = useState<string | null>(null);

  const related = useMemo(
    () => KNOWLEDGE_ITEMS.filter((k) => k.business === item.business && k.id !== item.id).slice(0, 3),
    [item]
  );
  const relatedFaq = useMemo(
    () => FAQ_ITEMS.filter((faq) => faq.sourceId === item.id || faq.sourceId?.startsWith(item.business.toLowerCase())).slice(0, 3),
    [item]
  );

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-[rgba(5,18,36,0.66)] p-3 backdrop-blur-[2px]">
      <div className="flex h-[min(82vh,780px)] w-[min(980px,96vw)] flex-col overflow-hidden rounded-xl border border-[#3f77ab] bg-[linear-gradient(180deg,#0f3562_0%,#0f2f58_100%)] shadow-[0_18px_36px_rgba(4,20,45,0.55)]">
        <div className="flex items-start justify-between gap-2 border-b border-[#2f6698] px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-[#dff1ff]">
              <BookOpen size={14} className="text-[#97cff8]" />
              <span className="truncate">{item.title}</span>
            </div>
            <div className="mt-1 text-[11px] text-[#9ac8eb]">{item.business} · 最后更新 {item.updatedAt} · {item.owner}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#4379aa] bg-[#18487a] text-[#dff0ff] hover:bg-[#22609c]"
          >
            <X size={13} />
          </button>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[1fr_280px] gap-0">
          <div className="custom-scrollbar min-h-0 overflow-y-auto border-b border-[#2f6698] px-4 py-3 text-[13px] leading-7 text-[#d4e9fb] whitespace-pre-wrap md:border-b-0 md:border-r">
            <div className="mb-2 rounded-md border border-[#3f75a7] bg-[#123b66] px-2 py-1 text-[11px] text-[#9fd0f5]">
              原始知识内容（来源）
            </div>
            {item.content}
          </div>
          <div className="custom-scrollbar min-h-0 overflow-y-auto px-3 py-3">
            <div className="mb-2 rounded-md border border-[#3f75a7] bg-[#143c66] px-2 py-1.5">
              <div className="mb-1 text-[11px] text-[#9fd0f5]">引用来源操作</div>
              <button
                type="button"
                onClick={() => onAsk(`请基于知识《${item.title}》给我一个可执行的运维操作清单`)}
                className="w-full rounded border border-[#4a8bc0] bg-[#16518f] px-2 py-1.5 text-[11px] text-[#dff1ff] hover:bg-[#1e5ea3]"
              >
                基于此来源生成操作建议
              </button>
            </div>

            <div className="mb-2 text-[11px] text-[#afd7ff]">相关知识</div>
            <div className="space-y-1.5">
              {related.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onOpenKnowledge(r.id)}
                  className="w-full rounded border border-[#3f75a7] bg-[#123a64] px-2 py-1.5 text-left text-[11px] text-[#cbe6ff] hover:border-[#66b4f3] hover:bg-[#14528f]"
                >
                  {r.title}
                </button>
              ))}
            </div>

            <div className="mb-2 mt-3 text-[11px] text-[#afd7ff]">相关问答</div>
            <div className="space-y-1.5">
              {relatedFaq.map((faq) => (
                <button
                  key={faq.id}
                  type="button"
                  onClick={() => onAsk(faq.q)}
                  className="w-full rounded border border-[#3f75a7] bg-[#123a64] px-2 py-1.5 text-left text-[11px] text-[#d9ecff] hover:border-[#66b4f3] hover:bg-[#14528f]"
                >
                  <span className="inline-flex items-center gap-1">
                    <FileText size={11} className="text-[#97cff8]" />
                    {faq.q}
                  </span>
                </button>
              ))}
            </div>

            <div className="mb-2 mt-3 text-[11px] text-[#9ec7e6]">内容反馈</div>
            <div className="mb-3 flex flex-wrap gap-2">
            {[
              { key: 'useful', label: '有用', icon: <ThumbsUp size={12} /> },
              { key: 'useless', label: '没用', icon: <ThumbsDown size={12} /> },
              { key: 'old', label: '内容过时', icon: <ThumbsDown size={12} /> },
            ].map((b) => (
              <button
                key={b.key}
                type="button"
                disabled={!!feedback}
                onClick={() => {
                  setFeedback(b.key);
                  onFeedback({ id: item.id, feedback: b.key as 'useful' | 'useless' | 'old' });
                }}
                className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] ${
                  feedback === b.key
                    ? 'border-[#35a7ff] bg-[#165699] text-[#e6f4ff]'
                    : 'border-[#3f75a7] bg-[#123a64] text-[#bcdfff]'
                }`}
              >
                {b.icon}
                {b.label}
              </button>
            ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
