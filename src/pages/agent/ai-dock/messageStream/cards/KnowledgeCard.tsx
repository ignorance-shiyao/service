import React from 'react';
import { BookOpen } from 'lucide-react';
import { KnowledgeItem } from '../../mocks/knowledge';
import { CardActionBar } from './CardActionBar';

interface KnowledgeCardProps {
  item: KnowledgeItem;
  onOpen: (id: string) => void;
  onCopy?: (text: string) => void;
  onAsk?: (text: string) => void;
}

export const KnowledgeCard: React.FC<KnowledgeCardProps> = ({ item, onOpen, onCopy, onAsk }) => {
  const tone = ['青蓝', '紫蓝', '橙金'][item.title.length % 3];
  const toneClass =
    tone === '青蓝'
      ? 'border-[#3d8eb9] bg-[#1a5f78]'
      : tone === '紫蓝'
        ? 'border-[#5b7dc7] bg-[#334a93]'
        : 'border-[#9b7a4b] bg-[#7f5630]';

  return (
    <div className={`rounded-xl border p-4 shadow-[0_10px_22px_rgba(6,30,64,0.28)] ${toneClass}`}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#e6f6ff]">
          <BookOpen size={16} />
          <span className="text-sm font-semibold">{item.title}</span>
        </div>
        <span className="rounded-full border border-[rgba(179,228,255,0.45)] bg-[rgba(20,76,122,0.35)] px-1.5 py-0.5 text-[10px] text-[#b3daf3]">更新于 {item.updatedAt}</span>
      </div>
      <p className="line-clamp-2 text-xs text-[#cfe4f7]">{item.summary}</p>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-1.5">
          {item.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="rounded-full border border-[rgba(159,212,255,0.5)] bg-[rgba(16,58,99,0.45)] px-2 py-0.5 text-[10px] text-[#d7ecff]">
              {tag}
            </span>
          ))}
        </div>
      </div>
      <CardActionBar
        actions={[
          {
            key: 'copy',
            label: '复制摘要',
            onClick: () => onCopy?.(`${item.title}\n${item.summary}`),
          },
          {
            key: 'ask',
            label: '继续追问',
            onClick: () => onAsk?.(`结合知识条目《${item.title}》，给我更详细的说明`),
          },
          {
            key: 'open',
            label: '查看完整',
            tone: 'primary',
            onClick: () => onOpen(item.id),
          },
        ]}
      />
    </div>
  );
};
