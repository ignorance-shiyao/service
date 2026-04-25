import React from 'react';
import { DiagnosisTemplate } from '../../../../../mock/assistant';

interface DiagnosisHistoryDrawerProps {
  list: DiagnosisTemplate[];
  onClose: () => void;
}

export const DiagnosisHistoryDrawer: React.FC<DiagnosisHistoryDrawerProps> = ({ list, onClose }) => {
  return (
    <div className="absolute inset-y-0 right-0 z-[40] w-[360px] border-l border-[var(--sys-border-primary)] bg-[var(--sys-bg-header)] shadow-2xl">
      <div className="flex h-full flex-col">
        <div className="border-b border-[var(--sys-border-primary)] px-4 py-3 text-sm font-semibold text-[#e2f3ff]">诊断历史（模拟）</div>
        <div className="flex-1 overflow-auto p-3 space-y-2 custom-scrollbar">
          {list.map((item) => (
            <div key={item.id} className="rounded border border-[var(--sys-border-primary)] bg-[#103f74] p-2">
              <div className="text-xs font-semibold text-[#dff2ff]">{item.title}</div>
              <div className="mt-1 text-[11px] text-[var(--sys-text-secondary)]">评分：{item.score} · {item.conclusion}</div>
            </div>
          ))}
        </div>
        <div className="border-t border-[var(--sys-border-primary)] p-3">
          <button type="button" onClick={onClose} className="w-full rounded border border-[var(--sys-border-secondary)] bg-[#113f72] py-1.5 text-xs text-[#d7ecff]">关闭</button>
        </div>
      </div>
    </div>
  );
};
