import React from 'react';
import { DiagnosisTemplate } from '../../mocks/diagnosis';

interface DiagnosisSelectCardProps {
  list: DiagnosisTemplate[];
  onSelect: (item: DiagnosisTemplate) => void;
}

export const DiagnosisSelectCard: React.FC<DiagnosisSelectCardProps> = ({ list, onSelect }) => {
  return (
    <div className="rounded-xl border border-[var(--sys-border-primary)] bg-[var(--sys-bg-header)] p-3">
      <div className="text-sm font-semibold text-[#e0f1ff]">请选择要诊断的业务</div>
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
    </div>
  );
};
