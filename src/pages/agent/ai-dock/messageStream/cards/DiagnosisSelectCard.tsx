import React from 'react';
import { Stethoscope } from 'lucide-react';
import { DiagnosisTemplate } from '../../../../../mock/assistant';
import { CardActionBar } from './CardActionBar';

interface DiagnosisSelectCardProps {
  list: DiagnosisTemplate[];
  onSelect: (item: DiagnosisTemplate) => void;
  onAsk?: (text: string) => void;
  onCopy?: (text: string) => void;
}

export const DiagnosisSelectCard: React.FC<DiagnosisSelectCardProps> = ({ list, onSelect, onAsk, onCopy }) => {
  return (
    <div className="rounded-xl border border-[var(--sys-border-primary)] bg-[var(--sys-bg-header)] p-3 shadow-[0_10px_20px_rgba(7,31,67,0.24)]">
      <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#e0f1ff]">
        <Stethoscope size={14} className="text-[#97ceff]" />
        请选择要诊断的业务
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {list.map((i) => (
          <button
            type="button"
            key={i.id}
            onClick={() => onSelect(i)}
            className="rounded border border-[var(--sys-border-primary)] bg-[#123e74] px-2 py-1.5 text-xs text-[#cbe7ff] hover:border-[#51adff] hover:bg-[#1a568f]"
          >
            {i.name}
          </button>
        ))}
      </div>
      <CardActionBar
        actions={[
          {
            key: 'copy',
            label: '复制诊断项',
            onClick: () => onCopy?.(`可诊断业务：${list.map((i) => i.name).join('、')}`),
          },
          {
            key: 'ask',
            label: '推荐优先级',
            tone: 'primary',
            onClick: () => onAsk?.('请根据影响范围给我推荐优先诊断顺序'),
          },
        ]}
      />
    </div>
  );
};
